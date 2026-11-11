<?php

namespace App\Models\Concerns;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

trait HasItemImage
{
    public function getImageUrlAttribute(): ?string
    {
        return $this->image_path ? Storage::disk('public')->url($this->image_path) : null;
    }

    protected static function bootHasItemImage(): void
    {
        static::deleted(function ($item) {
            if ($item->image_path) {
                $path = $item->image_path;
                DB::afterCommit(fn () => Storage::disk('public')->delete($path));
            }
        });
    }
}
