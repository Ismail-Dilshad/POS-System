<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ScaleProduct;
use App\Models\Transaction;
use App\Models\TransactionItem;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Redis;
use Carbon\Carbon;

class TransactionController extends Controller
{
    private const TRANSACTION_LIST_CACHE_PREFIX = 'transactions:list:';
    private const TRANSACTION_SEARCH_CACHE_PREFIX = 'transactions:search:';
    private const TRANSACTION_STATS_CACHE_PREFIX = 'transactions:stats:';
    private const TRANSACTION_EXPORT_CACHE_PREFIX = 'transactions:export:';
    private const TRANSACTION_REPORT_CACHE_PREFIX = 'transactions:report:';
    private const TRANSACTION_REPORT_STATS_CACHE_PREFIX = 'transactions:report:stats:';
    private const TRANSACTION_REPORT_EXPORT_CACHE_PREFIX = 'transactions:report:export:';
    private const CACHE_TTL_LIST = 300;
    private const CACHE_TTL_SEARCH = 180;
    private const CACHE_TTL_STATS_TODAY = 30;
    private const CACHE_TTL_STATS_OTHER = 600;
    private const CACHE_TTL_EXPORT = 600;
    private const CACHE_TTL_REPORT = 300;
    private const CACHE_TTL_REPORT_STATS = 600;
    private const CACHE_TTL_REPORT_EXPORT = 600;
    /**
     * Validate stock availability for transaction items using pre-loaded collections
     */
    private function validateStock($items, $products, $scaleProducts): array
    {
        try {
            $insufficientItems = [];

            foreach ($items as $item) {
                // Skip stock validation for cards (they have unlimited stock)
                if (isset($item['card_id']) && $item['card_id']) {
                    continue;
                }
                
                $productId = $item['product_id'] ?? $item['scale_product_id'];
                $quantity = $item['quantity'] ?? 1;
                
                if ($productId) {
                    $product = null;
                    $scaleProduct = null;
                    $availableStock = 0;

                    if (isset($item['product_id']) && $item['product_id']) {
                        $product = $products->get($productId);
                        $availableStock = $product ? (int) $product->stock : 0;
                    } else {
                        $scaleProduct = $scaleProducts->get($productId);
                        $availableStock = $scaleProduct ? (int) $scaleProduct->stock : 0;
                    }

                    if ($availableStock < $quantity) {
                        $itemName = trim((string) ($item['name'] ?? $product?->name ?? $scaleProduct?->name ?? 'Item'));
                        $itemBarcode = $item['barcode']
                            ?? $product?->barcode
                            ?? $scaleProduct?->plu
                            ?? $scaleProduct?->scale_id
                            ?? null;

                        $insufficientItems[] = [
                            'name' => $itemName,
                            'barcode' => $itemBarcode,
                            'available' => $availableStock,
                            'requested' => $quantity,
                        ];
                    }
                }
            }
            
            if (!empty($insufficientItems)) {
                return [
                    'valid' => false,
                    'message' => 'Insufficient stock for requested items.',
                    'details' => $insufficientItems,
                ];
            }

            return ['valid' => true];
            
        } catch (\Exception $e) {
            Log::error('Stock validation failed', [
                'error' => $e->getMessage()
            ]);
            return [
                'valid' => false,
                'message' => 'Stock validation failed'
            ];
        }
    }

