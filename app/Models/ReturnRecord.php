<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReturnRecord extends Model
{
    use HasFactory;

    protected $table = 'returns';

    protected $fillable = [
        'return_code',
        'return_type',
        'original_transaction_id',
        'original_transaction_number',
        'total_return_amount',
        'processed_by_user_id',
    ];

    protected $casts = [
        'total_return_amount' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Generate a unique return code
     */
    public static function generateReturnCode(): string
    {
        $date = now()->format('ymd');
        $sequence = str_pad(
            self::whereDate('created_at', now())->count() + 1,
            4,
            '0',
            STR_PAD_LEFT
        );

        return "RTN-{$date}{$sequence}";
    }

    /**
     * Get the transaction that was returned (for receipt-based returns)
     */
    public function originalTransaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class, 'original_transaction_id');
    }

    /**
     * Get the user who processed this return
     */
    public function processedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by_user_id');
    }

    /**
     * Get all items in this return
     */
    public function items(): HasMany
    {
        return $this->hasMany(ReturnItem::class, 'return_id');
    }

    /**
     * Scope for receipt-based returns
     */
    public function scopeReceipt($query)
    {
        return $query->where('return_type', 'receipt');
    }

    /**
     * Scope for manual returns
     */
    public function scopeManual($query)
    {
        return $query->where('return_type', 'manual');
    }

    /**
     * Scope for returns within date range
     */
    public function scopeDateRange($query, $from, $to, $timezone = 'UTC')
    {
        $start = Carbon::parse($from, $timezone)->startOfDay()->utc();
        $end = Carbon::parse($to, $timezone)->endOfDay()->utc();
        return $query->whereBetween('created_at', [$start, $end]);
    }

    /**
     * Process inventory adjustments for all items in this return
     * Note: This method should be called within an existing transaction
     */
    public function processInventoryAdjustments(User $user): bool
    {
        try {
            foreach ($this->items as $item) {
                if (!$item->stock_adjusted) {
                    if (!$item->adjustInventory($user)) {
                        \Log::error("Failed to adjust inventory for return item {$item->id} in return {$this->return_code}");
                        return false;
                    }
                }
            }

            return true;
        } catch (\Exception $e) {
            \Log::error('Failed to process inventory adjustments for return ' . $this->return_code . ': ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Check if this return has fully processed inventory adjustments
     */
    public function isInventoryFullyAdjusted(): bool
    {
        return $this->items()->where('stock_adjusted', false)->count() === 0;
    }

    /**
     * Get return statistics
     */
    public static function getStatistics($dateFrom = null, $dateTo = null, $timeFrom = null, $timeTo = null, $timezone = 'UTC'): array
    {
        try {
            $baseQuery = self::query();

            if ($dateFrom || $dateTo || $timeFrom || $timeTo) {
                // If only time filters are provided, use today's date
                if (!$dateFrom && !$dateTo) {
                    $start = \Carbon\Carbon::today($timezone);
                    $end = \Carbon\Carbon::today($timezone);
                } else {
                    $start = $dateFrom
                        ? \Carbon\Carbon::parse($dateFrom, $timezone)
                        : \Carbon\Carbon::createFromTimestamp(0, $timezone);
                    
                    $end = $dateTo
                        ? \Carbon\Carbon::parse($dateTo, $timezone)
                        : \Carbon\Carbon::now($timezone)->addYears(100);
                }

                // Apply time filters if provided
                if ($timeFrom) {
                    $timeFromFormatted = $timeFrom; // Format: "HH:MM"
                    $start = $start->copy()->setTimeFromTimeString($timeFromFormatted . ':00');
                } else {
                    $start = $start->startOfDay();
                }

                if ($timeTo) {
                    $timeToFormatted = $timeTo; // Format: "HH:MM"
                    $end = $end->copy()->setTimeFromTimeString($timeToFormatted . ':00');
                } else {
                    $end = $end->endOfDay();
                }

                // Convert to UTC for database comparison
                $start = $start->utc();
                $end = $end->utc();

                $baseQuery->whereBetween('created_at', [$start, $end]);
            }

            // Use more efficient single query with conditional aggregation
            $results = $baseQuery->selectRaw("
                COUNT(*) as total_returns,
                COALESCE(SUM(total_return_amount), 0) as total_amount,
                COUNT(CASE WHEN return_type = 'receipt' THEN 1 END) as receipt_returns,
                COUNT(CASE WHEN return_type = 'manual' THEN 1 END) as manual_returns
            ")->first();


            $totalReturns = (int) $results->total_returns;
            $totalAmount = (float) $results->total_amount;
            $receiptReturns = (int) $results->receipt_returns;
            $manualReturns = (int) $results->manual_returns;


            return [
                'total_returns' => $totalReturns,
                'total_amount' => $totalAmount,
                'receipt_returns' => $receiptReturns,
                'manual_returns' => $manualReturns,
                'average_return_value' => $totalReturns > 0 ? round($totalAmount / $totalReturns, 2) : 0,
            ];
        } catch (\Exception $e) {
            \Log::error('Failed to get return statistics: ' . $e->getMessage());

            // Return default statistics on error
            return [
                'total_returns' => 0,
                'total_amount' => 0,
                'receipt_returns' => 0,
                'manual_returns' => 0,
                'average_return_value' => 0,
            ];
        }
    }
}