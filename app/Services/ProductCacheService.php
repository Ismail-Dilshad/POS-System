<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ScaleProduct;
use Illuminate\Support\Facades\Log;

class ProductCacheService
{
    /**
     * Get all products for POS (called once at startup)
     * Browser Map handles all lookups - this just returns fresh data from database
     */
    public function getAllProductsForPos(): array
    {
        try {
            // Safety limit: Maximum 10,000 products to prevent memory exhaustion
            // For larger inventories, consider implementing pagination or lazy loading
            return Product::select('id', 'name', 'barcode', 'secondary_barcode', 'sell_price', 'stock', 'per_carton', 'carton_price')
                ->limit(10000)
                ->get()
                ->map(function ($product) {
                    return [
                        'id' => $product->id,
                        'type' => 'product',
                        'name' => $product->name,
                        'barcode' => $product->barcode,
                        'secondary_barcode' => $product->secondary_barcode,
                        'sell_price' => $product->sell_price,
                        'stock' => $product->stock,
                        'per_carton' => $product->per_carton,
                        'carton_price' => $product->carton_price,
                    ];
                })
                ->toArray();
        } catch (\Exception $e) {
            Log::error('Failed to get all products', [
                'error' => $e->getMessage()
            ]);
            return [];
        }
    }


    /**
     * Search products by barcode (fallback - browser Map handles most lookups)
     */
    public function searchByBarcode(string $search): array
    {
        return $this->databaseBarcodeSearch($search);
    }

    /**
     * Search products by name (fallback - browser Map handles most lookups)
     */
    public function searchByName(string $search): array
    {
        return $this->databaseNameSearch($search);
    }





    /**
     * Build product cache (no-op - browser Map handles caching)
     */
    public function buildProductCache(): void
    {
        // No-op: Browser Map handles all caching
    }

    /**
     * Clear product cache (no-op - browser Map handles caching)
     */
    public function clearCache(): void
    {
        // No-op: Browser Map handles all caching
    }

    /**
     * Check if cache exists (always true - browser Map is always available)
     */
    public function isCacheValid(): bool
    {
        return true; // Browser Map is always valid
    }

    /**
     * Get cache statistics (simplified for browser Map)
     */
    public function getCacheStats(): array
    {
        $allProducts = $this->getAllProductsForPos();
        $productCount = count($allProducts);
        $productsWithCarton = 0;
        
        foreach ($allProducts as $product) {
            if (isset($product['per_carton']) && $product['per_carton'] !== null) {
                $productsWithCarton++;
            }
        }

        return [
            'cache_exists' => true,
            'cache_valid' => true,
            'cache_driver' => 'browser_map',
            'total_products' => $productCount,
            'regular_products' => $productCount,
            'products_with_carton' => $productsWithCarton,
        ];
    }

    /**
     * Refresh cache (no-op - browser Map handles caching)
     */
    public function refreshCache(): array
    {
        return [
            'success' => true,
            'message' => 'Browser Map cache is always fresh',
            'stats' => $this->getCacheStats(),
            'timestamp' => now()->toISOString()
        ];
    }

    /**
     * Update product stock (no-op - browser Map handles caching)
     */
    public function updateProductStock(int $productId, string $type = 'product'): void
    {
        // No-op: Browser Map will reload on next page refresh
    }

    /**
     * Smart update product (no-op - browser Map handles caching)
     */
    public function smartUpdateProduct(int $productId, string $type = 'product'): void
    {
        // No-op: Browser Map will reload on next page refresh
    }

    /**
     * Remove product from cache (no-op - browser Map handles caching)
     */
    public function removeProductFromCache(int $productId, string $type = 'product'): void
    {
        // No-op: Browser Map will reload on next page refresh
    }

    /**
     * Handle out-of-stock products (no-op)
     */
    public function handleOutOfStockProduct(int $productId, string $type = 'product'): void
    {
        // No-op: Browser Map will reload on next page refresh
    }

    /**
     * Get product stock (direct database query - no cache)
     */
    public function getProductStock(int $productId, string $type = 'product'): int
    {
        try {
            if ($type === 'product') {
                $product = Product::select('stock')->find($productId);
            } else {
                $product = ScaleProduct::select('stock')->find($productId);
            }
            
            return $product ? (int) $product->stock : 0;
        } catch (\Exception $e) {
            return 0;
        }
    }

    /**
     * Database search for products by name using LIKE pattern (contains)
     */
    private function databaseNameSearch(string $search): array
    {
        try {
            $searchTerm = trim($search);
            if (empty($searchTerm)) {
                return [];
            }

            $products = Product::select('id', 'name', 'barcode', 'secondary_barcode', 'sell_price', 'stock', 'per_carton', 'carton_price')
                ->where('name', 'LIKE', '%' . $searchTerm . '%')
                ->get()
                ->map(function ($product) {
                    return [
                        'id' => $product->id,
                        'type' => 'product',
                        'name' => $product->name,
                        'barcode' => $product->barcode,
                        'secondary_barcode' => $product->secondary_barcode,
                        'sell_price' => $product->sell_price,
                        'stock' => $product->stock,
                        'per_carton' => $product->per_carton,
                        'carton_price' => $product->carton_price,
                    ];
                });

            return $products->toArray();

        } catch (\Exception $e) {
            Log::error('Database name search failed', [
                'search' => $search,
                'error' => $e->getMessage()
            ]);
            return [];
        }
    }

    /**
     * Database search for products by barcode using LIKE pattern (starts with)
     */
    private function databaseBarcodeSearch(string $search): array
    {
        try {
            $searchTerm = trim($search);
            if (empty($searchTerm)) {
                return [];
            }

            $products = Product::select('id', 'name', 'barcode', 'secondary_barcode', 'sell_price', 'stock', 'per_carton', 'carton_price')
                ->where(function ($query) use ($searchTerm) {
                    $query->where('barcode', 'LIKE', $searchTerm . '%')
                          ->orWhere('secondary_barcode', 'LIKE', $searchTerm . '%');
                })
                ->get()
                ->map(function ($product) {
                    return [
                        'id' => $product->id,
                        'type' => 'product',
                        'name' => $product->name,
                        'barcode' => $product->barcode,
                        'secondary_barcode' => $product->secondary_barcode,
                        'sell_price' => $product->sell_price,
                        'stock' => $product->stock,
                        'per_carton' => $product->per_carton,
                        'carton_price' => $product->carton_price,
                    ];
                });

            return $products->toArray();

        } catch (\Exception $e) {
            Log::error('Database barcode search failed', [
                'search' => $search,
                'error' => $e->getMessage()
            ]);
            return [];
        }
    }
}