    /**
     * Display a listing of transactions
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = max(1, min((int) $request->get('per_page', 10), 100));

            $loadItems = $request->get('include_items', false);

            $query = Transaction::query()
                ->select([
                    'id',
                    'transaction_number',
                    'total_amount',
                    'amount_paid',
                    'change_due',
                    'discount',
                    'items_count',
                    'status',
                    'user_id',
                    'notes',
                    'created_at',
                    'updated_at',
                ])
                ->with([
                    'user:id,full_name,username',
                ]);

            if ($loadItems) {
                $query->with([
                    'items' => function ($itemQuery) use ($request) {
                        $itemQuery->select([
                            'id',
                            'transaction_id',
                            'product_id',
                            'card_id',
                            'scale_product_id',
                            'barcode',
                            'name',
                            'price',
                            'quantity',
                            'total',
                        ])->orderBy('id');
                    },
                ]);
            }

            // Apply filters
            if ($request->filled('search')) {
                $search = $request->get('search');
                $query->where(function ($q) use ($search, $loadItems) {
                    $q->where('transaction_number', 'like', "{$search}%")
                        ->orWhereHas('user', function ($userQuery) use ($search) {
                            $userQuery->where('full_name', 'like', "%{$search}%");
                        });
                    
                    if ($loadItems) {
                        $q->orWhereHas('items', function ($subQ) use ($search) {
                            $subQ->where(function ($inner) use ($search) {
                                $inner->where('name', 'like', "{$search}%")
                                    ->orWhere('barcode', 'like', "{$search}%");
                            });
                        });
                    }
                });
            }

            if ($dateRange = $this->resolveDateRange($request)) {
                $query->whereBetween('created_at', $dateRange);
            }

            $this->applyTransactionScopedFilters($request, $query);

            if ($request->filled('status')) {
                $query->where('status', $request->get('status'));
            }

            if ($request->filled('price_from') || $request->filled('price_min')) {
                $priceMin = $request->get('price_from') ?? $request->get('price_min');
                $query->where('total_amount', '>=', (float) $priceMin);
            }
            if ($request->filled('price_to') || $request->filled('price_max')) {
                $priceMax = $request->get('price_to') ?? $request->get('price_max');
                $query->where('total_amount', '<=', (float) $priceMax);
            }

            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            
            $allowedSortColumns = ['id', 'transaction_number', 'total_amount', 'amount_paid', 'items_count', 'created_at', 'updated_at'];
            if (!in_array($sortBy, $allowedSortColumns)) {
                $sortBy = 'created_at';
            }
            
            $sortOrder = strtolower($sortOrder) === 'asc' ? 'asc' : 'desc';
            $query->orderBy($sortBy, $sortOrder);

            $hasSearch = $request->filled('search');
            $cacheKey = ($hasSearch ? self::TRANSACTION_SEARCH_CACHE_PREFIX : self::TRANSACTION_LIST_CACHE_PREFIX) 
                . md5(serialize([
                    'page' => $request->get('page', 1),
                    'per_page' => $perPage,
                    'load_items' => $loadItems,
                    'search' => $request->get('search'),
                    'date_range' => $dateRange,
                    'status' => $request->get('status'),
                    'cashier' => $request->get('cashier') ?? $request->get('cashier_full_name'),
                    'price_min' => $request->get('price_from') ?? $request->get('price_min'),
                    'price_max' => $request->get('price_to') ?? $request->get('price_max'),
                    'sort_by' => $sortBy,
                    'sort_order' => $sortOrder,
                ]));

            $cacheTime = $hasSearch ? self::CACHE_TTL_SEARCH : self::CACHE_TTL_LIST;
            
            try {
                $transactions = Cache::store('redis')->remember($cacheKey, $cacheTime, function () use ($query, $perPage) {
                    return $query->paginate($perPage);
                });
            } catch (\Exception $e) {
                Log::warning('Redis cache failed for transaction list, using default cache store', [
                    'error' => $e->getMessage(),
                    'trace' => substr($e->getTraceAsString(), 0, 500)
                ]);
                $transactions = Cache::remember($cacheKey, $cacheTime, function () use ($query, $perPage) {
                    return $query->paginate($perPage);
                });
            }

            return response()->json([
                'success' => true,
                'data' => $transactions,
                'message' => 'Transactions retrieved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to retrieve transactions', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve transactions: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all transactions with filters (for exports)
     */
    public function getAll(Request $request): JsonResponse
    {
        try {
            $exportMode = $request->get('export', false);
            
            if ($exportMode) {
                $query = Transaction::query()
                    ->select([
                        'id',
                        'transaction_number',
                        'total_amount',
                        'amount_paid',
                        'change_due',
                        'discount',
                        'items_count',
                        'status',
                        'user_id',
                        'notes',
                        'created_at',
                        'updated_at',
                    ])
                    ->with([
                        'user:id,full_name,username',
                        'items' => function ($itemQuery) {
                            $itemQuery->select([
                                'id',
                                'transaction_id',
                                'product_id',
                                'card_id',
                                'scale_product_id',
                                'barcode',
                                'name',
                                'price',
                                'quantity',
                                'total',
                                'is_scale_product',
                            ])->orderBy('id');
                        },
                    ]);

            if ($request->filled('search')) {
                    $search = $request->get('search');
                    $query->where(function ($q) use ($search) {
                        $q->where('transaction_number', 'like', "{$search}%")
                            ->orWhereHas('user', function ($userQuery) use ($search) {
                                $userQuery->where('full_name', 'like', "%{$search}%");
                            });
                    });
                }

                if ($dateRange = $this->resolveDateRange($request)) {
                    $query->whereBetween('created_at', $dateRange);
                }

                $this->applyTransactionScopedFilters($request, $query);

                if ($request->filled('status')) {
                    $query->where('status', $request->get('status'));
                }

                if ($request->filled('price_from') || $request->filled('price_min')) {
                    $priceMin = $request->get('price_from') ?? $request->get('price_min');
                    $query->where('total_amount', '>=', (float) $priceMin);
                }
                if ($request->filled('price_to') || $request->filled('price_max')) {
                    $priceMax = $request->get('price_to') ?? $request->get('price_max');
                    $query->where('total_amount', '<=', (float) $priceMax);
                }

                $sortBy = $request->get('sort_by', 'created_at');
                $sortOrder = $request->get('sort_order', 'desc');
                $allowedSortColumns = ['id', 'transaction_number', 'total_amount', 'amount_paid', 'items_count', 'created_at', 'updated_at'];
                if (!in_array($sortBy, $allowedSortColumns)) {
                    $sortBy = 'created_at';
                }
                $sortOrder = strtolower($sortOrder) === 'asc' ? 'asc' : 'desc';
                $query->orderBy($sortBy, $sortOrder);

                $exportCacheKey = self::TRANSACTION_EXPORT_CACHE_PREFIX . md5(serialize([
                    'filters' => [
                        'search' => $request->get('search'),
                        'date_range' => $dateRange,
                        'status' => $request->get('status'),
                        'cashier' => $request->get('cashier') ?? $request->get('cashier_full_name'),
                        'price_min' => $request->get('price_from') ?? $request->get('price_min'),
                        'price_max' => $request->get('price_to') ?? $request->get('price_max'),
                        'sort_by' => $sortBy,
                        'sort_order' => $sortOrder,
                    ]
                ]));

                try {
                    $result = Cache::store('redis')->remember($exportCacheKey, self::CACHE_TTL_EXPORT, function () use ($query) {
                        $transactions = $query->get();
                        $total = $transactions->count();
                        return [
                            'data' => $transactions->values(),
                            'total' => $total,
                        ];
                    });
                } catch (\Exception $e) {
                    Log::warning('Redis cache failed for export, using default cache store', [
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                    $result = Cache::remember($exportCacheKey, self::CACHE_TTL_EXPORT, function () use ($query) {
                        $transactions = $query->get();
                        $total = $transactions->count();
                        return [
                            'data' => $transactions->values(),
                            'total' => $total,
                        ];
                    });
                }

                return response()->json([
                    'success' => true,
                    'data' => $result['data'],
                    'pagination' => [
                        'total' => $result['total'],
                        'per_page' => $result['total'],
                        'current_page' => 1,
                        'last_page' => 1,
                        'from' => $result['total'] > 0 ? 1 : 0,
                        'to' => $result['total'],
                    ]
                ]);
            }

            $limit = 500; // Reduced from 10000 for better performance
            $cursor = $request->get('cursor');

            $query = Transaction::query()
                ->select([
                    'id',
                    'transaction_number',
                    'total_amount',
                    'amount_paid',
                    'change_due',
                    'discount',
                    'items_count',
                    'status',
                    'user_id',
                    'notes',
                    'created_at',
                    'updated_at',
                ])
                ->with([
                    'items' => function ($itemQuery) use ($request) {
                        $itemQuery->select([
                            'id',
                            'transaction_id',
                            'product_id',
                            'card_id',
                            'scale_product_id',
                            'barcode',
                            'name',
                            'price',
                            'cost_price',
                            'quantity',
                            'weight',
                            'total',
                            'is_scale_product',
                            'category',
                            'supplier',
                        ])->orderBy('id');
                        $this->applyItemScopedFilters($request, $itemQuery);
                    },
                    'user' => function ($userQuery) {
                        $userQuery->select(['id', 'full_name', 'username']);
                    },
                ])
                ->where('status', 'completed')
                ->orderByDesc('id');

            if ($cursor) {
                $query->where('id', '<', $cursor);
            }

            if ($request->filled('search')) {
                $search = $request->get('search');
                $query->where(function ($q) use ($search) {
                    $q->where('transaction_number', 'LIKE', "%{$search}%")
                        ->orWhereHas('user', function ($userQuery) use ($search) {
                            $userQuery->where('full_name', 'LIKE', "%{$search}%");
                        })
                        ->orWhereHas('items', function ($itemQuery) use ($search) {
                            $itemQuery->where('name', 'LIKE', "%{$search}%")
                                ->orWhere('barcode', 'LIKE', "%{$search}%");
                        });
                });
            }

            if ($dateRange = $this->resolveDateRange($request)) {
                $query->whereBetween('created_at', $dateRange);
            }

            $this->applyTransactionScopedFilters($request, $query);

            if ($request->filled('status')) {
                $query->where('status', $request->get('status'));
            }

            // Apply price range filters
            if ($request->filled('price_from') || $request->filled('price_min')) {
                $priceMin = $request->get('price_from') ?? $request->get('price_min');
                $query->where('total_amount', '>=', (float) $priceMin);
            }
            if ($request->filled('price_to') || $request->filled('price_max')) {
                $priceMax = $request->get('price_to') ?? $request->get('price_max');
                $query->where('total_amount', '<=', (float) $priceMax);
            }

            $transactions = $query->limit($limit + 1)->get();
            $hasMore = $transactions->count() > $limit;

            if ($hasMore) {
                $transactions = $transactions->take($limit);
            }

            $nextCursor = $transactions->isNotEmpty() ? $transactions->last()->id : null;

            return response()->json([
                'success' => true,
                'data' => $transactions,
                'cursor' => $nextCursor,
                'has_more' => $hasMore,
                'count' => $transactions->count(),
                'message' => 'Transactions retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve all transactions: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created transaction.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'items' => 'required|array|min:1',
            'items.*.barcode' => 'required|string',
            'items.*.name' => 'required|string',
            'items.*.price' => 'required|numeric|min:0',
            'items.*.price_overridden' => 'sometimes|boolean',
            'items.*.quantity' => 'nullable|integer|min:1',
            'items.*.weight' => 'nullable|numeric|min:0',
            'items.*.total' => 'required|numeric|min:0',
            'items.*.is_scale_product' => 'boolean',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.card_id' => 'nullable|exists:cards,id',
            'items.*.scale_product_id' => 'nullable|exists:scale_products,id',
            'total_amount' => 'required|numeric|min:0',
            'amount_paid' => 'required|numeric|min:0',
            'change_due' => 'required|numeric|min:0',
            'discount' => 'nullable|numeric|min:0'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $startTime = microtime(true);

            DB::beginTransaction();

            $productIds = collect($request->items)->pluck('product_id')->filter()->unique()->values()->toArray();
            $scaleProductIds = collect($request->items)->pluck('scale_product_id')->filter()->unique()->values()->toArray();
            $cardIds = collect($request->items)->pluck('card_id')->filter()->unique()->values()->toArray();

            $products = Product::select('id', 'name', 'barcode', 'stock', 'cost_price', 'sell_price', 'per_carton', 'carton_price', 'category_id', 'supplier_id')
                ->with(['category:id,name', 'supplier:id,name'])
                ->whereIn('id', $productIds)
                ->get()
                ->keyBy('id');
            
            $scaleProducts = ScaleProduct::select('id', 'name', 'scale_id', 'plu', 'stock', 'cost_price', 'sell_price', 'category_id', 'supplier_id')
                ->with(['category:id,name', 'supplier:id,name'])
                ->whereIn('id', $scaleProductIds)
                ->get()
                ->keyBy('id');
            
            $cards = \App\Models\Card::select('id', 'name_card_id', 'cost_price', 'sell_price')
                ->with(['nameCard:id,name'])
                ->whereIn('id', $cardIds)
                ->get()
                ->keyBy('id');

            $stockValidation = $this->validateStock($request->items, $products, $scaleProducts);
            if (!$stockValidation['valid']) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => $stockValidation['message'],
                    'details' => $stockValidation['details'] ?? null,
                ], 422);
            }

            $priceErrors = (new \App\Services\SalePriceValidator)->validate(
                $request->items, $products, $scaleProducts, $cards,
                (float) ($request->discount ?? 0), (float) $request->total_amount,
            );
            if ($priceErrors) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => array_values($priceErrors)[0][0],
                    'errors' => $priceErrors,
                ], 422);
            }

