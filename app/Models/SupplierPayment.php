<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

class SupplierPayment extends Model
{
    protected $fillable = [
        'purchase_id',
        'supplier_id',
        'supplier_name',
        'total_amount',
        'paid_amount',
        'remaining_amount',
        'payment_status',
        'notes',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'remaining_amount' => 'decimal:2',
    ];

    protected $appends = [
        'payment_date',
    ];

    /**
     * Get the purchase that owns the payment.
     */
    public function purchase(): BelongsTo
    {
        return $this->belongsTo(Purchase::class);
    }

    /**
     * Get the supplier that owns the payment.
     */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    /**
     * Update payment status based on amounts.
     */
    public function updatePaymentStatus(): void
    {
        if ($this->paid_amount >= $this->total_amount) {
            $this->payment_status = 'paid';
        } elseif ($this->paid_amount > 0) {
            $this->payment_status = 'partial';
        } else {
            $this->payment_status = 'debt';
        }

        $this->save();
    }

    /**
     * Check if payment is fully paid.
     */
    public function isFullyPaid(): bool
    {
        return $this->payment_status === 'paid';
    }

    /**
     * Check if payment is partially paid.
     */
    public function isPartiallyPaid(): bool
    {
        return $this->payment_status === 'partial';
    }

    /**
     * Check if payment is debt (unpaid).
     */
    public function isDebt(): bool
    {
        return $this->payment_status === 'debt';
    }

    public function getPaymentDateAttribute(): ?string
    {
        $updatedAt = $this->updated_at instanceof Carbon
            ? $this->updated_at
            : ($this->updated_at ? Carbon::parse($this->updated_at) : null);

        $createdAt = $this->created_at instanceof Carbon
            ? $this->created_at
            : ($this->created_at ? Carbon::parse($this->created_at) : null);

        if ($this->payment_status === 'paid' && $updatedAt) {
            return $updatedAt->toIso8601String();
        }

        if ($createdAt) {
            return $createdAt->toIso8601String();
        }

        return null;
    }
}
