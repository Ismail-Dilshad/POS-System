<?php

namespace App\Models;

use App\Services\ProductCacheService;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Log;

class ScaleProduct extends Model
{
    use HasFactory, \App\Models\Concerns\HasItemImage;



    protected $fillable = [
        'name',
        'image_path',
        'category_id',
        'supplier_id',
        'scale_id',
        'plu',
        'cost_price',
        'sell_price',
        'stock',
        'min_stock',
    ];

    protected $appends = ['image_url'];

    protected $casts = [
        'cost_price' => 'decimal:2',
        'sell_price' => 'decimal:2',
        'stock' => 'decimal:2',
        'min_stock' => 'decimal:2',
    ];

    /**
     * Get the category that owns the scale product.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get the supplier that owns the scale product.
     */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    /**
     * Calculate profit margin percentage.
     */
    public function getProfitMarginAttribute(): float
    {
        if ($this->cost_price > 0 && $this->sell_price > 0) {
            return round((($this->sell_price - $this->cost_price) / $this->cost_price) * 100, 2);
        }
        return 0.00;
    }

    /**
     * Check if the scale product is low stock.
     */
    public function getIsLowStockAttribute(): bool
    {
        return $this->stock <= $this->min_stock && $this->stock > 0;
    }

    /**
     * Check if the scale product is out of stock.
     */
    public function getIsOutOfStockAttribute(): bool
    {
        return $this->stock <= 0;
    }

    /**
     * Get total stock value (stock * sell_price).
     */
    public function getStockValueAttribute(): float
    {
        return round($this->stock * $this->sell_price, 2);
    }

    /**
     * Scope to filter by search term.
     */
    public function scopeSearch($query, $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->where('name', 'like', "%{$term}%")
              ->orWhere('plu', 'like', "%{$term}%")
              ->orWhere('scale_id', 'like', "%{$term}%");
        });
    }

    /**
     * Scope to filter low stock products.
     */
    public function scopeLowStock($query)
    {
        return $query->whereColumn('stock', '<=', 'min_stock')
                    ->where('stock', '>', 0);
    }

    /**
     * Scope to filter out of stock products.
     */
    public function scopeOutOfStock($query)
    {
        return $query->where('stock', '<=', 0);
    }

    /**
     * Scope to filter products in stock.
     */
    public function scopeInStock($query)
    {
        return $query->whereColumn('stock', '>', 'min_stock');
    }
}