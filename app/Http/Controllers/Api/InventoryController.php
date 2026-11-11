<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Card;
use App\Models\Product;
use App\Models\ScaleProduct;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class InventoryController extends Controller
{
    private const INVENTORY_INDEX_CACHE_KEY = 'inventory:index:v2:all';
    private const INVENTORY_STATS_CACHE_KEY = 'inventory:comprehensive_stats';
    private const INVENTORY_SEARCH_CACHE_KEY = 'inventory:search:v2';

    /**
     * Build inventory items with comprehensive database-level filtering
     * ALL filters are applied at database level for maximum performance
     * 
     * @param array $filters Filter parameters
     * @param bool $minimal Return minimal data (for search)
     * @param int|null $page Page number for pagination (null = all items)
     * @param int|null $perPage Items per page (null = all items)
     * @return array ['items' => Collection, 'total' => int]
     */
    private function buildInventoryItems(array $filters = [], bool $minimal = false, ?int $page = null, ?int $perPage = null)
    {
        $search = trim($filters['search'] ?? '');
        $status = $filters['status'] ?? null;
        $category = $filters['category'] ?? null;
        $supplier = $filters['supplier'] ?? null;
        $productType = $filters['productType'] ?? null;
        $priceMin = $filters['priceMin'] ?? null;
        $priceMax = $filters['priceMax'] ?? null;
        $stockMin = $filters['stockMin'] ?? null;
        $stockMax = $filters['stockMax'] ?? null;
        $dateFrom = $filters['dateFrom'] ?? null;
        $dateTo = $filters['dateTo'] ?? null;
        $notSoldPeriod = $filters['notSoldPeriod'] ?? null;
        $profitMarginMin = $filters['profitMarginMin'] ?? null;
        $profitMarginMax = $filters['profitMarginMax'] ?? null;

        // Normalize status filter
        if ($status === 'all' || $status === '') {
            $status = null;
        }

        // Build products query with database-level filtering
        $productsQuery = Product::query()
            ->select([
                'id',
                'name',
                'barcode',
                'secondary_barcode',
                'image_path',
                'category_id',
                'supplier_id',
                'cost_price',
                'sell_price',
                'stock',
                'min_stock',
                'per_carton',
                'carton_price',
                'show_in_pos',
                'expire_date',
                'last_sold_at',
                'created_at',
                'updated_at',
            ])
            ->with([
                'category' => function ($query) {
                    $query->select(['id', 'name']);
                },
                'supplier' => function ($query) {
                    $query->select(['id', 'name']);
                },
            ]);

        // Apply search filter (database level)
        if ($search !== '') {
            $productsQuery->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('barcode', 'like', "%{$search}%")
                  ->orWhere('secondary_barcode', 'like', "%{$search}%");
            });
        }

        // Apply category filter (database level)
        if ($category && $category !== 'all') {
            $productsQuery->whereHas('category', function ($q) use ($category) {
                $q->where('name', 'like', "%{$category}%");
            });
        }

        // Apply supplier filter (database level)
        if ($supplier && $supplier !== 'all') {
            $productsQuery->whereHas('supplier', function ($q) use ($supplier) {
                $q->where('name', 'like', "%{$supplier}%");
            });
        }

        // Apply product type filter (database level)
        // Map frontend values: 'normal' -> 'product', 'scale' -> 'scale_product', 'card' -> 'card'
        if ($productType && $productType !== 'all') {
            $normalizedType = match($productType) {
                'normal' => 'product',
                'scale' => 'scale_product',
                default => $productType,
            };
            if ($normalizedType !== 'product') {
                $productsQuery->whereRaw('1 = 0'); // Exclude products
            }
        }

        // Apply price range filters (database level)
        if ($priceMin !== null && $priceMin !== '') {
            $productsQuery->where('sell_price', '>=', (float) $priceMin);
        }
        if ($priceMax !== null && $priceMax !== '') {
            $productsQuery->where('sell_price', '<=', (float) $priceMax);
        }

        // Apply stock range filters (database level)
        if ($stockMin !== null && $stockMin !== '') {
            $productsQuery->where('stock', '>=', (int) $stockMin);
        }
        if ($stockMax !== null && $stockMax !== '') {
            $productsQuery->where('stock', '<=', (int) $stockMax);
        }

        // Apply date range filters (database level)
        if ($dateFrom) {
            $productsQuery->whereDate('created_at', '>=', $dateFrom);
        }
        if ($dateTo) {
            $productsQuery->whereDate('created_at', '<=', $dateTo);
        }

        // Apply not sold period filter (database level)
        if ($notSoldPeriod && $notSoldPeriod !== 'all') {
            $days = (int) $notSoldPeriod;
            if ($days > 0) {
                $cutoffDate = now()->subDays($days);
                $productsQuery->where(function ($q) use ($cutoffDate) {
                    $q->whereNull('last_sold_at')
                      ->orWhere('last_sold_at', '<=', $cutoffDate);
            });
            }
        }

        // Apply profit margin filters (database level - calculated)
        if ($profitMarginMin !== null && $profitMarginMin !== '') {
            $productsQuery->whereRaw('((sell_price - cost_price) / NULLIF(cost_price, 0) * 100) >= ?', [(float) $profitMarginMin]);
        }
        if ($profitMarginMax !== null && $profitMarginMax !== '') {
            $productsQuery->whereRaw('((sell_price - cost_price) / NULLIF(cost_price, 0) * 100) <= ?', [(float) $profitMarginMax]);
        }

        // Apply status filter (database level - based on stock calculations)
        if ($status === 'out_of_stock') {
            $productsQuery->where('stock', '=', 0);
        } elseif ($status === 'low_stock') {
            $productsQuery->where('stock', '>', 0)
                          ->whereColumn('stock', '<', 'min_stock');
        } elseif ($status === 'active') {
            $productsQuery->whereColumn('stock', '>=', 'min_stock');
        }

        // Add search priority ordering
        if ($search !== '') {
            $productsQuery->orderByRaw(
                "CASE
                    WHEN barcode = ? THEN 1
                    WHEN secondary_barcode = ? THEN 2
                    WHEN barcode LIKE ? THEN 3
                    WHEN secondary_barcode LIKE ? THEN 4
                    WHEN LOWER(name) LIKE ? THEN 5
                    WHEN LOWER(name) LIKE ? THEN 6
                    ELSE 7
                END",
                [
                    $search,
                    $search,
                    $search . '%',
                    $search . '%',
                    strtolower($search) . '%',
                    '%' . strtolower($search) . '%',
                ]
            );
        } else {
            $productsQuery->orderBy('name');
        }

        // Get total count for products (without pagination)
        $productsTotal = (clone $productsQuery)->count();

        // Apply database-level pagination if requested
        // Load enough items to ensure we can fill the page after combining and sorting across 3 tables
        // Calculate offset and load offset + perPage + buffer to account for type priority sorting
        if ($page !== null && $perPage !== null) {
            $offset = ($page - 1) * $perPage;
            // Load offset + perPage + buffer (perPage) to ensure enough items after sorting
            // This ensures we have enough items even if all items on current page come from one table type
            $itemsToLoad = $offset + $perPage + $perPage; // offset + perPage + buffer
            $productsQuery->take($itemsToLoad);
        }
        // No limit in export mode - fetch all products

        $products = $productsQuery->get()
            ->map(function ($product) use ($minimal) {
                $profit_margin = $product->cost_price > 0
                    ? round((($product->sell_price - $product->cost_price) / $product->cost_price) * 100, 2)
                    : 0.0;
                $profit_amount = round($product->sell_price - $product->cost_price, 2);

                $itemStatus = 'active';
                if ((int) $product->stock === 0) {
                    $itemStatus = 'out_of_stock';
                } elseif ($product->stock !== null && $product->min_stock !== null && (int) $product->stock > 0 && (int) $product->stock < (int) $product->min_stock) {
                    $itemStatus = 'low_stock';
                }

                $category = $product->category
                    ? ['id' => $product->category->id, 'name' => $product->category->name]
                    : null;

                $supplier = $product->supplier
                    ? ['id' => $product->supplier->id, 'name' => $product->supplier->name]
                    : null;

                $baseData = [
                    'id' => $product->id,
                    'name' => $product->name,
                    'image_url' => $product->image_url,
                    'product_type' => 'product',
                    'identifier' => $product->barcode,
                    'identifier_type' => 'barcode',
                    'barcode' => $product->barcode,
                    'secondary_barcode' => $product->secondary_barcode,
                    'category' => $category,
                    'supplier' => $supplier,
                    'cost_price' => (float) $product->cost_price,
                    'sell_price' => (float) $product->sell_price,
                    'stock' => $product->stock !== null ? (int) $product->stock : null,
                    'carton_price' => $product->carton_price !== null ? (float) $product->carton_price : null,
                    'status' => $itemStatus,
                ];

                if ($minimal) {
                    return $baseData;
                }

                $createdAt = $product->created_at?->toIso8601String();
                $updatedAt = $product->updated_at?->toIso8601String();
                $lastSoldAt = $product->last_sold_at?->toIso8601String();

                $originalData = $product->toArray();
                $originalData['created_at'] = $createdAt;
                $originalData['updated_at'] = $updatedAt;
                $originalData['last_sold_at'] = $lastSoldAt;
                if ($category !== null) {
                    $originalData['category'] = $category;
                }
                if ($supplier !== null) {
                    $originalData['supplier'] = $supplier;
                }

                return array_merge($baseData, [
                    'min_stock' => $product->min_stock !== null ? (int) $product->min_stock : null,
                    'per_carton' => $product->per_carton !== null ? (int) $product->per_carton : null,
                    'carton_price' => $product->carton_price !== null ? (float) $product->carton_price : null,
                    'carton_info' => $product->carton_info,
                    'profit_margin' => $profit_margin,
                    'profit_amount' => $profit_amount,
                    'created_at' => $createdAt,
                    'updated_at' => $updatedAt,
                    'last_sold_at' => $lastSoldAt,
                    'original_data' => $originalData,
                ]);
            });

        // Build scale products query with database-level filtering
        $scaleProductsQuery = ScaleProduct::query()
            ->select([
                'id',
                'name',
                'plu',
                'image_path',
                'scale_id',
                'category_id',
                'supplier_id',
                'cost_price',
                'sell_price',
                'stock',
                'min_stock',
                'created_at',
                'updated_at',
            ])
            ->with([
                'category' => function ($query) {
                    $query->select(['id', 'name']);
                },
                'supplier' => function ($query) {
                    $query->select(['id', 'name']);
                },
            ]);

        // Apply search filter (database level)
        if ($search !== '') {
            $scaleProductsQuery->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('plu', 'like', "%{$search}%")
                  ->orWhere('scale_id', 'like', "%{$search}%");
            });
        }

        // Apply category filter (database level)
        if ($category && $category !== 'all') {
            $scaleProductsQuery->whereHas('category', function ($q) use ($category) {
                $q->where('name', 'like', "%{$category}%");
            });
        }

        // Apply supplier filter (database level)
        if ($supplier && $supplier !== 'all') {
            $scaleProductsQuery->whereHas('supplier', function ($q) use ($supplier) {
                $q->where('name', 'like', "%{$supplier}%");
            });
        }

        // Apply product type filter (database level)
        // Map frontend values: 'normal' -> 'product', 'scale' -> 'scale_product', 'card' -> 'card'
        if ($productType && $productType !== 'all') {
            $normalizedType = match($productType) {
                'normal' => 'product',
                'scale' => 'scale_product',
                default => $productType,
            };
            if ($normalizedType !== 'scale_product') {
                $scaleProductsQuery->whereRaw('1 = 0'); // Exclude scale products
            }
        }

        // Apply price range filters (database level)
        if ($priceMin !== null && $priceMin !== '') {
            $scaleProductsQuery->where('sell_price', '>=', (float) $priceMin);
        }
        if ($priceMax !== null && $priceMax !== '') {
            $scaleProductsQuery->where('sell_price', '<=', (float) $priceMax);
        }

        // Apply stock range filters (database level)
        if ($stockMin !== null && $stockMin !== '') {
            $scaleProductsQuery->where('stock', '>=', (float) $stockMin);
        }
        if ($stockMax !== null && $stockMax !== '') {
            $scaleProductsQuery->where('stock', '<=', (float) $stockMax);
        }

        // Apply date range filters (database level)
        if ($dateFrom) {
            $scaleProductsQuery->whereDate('created_at', '>=', $dateFrom);
        }
        if ($dateTo) {
            $scaleProductsQuery->whereDate('created_at', '<=', $dateTo);
        }

        // Apply profit margin filters (database level)
        if ($profitMarginMin !== null && $profitMarginMin !== '') {
            $scaleProductsQuery->whereRaw('((sell_price - cost_price) / NULLIF(cost_price, 0) * 100) >= ?', [(float) $profitMarginMin]);
        }
        if ($profitMarginMax !== null && $profitMarginMax !== '') {
            $scaleProductsQuery->whereRaw('((sell_price - cost_price) / NULLIF(cost_price, 0) * 100) <= ?', [(float) $profitMarginMax]);
        }

        // Apply status filter (database level)
        if ($status === 'out_of_stock') {
            $scaleProductsQuery->where('stock', '=', 0);
        } elseif ($status === 'low_stock') {
            $scaleProductsQuery->where('stock', '>', 0)
                               ->whereColumn('stock', '<', 'min_stock');
        } elseif ($status === 'active') {
            $scaleProductsQuery->whereColumn('stock', '>=', 'min_stock');
        }

        // Add search priority ordering
        if ($search !== '') {
            $scaleProductsQuery->orderByRaw(
                "CASE
                    WHEN plu = ? THEN 1
                    WHEN scale_id = ? THEN 2
                    WHEN plu LIKE ? THEN 3
                    WHEN scale_id LIKE ? THEN 4
                    WHEN LOWER(name) LIKE ? THEN 5
                    WHEN LOWER(name) LIKE ? THEN 6
                    ELSE 7
                END",
                [
                    $search,
                    $search,
                    $search . '%',
                    $search . '%',
                    strtolower($search) . '%',
                    '%' . strtolower($search) . '%',
                ]
            );
        } else {
            $scaleProductsQuery->orderBy('name');
        }

        // Get total count for scale products (without pagination)
        $scaleProductsTotal = (clone $scaleProductsQuery)->count();

        // Apply database-level pagination if requested
        if ($page !== null && $perPage !== null) {
            $offset = ($page - 1) * $perPage;
            $itemsToLoad = $offset + $perPage + $perPage;
            $scaleProductsQuery->take($itemsToLoad);
        }
        // No limit in export mode - fetch all scale products

        $scaleProducts = $scaleProductsQuery->get()
            ->map(function ($scaleProduct) {
                $profit_margin = $scaleProduct->cost_price > 0
                    ? round((($scaleProduct->sell_price - $scaleProduct->cost_price) / $scaleProduct->cost_price) * 100, 2)
                    : 0.0;
                $profit_amount = round($scaleProduct->sell_price - $scaleProduct->cost_price, 2);

                $itemStatus = 'active';
                if ($scaleProduct->stock !== null && (float) $scaleProduct->stock === 0.0) {
                    $itemStatus = 'out_of_stock';
                } elseif (
                    $scaleProduct->stock !== null &&
                    $scaleProduct->min_stock !== null &&
                    (float) $scaleProduct->stock > 0.0 &&
                    (float) $scaleProduct->stock < (float) $scaleProduct->min_stock
                ) {
                    $itemStatus = 'low_stock';
                }

                $createdAt = $scaleProduct->created_at?->toIso8601String();
                $updatedAt = $scaleProduct->updated_at?->toIso8601String();

                $category = $scaleProduct->category
                    ? ['id' => $scaleProduct->category->id, 'name' => $scaleProduct->category->name]
                    : null;

                $supplier = $scaleProduct->supplier
                    ? ['id' => $scaleProduct->supplier->id, 'name' => $scaleProduct->supplier->name]
                    : null;

                $originalData = $scaleProduct->toArray();
                $originalData['created_at'] = $createdAt;
                $originalData['updated_at'] = $updatedAt;
                if ($category !== null) {
                    $originalData['category'] = $category;
                }
                if ($supplier !== null) {
                    $originalData['supplier'] = $supplier;
                }

                return [
                    'id' => $scaleProduct->id,
                    'name' => $scaleProduct->name,
                    'image_url' => $scaleProduct->image_url,
                    'product_type' => 'scale_product',
                    'identifier' => $scaleProduct->plu,
                    'identifier_type' => 'plu',
                    'category' => $category,
                    'supplier' => $supplier,
                    'cost_price' => (float) $scaleProduct->cost_price,
                    'sell_price' => (float) $scaleProduct->sell_price,
                    'stock' => $scaleProduct->stock !== null ? (float) $scaleProduct->stock : null,
                    'min_stock' => $scaleProduct->min_stock !== null ? (float) $scaleProduct->min_stock : null,
                    'status' => $itemStatus,
                    'profit_margin' => $profit_margin,
                    'profit_amount' => $profit_amount,
                    'created_at' => $createdAt,
                    'updated_at' => $updatedAt,
                    'last_sold_at' => null,
                    'original_data' => $originalData,
                ];
            });

        // Build cards query with database-level filtering
        $cardsQuery = Card::query()
            ->select([
                'id',
                'name_card_id',
                'cost_price',
                'sell_price',
                'is_active',
                'created_at',
                'updated_at',
            ])
            ->with(['nameCard' => function ($query) {
                $query->select(['id', 'name', 'image_path']);
            }]);

        // Apply search filter (database level)
        if ($search !== '') {
            $cardsQuery->whereHas('nameCard', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%");
                });
        }

        // Apply product type filter (database level)
        if ($productType && $productType !== 'all' && $productType !== 'card') {
            $cardsQuery->whereRaw('1 = 0'); // Return no cards
        }

        // Apply price range filters (database level)
        if ($priceMin !== null && $priceMin !== '') {
            $cardsQuery->where('sell_price', '>=', (float) $priceMin);
        }
        if ($priceMax !== null && $priceMax !== '') {
            $cardsQuery->where('sell_price', '<=', (float) $priceMax);
        }

        // Apply date range filters (database level)
        if ($dateFrom) {
            $cardsQuery->whereDate('created_at', '>=', $dateFrom);
        }
        if ($dateTo) {
            $cardsQuery->whereDate('created_at', '<=', $dateTo);
        }

        // Apply status filter for cards (database level)
        if ($status === 'out_of_stock' || $status === 'inactive') {
            $cardsQuery->where('is_active', false);
        } elseif ($status === 'active') {
            $cardsQuery->where('is_active', true);
        } elseif ($status === 'low_stock') {
            // Cards don't have stock, so exclude them from low_stock filter
            $cardsQuery->whereRaw('1 = 0');
        }

        // Apply profit margin filters (database level)
        if ($profitMarginMin !== null && $profitMarginMin !== '') {
            $cardsQuery->whereRaw('((sell_price - cost_price) / NULLIF(cost_price, 0) * 100) >= ?', [(float) $profitMarginMin]);
        }
        if ($profitMarginMax !== null && $profitMarginMax !== '') {
            $cardsQuery->whereRaw('((sell_price - cost_price) / NULLIF(cost_price, 0) * 100) <= ?', [(float) $profitMarginMax]);
        }

        // Add search priority ordering for cards
        if ($search !== '') {
            $cardsQuery->orderByRaw(
                "CASE
                    WHEN EXISTS (
                        SELECT 1 FROM name_cards 
                        WHERE name_cards.id = cards.name_card_id 
                        AND LOWER(name_cards.name) = LOWER(?)
                    ) THEN 1
                    WHEN EXISTS (
                        SELECT 1 FROM name_cards 
                        WHERE name_cards.id = cards.name_card_id 
                        AND LOWER(name_cards.name) LIKE LOWER(?)
                    ) THEN 2
                    ELSE 3
                END",
                [
                    $search,
                    $search . '%',
                ]
            );
        } else {
            $cardsQuery->orderBy('created_at');
        }

        // Get total count for cards (without pagination)
        $cardsTotal = (clone $cardsQuery)->count();

        // Apply database-level pagination if requested
        if ($page !== null && $perPage !== null) {
            $offset = ($page - 1) * $perPage;
            $itemsToLoad = $offset + $perPage + $perPage;
            $cardsQuery->take($itemsToLoad);
        }
        // No limit in export mode - fetch all cards

        $cards = $cardsQuery->get()
            ->when($search !== '', function ($collection) use ($search) {
                return $collection->sort(function ($a, $b) use ($search) {
                    $nameA = strtolower($a->nameCard->name ?? '');
                    $nameB = strtolower($b->nameCard->name ?? '');
                    $searchLower = strtolower($search);

                    $aStartsWith = str_starts_with($nameA, $searchLower);
                    $bStartsWith = str_starts_with($nameB, $searchLower);

                    if ($aStartsWith && !$bStartsWith) return -1;
                    if (!$aStartsWith && $bStartsWith) return 1;

                    return strcmp($nameA, $nameB);
                })->values();
            })
            ->map(function ($card) use ($minimal) {
                $baseData = [
                    'id' => $card->id,
                    'image_url' => $card->nameCard?->image_url,
                    'name' => $card->nameCard->name ?? 'Card',
                    'product_type' => 'card',
                    'identifier' => $card->nameCard->name ?? (string) $card->id,
                    'identifier_type' => 'card',
                    'category' => null,
                    'supplier' => null,
                    'cost_price' => (float) $card->cost_price,
                    'sell_price' => (float) $card->sell_price,
                    'stock' => null,
                    'status' => $card->is_active ? 'active' : 'inactive',
                ];

                if ($minimal) {
                    return $baseData;
                }

                $profit_margin = $card->cost_price > 0
                    ? round((($card->sell_price - $card->cost_price) / $card->cost_price) * 100, 2)
                    : 0.0;
                $profit_amount = round($card->sell_price - $card->cost_price, 2);

                $createdAt = $card->created_at?->toIso8601String();
                $updatedAt = $card->updated_at?->toIso8601String();

                $originalData = $card->toArray();
                $originalData['created_at'] = $createdAt;
                $originalData['updated_at'] = $updatedAt;
                if ($card->relationLoaded('nameCard') && $card->nameCard) {
                    $originalData['name_card'] = $card->nameCard->toArray();
                }

                return array_merge($baseData, [
                    'min_stock' => null,
                    'profit_margin' => $profit_margin,
                    'profit_amount' => $profit_amount,
                    'created_at' => $createdAt,
                    'updated_at' => $updatedAt,
                    'last_sold_at' => null,
                    'original_data' => $originalData,
                ]);
            });

        // Combine all items while preserving database ordering (which includes search priority)
        // Add index to preserve order within each type
        $productsWithIndex = $products->map(function ($item, $index) {
            $item['_sort_index'] = $index;
            return $item;
        });
        $scaleProductsWithIndex = $scaleProducts->map(function ($item, $index) {
            $item['_sort_index'] = $index;
            return $item;
        });
        $cardsWithIndex = $cards->map(function ($item, $index) {
            $item['_sort_index'] = $index;
            return $item;
        });

        $allItems = collect()->concat($productsWithIndex)->concat($scaleProductsWithIndex)->concat($cardsWithIndex);

        // Calculate total count across all tables
        $total = $productsTotal + $scaleProductsTotal + $cardsTotal;

        // Sort by product type priority (normal → scale_product → card)
        $allItems = $allItems->sort(function ($a, $b) {
            $typeRank = function ($type) {
                return match($type) {
                    'product' => 0,
                    'scale_product' => 1,
                    'card' => 2,
                    default => 3,
                };
            };

            $aRank = $typeRank($a['product_type'] ?? '');
            $bRank = $typeRank($b['product_type'] ?? '');

            if ($aRank !== $bRank) {
                return $aRank - $bRank;
            }

            // Same type, preserve database ordering
            $aIndex = $a['_sort_index'] ?? 999999;
            $bIndex = $b['_sort_index'] ?? 999999;
            return $aIndex - $bIndex;
        })->map(function ($item) {
            // Remove temporary sort index
            unset($item['_sort_index']);
            return $item;
        })->values();

        // Apply pagination if requested (after sorting)
        if ($page !== null && $perPage !== null) {
            $offset = ($page - 1) * $perPage;
            $allItems = $allItems->slice($offset, $perPage)->values();
        }

        return ['items' => $allItems, 'total' => $total];
    }

    /**
     * Get inventory items with intelligent pagination and comprehensive filtering
     * ALL filtering happens at database level for maximum performance
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // Extract all filter parameters
            $filters = [
                'search' => $request->get('search'),
                'status' => $request->get('status'),
                'category' => $request->get('category'),
                'supplier' => $request->get('supplier'),
                'productType' => $request->get('productType'),
                'priceMin' => $request->get('priceMin'),
                'priceMax' => $request->get('priceMax'),
                'stockMin' => $request->get('stockMin'),
                'stockMax' => $request->get('stockMax'),
                'dateFrom' => $request->get('dateFrom'),
                'dateTo' => $request->get('dateTo'),
                'notSoldPeriod' => $request->get('notSoldPeriod'),
                'profitMarginMin' => $request->get('profitMarginMin'),
                'profitMarginMax' => $request->get('profitMarginMax'),
            ];

            $minimal = $request->get('minimal', false) === 'true' || $request->get('minimal', false) === true;
            $exportMode = $request->get('export', false);
            
            if ($exportMode) {
                $result = $this->buildInventoryItems($filters, $minimal, null, null);
                $allItems = $result['items'];
                $total = $result['total'];
                
                return response()->json([
                    'success' => true,
                    'data' => $allItems->values(),
                    'pagination' => [
                        'total' => $total,
                        'per_page' => $total,
                        'current_page' => 1,
                        'last_page' => 1,
                        'from' => $total > 0 ? 1 : 0,
                        'to' => $total,
                    ]
                ]);
            }

            $page = max(1, (int) $request->get('page', 1));
            $perPage = max(1, min((int) $request->get('per_page', 10), 100));

            $hasFilters = !empty(array_filter($filters, fn($v) => $v !== null && $v !== '' && $v !== 'all'));
            $hasSearch = !empty($filters['search']);

            // Cache key for first page with no filters
            $cacheKey = !$hasFilters && $page === 1 && !$minimal
                ? self::INVENTORY_INDEX_CACHE_KEY . ':page:1'
                : null;

            if ($cacheKey) {
                if ($request->boolean('refresh')) {
                    Cache::forget($cacheKey);
                }
                $cachedData = Cache::remember($cacheKey, 300, function () use ($perPage, $minimal) {
                    $result = $this->buildInventoryItems([], $minimal, 1, $perPage);
                    $allItems = $result['items'];
                    $total = $result['total'];

                    return [
                        'data' => $allItems->values(),
                        'total' => $total,
                        'per_page' => $perPage,
                        'current_page' => 1,
                        'last_page' => (int) ceil($total / $perPage),
                    ];
                });

                return response()->json([
                    'success' => true,
                    'data' => $cachedData['data'],
                    'pagination' => [
                        'total' => $cachedData['total'],
                        'per_page' => $cachedData['per_page'],
                        'current_page' => $cachedData['current_page'],
                        'last_page' => $cachedData['last_page'],
                        'from' => ($cachedData['current_page'] - 1) * $cachedData['per_page'] + 1,
                        'to' => min($cachedData['current_page'] * $cachedData['per_page'], $cachedData['total']),
                    ]
                ]);
            }

            // Cache key for search queries (5 minutes TTL) - only for minimal mode (add purchase modal)
            $searchCacheKey = null;
            if ($hasSearch && $page === 1 && $minimal) {
                $searchHash = md5(json_encode([
                    'search' => $filters['search'],
                    'productType' => $filters['productType'] ?? null,
                    'minimal' => true,
                    'perPage' => $perPage,
                ]));
                $searchCacheKey = self::INVENTORY_SEARCH_CACHE_KEY . ':' . $searchHash;
            }

            if ($searchCacheKey && $request->boolean('refresh')) {
                Cache::forget($searchCacheKey);
            }

            if ($searchCacheKey && Cache::has($searchCacheKey)) {
                $cachedData = Cache::get($searchCacheKey);
            return response()->json([
                'success' => true,
                    'data' => $cachedData['data'],
                    'pagination' => $cachedData['pagination'],
                ]);
            }

            // Build items with filters applied at database level
            $result = $this->buildInventoryItems($filters, $minimal, $page, $perPage);
            $allItems = $result['items'];
            $total = $result['total'];

            $paginationData = [
                'total' => $total,
                'per_page' => $perPage,
                'current_page' => $page,
                'last_page' => (int) ceil($total / $perPage),
                'from' => $total > 0 ? ($page - 1) * $perPage + 1 : 0,
                'to' => $total > 0 ? min($page * $perPage, $total) : 0,
            ];

            // Cache search results for 5 minutes (300 seconds)
            if ($searchCacheKey) {
                Cache::put($searchCacheKey, [
                    'data' => $allItems->values(),
                    'pagination' => $paginationData,
                ], 300);
            }

            return response()->json([
                'success' => true,
                'data' => $allItems->values(),
                'pagination' => $paginationData,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch inventory', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch inventory: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get comprehensive statistics for inventory dashboard
     */
    public function getComprehensiveStatistics(Request $request): JsonResponse
    {
        try {
            if ($request->boolean('refresh')) {
                Cache::forget(self::INVENTORY_STATS_CACHE_KEY);
            }
            $stats = Cache::remember(self::INVENTORY_STATS_CACHE_KEY, 300, function () {
                $productStats = Product::query()
                    ->selectRaw('COUNT(*) as total_products')
                    ->selectRaw('SUM(CASE WHEN stock > 0 THEN 1 ELSE 0 END) as active_products')
                    ->selectRaw('SUM(CASE WHEN stock > 0 AND stock < min_stock THEN 1 ELSE 0 END) as low_stock_products')
                    ->selectRaw('SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) as out_of_stock_products')
                    ->selectRaw('COALESCE(SUM(stock * cost_price), 0) as total_cost_value')
                    ->selectRaw('COALESCE(SUM(stock * sell_price), 0) as total_sales_value')
                    ->selectRaw('COALESCE(AVG(CASE WHEN stock IS NOT NULL THEN stock END), 0) as average_stock')
                    ->selectRaw('COALESCE(SUM(CASE WHEN stock IS NOT NULL THEN stock END), 0) as total_stock')
                    ->first();

                $scaleStats = ScaleProduct::query()
                    ->selectRaw('COUNT(*) as total_scale_products')
                    ->selectRaw('SUM(CASE WHEN stock > 0 THEN 1 ELSE 0 END) as active_scale_products')
                    ->selectRaw('SUM(CASE WHEN stock > 0 AND stock < min_stock THEN 1 ELSE 0 END) as low_stock_scale_products')
                    ->selectRaw('SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) as out_of_stock_scale_products')
                    ->selectRaw('COALESCE(SUM(stock * cost_price), 0) as total_scale_cost_value')
                    ->selectRaw('COALESCE(SUM(stock * sell_price), 0) as total_scale_sales_value')
                    ->selectRaw('COALESCE(SUM(CASE WHEN stock IS NOT NULL THEN stock END), 0) as total_scale_stock')
                    ->first();

                $cardStats = Card::query()
                    ->selectRaw('COUNT(*) as total_cards')
                    ->selectRaw('SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_cards')
                    ->first();

                $totals = [
                    'total_products' => (int) ($productStats->total_products ?? 0),
                    'total_scale_products' => (int) ($scaleStats->total_scale_products ?? 0),
                    'total_cards' => (int) ($cardStats->total_cards ?? 0),
                ];

                $totalItems = $totals['total_products'] + $totals['total_scale_products'] + $totals['total_cards'];
                $activeItems = (int) ($productStats->active_products ?? 0)
                    + (int) ($scaleStats->active_scale_products ?? 0)
                    + (int) ($cardStats->active_cards ?? 0);
                $lowStockItems = (int) ($productStats->low_stock_products ?? 0)
                    + (int) ($scaleStats->low_stock_scale_products ?? 0);
                $outOfStockItems = (int) ($productStats->out_of_stock_products ?? 0)
                    + (int) ($scaleStats->out_of_stock_scale_products ?? 0);

                return [
                    'total_items' => $totalItems,
                    'total_products' => $totals['total_products'],
                    'total_scale_products' => $totals['total_scale_products'],
                    'total_cards' => $totals['total_cards'],
                    'active_items' => $activeItems,
                    'active_products' => (int) ($productStats->active_products ?? 0),
                    'active_scale_products' => (int) ($scaleStats->active_scale_products ?? 0),
                    'active_cards' => (int) ($cardStats->active_cards ?? 0),
                    'low_stock_items' => $lowStockItems,
                    'low_stock_products' => (int) ($productStats->low_stock_products ?? 0),
                    'low_stock_scale_products' => (int) ($scaleStats->low_stock_scale_products ?? 0),
                    'out_of_stock_items' => $outOfStockItems,
                    'out_of_stock_products' => (int) ($productStats->out_of_stock_products ?? 0),
                    'out_of_stock_scale_products' => (int) ($scaleStats->out_of_stock_scale_products ?? 0),
                    'total_value' => (float) (($productStats->total_cost_value ?? 0) + ($scaleStats->total_scale_cost_value ?? 0)),
                    'total_sales_value' => (float) (($productStats->total_sales_value ?? 0) + ($scaleStats->total_scale_sales_value ?? 0)),
                    'normal_products_value' => (float) ($productStats->total_sales_value ?? 0),
                    'scale_products_value' => (float) ($scaleStats->total_scale_sales_value ?? 0),
                    'average_stock_level' => (float) ($productStats->average_stock ?? 0),
                    'scale_stock_total' => (float) ($scaleStats->total_scale_stock ?? 0),
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get statistics: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Validate adjustment items before processing
     */
    public function validateAdjustments(Request $request): JsonResponse
    {
        try {
            // Accept both 'items' and 'adjustments' parameter names for flexibility
            $items = $request->input('items') ?? $request->input('adjustments');

            // Validate request structure
            $validator = \Validator::make(['items' => $items], [
                'items' => 'required|array|min:1',
                'items.*.id' => 'required|integer',
                'items.*.product_type' => 'required|in:product,scale_product',
                'items.*.adjust_type' => 'required|in:add,delete,set',
                'items.*.adjust_qty' => 'required|numeric|min:0',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                        'errors' => $validator->errors()->all()
                ], 422);
            }

            $errors = [];
            $validatedItems = [];

            foreach ($items as $item) {
                $productId = $item['id'];
                $productType = $item['product_type'];
                $adjustType = $item['adjust_type'];
                $adjustQty = (float) $item['adjust_qty'];

                if ($productType === 'product') {
                    $product = Product::find($productId);
                    if (!$product) {
                        $errors[] = "Product ID {$productId} not found";
                        continue;
                    }

                    $currentStock = (int) $product->stock;
                    $newStock = match ($adjustType) {
                        'add' => $currentStock + $adjustQty,
                        'delete' => max(0, $currentStock - $adjustQty),
                        'set' => $adjustQty,
                        default => $currentStock,
                    };

                    if ($newStock < 0) {
                        $errors[] = "Product '{$product->name}' cannot have negative stock";
                        continue;
                    }

                    $validatedItems[] = [
                        'id' => $productId,
                        'product_type' => 'product',
                        'name' => $product->name,
                        'current_stock' => $currentStock,
                        'adjust_type' => $adjustType,
                        'adjust_qty' => $adjustQty,
                        'new_stock' => $newStock,
                    ];
                } elseif ($productType === 'scale_product') {
                    $scaleProduct = ScaleProduct::find($productId);
                    if (!$scaleProduct) {
                        $errors[] = "Scale Product ID {$productId} not found";
                        continue;
                    }

                    $currentStock = (float) $scaleProduct->stock;
                    $newStock = match ($adjustType) {
                        'add' => $currentStock + $adjustQty,
                        'delete' => max(0, $currentStock - $adjustQty),
                        'set' => $adjustQty,
                        default => $currentStock,
                    };

                    if ($newStock < 0) {
                        $errors[] = "Scale Product '{$scaleProduct->name}' cannot have negative stock";
                        continue;
            }

                    $validatedItems[] = [
                        'id' => $productId,
                        'product_type' => 'scale_product',
                        'name' => $scaleProduct->name,
                        'current_stock' => $currentStock,
                        'adjust_type' => $adjustType,
                        'adjust_qty' => $adjustQty,
                        'new_stock' => $newStock,
                    ];
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'validated_items' => $validatedItems,
                    'errors' => $errors,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to validate adjustments: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Adjust inventory stock for multiple items
     */
    public function adjustInventory(Request $request): JsonResponse
    {
        try {
            $items = $request->input('items') ?? $request->input('adjustments');

            if (empty($items) || !is_array($items)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No items provided for adjustment'
                ], 422);
            }

            DB::beginTransaction();

            $adjustedItems = [];
            $errors = [];

            // Separate products and scale products for bulk operations
            $productIds = [];
            $scaleProductIds = [];
            $productAdjustments = [];
            $scaleProductAdjustments = [];

            foreach ($items as $item) {
                $id = (int) $item['id'];
                $type = $item['product_type'];
                $adjustType = $item['adjust_type'];
                $adjustQty = (float) $item['adjust_qty'];

                if ($type === 'product') {
                    $productIds[] = $id;
                    $productAdjustments[$id] = ['type' => $adjustType, 'qty' => $adjustQty];
                } elseif ($type === 'scale_product') {
                    $scaleProductIds[] = $id;
                    $scaleProductAdjustments[$id] = ['type' => $adjustType, 'qty' => $adjustQty];
                }
            }

            // Bulk load products and scale products
            $products = !empty($productIds)
                ? Product::whereIn('id', $productIds)->get()->keyBy('id')
                : collect();
            $scaleProducts = !empty($scaleProductIds)
                ? ScaleProduct::whereIn('id', $scaleProductIds)->get()->keyBy('id')
                : collect();

            // Process product adjustments
            foreach ($productAdjustments as $productId => $adjustment) {
                $product = $products->get($productId);
                        if (!$product) {
                    $errors[] = "Product ID {$productId} not found";
                            continue;
                        }

                $oldStock = (int) $product->stock;
                $newStock = match ($adjustment['type']) {
                    'add' => $oldStock + $adjustment['qty'],
                    'delete' => max(0, $oldStock - $adjustment['qty']),
                    'set' => $adjustment['qty'],
                    default => $oldStock,
                };

                if ($newStock < 0) {
                    $errors[] = "Product '{$product->name}' cannot have negative stock";
                    continue;
                }

                $product->stock = $newStock;
                $product->save();

                $adjustedItems[] = [
                    'id' => $productId,
                            'product_type' => 'product',
                            'name' => $product->name,
                    'old_stock' => $oldStock,
                            'new_stock' => $newStock,
                    'adjust_qty' => $adjustment['qty'],
                    'adjust_type' => $adjustment['type'],
                        ];
                }

                // Process scale product adjustments
            foreach ($scaleProductAdjustments as $scaleProductId => $adjustment) {
                $scaleProduct = $scaleProducts->get($scaleProductId);
                        if (!$scaleProduct) {
                    $errors[] = "Scale Product ID {$scaleProductId} not found";
                            continue;
                        }

                $oldStock = (float) $scaleProduct->stock;
                $newStock = match ($adjustment['type']) {
                    'add' => $oldStock + $adjustment['qty'],
                    'delete' => max(0, $oldStock - $adjustment['qty']),
                    'set' => $adjustment['qty'],
                    default => $oldStock,
                };

                if ($newStock < 0) {
                    $errors[] = "Scale Product '{$scaleProduct->name}' cannot have negative stock";
                    continue;
                }

                $scaleProduct->stock = $newStock;
                $scaleProduct->save();

                $adjustedItems[] = [
                    'id' => $scaleProductId,
                            'product_type' => 'scale_product',
                            'name' => $scaleProduct->name,
                    'old_stock' => $oldStock,
                            'new_stock' => $newStock,
                    'adjust_qty' => $adjustment['qty'],
                    'adjust_type' => $adjustment['type'],
                        ];
                }

            // Clear cache after adjustments
            Cache::forget(self::INVENTORY_INDEX_CACHE_KEY . ':page:1');
            Cache::forget(self::INVENTORY_STATS_CACHE_KEY);

                DB::commit();

                return response()->json([
                    'success' => true,
                'message' => 'Inventory adjusted successfully',
                    'data' => [
                    'adjusted_items' => $adjustedItems,
                        'errors' => $errors,
                    'total_processed' => count($adjustedItems),
                    'total_errors' => count($errors),
                    ]
                ]);
            } catch (\Exception $e) {
                DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to adjust inventory: ' . $e->getMessage()
            ], 500);
        }
    }
}
