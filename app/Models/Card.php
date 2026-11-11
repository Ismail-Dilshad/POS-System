<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Card extends Model
{
    use HasFactory;

    protected $fillable = [
        'name_card_id',
        'cost_price',
        'sell_price',
        'profit_margin',
        'is_active',
    ];

    protected $casts = [
        'cost_price' => 'decimal:2',
        'sell_price' => 'decimal:2',
        'profit_margin' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    protected $appends = [
        'calculated_profit_margin',
        'profit_amount',
        'card_name',
    ];

    /**
     * Get the name card that owns this card.
     */
    public function nameCard(): BelongsTo
    {
        return $this->belongsTo(NameCard::class);
    }

    /**
     * Calculate profit margin percentage.
     */
    public function getCalculatedProfitMarginAttribute(): float
    {
        if ($this->cost_price > 0 && $this->sell_price > 0) {
            return round((($this->sell_price - $this->cost_price) / $this->cost_price) * 100, 2);
        }
        return 0.00;
    }

    /**
     * Calculate profit amount.
     */
    public function getProfitAmountAttribute(): float
    {
        return round($this->sell_price - $this->cost_price, 2);
    }

    /**
     * Get the card name (combination of name card name and pricing).
     */
    public function getCardNameAttribute(): string
    {
        $nameCardName = $this->nameCard ? $this->nameCard->name : 'Unknown';
        return $nameCardName . ' - $' . number_format($this->sell_price, 2);
    }

    /**
     * Check if the card is profitable.
     */
    public function isProfitable(): bool
    {
        return $this->sell_price > $this->cost_price;
    }

    /**
     * Get loss percentage if card is not profitable.
     */
    public function getLossPercentageAttribute(): float
    {
        if ($this->cost_price > 0 && $this->sell_price < $this->cost_price) {
            return round((($this->cost_price - $this->sell_price) / $this->cost_price) * 100, 2);
        }
        return 0.00;
    }

    /**
     * Scope to filter active cards.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to filter inactive cards.
     */
    public function scopeInactive($query)
    {
        return $query->where('is_active', false);
    }

    /**
     * Scope to filter profitable cards.
     */
    public function scopeProfitable($query)
    {
        return $query->whereColumn('sell_price', '>', 'cost_price');
    }

    /**
     * Scope to filter non-profitable cards.
     */
    public function scopeNotProfitable($query)
    {
        return $query->whereColumn('sell_price', '<=', 'cost_price');
    }

    /**
     * Scope to search cards by name card name.
     */
    public function scopeSearch($query, $term)
    {
        return $query->whereHas('nameCard', function ($q) use ($term) {
            $q->where('name', 'like', "%{$term}%");
        });
    }

    /**
     * Scope to filter by price range.
     */
    public function scopePriceRange($query, $minPrice = null, $maxPrice = null)
    {
        if ($minPrice !== null) {
            $query->where('sell_price', '>=', $minPrice);
        }

        if ($maxPrice !== null) {
            $query->where('sell_price', '<=', $maxPrice);
        }

        return $query;
    }

    /**
     * Automatically calculate and update profit margin before saving.
     */
    protected static function booted()
    {
        static::saving(function ($card) {
            // Auto-calculate profit margin
            if ($card->cost_price > 0 && $card->sell_price > 0) {
                $card->profit_margin = (($card->sell_price - $card->cost_price) / $card->cost_price) * 100;
            } else {
                $card->profit_margin = 0;
            }
        });
    }
}