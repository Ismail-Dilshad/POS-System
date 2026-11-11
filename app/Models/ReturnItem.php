<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;

class ReturnItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'return_id',
        'product_id',
        'product_name',
        'product_barcode',
        'product_category',
        'product_supplier',
        'original_price',
        'quantity',
        'return_total',
        'stock_adjusted',
        'stock_adjusted_at',
        'stock_adjusted_by',
    ];

    protected $casts = [
        'original_price' => 'decimal:2',
        'return_total' => 'decimal:2',
        'quantity' => 'integer',
        'stock_adjusted' => 'boolean',
        'stock_adjusted_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $appends = ['return_quantity'];

    /**
     * Accessor for return_quantity (alias for quantity field)
     */
    public function getReturnQuantityAttribute(): int
    {
        return $this->quantity;
    }

    /**
     * Get the return this item belongs to
     */
    public function returnRecord(): BelongsTo
    {
        return $this->belongsTo(ReturnRecord::class, 'return_id');
    }

    /**
     * Get the product that was returned
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Get the user who adjusted the stock
     */
    public function stockAdjustedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'stock_adjusted_by');
    }

    /**
     * Adjust product inventory for this return item
     * Note: This method should be called within an existing transaction
     */
    public function adjustInventory(User $user): bool
    {
        if ($this->stock_adjusted) {
            \Log::info("Stock already adjusted for return item {$this->id}");
            return true; // Already adjusted
        }

        // Validate stock adjustment before processing
        if (!$this->validateStockAdjustment()) {
            \Log::error("Stock adjustment validation failed for return item {$this->id}");
            return false;
        }

        try {
            // Get the product and increase its stock
            $product = $this->product;
            if ($product) {
                // Get current stock before adjustment
                $oldStock = $product->stock;
                
                // Increase stock by return quantity
                $product->increment('stock', $this->quantity);
                
                // Get new stock after adjustment
                $newStock = $product->fresh()->stock;

                // Mark this item as stock adjusted
                $this->update([
                    'stock_adjusted' => true,
                    'stock_adjusted_at' => now(),
                    'stock_adjusted_by' => $user->id,
                ]);

                \Log::info("Stock adjusted for return item {$this->id}: Added {$this->quantity} to product {$product->name} (ID: {$product->id}) - Stock: {$oldStock} → {$newStock}");
                return true;
            }

            \Log::error("Product not found for return item {$this->id}");
            return false;
        } catch (\Exception $e) {
            \Log::error("Failed to adjust inventory for return item {$this->id}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Reverse inventory adjustment (if needed for cancellations)
     * Note: This method should be called within an existing transaction
     */
    public function reverseInventoryAdjustment(User $user): bool
    {
        if (!$this->stock_adjusted) {
            \Log::info("No stock adjustment to reverse for return item {$this->id}");
            return true; // Nothing to reverse
        }

        try {
            // Get the product and decrease its stock
            $product = $this->product;
            if ($product) {
                // Get current stock before reversal
                $oldStock = $product->stock;
                
                // Decrease stock by return quantity
                $product->decrement('stock', $this->quantity);
                
                // Get new stock after reversal
                $newStock = $product->fresh()->stock;

                // Mark this item as not stock adjusted
                $this->update([
                    'stock_adjusted' => false,
                    'stock_adjusted_at' => null,
                    'stock_adjusted_by' => null,
                ]);

                \Log::info("Stock adjustment reversed for return item {$this->id}: Removed {$this->quantity} from product {$product->name} (ID: {$product->id}) - Stock: {$oldStock} → {$newStock}");
                return true;
            }

            \Log::error("Product not found for return item {$this->id} during reversal");
            return false;
        } catch (\Exception $e) {
            \Log::error("Failed to reverse inventory adjustment for return item {$this->id}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Scope for items that need stock adjustment
     */
    public function scopePendingStockAdjustment($query)
    {
        return $query->where('stock_adjusted', false);
    }

    /**
     * Scope for items with completed stock adjustment
     */
    public function scopeStockAdjusted($query)
    {
        return $query->where('stock_adjusted', true);
    }

    /**
     * Scope for items by product barcode
     */
    public function scopeByBarcode($query, $barcode)
    {
        return $query->where('product_barcode', $barcode);
    }

    /**
     * Validate stock adjustment before processing
     */
    private function validateStockAdjustment(): bool
    {
        $product = $this->product;
        
        // Check product exists (removed is_active check as field doesn't exist)
        if (!$product) {
            \Log::error("Product is not available for stock adjustment: Product ID {$this->product_id}");
            return false;
        }

        // Allow negative stock for returns (legitimate business scenario)
        // Removed negative stock check as it's not relevant for returns

        // Add stock adjustment limits (configurable)
        $maxStockAdjustment = config('returns.max_stock_adjustment', 1000);
        if ($this->quantity > $maxStockAdjustment) {
            \Log::error("Stock adjustment exceeds maximum allowed: {$this->quantity} > {$maxStockAdjustment}");
            return false;
        }

        // Validate return quantity is positive
        if ($this->quantity <= 0) {
            \Log::error("Invalid return quantity: {$this->quantity}");
            return false;
        }

        return true;
    }

    /**
     * Calculate total value of returned items
     */
    public static function getTotalReturnValue($dateFrom = null, $dateTo = null): float
    {
        $query = self::query();

        if ($dateFrom && $dateTo) {
            $query->whereBetween('created_at', [$dateFrom, $dateTo]);
        }

        return $query->sum('return_total');
    }

    /**
     * Get most returned products
     */
    public static function getMostReturnedProducts($limit = 10)
    {
        return self::select('product_name', 'product_barcode')
            ->selectRaw('SUM(quantity) as total_returned')
            ->selectRaw('COUNT(*) as return_count')
            ->selectRaw('SUM(return_total) as total_value')
            ->groupBy('product_name', 'product_barcode')
            ->orderByDesc('total_returned')
            ->limit($limit)
            ->get();
    }
}