            // Create transaction
            $transaction = Transaction::create([
                'transaction_number' => Transaction::generateTransactionNumber(),
                'total_amount' => $request->total_amount,
                'amount_paid' => $request->amount_paid,
                'change_due' => $request->change_due,
                'discount' => $request->discount ?? 0,
                'items_count' => count($request->items),
                'status' => 'completed',
                'user_id' => auth()->id(),
            ]);

            $transactionItems = [];
            foreach ($request->items as $itemData) {
                $category = null;
                $supplier = null;
                $costPrice = null;

                if (isset($itemData['product_id']) && $itemData['product_id']) {
                    $product = $products->get($itemData['product_id']);
                    if ($product) {
                        $category = $product->category?->name;
                        $supplier = $product->supplier?->name;
                        $costPrice = $product->cost_price;
                    }
                } elseif (isset($itemData['scale_product_id']) && $itemData['scale_product_id']) {
                    $scaleProduct = $scaleProducts->get($itemData['scale_product_id']);
                    if ($scaleProduct) {
                        $category = $scaleProduct->category?->name;
                        $supplier = $scaleProduct->supplier?->name;
                        $costPrice = $scaleProduct->cost_price;
                    }
                } elseif (isset($itemData['card_id']) && $itemData['card_id']) {
                    $card = $cards->get($itemData['card_id']);
                    if ($card) {
                        $category = 'Cards';
                        $supplier = $card->nameCard?->name;
                        $costPrice = $card->cost_price;
                    }
                }

                $transactionItems[] = [
                    'transaction_id' => $transaction->id,
                    'product_id' => $itemData['product_id'] ?? null,
                    'card_id' => $itemData['card_id'] ?? null,
                    'scale_product_id' => $itemData['scale_product_id'] ?? null,
                    'barcode' => $itemData['barcode'],
                    'name' => $itemData['name'],
                    'price' => $itemData['price'],
                    'cost_price' => $costPrice,
                    'quantity' => $itemData['quantity'],
                    'weight' => $itemData['weight'] ?? 0,
                    'total' => $itemData['total'],
                    'is_scale_product' => $itemData['is_scale_product'] ?? false,
                    'category' => $category,
                    'supplier' => $supplier,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            TransactionItem::insert($transactionItems);

            // PERFORMANCE OPTIMIZATION: Bulk stock updates instead of individual updates
            // Group updates by product ID to handle multiple items of same product
            $productStockChanges = [];
            $scaleProductStockChanges = [];

            foreach ($request->items as $itemData) {
                if (isset($itemData['product_id']) && $itemData['product_id']) {
                    $productId = $itemData['product_id'];
                    $quantity = $itemData['quantity'] ?? 1;
                    $productStockChanges[$productId] = ($productStockChanges[$productId] ?? 0) + $quantity;
                } elseif (isset($itemData['scale_product_id']) && $itemData['scale_product_id']) {
                    $scaleProductId = $itemData['scale_product_id'];
                    $quantity = $itemData['quantity'] ?? 1;
                    $scaleProductStockChanges[$scaleProductId] = ($scaleProductStockChanges[$scaleProductId] ?? 0) + $quantity;
                }
            }

            $productOldStocks = [];
            $scaleProductOldStocks = [];
            
            foreach ($productStockChanges as $productId => $quantityToDeduct) {
                $product = $products->get($productId);
                if ($product) {
                    $productOldStocks[$productId] = $product->stock;
                }
            }
            
            foreach ($scaleProductStockChanges as $scaleProductId => $quantityToDeduct) {
                $scaleProduct = $scaleProducts->get($scaleProductId);
                if ($scaleProduct) {
                    $scaleProductOldStocks[$scaleProductId] = $scaleProduct->stock;
                }
            }

            // Bulk update product stock using CASE statement
            if (!empty($productStockChanges)) {
                $now = now();
                $productIds = array_keys($productStockChanges);
                
                // Build CASE statement for bulk stock update
                // Each product gets its specific quantity deducted in a single query
                $stockCase = 'CASE id';
                foreach ($productStockChanges as $productId => $quantityToDeduct) {
                    // Sanitize values to prevent SQL injection (already validated, but extra safety)
                    $productId = (int) $productId;
                    $quantityToDeduct = (int) $quantityToDeduct;
                    $stockCase .= " WHEN {$productId} THEN stock - {$quantityToDeduct}";
                }
                $stockCase .= ' ELSE stock END';
                
                // Single bulk update query for all products - much faster than N individual queries
                DB::table('products')
                    ->whereIn('id', $productIds)
                    ->update([
                        'stock' => DB::raw($stockCase),
                        'last_sold_at' => $now
                    ]);
            }

            // Bulk update scale product stock using CASE statement
            if (!empty($scaleProductStockChanges)) {
                $now = now();
                $scaleProductIds = array_keys($scaleProductStockChanges);
                
                // Build CASE statement for bulk stock update
                // Each scale product gets its specific quantity deducted in a single query
                $stockCase = 'CASE id';
                foreach ($scaleProductStockChanges as $scaleProductId => $quantityToDeduct) {
                    // Sanitize values to prevent SQL injection (already validated, but extra safety)
                    $scaleProductId = (int) $scaleProductId;
                    $quantityToDeduct = (int) $quantityToDeduct;
                    $stockCase .= " WHEN {$scaleProductId} THEN stock - {$quantityToDeduct}";
                }
                $stockCase .= ' ELSE stock END';
                
                // Single bulk update query for all scale products - much faster than N individual queries
                DB::table('scale_products')
                    ->whereIn('id', $scaleProductIds)
                    ->update([
                        'stock' => DB::raw($stockCase),
                        'last_sold_at' => $now
                    ]);
            }

            $affectedProductIds = array_keys($productStockChanges);
            $affectedScaleProductIds = array_keys($scaleProductStockChanges);
            $cacheKeysToForget = [
                'inventory:index:v2:all',
                'inventory:index:all',
                'inventory:comprehensive_stats'
            ];
            
            if (!empty($affectedProductIds)) {
                $productsNeedingCacheUpdate = [];
                
                foreach ($affectedProductIds as $productId) {
                    $productsNeedingCacheUpdate[] = $productId;
                }
                
                if (!empty($productsNeedingCacheUpdate)) {
                    try {
                        $cacheService = app(\App\Services\ProductCacheService::class);
                        foreach ($productsNeedingCacheUpdate as $productId) {
                            $cacheService->smartUpdateProduct($productId, 'product');
                        }
                        foreach ($cacheKeysToForget as $key) {
                            \Illuminate\Support\Facades\Cache::forget($key);
                        }
                    } catch (\Exception $e) {
                        Log::error('Failed to batch update product cache after bulk stock update', [
                            'product_ids' => $productsNeedingCacheUpdate,
                            'error' => $e->getMessage()
                        ]);
                    }
                }
            }
            
            if (!empty($affectedScaleProductIds)) {
                $scaleProductsNeedingCacheUpdate = [];
                
                foreach ($affectedScaleProductIds as $scaleProductId) {
                    // All scale products need cache update
                    $scaleProductsNeedingCacheUpdate[] = $scaleProductId;
                }
                
                // Batch cache updates (single operation per product type, not per product)
                if (!empty($scaleProductsNeedingCacheUpdate)) {
                    try {
                        $cacheService = app(\App\Services\ProductCacheService::class);
                        // Update cache for all affected scale products
                        foreach ($scaleProductsNeedingCacheUpdate as $scaleProductId) {
                            $cacheService->smartUpdateProduct($scaleProductId, 'scale_product');
                        }
                        // Batch clear inventory cache (once instead of per-product)
                        foreach ($cacheKeysToForget as $key) {
                            \Illuminate\Support\Facades\Cache::forget($key);
                        }
                    } catch (\Exception $e) {
                        Log::error('Failed to batch update scale product cache after bulk stock update', [
                            'scale_product_ids' => $scaleProductsNeedingCacheUpdate,
                            'error' => $e->getMessage()
                        ]);
                    }
                }
            }

            DB::commit();

            $duration = (microtime(true) - $startTime) * 1000;
            Log::info('Transaction completed', [
                'duration_ms' => round($duration, 2),
                'items_count' => count($request->items),
                'transaction_id' => $transaction->id
            ]);

            // Invalidate Redis caches after new transaction
            $this->invalidateTransactionCaches();

            // Build response from already-loaded data (skip database query)
            // Frontend already has all item data, so we just need transaction metadata
            $transaction->setRelation('items', collect($transactionItems)->map(function ($item) use ($transaction) {
                return (object) [
                    'id' => null, // Not needed for response
                    'transaction_id' => $transaction->id,
                    'name' => $item['name'],
                    'price' => $item['price'],
                    'quantity' => $item['quantity'],
                    'total' => $item['total']
                ];
            }));

            return response()->json([
                'success' => true,
                'data' => $transaction,
                'message' => 'Transaction created successfully'
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create transaction: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified transaction
     */
    public function show(string $id): JsonResponse
    {
        try {
            $transaction = Transaction::with([
                'items' => function ($itemQuery) {
                    $itemQuery->select([
                        'id',
                        'transaction_id',
                        'product_id',
                        'card_id',
                        'scale_product_id',
                        'barcode',
                        'name',
                        'price',
                        'cost_price',
                        'quantity',
                        'weight',
                        'total',
                        'is_scale_product',
                        'category',
                        'supplier',
                    ])->orderBy('id');
                },
                'items.product' => function ($productQuery) {
                    $productQuery->select(['id', 'name', 'category_id', 'supplier_id']);
                },
                'items.scaleProduct' => function ($scaleProductQuery) {
                    $scaleProductQuery->select(['id', 'name', 'category_id', 'supplier_id']);
                },
                'items.card' => function ($cardQuery) {
                    $cardQuery->select(['id', 'name_card_id', 'sell_price', 'cost_price', 'is_active']);
                },
                'items.card.nameCard' => function ($nameCardQuery) {
                    $nameCardQuery->select(['id', 'name']);
                },
                'user' => function ($userQuery) {
                    $userQuery->select(['id', 'full_name', 'username', 'role']);
                },
            ])->findOrFail($id);

            $transaction->makeVisible([
                'id',
                'transaction_number',
                'total_amount',
                'amount_paid',
                'change_due',
                'discount',
                'items_count',
                'status',
                'user_id',
                'notes',
                'created_at',
                'updated_at',
            ]);

            return response()->json([
                'success' => true,
                'data' => $transaction,
                'message' => 'Transaction retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Transaction not found: ' . $e->getMessage()
            ], 404);
        }
    }

    /**
     * Get transaction statistics
     */
    public function statistics(Request $request): JsonResponse
    {
        try {
            $dateRange = $this->resolveDateRange($request);
            $statusFilter = $request->get('status');

            $cacheKey = self::TRANSACTION_STATS_CACHE_PREFIX . md5(serialize([
                'date_range' => $dateRange,
                'status' => $statusFilter,
                'filters' => $request->except(['page', 'per_page'])
            ]));

            // Determine cache time based on date range
            $cacheTime = self::CACHE_TTL_STATS_OTHER;
            if ($dateRange && $request->filled('date_from')) {
                $userTimezone = $request->get('timezone', 'UTC');
                try {
                    $dateFrom = Carbon::parse($request->get('date_from'), $userTimezone);
                    if ($dateFrom->isToday($userTimezone)) {
                        $cacheTime = self::CACHE_TTL_STATS_TODAY; // 30 seconds for today's stats
                    }
                } catch (\Exception $e) {
                }
            }
            $stats = $this->getCachedStatistics($cacheKey, $cacheTime, $dateRange, $statusFilter, $request);

            return response()->json([
                'success' => true,
                'data' => $stats,
                'message' => 'Statistics retrieved successfully'
            ]);

        } catch (\Throwable $e) {
            Log::error('Failed to retrieve statistics', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'context' => $request->all(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve statistics: ' . $e->getMessage(),
                'data' => [
                    'total_sales' => 0,
                    'total_transactions' => 0,
                    'average_transaction_value' => 0,
                    'total_items_sold' => 0,
                    'total_quantity' => 0,
                    'total_profit' => 0,
                    'daily_sales' => [],
                ]
            ], 500);
        }
    }

    /**
     * Get transaction by transaction number.
     */
    public function getByTransactionNumber(string $transactionNumber): JsonResponse
    {
        try {
            $transaction = Transaction::with([
                'items' => function ($itemQuery) {
                    $itemQuery->select([
                        'id',
                        'transaction_id',
                        'product_id',
                        'card_id',
                        'scale_product_id',
                        'barcode',
                        'name',
                        'price',
                        'cost_price',
                        'quantity',
                        'weight',
                        'total',
                        'is_scale_product',
                        'category',
                        'supplier',
                    ])->orderBy('id');
                },
                'items.product' => function ($productQuery) {
                    $productQuery->select(['id', 'name', 'category_id', 'supplier_id']);
                },
                'items.scaleProduct' => function ($scaleProductQuery) {
                    $scaleProductQuery->select(['id', 'name', 'category_id', 'supplier_id']);
                },
                'items.card' => function ($cardQuery) {
                    $cardQuery->select(['id', 'name_card_id', 'sell_price', 'cost_price', 'is_active']);
                },
                'items.card.nameCard' => function ($nameCardQuery) {
                    $nameCardQuery->select(['id', 'name']);
                },
                'user' => function ($userQuery) {
                    $userQuery->select(['id', 'full_name', 'username', 'role']);
                },
            ])
                ->where('transaction_number', $transactionNumber)
                ->first();

            if (!$transaction) {
                return response()->json([
                    'success' => false,
                    'message' => 'Transaction not found with number: ' . $transactionNumber
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $transaction,
                'message' => 'Transaction found successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to find transaction: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Search transaction history by barcode.
     */
    public function searchTransactionHistory(string $barcode): JsonResponse
    {
        try {
            $itemsQuery = TransactionItem::query()
                ->select([
                    'id',
                    'transaction_id',
                    'barcode',
                    'name',
                    'quantity',
                    'price',
                    'total',
                    'created_at',
                ])
                ->with(['transaction' => function ($transactionQuery) {
                    $transactionQuery->select(['id', 'transaction_number', 'created_at']);
                }])
                ->where('barcode', $barcode)
                ->orderByDesc('created_at');

            $transactionItems = (clone $itemsQuery)
                ->limit(100)
                ->get();

            if ($transactionItems->isEmpty()) {
                $product = \App\Models\Product::select(['id', 'name'])->where('barcode', $barcode)->first();
                $scaleProduct = \App\Models\ScaleProduct::select(['id', 'name'])->where('plu', $barcode)->first();

                if ($product) {
                    $message = "Product '{$product->name}' exists but has no sales history. Only products with transaction history can be returned.";
                } elseif ($scaleProduct) {
                    $message = "Scale product '{$scaleProduct->name}' exists but has no sales history. Only products with transaction history can be returned.";
                } else {
                    $message = "No product found with barcode '{$barcode}'. Please check the barcode and try again.";
                }

                return response()->json([
                    'success' => false,
                    'message' => $message
                ], 404);
            }

            $aggregate = TransactionItem::query()
                ->where('barcode', $barcode)
                ->selectRaw('COUNT(*) as sale_count')
                ->selectRaw('COALESCE(SUM(COALESCE(quantity, 1)), 0) as total_sold')
                ->selectRaw('MAX(price) as last_price')
                ->selectRaw('MIN(created_at) as first_sold')
                ->selectRaw('MAX(created_at) as last_sold')
                ->first();

            $productName = $transactionItems->first()->name;
            $saleCount = (int) ($aggregate->sale_count ?? 0);
            $totalSold = (int) ($aggregate->total_sold ?? 0);
            $lastPrice = (float) ($aggregate->last_price ?? $transactionItems->first()->price);
            $firstSold = $aggregate->first_sold ?? $transactionItems->last()->created_at;
            $lastSold = $aggregate->last_sold ?? $transactionItems->first()->created_at;

            $transactions = $transactionItems->map(function ($item) {
                return [
                    'id' => $item->transaction->id,
                    'transaction_number' => $item->transaction->transaction_number,
                    'date' => $item->transaction->created_at,
                    'quantity' => $item->quantity ?? 1,
                    'price' => $item->price,
                    'total' => $item->total,
                ];
            })->toArray();

            $historyData = [
                'barcode' => $barcode,
                'name' => $productName,
                'total_sold' => $totalSold,
                'last_price' => $lastPrice,
                'first_sold' => $firstSold,
                'last_sold' => $lastSold,
                'transactions' => $transactions,
            ];

            return response()->json([
                'success' => true,
                'data' => $historyData,
                'message' => "Transaction history found: {$saleCount} transactions with {$totalSold} total items sold"
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to search transaction history: ' . $e->getMessage()
            ], 500);
        }
    }

    private function resolveDateRange(Request $request): ?array
    {
        if (
            !$request->filled('date_from') &&
            !$request->filled('date_to') &&
            !$request->filled('time_from') &&
            !$request->filled('time_to')
        ) {
            return null;
        }

        $userTimezone = $request->get('timezone', 'UTC');

        if (!$request->filled('date_from') && !$request->filled('date_to')) {
            $start = Carbon::today($userTimezone);
            $end = Carbon::today($userTimezone);
        } else {
            $start = $request->filled('date_from')
                ? Carbon::parse($request->get('date_from'), $userTimezone)
                : Carbon::createFromTimestamp(0, $userTimezone);

            $end = $request->filled('date_to')
                ? Carbon::parse($request->get('date_to'), $userTimezone)
                : Carbon::now($userTimezone)->addYears(100);
        }

        if ($request->filled('time_from')) {
            $start = $start->copy()->setTimeFromTimeString($request->get('time_from') . ':00');
        } else {
            $start = $start->startOfDay();
        }

        if ($request->filled('time_to')) {
            $end = $end->copy()->setTimeFromTimeString($request->get('time_to') . ':00');
        } else {
            $end = $end->endOfDay();
        }

        return [$start, $end];
    }

    private function getCachedStatistics(string $cacheKey, int $cacheTime, ?array $dateRange, ?string $statusFilter, Request $request): array
    {
        $statsCallback = function () use ($dateRange, $statusFilter, $request) {
            $query = Transaction::query();

            if (!$statusFilter || $statusFilter === 'completed') {
                $query->where('status', 'completed');
            } elseif ($statusFilter !== 'all') {
                $query->where('status', $statusFilter);
            }

            if ($dateRange) {
                $query->whereBetween('created_at', $dateRange);
            }

            $this->applyTransactionScopedFilters($request, $query);

            $baseQuery = clone $query;
            $transactionIds = $baseQuery->pluck('id');
            
            $transactionStats = (clone $query)
                ->selectRaw('
                    COALESCE(SUM(total_amount), 0) as total_sales,
                    COUNT(*) as total_transactions,
                    COALESCE(SUM(items_count), 0) as total_items_sold,
                    CASE 
                        WHEN COUNT(*) > 0 THEN COALESCE(SUM(total_amount), 0) / COUNT(*)
                        ELSE 0
                    END as average_transaction_value
                ')
                ->first();

            $dailySales = (clone $query)
                ->selectRaw('DATE(created_at) as date')
                ->selectRaw('SUM(total_amount) as total_amount')
                ->selectRaw('COUNT(*) as transactions_count')
                ->groupBy(DB::raw('DATE(created_at)'))
                ->orderBy('date')
                ->get()
                ->map(function ($day) {
                    return [
                        'date' => $day->date,
                        'total_amount' => (float) $day->total_amount,
                        'transactions_count' => (int) $day->transactions_count,
                    ];
                })
                ->toArray();

            $totalQuantity = 0.0;
            $totalProfit = 0.0;

            if ($transactionIds->isNotEmpty()) {
                $itemQuery = TransactionItem::query()
                    ->whereIn('transaction_id', $transactionIds);
                
                $this->applyItemScopedFilters($request, $itemQuery);

                $quantityExpression = $this->lineQuantityExpression();

                $itemStats = (clone $itemQuery)
                    ->selectRaw("
                        COALESCE(SUM({$quantityExpression}), 0) as total_quantity,
                        COALESCE(SUM((price - COALESCE(cost_price, 0)) * {$quantityExpression}), 0) as total_profit
                    ")
                    ->first();

                $totalQuantity = (float) ($itemStats->total_quantity ?? 0);
                $totalProfit = (float) ($itemStats->total_profit ?? 0);
            }

            return [
                'total_sales' => (float) ($transactionStats->total_sales ?? 0),
                'total_transactions' => (int) ($transactionStats->total_transactions ?? 0),
                'average_transaction_value' => (float) ($transactionStats->average_transaction_value ?? 0),
                'total_items_sold' => (int) ($transactionStats->total_items_sold ?? 0),
                'total_quantity' => $totalQuantity,
                'total_profit' => $totalProfit,
                'daily_sales' => $dailySales,
            ];
        };

        try {
            return Cache::store('redis')->remember($cacheKey, $cacheTime, $statsCallback);
        } catch (\Exception $e) {
            Log::warning('Redis cache failed for statistics, using default cache store', ['error' => $e->getMessage()]);
            return Cache::remember($cacheKey, $cacheTime, $statsCallback);
        }
    }

    /**
     * Invalidate all transaction-related caches
     */
    private function invalidateTransactionCaches(): void
    {
        try {
            $redis = Redis::connection('cache');
            $cachePrefix = config('cache.prefix', '');
            $patterns = [
                $cachePrefix . self::TRANSACTION_LIST_CACHE_PREFIX . '*',
                $cachePrefix . self::TRANSACTION_SEARCH_CACHE_PREFIX . '*',
                $cachePrefix . self::TRANSACTION_STATS_CACHE_PREFIX . '*',
                $cachePrefix . self::TRANSACTION_EXPORT_CACHE_PREFIX . '*',
                $cachePrefix . self::TRANSACTION_REPORT_CACHE_PREFIX . '*',
                $cachePrefix . self::TRANSACTION_REPORT_STATS_CACHE_PREFIX . '*',
                $cachePrefix . self::TRANSACTION_REPORT_EXPORT_CACHE_PREFIX . '*',
            ];

            foreach ($patterns as $pattern) {
                try {
                    $cursor = 0;
                    $keysToDelete = [];
                    
                    do {
                        $result = $redis->scan($cursor, ['match' => $pattern, 'count' => 100]);
                        $cursor = $result[0];
                        $keys = $result[1] ?? [];
                        
                        if (!empty($keys)) {
                            $keysToDelete = array_merge($keysToDelete, $keys);
                        }
                        
                        if (count($keysToDelete) >= 100) {
                            $redis->del($keysToDelete);
                            $keysToDelete = [];
                        }
                    } while ($cursor > 0);
                    
                    if (!empty($keysToDelete)) {
                        $redis->del($keysToDelete);
                    }
                } catch (\Exception $scanException) {
                    try {
                        $keys = $redis->keys($pattern);
                        if (!empty($keys)) {
                            foreach (array_chunk($keys, 100) as $chunk) {
                                $redis->del($chunk);
                            }
                        }
                    } catch (\Exception $keysException) {
                        Log::warning('Both SCAN and KEYS failed for cache invalidation', [
                            'pattern' => $pattern,
                            'scan_error' => $scanException->getMessage(),
                            'keys_error' => $keysException->getMessage()
                        ]);
                    }
                }
            }
        } catch (\Exception $e) {
            Log::warning('Failed to invalidate transaction caches', [
                'error' => $e->getMessage()
            ]);
        }
    }

    private function hasItemFilters(Request $request): bool
    {
        if ($request->filled('product_type') && $request->get('product_type') !== 'all') {
            return true;
        }

        return $request->filled('category')
            || $request->filled('supplier')
            || $request->filled('price_from')
            || $request->filled('price_to');
    }

    private function applyItemScopedFilters(Request $request, Builder|Relation $query): void
    {
        $productType = $request->get('product_type');
        if ($productType && $productType !== 'all') {
            $query->where(function ($typeQuery) use ($productType) {
                if ($productType === 'card') {
                    $typeQuery->whereNotNull('card_id');
                } elseif ($productType === 'scale') {
                    $typeQuery->where('is_scale_product', true);
                } elseif ($productType === 'normal') {
                    $typeQuery->where(function ($normalQuery) {
                        $normalQuery->where('is_scale_product', false)
                            ->orWhereNull('is_scale_product');
                    })->whereNull('card_id');
                }
            });
        }

        if ($request->filled('category')) {
            $query->where('category', $request->get('category'));
        }

        if ($request->filled('supplier')) {
            $query->where('supplier', $request->get('supplier'));
        }

        if ($request->filled('price_from')) {
            $query->where('price', '>=', (float) $request->get('price_from'));
        }

        if ($request->filled('price_to')) {
            $query->where('price', '<=', (float) $request->get('price_to'));
        }
    }

    private function applyTransactionScopedFilters(Request $request, Builder $query): void
    {
        // Cashier filter with partial match support
        if ($request->filled('cashier') || $request->filled('cashier_full_name')) {
            $cashierFilter = $request->get('cashier') ?? $request->get('cashier_full_name');
            $query->whereHas('user', function ($userQuery) use ($cashierFilter) {
                $userQuery->where('full_name', 'like', "%{$cashierFilter}%");
            });
        }

        if ($this->hasItemFilters($request)) {
            $query->whereHas('items', function ($itemQuery) use ($request) {
                $this->applyItemScopedFilters($request, $itemQuery);
            });
        }
    }

    private function lineQuantityExpression(): string
    {
        return <<<SQL
CASE
    WHEN transaction_items.is_scale_product = true THEN COALESCE(transaction_items.weight, 0)
    WHEN transaction_items.card_id IS NOT NULL THEN COALESCE(transaction_items.quantity, 1)
    ELSE COALESCE(transaction_items.quantity, 0)
END
SQL;
    }

    private function applyTimeComparison($query, string $column, string $operator, string $timeValue, string $timezone): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'pgsql') {
            $query->whereRaw("({$column})::time {$operator} ?", [$timeValue]);
            return;
        }

        if ($driver === 'mysql') {
            $query->whereRaw("TIME({$column}) {$operator} ?", [$timeValue]);
            return;
        }

        $query->whereRaw("TIME({$column}) {$operator} ?", [$timeValue]);
    }

    /**
     * Process return transaction (placeholder - will be implemented when return migration is ready).
     */
    public function processReturn(Request $request): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Return processing functionality will be available after database migration is completed.'
        ], 501);
    }

    /**
     * Delete all transactions with password verification.
     */
    public function deleteAll(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'password' => 'required|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Password is required',
                    'errors' => $validator->errors()
                ], 422);
            }

            $password = $request->get('password');
            $correctPassword = 'Esma3ilDilshadAmeenHasan04xade.@';

            if ($password !== $correctPassword) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid password'
                ], 401);
            }

            DB::beginTransaction();

            try {
                // Get count before deletion for logging
                $transactionCount = Transaction::count();
                
                // Delete all transaction items first (foreign key constraint)
                TransactionItem::truncate();
                
                // Delete all transactions
                Transaction::truncate();

                DB::commit();

                // Invalidate all transaction caches after bulk delete
                $this->invalidateTransactionCaches();

                Log::info("All transactions deleted by user: " . (auth()->user()?->full_name ?? 'Unknown'));

                return response()->json([
                    'success' => true,
                    'message' => "Successfully deleted {$transactionCount} transaction(s)",
                    'deleted_count' => $transactionCount
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('Failed to delete all transactions: ' . $e->getMessage());
                throw $e;
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete transactions: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get transaction report data (one row per item) - separate from regular transaction endpoint
     */
    public function report(Request $request): JsonResponse
    {
        try {
            $perPage = max(1, min((int) $request->get('per_page', 10), 100));
            $page = max(1, (int) $request->get('page', 1));

            // Optimized query for large datasets - use select only needed columns
            $query = TransactionItem::query()
                ->select([
                    'transaction_items.id',
                    'transaction_items.transaction_id',
                    'transaction_items.barcode',
                    'transaction_items.name',
                    'transaction_items.price',
                    'transaction_items.cost_price',
                    'transaction_items.quantity',
                    'transaction_items.weight',
                    'transaction_items.total',
                    'transaction_items.is_scale_product',
                    'transaction_items.card_id',
                    'transaction_items.category',
                    'transaction_items.supplier',
                ])
                ->join('transactions', 'transaction_items.transaction_id', '=', 'transactions.id')
                ->join('users', 'transactions.user_id', '=', 'users.id')
                ->selectRaw('transactions.transaction_number')
                ->selectRaw('transactions.created_at as transaction_created_at')
                ->selectRaw('users.full_name as cashier_name')
                ->where('transactions.status', 'completed');

            // Apply product type filter
            $productType = $request->get('product_type');
            if ($productType && $productType !== 'all') {
                if ($productType === 'card') {
                    $query->whereNotNull('transaction_items.card_id');
                } elseif ($productType === 'scale') {
                    $query->where('transaction_items.is_scale_product', true);
                } elseif ($productType === 'normal') {
                    $query->where(function ($normalQuery) {
                        $normalQuery->where('transaction_items.is_scale_product', false)
                            ->orWhereNull('transaction_items.is_scale_product');
                    })->whereNull('transaction_items.card_id');
                }
            }

            // Apply category filter
            if ($request->filled('category')) {
                $query->where('transaction_items.category', $request->get('category'));
            }

            // Apply supplier filter
            if ($request->filled('supplier')) {
                $query->where('transaction_items.supplier', $request->get('supplier'));
            }

            // Apply barcode / identifier filter (exact match)
            if ($request->filled('barcode')) {
                $query->where('transaction_items.barcode', trim($request->get('barcode')));
            }

                // Apply cashier filter - optimized with join
                if ($request->filled('cashier')) {
                    $cashierFilter = $request->get('cashier');
                    $query->where('users.full_name', 'like', "%{$cashierFilter}%");
                }

            // Apply price range filters
            if ($request->filled('price_from') || $request->filled('price_min')) {
                $priceMin = $request->get('price_from') ?? $request->get('price_min');
                $query->where('transaction_items.price', '>=', (float) $priceMin);
            }
            if ($request->filled('price_to') || $request->filled('price_max')) {
                $priceMax = $request->get('price_to') ?? $request->get('price_max');
                $query->where('transaction_items.price', '<=', (float) $priceMax);
            }

            // Apply date range filter
            if ($dateRange = $this->resolveDateRange($request)) {
                $query->whereBetween('transactions.created_at', $dateRange);
            }

            // Apply time range filter
            if ($request->filled('time_from') || $request->filled('time_to')) {
                $userTimezone = $request->get('timezone', 'UTC');
                $timeFrom = $request->get('time_from');
                $timeTo = $request->get('time_to');

                if ($timeFrom || $timeTo) {
                    $query->where(function ($timeQuery) use ($timeFrom, $timeTo, $userTimezone) {
                        if ($timeFrom) {
                            $this->applyTimeComparison($timeQuery, 'transactions.created_at', '>=', $timeFrom, $userTimezone);
                        }
                        if ($timeTo) {
                            $this->applyTimeComparison($timeQuery, 'transactions.created_at', '<=', $timeTo, $userTimezone);
                        }
                    });
                }
            }

            // Sorting - optimize for large datasets
            $sortBy = $request->get('sort_by', 'transactions.created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            
            // Map frontend column names to database columns
            $sortColumnMap = [
                'product_name' => 'transaction_items.name',
                'product_type' => 'transaction_items.is_scale_product',
                'identifier' => 'transaction_items.barcode',
                'category' => 'transaction_items.category',
                'supplier' => 'transaction_items.supplier',
                'quantity' => 'transaction_items.quantity',
                'cost_price' => 'transaction_items.cost_price',
                'sell_price' => 'transaction_items.price',
                'line_total' => 'transaction_items.total',
                'cashier_name' => 'transactions.user_id',
                'transaction_number' => 'transactions.transaction_number',
                'created_at' => 'transactions.created_at',
            ];
            
            $dbSortColumn = $sortColumnMap[$sortBy] ?? 'transactions.created_at';
            
            // Add index hint for better performance on large datasets
            // Use composite index on (transactions.created_at, transactions.status) if available
            if ($dbSortColumn === 'transactions.created_at') {
                $query->orderBy('transactions.created_at', $sortOrder)
                    ->orderBy('transaction_items.id', 'asc'); // Secondary sort for consistency
            } else {
                $query->orderBy($dbSortColumn, $sortOrder)
                    ->orderBy('transactions.created_at', 'desc') // Secondary sort for consistency
                    ->orderBy('transaction_items.id', 'asc'); // Tertiary sort for consistency
            }

            $paginator = $query->paginate($perPage, ['*'], 'page', $page);

            $transformedData = [];

            foreach ($paginator->items() as $item) {
                $quantity = $item->is_scale_product
                    ? (float) ($item->weight ?? 0)
                    : ($item->card_id
                        ? (float) ($item->quantity ?? 1)
                        : (float) ($item->quantity ?? 0));

                $productType = $item->card_id
                    ? 'card'
                    : ($item->is_scale_product
                        ? 'scale_product'
                        : 'product');

                $identifierType = $item->is_scale_product
                    ? 'scale'
                    : ($item->card_id
                        ? 'card'
                        : 'barcode');

                $transformedData[] = [
                    'id' => $item->id,
                    'transaction_id' => $item->transaction_id,
                    'transaction_number' => $item->transaction_number,
                    'cashier_name' => $item->cashier_name ?? 'Unknown',
                    'product_name' => $item->name,
                    'product_type' => $productType,
                    'identifier' => $item->barcode ?? '',
                    'identifier_type' => $identifierType,
                    'category' => $item->category,
                    'supplier' => $item->supplier,
                    'quantity' => $quantity,
                    'cost_price' => (float) ($item->cost_price ?? 0),
                    'sell_price' => (float) ($item->price ?? 0),
                    'line_total' => (float) ($item->total ?? ($item->price * $quantity)),
                    'profit_margin' => $item->price > 0 && $item->cost_price > 0
                        ? ((((float) $item->price - (float) $item->cost_price) / (float) $item->cost_price) * 100)
                        : 0,
                    'profit_amount' => ((float) $item->price - (float) ($item->cost_price ?? 0)) * $quantity,
                    'created_at' => $item->transaction_created_at,
                ];
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'data' => $transformedData,
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch transaction report', [
                'message' => $e->getMessage(),
                'trace' => substr($e->getTraceAsString(), 0, 500),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch transaction report: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get transaction report statistics (filtered based on request filters)
     */
    public function reportStatistics(Request $request): JsonResponse
    {
        try {
            $stats = (function () use ($request) {
                // Build the same query as report endpoint but for statistics
                // Optimized with join for better performance
                $itemQuery = TransactionItem::query()
                    ->join('transactions', 'transaction_items.transaction_id', '=', 'transactions.id')
                    ->join('users', 'transactions.user_id', '=', 'users.id')
                    ->where('transactions.status', 'completed');

                // Apply product type filter
                $productType = $request->get('product_type');
                if ($productType && $productType !== 'all') {
                    if ($productType === 'card') {
                        $itemQuery->whereNotNull('transaction_items.card_id');
                    } elseif ($productType === 'scale') {
                        $itemQuery->where('transaction_items.is_scale_product', true);
                    } elseif ($productType === 'normal') {
                        $itemQuery->where(function ($normalQuery) {
                            $normalQuery->where('transaction_items.is_scale_product', false)
                                ->orWhereNull('transaction_items.is_scale_product');
                        })->whereNull('transaction_items.card_id');
                    }
                }

                // Apply category filter
                if ($request->filled('category')) {
                    $itemQuery->where('transaction_items.category', $request->get('category'));
                }

                // Apply supplier filter
                if ($request->filled('supplier')) {
                    $itemQuery->where('transaction_items.supplier', $request->get('supplier'));
                }

                // Apply barcode / identifier filter
                if ($request->filled('barcode')) {
                    $itemQuery->where('transaction_items.barcode', trim($request->get('barcode')));
                }

                // Apply cashier filter
                if ($request->filled('cashier')) {
                    $cashierFilter = $request->get('cashier');
                    $itemQuery->whereHas('transaction.user', function ($userQuery) use ($cashierFilter) {
                        $userQuery->where('full_name', 'like', "%{$cashierFilter}%");
                    });
                }

                // Apply price range filters
                if ($request->filled('price_from') || $request->filled('price_min')) {
                    $priceMin = $request->get('price_from') ?? $request->get('price_min');
                    $itemQuery->where('transaction_items.price', '>=', (float) $priceMin);
                }
                if ($request->filled('price_to') || $request->filled('price_max')) {
                    $priceMax = $request->get('price_to') ?? $request->get('price_max');
                    $itemQuery->where('transaction_items.price', '<=', (float) $priceMax);
                }

                // Apply date range filter
                if ($dateRange = $this->resolveDateRange($request)) {
                    $itemQuery->whereBetween('transactions.created_at', $dateRange);
                }

                // Apply time range filter
                if ($request->filled('time_from') || $request->filled('time_to')) {
                    $userTimezone = $request->get('timezone', 'UTC');
                    $timeFrom = $request->get('time_from');
                    $timeTo = $request->get('time_to');

                    if ($timeFrom || $timeTo) {
                        $itemQuery->where(function ($timeQuery) use ($timeFrom, $timeTo, $userTimezone) {
                            if ($timeFrom) {
                                $this->applyTimeComparison($timeQuery, 'transactions.created_at', '>=', $timeFrom, $userTimezone);
                            }
                            if ($timeTo) {
                                $this->applyTimeComparison($timeQuery, 'transactions.created_at', '<=', $timeTo, $userTimezone);
                            }
                        });
                    }
                }

                // Get unique transaction IDs for counting transactions
                $transactionIds = (clone $itemQuery)
                    ->select('transactions.id')
                    ->distinct()
                    ->pluck('id');

                $totalTransactions = $transactionIds->count();

                // When barcode filter is set: stats are product-only (from item-level aggregates)
                $barcodeFilter = $request->filled('barcode');

                if ($barcodeFilter) {
                    $quantityExpression = $this->lineQuantityExpression();
                    $itemStats = (clone $itemQuery)
                        ->selectRaw("
                            COALESCE(SUM(transaction_items.total), 0) as total_sales,
                            COUNT(transaction_items.id) as total_items_sold,
                            COALESCE(SUM({$quantityExpression}), 0) as total_quantity,
                            COALESCE(SUM((transaction_items.price - COALESCE(transaction_items.cost_price, 0)) * {$quantityExpression}), 0) as total_profit
                        ")
                        ->first();
                    $totalSales = (float) ($itemStats->total_sales ?? 0);
                    $totalItemsSold = (int) ($itemStats->total_items_sold ?? 0);
                    $totalQuantity = (float) ($itemStats->total_quantity ?? 0);
                    $totalProfit = (float) ($itemStats->total_profit ?? 0);
                    $avgValue = $totalTransactions > 0 ? $totalSales / $totalTransactions : 0.0;

                    return [
                        'total_sales' => $totalSales,
                        'total_transactions' => $totalTransactions,
                        'average_transaction_value' => round($avgValue, 2),
                        'total_items_sold' => $totalItemsSold,
                        'total_quantity' => $totalQuantity,
                        'total_profit' => $totalProfit,
                    ];
                }

                // No barcode: transaction-level stats (existing behavior)
                $transactionStats = Transaction::query()
                    ->whereIn('id', $transactionIds)
                    ->selectRaw('
                        COALESCE(SUM(total_amount), 0) as total_sales,
                        COUNT(*) as total_transactions,
                        COALESCE(SUM(items_count), 0) as total_items_sold,
                        CASE 
                            WHEN COUNT(*) > 0 THEN COALESCE(SUM(total_amount), 0) / COUNT(*)
                            ELSE 0
                        END as average_transaction_value
                    ')
                    ->first();

                $quantityExpression = $this->lineQuantityExpression();

                $itemStats = (clone $itemQuery)
                    ->selectRaw("
                        COALESCE(SUM({$quantityExpression}), 0) as total_quantity,
                        COALESCE(SUM((transaction_items.price - COALESCE(transaction_items.cost_price, 0)) * {$quantityExpression}), 0) as total_profit
                    ")
                    ->first();

                return [
                    'total_sales' => (float) ($transactionStats->total_sales ?? 0),
                    'total_transactions' => (int) ($transactionStats->total_transactions ?? 0),
                    'average_transaction_value' => (float) ($transactionStats->average_transaction_value ?? 0),
                    'total_items_sold' => (int) ($transactionStats->total_items_sold ?? 0),
                    'total_quantity' => (float) ($itemStats->total_quantity ?? 0),
                    'total_profit' => (float) ($itemStats->total_profit ?? 0),
                ];
            })();

            return response()->json([
                'success' => true,
                'data' => $stats,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch transaction report statistics', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch transaction report statistics: ' . $e->getMessage(),
                'data' => [
                    'total_sales' => 0,
                    'total_transactions' => 0,
                    'average_transaction_value' => 0,
                    'total_items_sold' => 0,
                    'total_quantity' => 0,
                    'total_profit' => 0,
                ],
            ], 500);
        }
    }

    /**
     * Get all transaction report data for export
     */
    public function reportExport(Request $request): JsonResponse
    {
        try {
            // Optimized query for export - use joins instead of eager loading
            $query = TransactionItem::query()
                ->select([
                    'transaction_items.id',
                    'transaction_items.transaction_id',
                    'transaction_items.barcode',
                    'transaction_items.name',
                    'transaction_items.price',
                    'transaction_items.cost_price',
                    'transaction_items.quantity',
                    'transaction_items.weight',
                    'transaction_items.total',
                    'transaction_items.is_scale_product',
                    'transaction_items.card_id',
                    'transaction_items.category',
                    'transaction_items.supplier',
                ])
                ->join('transactions', 'transaction_items.transaction_id', '=', 'transactions.id')
                ->join('users', 'transactions.user_id', '=', 'users.id')
                ->selectRaw('transactions.transaction_number')
                ->selectRaw('transactions.created_at as transaction_created_at')
                ->selectRaw('users.full_name as cashier_name')
                ->where('transactions.status', 'completed');

            // Apply filters (same as report endpoint)
            $productType = $request->get('product_type');
            if ($productType && $productType !== 'all') {
                if ($productType === 'card') {
                    $query->whereNotNull('transaction_items.card_id');
                } elseif ($productType === 'scale') {
                    $query->where('transaction_items.is_scale_product', true);
                } elseif ($productType === 'normal') {
                    $query->where(function ($normalQuery) {
                        $normalQuery->where('transaction_items.is_scale_product', false)
                            ->orWhereNull('transaction_items.is_scale_product');
                    })->whereNull('transaction_items.card_id');
                }
            }

            if ($request->filled('category')) {
                $query->where('transaction_items.category', $request->get('category'));
            }

            if ($request->filled('supplier')) {
                $query->where('transaction_items.supplier', $request->get('supplier'));
            }

            if ($request->filled('barcode')) {
                $query->where('transaction_items.barcode', trim($request->get('barcode')));
            }

            // Apply cashier filter - optimized with join (already joined above)
            if ($request->filled('cashier')) {
                $cashierFilter = $request->get('cashier');
                $query->where('users.full_name', 'like', "%{$cashierFilter}%");
            }

            if ($request->filled('price_from') || $request->filled('price_min')) {
                $priceMin = $request->get('price_from') ?? $request->get('price_min');
                $query->where('transaction_items.price', '>=', (float) $priceMin);
            }
            if ($request->filled('price_to') || $request->filled('price_max')) {
                $priceMax = $request->get('price_to') ?? $request->get('price_max');
                $query->where('transaction_items.price', '<=', (float) $priceMax);
            }

            if ($dateRange = $this->resolveDateRange($request)) {
                $query->whereBetween('transactions.created_at', $dateRange);
            }

            if ($request->filled('time_from') || $request->filled('time_to')) {
                $userTimezone = $request->get('timezone', 'UTC');
                $timeFrom = $request->get('time_from');
                $timeTo = $request->get('time_to');

                if ($timeFrom || $timeTo) {
                    $query->where(function ($timeQuery) use ($timeFrom, $timeTo, $userTimezone) {
                        if ($timeFrom) {
                            $this->applyTimeComparison($timeQuery, 'transactions.created_at', '>=', $timeFrom, $userTimezone);
                        }
                        if ($timeTo) {
                            $this->applyTimeComparison($timeQuery, 'transactions.created_at', '<=', $timeTo, $userTimezone);
                        }
                    });
                }
            }

            $items = $query->get();
            $data = [];

            foreach ($items as $item) {
                $quantity = $item->is_scale_product
                    ? (float) ($item->weight ?? 0)
                    : ($item->card_id
                        ? (float) ($item->quantity ?? 1)
                        : (float) ($item->quantity ?? 0));

                $productType = $item->card_id
                    ? 'card'
                    : ($item->is_scale_product
                        ? 'scale_product'
                        : 'product');

                $data[] = [
                    'id' => $item->id,
                    'transaction_id' => $item->transaction_id,
                    'transaction_number' => $item->transaction_number,
                    'cashier_name' => $item->cashier_name ?? 'Unknown',
                    'product_name' => $item->name,
                    'product_type' => $productType,
                    'identifier' => $item->barcode ?? '',
                    'category' => $item->category,
                    'supplier' => $item->supplier,
                    'quantity' => $quantity,
                    'cost_price' => (float) ($item->cost_price ?? 0),
                    'sell_price' => (float) ($item->price ?? 0),
                    'line_total' => (float) ($item->total ?? ($item->price * $quantity)),
                    'profit_margin' => $item->price > 0 && $item->cost_price > 0
                        ? ((((float) $item->price - (float) $item->cost_price) / (float) $item->cost_price) * 100)
                        : 0,
                    'profit_amount' => ((float) $item->price - (float) ($item->cost_price ?? 0)) * $quantity,
                    'created_at' => $item->transaction_created_at,
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to export transaction report', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to export transaction report: ' . $e->getMessage(),
            ], 500);
        }
    }
}
