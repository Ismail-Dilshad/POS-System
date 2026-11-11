<?php

namespace App\Models;

use App\Services\ProductCacheService;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Log;

class Product extends Model
{
    use HasFactory, \App\Models\Concerns\HasItemImage;



    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'image_path',
        'category_id',
        'supplier_id',
        'barcode_type',
        'barcode',
        'secondary_barcode',
        'cost_price',
        'sell_price',
        'stock',
        'min_stock',
        'per_carton',
        'carton_price',
        'show_in_pos',
        'expire_date',
        'last_sold_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'cost_price' => 'decimal:2',
        'sell_price' => 'decimal:2',
        'carton_price' => 'decimal:2',
        'stock' => 'integer',
        'min_stock' => 'integer',
        'per_carton' => 'integer',
        'show_in_pos' => 'boolean',
        'expire_date' => 'date',
        'last_sold_at' => 'datetime',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array<int, string>
     */
    protected $appends = [
        'image_url',
        'profit_margin',
        'days_until_expire',
        'is_low_stock',
        'is_expired',
        'is_near_expiry',
        'carton_info',
    ];

    /**
     * Get the category that owns the product.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get the supplier that owns the product.
     */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    /**
     * Get return items for this product
     */
    public function returnItems(): HasMany
    {
        return $this->hasMany(ReturnItem::class);
    }

    /**
     * Get the profit margin percentage.
     *
     * @return float
     */
    public function getProfitMarginAttribute(): float
    {
        if ($this->cost_price > 0 && $this->sell_price > 0) {
            return round((($this->sell_price - $this->cost_price) / $this->cost_price) * 100, 2);
        }
        return 0.00;
    }

    /**
     * Get days until expiration.
     *
     * @return int
     */
    public function getDaysUntilExpireAttribute(): int
    {
        if ($this->expire_date) {
            $today = now();
            $expireDate = $this->expire_date;
            $diffInDays = $today->diffInDays($expireDate, false);
            return max(0, (int) $diffInDays);
        }
        return 0;
    }

    /**
     * Check if product is low in stock.
     *
     * @return bool
     */
    public function getIsLowStockAttribute(): bool
    {
        return $this->stock <= $this->min_stock;
    }

    /**
     * Check if product is expired.
     *
     * @return bool
     */
    public function getIsExpiredAttribute(): bool
    {
        if ($this->expire_date) {
            return now()->isAfter($this->expire_date);
        }
        return false;
    }

    /**
     * Check if product is near expiry (within 30 days).
     *
     * @return bool
     */
    public function getIsNearExpiryAttribute(): bool
    {
        if ($this->expire_date) {
            return $this->days_until_expire <= 30 && $this->days_until_expire > 0;
        }
        return false;
    }

    /**
     * Get carton information for display.
     *
     * @return string|null
     */
    public function getCartonInfoAttribute(): ?string
    {
        if ($this->per_carton && $this->per_carton > 0) {
            $cartons = floor($this->stock / $this->per_carton);
            $remaining = $this->stock % $this->per_carton;
            
            if ($cartons > 0) {
                $info = "{$cartons} carton" . ($cartons > 1 ? 's' : '');
                if ($remaining > 0) {
                    $info .= " + {$remaining} loose";
                }
                return $info;
            } elseif ($remaining > 0) {
                return "{$remaining} loose items";
            }
        }
        return null;
    }

    /**
     * Scope for searching products.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param string $search
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeSearch($query, $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
              ->orWhere('barcode', 'like', "%{$search}%")
              ->orWhere('secondary_barcode', 'like', "%{$search}%")
              ->orWhereHas('category', function ($categoryQuery) use ($search) {
                  $categoryQuery->where('name', 'like', "%{$search}%");
              })
              ->orWhereHas('supplier', function ($supplierQuery) use ($search) {
                  $supplierQuery->where('name', 'like', "%{$search}%")
                               ->orWhere('supplier_code', 'like', "%{$search}%");
              });
        });
    }

    /**
     * Scope for low stock products.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeLowStock($query)
    {
        return $query->whereRaw('stock <= min_stock');
    }

    /**
     * Scope for expired products.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeExpired($query)
    {
        return $query->where('expire_date', '<', now());
    }

    /**
     * Scope for products visible in POS.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeVisibleInPos($query)
    {
        return $query->where('show_in_pos', true);
    }
}