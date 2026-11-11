<?php

namespace App\Http\Middleware;

use App\Services\ProductCacheService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class EnsureProductCache
{
    private ProductCacheService $productCacheService;

    public function __construct(ProductCacheService $productCacheService)
    {
        $this->productCacheService = $productCacheService;
    }

    /**
     * Handle an incoming request and ensure product cache is available.
     */
    public function handle(Request $request, Closure $next): mixed
    {
        try {
            // Only try to build cache if cache driver is available
            $cacheDriver = config('cache.default');

            if ($cacheDriver !== 'array' && $cacheDriver !== 'null') {
                // Check if cache is valid
                if (!$this->productCacheService->isCacheValid()) {
                    Log::info('POS product cache missing - building cache for zero-delay lookup');
                    $this->productCacheService->buildProductCache();
                }
            } else {
                Log::info('Cache disabled, POS will use database fallback');
            }
        } catch (\Exception $e) {
            Log::warning('Failed to ensure product cache - using database fallback', [
                'error' => $e->getMessage(),
                'uri' => $request->getUri(),
            ]);
            // Don't fail the request if cache building fails
        }

        return $next($request);
    }
}