<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'transaction_number',
        'total_amount',
        'amount_paid',
        'change_due',
        'discount',
        'items_count',
        'status',
        'user_id',
        'notes',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'change_due' => 'decimal:2',
        'discount' => 'decimal:2',
        'items_count' => 'integer',
    ];

    /**
     * Generate a unique transaction number using the same pattern as receipt service
     * Format: YYMMDDHHMMSSRR (Year, Month, Day, Hour, Minute, Second, Random)
     */
    public static function generateTransactionNumber(): string
    {
        $now = now();
        $yy = $now->format('y'); // 2-digit year
        $mm = $now->format('m'); // 2-digit month
        $dd = $now->format('d'); // 2-digit day
        $hh = $now->format('H'); // 2-digit hour (24-hour format)
        $min = $now->format('i'); // 2-digit minute
        $ss = $now->format('s'); // 2-digit second

        // Generate 2-digit random number for uniqueness
        $random = str_pad(mt_rand(0, 99), 2, '0', STR_PAD_LEFT);

        return "{$yy}{$mm}{$dd}{$hh}{$min}{$ss}{$random}";
    }

    /**
     * Relationship with user (cashier)
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relationship with transaction items
     */
    public function items(): HasMany
    {
        return $this->hasMany(TransactionItem::class);
    }

    /**
     * Alias for transaction items (for compatibility with report service)
     */
    public function transactionItems(): HasMany
    {
        return $this->items();
    }

    /**
     * Get returns associated with this transaction
     */
    public function returns(): HasMany
    {
        return $this->hasMany(ReturnRecord::class, 'original_transaction_id');
    }

    /**
     * Scope for completed transactions
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope for date range
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    /**
     * Check if all items in this transaction have been fully returned
     */
    public function isFullyReturned(): bool
    {
        // Get all transaction items with their quantities
        $transactionItems = $this->items;

        if ($transactionItems->isEmpty()) {
            return false;
        }

        // For each transaction item, check if the total returned quantity equals the original quantity
        foreach ($transactionItems as $transactionItem) {
            $totalReturned = \App\Models\ReturnItem::where('product_id', $transactionItem->product_id)
                ->whereHas('returnRecord', function ($query) {
                    $query->where('original_transaction_id', $this->id);
                })
                ->sum('return_quantity');

            if ($totalReturned < $transactionItem->quantity) {
                return false; // Not all items of this product have been returned
            }
        }

        return true; // All items have been fully returned
    }

    /**
     * Get the total quantity returned for this transaction
     */
    public function getTotalReturnedQuantity(): int
    {
        return \App\Models\ReturnItem::whereHas('returnRecord', function ($query) {
            $query->where('original_transaction_id', $this->id);
        })->sum('return_quantity');
    }

    /**
     * Get the total original quantity for this transaction
     */
    public function getTotalOriginalQuantity(): int
    {
        return $this->items->sum('quantity');
    }

    /**
     * Process partial return by updating transaction item quantities
     */
    public function processPartialReturn(array $returnItems): bool
    {
        try {
            DB::beginTransaction();

            foreach ($returnItems as $returnItem) {
                // Find the corresponding transaction item by product_id OR barcode
                $transactionItem = null;

                // First try to find by product_id
                if (isset($returnItem['product_id'])) {
                    $transactionItem = $this->items()
                        ->where('product_id', $returnItem['product_id'])
                        ->first();
                }

                // If not found by product_id, try to find by barcode
                if (!$transactionItem && isset($returnItem['barcode'])) {
                    $transactionItem = $this->items()
                        ->where('barcode', $returnItem['barcode'])
                        ->first();
                }

                // If still not found, try to find by matching with product barcode
                if (!$transactionItem && isset($returnItem['product_id'])) {
                    $product = \App\Models\Product::find($returnItem['product_id']);
                    if ($product) {
                        $transactionItem = $this->items()
                            ->where('barcode', $product->barcode)
                            ->first();
                    }
                }

                if ($transactionItem) {
                    Log::info("Processing return for transaction {$this->transaction_number}: Product {$transactionItem->barcode} - Return qty: {$returnItem['return_quantity']}, Current qty: {$transactionItem->quantity}");
                    Log::info("Match found: Product ID {$transactionItem->product_id}, Barcode {$transactionItem->barcode}");

                    $newQuantity = $transactionItem->quantity - $returnItem['return_quantity'];

                    if ($newQuantity <= 0) {
                        // If quantity becomes 0 or negative, delete the transaction item
                        $transactionItem->delete();
                        Log::info("Transaction item deleted - quantity became {$newQuantity}");
                    } else {
                        // Update the quantity and recalculate total
                        $transactionItem->update([
                            'quantity' => $newQuantity,
                            'total' => $newQuantity * $transactionItem->price
                        ]);
                        Log::info("Transaction item updated - new quantity: {$newQuantity}");
                    }
                } else {
                    Log::warning("No matching transaction item found for return item with product_id: " . ($returnItem['product_id'] ?? 'null') . ", barcode: " . ($returnItem['barcode'] ?? 'null'));
                    Log::warning("Available transaction items in transaction {$this->transaction_number}: " . $this->items->pluck('product_id', 'barcode')->toJson());
                }
            }

            // Recalculate transaction totals
            $this->recalculateTransactionTotals();

            // Check if transaction has any items left
            if ($this->items()->count() === 0) {
                // Delete the transaction if no items remain
                $this->delete();
                DB::commit();
                return true; // Return true to indicate transaction was deleted
            }

            DB::commit();
            return false; // Return false to indicate transaction was updated but not deleted
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to process partial return for transaction ' . $this->id . ': ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Recalculate transaction totals after items are modified
     */
    private function recalculateTransactionTotals(): void
    {
        $items = $this->items()->get();

        $newTotal = $items->sum('total');
        $newItemsCount = $items->sum('quantity');

        // Calculate the difference in total amount (return amount)
        $returnAmount = $this->total_amount - $newTotal;

        // Update payment fields by reducing them by the return amount
        $newAmountPaid = max(0, $this->amount_paid - $returnAmount);
        $newChangeDue = max(0, $this->change_due - $returnAmount);

        $this->update([
            'total_amount' => $newTotal,
            'items_count' => $newItemsCount,
            'amount_paid' => $newAmountPaid,
            'change_due' => $newChangeDue
        ]);

        Log::info("Transaction {$this->transaction_number} updated: Total: {$newTotal}, Amount Paid: {$newAmountPaid}, Change Due: {$newChangeDue}, Return Amount: {$returnAmount}");
    }
}