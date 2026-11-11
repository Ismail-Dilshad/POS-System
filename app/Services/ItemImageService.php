<?php

namespace App\Services;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Throwable;

class ItemImageService
{
    public static function rules(): array
    {
        return [
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'remove_image' => 'sometimes|boolean',
        ];
    }

    public function save(Model $item, array $attributes, ?UploadedFile $image, bool $remove): Model
    {
        unset($attributes['image'], $attributes['remove_image']);
        $oldPath = $item->image_path;
        $newPath = null;
        try {
            if ($image) {
                $newPath = $image->store('item-images', 'public');
                if (! $newPath) throw new RuntimeException('Unable to store item image');
                $attributes['image_path'] = $newPath;
            } elseif ($remove) {
                $attributes['image_path'] = null;
            }
            DB::transaction(fn () => $item->fill($attributes)->save());
        } catch (Throwable $exception) {
            if ($newPath) Storage::disk('public')->delete($newPath);
            throw $exception;
        }
        if ($oldPath && ($newPath || $remove)) {
            DB::afterCommit(fn () => Storage::disk('public')->delete($oldPath));
        }
        Cache::forget('inventory:index:v2:all:page:1');
        return $item;
    }
}
