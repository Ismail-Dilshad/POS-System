<?php

namespace App\Observers;

use App\Models\ScaleProduct;
use App\Services\ProductCacheService;
use Illuminate\Support\Facades\Log;

class ScaleProductObserver
{
    /**
     * Handle the ScaleProduct "created" event.
     */
    public function created(ScaleProduct $scaleProduct): void
    {
        // Handle cache update
        try {
            $cacheService = app(ProductCacheService::class);
            $cacheService->smartUpdateProduct($scaleProduct->id, 'scale_product');
            Log::info('Scale product added to cache with smart update', ['product' => $scaleProduct->name]);
        } catch (\Exception $e) {
            Log::error('Failed to add scale product to cache with smart update', [
                'product' => $scaleProduct->name,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Handle the ScaleProduct "updated" event.
     */
    public function updated(ScaleProduct $scaleProduct): void
    {
        // Handle cache update
        $relevantFields = ['name', 'scale_id', 'plu', 'sell_price', 'stock'];
        if ($scaleProduct->wasChanged($relevantFields)) {
            try {
                $cacheService = app(ProductCacheService::class);
                $cacheService->smartUpdateProduct($scaleProduct->id, 'scale_product');
                Log::info('Scale product cache updated with smart update', ['product' => $scaleProduct->name]);
            } catch (\Exception $e) {
                Log::error('Failed to smart update scale product cache', [
                    'product' => $scaleProduct->name,
                    'error' => $e->getMessage()
                ]);
            }
        }
    }

    /**
     * Handle the ScaleProduct "deleted" event.
     */
    public function deleted(ScaleProduct $scaleProduct): void
    {
        // Handle cache removal
        try {
            $cacheService = app(ProductCacheService::class);
            $cacheService->removeProductFromCache($scaleProduct->id, 'scale_product');
            
            // Clear inventory cache to ensure fresh data
            \Illuminate\Support\Facades\Cache::forget('inventory:index:v2:all');
            \Illuminate\Support\Facades\Cache::forget('inventory:index:all');
            \Illuminate\Support\Facades\Cache::forget('inventory:comprehensive_stats');
            
            Log::info('Scale product removed from cache with smart update', ['product' => $scaleProduct->name]);
        } catch (\Exception $e) {
            Log::error('Failed to remove scale product from cache with smart update', [
                'product' => $scaleProduct->name,
                'error' => $e->getMessage()
            ]);
        }
    }
}
