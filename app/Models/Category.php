<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
    ];

    /**
     * Get the products for the category.
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    /**
     * Get the scale products for the category.
     */
    public function scaleProducts(): HasMany
    {
        return $this->hasMany(ScaleProduct::class);
    }

    /**
     * Check if category is being used by any products
     */
    public function isInUse(): bool
    {
        return $this->products()->exists() || $this->scaleProducts()->exists();
    }

    /**
     * Get count of products using this category
     */
    public function getUsageCount(): int
    {
        return $this->products()->count() + $this->scaleProducts()->count();
    }
}