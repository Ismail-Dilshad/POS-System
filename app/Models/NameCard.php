<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class NameCard extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'image_path',
        'image_original_name',
        'image_size',
        'image_mime_type',
    ];

    protected $casts = [
        'image_size' => 'integer',
    ];

    protected $appends = [
        'image_url',
        'has_image',
        'cards_count',
    ];

    /**
     * Get the cards associated with this name card.
     */
    public function cards(): HasMany
    {
        return $this->hasMany(Card::class);
    }

    /**
     * Get the active cards associated with this name card.
     */
    public function activeCards(): HasMany
    {
        return $this->hasMany(Card::class)->where('is_active', true);
    }

    /**
     * Get the full URL for the image.
     */
    public function getImageUrlAttribute(): ?string
    {
        if (!$this->image_path) {
            return null;
        }

        // Check if file exists in storage
        if (!Storage::disk('public')->exists($this->image_path)) {
            return null;
        }

        try {
            // Use Laravel's built-in URL generation for better reliability
            $url = Storage::disk('public')->url($this->image_path);
            
            // Add cache busting parameter using file modification time
            $filePath = Storage::disk('public')->path($this->image_path);
            if (file_exists($filePath)) {
                $timestamp = filemtime($filePath);
                $url .= '?v=' . $timestamp;
            }
            
            return $url;
        } catch (\Exception $e) {
            // Fallback to relative URL if storage URL fails
            $url = '/storage/' . $this->image_path;
            
            // Add cache busting parameter
            $filePath = Storage::disk('public')->path($this->image_path);
            if (file_exists($filePath)) {
                $timestamp = filemtime($filePath);
                $url .= '?v=' . $timestamp;
            }
            
            return $url;
        }
    }

    /**
     * Check if the name card has an image.
     */
    public function getHasImageAttribute(): bool
    {
        return !empty($this->image_path);
    }

    /**
     * Get the count of cards associated with this name card.
     */
    public function getCardsCountAttribute(): int
    {
        return $this->cards()->count();
    }

    /**
     * Get formatted file size.
     */
    public function getFormattedSizeAttribute(): ?string
    {
        if (!$this->image_size) {
            return null;
        }

        $bytes = $this->image_size;
        $units = ['B', 'KB', 'MB', 'GB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, 2) . ' ' . $units[$i];
    }

    /**
     * Scope to search name cards.
     */
    public function scopeSearch($query, $term)
    {
        return $query->where('name', 'like', "%{$term}%");
    }

    /**
     * Scope to get name cards with images.
     */
    public function scopeWithImages($query)
    {
        return $query->whereNotNull('image_path');
    }

    /**
     * Scope to get name cards without images.
     */
    public function scopeWithoutImages($query)
    {
        return $query->whereNull('image_path');
    }

    /**
     * Delete the associated image file when the model is deleted.
     */
    protected static function booted()
    {
        static::deleting(function ($nameCard) {
            if ($nameCard->image_path && Storage::disk('public')->exists($nameCard->image_path)) {
                Storage::disk('public')->delete($nameCard->image_path);
            }
        });
    }
}