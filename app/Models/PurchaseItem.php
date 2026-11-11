<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseItem extends Model
{
    protected $fillable = [
        'purchase_id',
        'product_id',
        'product_type',
        'product_name',
        'identifier',
        'cost_price',
        'sell_price',
        'quantity',
        'total_cost',
        'profit_margin',
        'supplier_id',
        'supplier_name',
    ];

    protected $casts = [
        'cost_price' => 'decimal:2',
        'sell_price' => 'decimal:2',
        'quantity' => 'decimal:3',
        'total_cost' => 'decimal:2',
        'profit_margin' => 'decimal:2',
    ];

    /**
     * Get the purchase that owns the purchase item.
     */
    public function purchase(): BelongsTo
    {
        return $this->belongsTo(Purchase::class);
    }

    /**
     * Get the supplier for the purchase item.
     */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    /**
     * Get the product for the purchase item (polymorphic).
     */
    public function product()
    {
        if ($this->product_type === 'product') {
            return $this->belongsTo(Product::class, 'product_id');
        } elseif ($this->product_type === 'scale_product') {
            return $this->belongsTo(ScaleProduct::class, 'product_id');
        }

        return null;
    }

    /**
     * Calculate total cost based on quantity and cost price.
     */
    public function calculateTotalCost(): float
    {
        return $this->quantity * $this->cost_price;
    }

    /**
     * Calculate profit margin percentage.
     */
    public function calculateProfitMargin(): float
    {
        if ($this->cost_price > 0) {
            return (($this->sell_price - $this->cost_price) / $this->cost_price) * 100;
        }
        return 0;
    }

    /**
     * Update calculated fields.
     */
    public function updateCalculations(): void
    {
        $this->update([
            'total_cost' => $this->calculateTotalCost(),
            'profit_margin' => $this->calculateProfitMargin(),
        ]);
    }
}
