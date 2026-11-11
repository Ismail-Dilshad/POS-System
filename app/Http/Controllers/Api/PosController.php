<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ProductCacheService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class PosController extends Controller
{
    private ProductCacheService $productCacheService;

    public function __construct(ProductCacheService $productCacheService)
    {
        $this->productCacheService = $productCacheService;
    }

    /**
     * Get all products for POS (called once at startup)
     * Browser Map handles all caching - this just returns fresh data
     */
    public function getAllProductsCache(Request $request): JsonResponse
    {
        try {
            // Get all products directly from database (browser Map handles caching)
            $allProducts = $this->productCacheService->getAllProductsForPos();
            
            // Minimal JSON structure for speed
            $compactData = array_map(function($product) {
                return [
                    'i' => $product['id'],           // id
                    't' => $product['type'],         // type
                    'n' => $product['name'],         // name
                    'b' => $product['barcode'],      // barcode
                    's' => $product['secondary_barcode'] ?? null, // secondary
                    'p' => $product['sell_price'],   // price
                    'k' => $product['stock'],        // stock
                    'u' => $product['plu'] ?? null,  // plu (scale)
                    'c' => $product['per_carton'] ?? null, // per_carton
                    'r' => $product['carton_price'] ?? null, // carton_price
                ];
            }, $allProducts);
            
            return response()->json([
                'success' => true,
                'data' => $compactData,
                'count' => count($compactData),
                'timestamp' => time(),
            ])
            ->header('Cache-Control', 'public, max-age=300');
            
        } catch (\Exception $e) {
            Log::error('Failed to get products cache', [
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to load products cache',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Search products by barcode for POS (fallback - browser Map handles most lookups)
     */
    public function searchByBarcode(Request $request): JsonResponse
    {
        $request->validate([
            'barcode' => 'required|string|min:1|max:50',
        ]);

        try {
            $barcode = trim($request->input('barcode'));

            // Direct database search (browser Map handles most lookups)
            $products = $this->productCacheService->searchByBarcode($barcode);

            $response = [
                'success' => true,
                'data' => $products,
                'count' => count($products),
                'timestamp' => time(),
            ];

            $jsonResponse = response()->json($response)
                ->header('X-Response-Time', microtime(true) - LARAVEL_START);

            // Enable compression if supported
            if (extension_loaded('zlib') && !ob_get_level()) {
                ob_start('ob_gzhandler');
            }

            return $jsonResponse;

        } catch (\Exception $e) {
            Log::error('POS barcode search failed', [
                'barcode' => $request->input('barcode'),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Search failed. Please try again.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Search products by name for POS (fallback - browser Map handles most lookups)
     */
    public function searchByName(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|min:1|max:100',
        ]);

        try {
            $name = trim($request->input('name'));

            // Direct database search (browser Map handles most lookups)
            $products = $this->productCacheService->searchByName($name);

            $response = [
                'success' => true,
                'data' => $products,
                'count' => count($products),
                'timestamp' => time(),
            ];

            $jsonResponse = response()->json($response)
                ->header('X-Response-Time', microtime(true) - LARAVEL_START);

            // Enable compression if supported
            if (extension_loaded('zlib') && !ob_get_level()) {
                ob_start('ob_gzhandler');
            }

            return $jsonResponse;

        } catch (\Exception $e) {
            Log::error('POS name search failed', [
                'name' => $request->input('name'),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Search failed. Please try again.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Rebuild product cache (no-op - browser Map handles caching)
     */
    public function rebuildCache(): JsonResponse
    {
        try {
            $this->productCacheService->buildProductCache();

            return response()->json([
                'success' => true,
                'message' => 'Browser Map cache is always fresh',
                'stats' => $this->productCacheService->getCacheStats(),
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to rebuild product cache', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to rebuild cache',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Refresh cache (no-op - browser Map handles caching)
     */
    public function refreshCache(): JsonResponse
    {
        try {
            $result = $this->productCacheService->refreshCache();

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'message' => $result['message'],
                    'stats' => $result['stats'],
                    'timestamp' => $result['timestamp'],
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => $result['message'],
                    'error' => $result['error'],
                    'timestamp' => $result['timestamp'],
                ], 500);
            }

        } catch (\Exception $e) {
            Log::error('Failed to refresh product cache', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to refresh cache',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get cache statistics
     */
    public function cacheStats(): JsonResponse
    {
        try {
            $stats = $this->productCacheService->getCacheStats();

            return response()->json([
                'success' => true,
                'data' => $stats,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get cache stats',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Clear product cache (no-op - browser Map handles caching)
     */
    public function clearCache(): JsonResponse
    {
        try {
            $this->productCacheService->clearCache();

            return response()->json([
                'success' => true,
                'message' => 'Browser Map cache is always fresh',
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to clear product cache', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to clear cache',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }

}