<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class BarcodePrintController extends Controller
{
    private const BARCODE_PRODUCTS_CACHE_PREFIX = 'barcode:products:';
    private const CACHE_TTL_LIST = 300;
    private const CACHE_TTL_SEARCH = 180;

    public function index(Request $request): JsonResponse
    {
        try {
            $filters = [
                'name' => $request->get('name'),
                'barcode' => $request->get('barcode'),
                'category' => $request->get('category'),
                'supplier' => $request->get('supplier'),
            ];

            $page = max(1, (int) $request->get('page', 1));
            $perPage = max(1, min((int) $request->get('per_page', 10), 100));

            $hasFilters = !empty(array_filter($filters, fn($v) => $v !== null && $v !== '' && $v !== 'all'));
            $hasSearch = !empty($filters['name']) || !empty($filters['barcode']);

            $cacheKey = !$hasFilters && $page === 1
                ? self::BARCODE_PRODUCTS_CACHE_PREFIX . 'page:1'
                : null;

            if ($cacheKey) {
                $cachedData = Cache::remember($cacheKey, self::CACHE_TTL_LIST, function () use ($perPage) {
                    $result = $this->buildProductsQuery([], 1, $perPage);
                    return [
                        'data' => $result['items']->values(),
                        'total' => $result['total'],
                        'per_page' => $perPage,
                        'current_page' => 1,
                        'last_page' => (int) ceil($result['total'] / $perPage),
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

            $searchCacheKey = null;
            if ($hasSearch && $page === 1) {
                $searchHash = md5(json_encode([
                    'name' => $filters['name'] ?? null,
                    'barcode' => $filters['barcode'] ?? null,
                    'category' => $filters['category'] ?? null,
                    'supplier' => $filters['supplier'] ?? null,
                    'perPage' => $perPage,
                ]));
                $searchCacheKey = self::BARCODE_PRODUCTS_CACHE_PREFIX . 'search:' . $searchHash;
            }

            if ($searchCacheKey && Cache::has($searchCacheKey)) {
                $cachedData = Cache::get($searchCacheKey);
                return response()->json([
                    'success' => true,
                    'data' => $cachedData['data'],
                    'pagination' => $cachedData['pagination'],
                ]);
            }

            $result = $this->buildProductsQuery($filters, $page, $perPage);
            $items = $result['items'];
            $total = $result['total'];

            $paginationData = [
                'total' => $total,
                'per_page' => $perPage,
                'current_page' => $page,
                'last_page' => (int) ceil($total / $perPage),
                'from' => $total > 0 ? ($page - 1) * $perPage + 1 : 0,
                'to' => $total > 0 ? min($page * $perPage, $total) : 0,
            ];

            if ($searchCacheKey) {
                Cache::put($searchCacheKey, [
                    'data' => $items->values(),
                    'pagination' => $paginationData,
                ], self::CACHE_TTL_SEARCH);
            }

            return response()->json([
                'success' => true,
                'data' => $items->values(),
                'pagination' => $paginationData,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch barcode products', [
                'error' => $e->getMessage(),
                'trace' => substr($e->getTraceAsString(), 0, 500),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch products: ' . $e->getMessage(),
            ], 500);
        }
    }

    private function buildProductsQuery(array $filters = [], int $page = 1, int $perPage = 10): array
    {
        $name = trim($filters['name'] ?? '');
        $barcode = trim($filters['barcode'] ?? '');
        $category = $filters['category'] ?? null;
        $supplier = $filters['supplier'] ?? null;

        $query = Product::query()
            ->select([
                'id',
                'name',
                'barcode',
                'barcode_type',
                'sell_price',
                'category_id',
                'supplier_id',
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

        if ($name !== '') {
            $query->where('name', 'like', $name . '%');
        }

        if ($barcode !== '') {
            $query->where(function ($q) use ($barcode) {
                $q->where('barcode', 'like', $barcode . '%')
                  ->orWhere('secondary_barcode', 'like', $barcode . '%');
            });
        }

        if ($category && $category !== 'all') {
            $query->whereHas('category', function ($q) use ($category) {
                $q->where('name', $category);
            });
        }

        if ($supplier && $supplier !== 'all') {
            $query->whereHas('supplier', function ($q) use ($supplier) {
                $q->where('name', $supplier);
            });
        }

        $total = $query->count();

        $items = $query->orderBy('name', 'asc')
            ->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'barcode' => $product->barcode,
                    'barcode_type' => $product->barcode_type,
                    'category' => $product->category?->name,
                    'supplier' => $product->supplier?->name,
                    'sell_price' => (float) $product->sell_price,
                    'created_at' => $product->created_at,
                    'updated_at' => $product->updated_at,
                ];
            });

        return [
            'items' => $items,
            'total' => $total,
        ];
    }

}
