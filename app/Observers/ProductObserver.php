<?php

namespace App\Observers;

use App\Models\Product;
use App\Services\ProductCacheService;
use Illuminate\Support\Facades\Log;

class ProductObserver
{
    /**
     * Handle the Product "created" event.
     */
    public function created(Product $product): void
    {
        // Handle cache update (optimized - no logging for performance)
        try {
            $cacheService = app(ProductCacheService::class);
            $cacheService->smartUpdateProduct($product->id, 'product');
            
            // Clear inventory cache to ensure fresh data
            \Illuminate\Support\Facades\Cache::forget('inventory:index:v2:all');
            \Illuminate\Support\Facades\Cache::forget('inventory:index:all');
            \Illuminate\Support\Facades\Cache::forget('inventory:comprehensive_stats');
        } catch (\Exception $e) {
            // Only log errors
            Log::error('Failed to add product to cache', [
                'product_id' => $product->id,
                'product' => $product->name,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Handle the Product "updated" event.
     */
    public function updated(Product $product): void
    {
        // Handle cache update (optimized - always update for any change, no field checking overhead)
        try {
            $cacheService = app(ProductCacheService::class);
            $cacheService->smartUpdateProduct($product->id, 'product');
            
            // Clear inventory cache to ensure fresh data
            \Illuminate\Support\Facades\Cache::forget('inventory:index:v2:all');
            \Illuminate\Support\Facades\Cache::forget('inventory:index:all');
            \Illuminate\Support\Facades\Cache::forget('inventory:comprehensive_stats');
        } catch (\Exception $e) {
            // Only log errors
            Log::error('Failed to update product cache', [
                'product_id' => $product->id,
                'product' => $product->name,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Handle the Product "deleted" event.
     */
    public function deleted(Product $product): void
    {
        // Handle cache removal (optimized - no logging for performance)
        try {
            $cacheService = app(ProductCacheService::class);
            $cacheService->removeProductFromCache($product->id, 'product');
            
            // Clear inventory cache to ensure fresh data
            \Illuminate\Support\Facades\Cache::forget('inventory:index:v2:all');
            \Illuminate\Support\Facades\Cache::forget('inventory:index:all');
            \Illuminate\Support\Facades\Cache::forget('inventory:comprehensive_stats');
        } catch (\Exception $e) {
            // Only log errors
            Log::error('Failed to remove product from cache', [
                'product_id' => $product->id,
                'product' => $product->name,
                'error' => $e->getMessage()
            ]);
        }
    }
}
