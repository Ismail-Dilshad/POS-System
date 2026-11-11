<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransactionItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'transaction_id',
        'product_id',
        'card_id',
        'scale_product_id',
        'barcode',
        'name',
        'price',
        'cost_price',
        'quantity',
        'weight',
        'total',
        'is_scale_product',
        'category',
        'supplier',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'cost_price' => 'decimal:2',
        'quantity' => 'integer',
        'weight' => 'decimal:3',
        'total' => 'decimal:2',
        'is_scale_product' => 'boolean',
    ];

    /**
     * Relationship with transaction
     */
    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }

    /**
     * Relationship with product (for regular products)
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Relationship with card
     */
    public function card(): BelongsTo
    {
        return $this->belongsTo(Card::class);
    }

    /**
     * Relationship with scale product
     */
    public function scaleProduct(): BelongsTo
    {
        return $this->belongsTo(ScaleProduct::class);
    }

    /**
     * Scope for scale products
     */
    public function scopeScaleProducts($query)
    {
        return $query->where('is_scale_product', true);
    }

    /**
     * Scope for regular products
     */
    public function scopeRegularProducts($query)
    {
        return $query->where('is_scale_product', false)
            ->whereNotNull('product_id');
    }

    /**
     * Scope for card items
     */
    public function scopeCardItems($query)
    {
        return $query->whereNotNull('card_id');
    }
}