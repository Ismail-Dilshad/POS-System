<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Purchase extends Model
{
    protected $fillable = [
        'invoice_name',
        'invoice_id',
        'total_orders',
        'total_amount',
        'status',
        'notes',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
    ];

    /**
     * Get the purchase items for the purchase.
     */
    public function items(): HasMany
    {
        return $this->hasMany(PurchaseItem::class);
    }

    /**
     * Get the supplier payments for the purchase.
     */
    public function supplierPayments(): HasMany
    {
        return $this->hasMany(SupplierPayment::class);
    }

    /**
     * Get the total number of items in this purchase.
     */
    public function getTotalItemsAttribute(): int
    {
        return $this->items->sum('quantity');
    }

    /**
     * Get the calculated total amount from items.
     */
    public function getCalculatedTotalAttribute(): float
    {
        return $this->items->sum('total_cost');
    }

    /**
     * Update the purchase totals based on items.
     */
    public function updateTotals(): void
    {
        $this->update([
            'total_orders' => $this->items->count(),
            'total_amount' => $this->items->sum('total_cost'),
        ]);
    }

    /**
     * Mark purchase as received and update inventory.
     *
     * This method performs the following operations:
     * 1. Updates purchase status to 'receive'
     * 2. Increments product/scale_product stock quantities
     * 3. Updates cost and sell prices from purchase items
     * 4. Updates supplier information if it has changed
     * 5. Logs all changes for audit purposes
     *
     * @return bool True if successful, false otherwise
     */
    public function markAsReceived(): bool
    {
        try {
            \DB::beginTransaction();

            // Update purchase status
            $this->update(['status' => 'receive']);

            // Update inventory quantities for each item
            foreach ($this->items as $item) {
                if ($item->product_type === 'product') {
                    // Update regular product stock
                    $product = \App\Models\Product::find($item->product_id);
                    if ($product) {
                        // Update stock to trigger observers
                        $oldStock = $product->stock;
                        $newStock = $oldStock + $item->quantity;
                        $product->update(['stock' => $newStock]);

                        // Prepare update data for cost/sell prices and supplier
                        $updateData = [];

                        // Always update cost and sell prices from purchase items
                        if ($item->cost_price > 0) {
                            $updateData['cost_price'] = $item->cost_price;
                        }
                        if ($item->sell_price > 0) {
                            $updateData['sell_price'] = $item->sell_price;
                        }

                        // Update supplier if it has changed and supplier_id is provided
                        if ($item->supplier_id && (int)$product->supplier_id !== (int)$item->supplier_id) {
                            $updateData['supplier_id'] = $item->supplier_id;
                            \Log::info("Product {$product->id} ({$product->name}): Updated supplier from {$product->supplier_id} to {$item->supplier_id}");
                        }

                        // Apply all updates if there are any
                        if (!empty($updateData)) {
                            $product->update($updateData);
                        }
                    }
                } elseif ($item->product_type === 'scale_product') {
                    // Update scale product stock
                    $scaleProduct = \App\Models\ScaleProduct::find($item->product_id);
                    if ($scaleProduct) {
                        // Update stock to trigger observers
                        $oldStock = $scaleProduct->stock;
                        $newStock = $oldStock + $item->quantity;
                        $scaleProduct->update(['stock' => $newStock]);

                        // Prepare update data for cost/sell prices and supplier
                        $updateData = [];

                        // Always update cost and sell prices from purchase items
                        if ($item->cost_price > 0) {
                            $updateData['cost_price'] = $item->cost_price;
                        }
                        if ($item->sell_price > 0) {
                            $updateData['sell_price'] = $item->sell_price;
                        }

                        // Update supplier if it has changed and supplier_id is provided
                        if ($item->supplier_id && (int)$scaleProduct->supplier_id !== (int)$item->supplier_id) {
                            $updateData['supplier_id'] = $item->supplier_id;
                            \Log::info("Scale Product {$scaleProduct->id} ({$scaleProduct->name}): Updated supplier from {$scaleProduct->supplier_id} to {$item->supplier_id}");
                        }

                        // Apply all updates if there are any
                        if (!empty($updateData)) {
                            $scaleProduct->update($updateData);
                        }
                    }
                }
            }

            // Log successful completion
            \Log::info("Purchase {$this->id} ({$this->invoice_name}) marked as received successfully. Updated inventory for " . $this->items->count() . " items.");

            \DB::commit();
            return true;
        } catch (\Exception $e) {
            \DB::rollback();
            \Log::error("Failed to mark purchase {$this->id} as received: " . $e->getMessage(), [
                'purchase_id' => $this->id,
                'invoice_name' => $this->invoice_name,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return false;
        }
    }

    /**
     * Check if purchase is received.
     */
    public function isReceived(): bool
    {
        return $this->status === 'receive';
    }

    /**
     * Check if purchase is order status.
     */
    public function isOrder(): bool
    {
        return $this->status === 'order';
    }

    /**
     * Get summary of changes that will be applied when receiving this purchase.
     *
     * @return array Summary of inventory and supplier changes
     */
    public function getReceivingSummary(): array
    {
        $summary = [
            'products_updated' => 0,
            'scale_products_updated' => 0,
            'supplier_changes' => 0,
            'total_stock_increase' => 0,
            'items' => []
        ];

        foreach ($this->items as $item) {
            $changes = [
                'type' => $item->product_type,
                'name' => $item->product_name,
                'stock_increase' => $item->quantity,
                'cost_price_update' => $item->cost_price,
                'sell_price_update' => $item->sell_price,
                'supplier_change' => false
            ];

            if ($item->product_type === 'product') {
                $product = \App\Models\Product::find($item->product_id);
                if ($product) {
                    $summary['products_updated']++;
                    if ($item->supplier_id && (int)$product->supplier_id !== (int)$item->supplier_id) {
                        $changes['supplier_change'] = true;
                        $changes['old_supplier_id'] = $product->supplier_id;
                        $changes['new_supplier_id'] = $item->supplier_id;
                        $summary['supplier_changes']++;
                    }
                }
            } elseif ($item->product_type === 'scale_product') {
                $scaleProduct = \App\Models\ScaleProduct::find($item->product_id);
                if ($scaleProduct) {
                    $summary['scale_products_updated']++;
                    if ($item->supplier_id && (int)$scaleProduct->supplier_id !== (int)$item->supplier_id) {
                        $changes['supplier_change'] = true;
                        $changes['old_supplier_id'] = $scaleProduct->supplier_id;
                        $changes['new_supplier_id'] = $item->supplier_id;
                        $summary['supplier_changes']++;
                    }
                }
            }

            $summary['total_stock_increase'] += $item->quantity;
            $summary['items'][] = $changes;
        }

        return $summary;
    }
}
