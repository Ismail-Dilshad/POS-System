<?php

namespace App\Http\Controllers;

use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Product;
use App\Models\ScaleProduct;
use App\Models\SupplierReturn;
use App\Models\SupplierReturnItem;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Redis;
use Carbon\Carbon;

class SupplierReturnController extends Controller
{
    private const SUPPLIER_RETURN_LIST_CACHE_PREFIX = 'supplier_returns:list:';
    private const SUPPLIER_RETURN_SEARCH_CACHE_PREFIX = 'supplier_returns:search:';
    private const SUPPLIER_RETURN_STATS_CACHE_PREFIX = 'supplier_returns:stats:';
    private const SUPPLIER_RETURN_EXPORT_CACHE_PREFIX = 'supplier_returns:export:';
    
    private const CACHE_TTL_LIST = 300;
    private const CACHE_TTL_SEARCH = 180;
    private const CACHE_TTL_STATS = 600;
    private const CACHE_TTL_EXPORT = 600;

    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = max(1, min((int) $request->get('per_page', 10), 100));
            $loadItems = $request->get('include_items', false);

            $query = SupplierReturn::query()
                ->select([
                    'id',
                    'purchase_id',
                    'user_id',
                    'original_order_id',
                    'original_order_name',
                    'return_reason',
                    'total_amount',
                    'items_count',
                    'created_at',
                    'updated_at',
                ])
                ->with([
                    'user:id,full_name,username',
                ]);

            if ($loadItems) {
                $query->with([
                    'items' => function ($itemQuery) {
                        $itemQuery->select([
                            'id',
                            'supplier_return_id',
                            'purchase_item_id',
                            'product_id',
                            'product_type',
                            'product_name',
                            'identifier',
                            'return_quantity',
                            'return_amount',
                            'cost_price',
                        ])->orderBy('id');
                    },
                ]);
            }

            if ($request->filled('search') || $request->filled('order_id')) {
                $search = $request->get('search') ?? $request->get('order_id');
                $query->where(function ($q) use ($search) {
                    $q->where('original_order_id', 'like', "{$search}%")
                        ->orWhere('original_order_name', 'like', "{$search}%");
                });
            }

            if ($request->filled('order_name')) {
                $query->where('original_order_name', 'like', "%{$request->get('order_name')}%");
            }

            if ($dateRange = $this->resolveDateRange($request)) {
                $query->whereBetween('created_at', $dateRange);
            }

            if ($request->filled('min_amount') || $request->filled('amount_min')) {
                $amountMin = $request->get('min_amount') ?? $request->get('amount_min');
                $query->where('total_amount', '>=', (float) $amountMin);
            }

            if ($request->filled('max_amount') || $request->filled('amount_max')) {
                $amountMax = $request->get('max_amount') ?? $request->get('amount_max');
                $query->where('total_amount', '<=', (float) $amountMax);
            }

            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            
            $allowedSortColumns = ['id', 'original_order_id', 'original_order_name', 'total_amount', 'items_count', 'created_at', 'updated_at'];
            if (!in_array($sortBy, $allowedSortColumns)) {
                $sortBy = 'created_at';
            }
            
            $sortOrder = strtolower($sortOrder) === 'asc' ? 'asc' : 'desc';
            $query->orderBy($sortBy, $sortOrder);

            $hasSearch = $request->filled('search') || $request->filled('order_id');
            $cacheKey = ($hasSearch ? self::SUPPLIER_RETURN_SEARCH_CACHE_PREFIX : self::SUPPLIER_RETURN_LIST_CACHE_PREFIX) 
                . md5(serialize([
                    'page' => $request->get('page', 1),
                    'per_page' => $perPage,
                    'load_items' => $loadItems,
                    'search' => $request->get('search') ?? $request->get('order_id'),
                    'order_name' => $request->get('order_name'),
                    'date_range' => $dateRange,
                    'min_amount' => $request->get('min_amount') ?? $request->get('amount_min'),
                    'max_amount' => $request->get('max_amount') ?? $request->get('amount_max'),
                    'sort_by' => $sortBy,
                    'sort_order' => $sortOrder,
                ]));

            $cacheTime = $hasSearch ? self::CACHE_TTL_SEARCH : self::CACHE_TTL_LIST;
            
            try {
                $returns = Cache::store('redis')->remember($cacheKey, $cacheTime, function () use ($query, $perPage) {
                    return $query->paginate($perPage);
                });
            } catch (\Exception $e) {
                Log::warning('Redis cache failed for supplier return list, using default cache store', [
                    'error' => $e->getMessage(),
                    'trace' => substr($e->getTraceAsString(), 0, 500)
                ]);
                $returns = Cache::remember($cacheKey, $cacheTime, function () use ($query, $perPage) {
                    return $query->paginate($perPage);
                });
            }

            return response()->json([
                'success' => true,
                'data' => $returns
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch supplier returns', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch supplier returns'
            ], 500);
        }
    }

    public function getStatistics(Request $request): JsonResponse
    {
        try {
            $cacheKey = self::SUPPLIER_RETURN_STATS_CACHE_PREFIX . md5(serialize([
                'filters' => $request->except(['page', 'per_page', 'cache_bust'])
            ]));

            $cacheTime = self::CACHE_TTL_STATS;
            
            if ($request->has('cache_bust')) {
                Cache::forget($cacheKey);
            }

            try {
                $statistics = Cache::store('redis')->remember($cacheKey, $cacheTime, function () {
                    $totalQuery = SupplierReturn::query();
                    $monthStart = Carbon::now()->startOfMonth();
                    $monthEnd = Carbon::now()->endOfMonth();
                    
                    $monthQuery = SupplierReturn::query()
                        ->whereBetween('created_at', [$monthStart, $monthEnd]);

                    return [
                        'total_returns' => $totalQuery->count(),
                        'total_amount' => (float) $totalQuery->sum('total_amount'),
                        'total_items' => (int) $totalQuery->sum('items_count'),
                        'this_month_returns' => $monthQuery->count(),
                        'this_month_amount' => (float) $monthQuery->sum('total_amount'),
                        'this_month_items' => (int) $monthQuery->sum('items_count'),
                    ];
                });
            } catch (\Exception $e) {
                Log::warning('Redis cache failed for supplier return statistics, using default cache store', [
                    'error' => $e->getMessage()
                ]);
                $statistics = Cache::remember($cacheKey, $cacheTime, function () {
                    $totalQuery = SupplierReturn::query();
                    $monthStart = Carbon::now()->startOfMonth();
                    $monthEnd = Carbon::now()->endOfMonth();
                    
                    $monthQuery = SupplierReturn::query()
                        ->whereBetween('created_at', [$monthStart, $monthEnd]);

        return [
            'total_returns' => $totalQuery->count(),
            'total_amount' => (float) $totalQuery->sum('total_amount'),
            'total_items' => (int) $totalQuery->sum('items_count'),
            'this_month_returns' => $monthQuery->count(),
            'this_month_amount' => (float) $monthQuery->sum('total_amount'),
            'this_month_items' => (int) $monthQuery->sum('items_count'),
        ];
                });
            }

            return response()->json([
                'success' => true,
                'data' => $statistics
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get supplier return statistics', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to get supplier return statistics'
            ], 500);
        }
    }

    public function getAll(Request $request): JsonResponse
    {
        try {
            $exportMode = $request->get('export', false);
            
            if ($exportMode) {
                $query = SupplierReturn::query()
                    ->select([
                        'id',
                        'purchase_id',
                        'user_id',
                        'original_order_id',
                        'original_order_name',
                        'return_reason',
                        'total_amount',
                        'items_count',
                        'created_at',
                        'updated_at',
                    ])
                    ->with([
                        'user:id,full_name,username',
                        'items' => function ($itemQuery) {
                            $itemQuery->select([
                                'id',
                                'supplier_return_id',
                                'purchase_item_id',
                                'product_id',
                                'product_type',
                                'product_name',
                                'identifier',
                                'return_quantity',
                                'return_amount',
                                'cost_price',
                            ])->orderBy('id');
                        },
                    ]);

                if ($request->filled('search') || $request->filled('order_id')) {
                    $search = $request->get('search') ?? $request->get('order_id');
                    $query->where(function ($q) use ($search) {
                        $q->where('original_order_id', 'like', "{$search}%")
                            ->orWhere('original_order_name', 'like', "{$search}%");
                    });
                }

                if ($request->filled('order_name')) {
                    $query->where('original_order_name', 'like', "%{$request->get('order_name')}%");
                }

                if ($dateRange = $this->resolveDateRange($request)) {
                    $query->whereBetween('created_at', $dateRange);
                }

                if ($request->filled('min_amount') || $request->filled('amount_min')) {
                    $amountMin = $request->get('min_amount') ?? $request->get('amount_min');
                    $query->where('total_amount', '>=', (float) $amountMin);
                }

                if ($request->filled('max_amount') || $request->filled('amount_max')) {
                    $amountMax = $request->get('max_amount') ?? $request->get('amount_max');
                    $query->where('total_amount', '<=', (float) $amountMax);
                }

                $sortBy = $request->get('sort_by', 'created_at');
                $sortOrder = $request->get('sort_order', 'desc');
                $allowedSortColumns = ['id', 'original_order_id', 'original_order_name', 'total_amount', 'items_count', 'created_at', 'updated_at'];
                if (!in_array($sortBy, $allowedSortColumns)) {
                    $sortBy = 'created_at';
                }
                $sortOrder = strtolower($sortOrder) === 'asc' ? 'asc' : 'desc';
                $query->orderBy($sortBy, $sortOrder);

                $exportCacheKey = self::SUPPLIER_RETURN_EXPORT_CACHE_PREFIX . md5(serialize([
                    'filters' => [
                        'search' => $request->get('search') ?? $request->get('order_id'),
                        'order_name' => $request->get('order_name'),
                        'date_range' => $dateRange,
                        'min_amount' => $request->get('min_amount') ?? $request->get('amount_min'),
                        'max_amount' => $request->get('max_amount') ?? $request->get('amount_max'),
                        'sort_by' => $sortBy,
                        'sort_order' => $sortOrder,
                    ]
                ]));

                try {
                    $result = Cache::store('redis')->remember($exportCacheKey, self::CACHE_TTL_EXPORT, function () use ($query) {
                        $returns = $query->get();
                        $total = $returns->count();
                        return [
                            'data' => $returns->values(),
                            'total' => $total,
                        ];
                    });
                } catch (\Exception $e) {
                    Log::warning('Redis cache failed for supplier return export, using default cache store', [
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                    $result = Cache::remember($exportCacheKey, self::CACHE_TTL_EXPORT, function () use ($query) {
                        $returns = $query->get();
                        $total = $returns->count();
                        return [
                            'data' => $returns->values(),
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

            return response()->json([
                'success' => false,
                'message' => 'Export mode required'
            ], 400);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve all supplier returns: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a single supplier return with details
     */
    public function show($id)
    {
        try {
            $return = SupplierReturn::with(['items', 'purchase', 'user'])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $return
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to fetch supplier return: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Supplier return not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Process a supplier return
     */
    public function processReturn(Request $request)
    {
        $request->validate([
            'purchase_id' => 'required|exists:purchases,id',
            'return_reason' => 'required|string|max:500',
            'return_items' => 'required|array|min:1',
            'return_items.*.item_id' => 'required|exists:purchase_items,id',
            'return_items.*.return_quantity' => 'required|numeric|min:0.001'
        ]);

        try {
            DB::beginTransaction();

            $purchase = Purchase::with('items')->findOrFail($request->purchase_id);

            // Verify purchase is in received status
            if ($purchase->status !== 'receive') {
                throw new \Exception('Only received purchases can be returned');
            }

            // Create supplier return record
            $supplierReturn = SupplierReturn::create([
                'purchase_id' => $purchase->id,
                'user_id' => auth()->id(),
                'original_order_id' => $purchase->invoice_id,
                'original_order_name' => $purchase->invoice_name,
                'return_reason' => $request->return_reason,
                'total_amount' => 0,
                'items_count' => 0
            ]);

            $totalReturnAmount = 0;
            $totalItemsCount = 0;

            // Process each return item
            foreach ($request->return_items as $returnItemData) {
                $purchaseItem = PurchaseItem::findOrFail($returnItemData['item_id']);

                // Validate return quantity doesn't exceed available quantity
                if ($returnItemData['return_quantity'] > $purchaseItem->quantity) {
                    throw new \Exception("Return quantity cannot exceed available quantity for item: {$purchaseItem->product_name}");
                }

                $returnAmount = $returnItemData['return_quantity'] * $purchaseItem->cost_price;

                // Create return item record
                SupplierReturnItem::create([
                    'supplier_return_id' => $supplierReturn->id,
                    'purchase_item_id' => $purchaseItem->id,
                    'product_id' => $purchaseItem->product_id,
                    'product_type' => $purchaseItem->product_type,
                    'product_name' => $purchaseItem->product_name,
                    'identifier' => $purchaseItem->identifier,
                    'cost_price' => $purchaseItem->cost_price,
                    'sell_price' => $purchaseItem->sell_price,
                    'return_quantity' => $returnItemData['return_quantity'],
                    'return_amount' => $returnAmount
                ]);

                $this->updateInventory($purchaseItem, $returnItemData['return_quantity'], 'reduce');

                $newQuantity = $purchaseItem->quantity - $returnItemData['return_quantity'];

                if ($newQuantity <= 0) {
                    $purchaseItem->delete();
                } else {
                    $purchaseItem->update([
                        'quantity' => $newQuantity,
                        'total_cost' => $newQuantity * $purchaseItem->cost_price
                    ]);
                }

                $totalReturnAmount += $returnAmount;
                $totalItemsCount++;
            }

            // Update supplier return totals
            $supplierReturn->update([
                'total_amount' => $totalReturnAmount,
                'items_count' => $totalItemsCount
            ]);

            // Recalculate purchase totals and check if it should be deleted
            $purchaseDeleted = $this->recalculatePurchaseTotals($purchase);

            DB::commit();

            $this->invalidateSupplierReturnCaches();

            $message = 'Return processed successfully';
            if ($purchaseDeleted) {
                $message .= '. Original purchase was fully returned and has been removed.';
            } else {
                $message .= '. Original purchase quantities have been updated.';
            }

            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => $supplierReturn->load('items'),
                'purchase_deleted' => $purchaseDeleted
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Supplier return processing failed: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to process return',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Recalculate purchase totals after items are modified
     * Returns true if purchase was deleted, false if updated
     */
    private function recalculatePurchaseTotals(Purchase $purchase): bool
    {
        // Reload items to get fresh data
        $purchase->load('items');

        // Check if purchase has any items left
        if ($purchase->items->count() === 0) {
            // Delete the purchase if no items remain
            $purchase->delete();
            return true; // Return true to indicate purchase was deleted
        }

        // Recalculate totals from remaining items
        $newTotalOrders = $purchase->items->sum('quantity');
        $newTotalAmount = $purchase->items->sum('total_cost');

        $purchase->update([
            'total_orders' => (int) $newTotalOrders,
            'total_amount' => $newTotalAmount
        ]);

        return false;
    }

    /**
     * Update inventory (reduce or increase stock)
     */
    private function updateInventory($purchaseItem, $quantity, $action = 'reduce')
    {
        if ($purchaseItem->product_type === 'product') {
            $product = Product::find($purchaseItem->product_id);
            if ($product) {
                $newStock = $action === 'reduce'
                    ? $product->stock - $quantity
                    : $product->stock + $quantity;

                $product->update(['stock' => max(0, $newStock)]);
            }
        } elseif ($purchaseItem->product_type === 'scale_product') {
            $scaleProduct = ScaleProduct::find($purchaseItem->product_id);
            if ($scaleProduct) {
                $newStock = $action === 'reduce'
                    ? $scaleProduct->stock - $quantity
                    : $scaleProduct->stock + $quantity;

                $scaleProduct->update(['stock' => max(0, $newStock)]);
            }
        }
    }

    /**
     * Delete all supplier returns with password verification.
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
                $supplierReturnCount = SupplierReturn::count();
                
                // Delete all supplier return items first (foreign key constraint)
                SupplierReturnItem::truncate();
                
                // Delete all supplier returns
                SupplierReturn::truncate();

                DB::commit();

                $this->invalidateSupplierReturnCaches();

                return response()->json([
                    'success' => true,
                    'message' => "Successfully deleted {$supplierReturnCount} supplier return(s)",
                    'deleted_count' => $supplierReturnCount
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('Failed to delete all supplier returns: ' . $e->getMessage());
                throw $e;
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete supplier returns: ' . $e->getMessage()
            ], 500);
        }
    }

    private function resolveDateRange(Request $request): ?array
    {
        if (!$request->filled('date_from') && !$request->filled('date_to')) {
            return null;
        }

        $userTimezone = $request->get('timezone', 'UTC');

        $start = $request->filled('date_from')
            ? Carbon::parse($request->get('date_from'), $userTimezone)
            : Carbon::createFromTimestamp(0, $userTimezone);

        $end = $request->filled('date_to')
            ? Carbon::parse($request->get('date_to'), $userTimezone)
            : Carbon::now($userTimezone)->addYears(100);

        return [$start->startOfDay()->utc(), $end->endOfDay()->utc()];
    }

    private function invalidateSupplierReturnCaches(): void
    {
        try {
            try {
                $redis = Redis::connection('cache');
            } catch (\Exception $e) {
                $redis = Redis::connection('default');
            }

            $cachePrefix = config('cache.prefix', '');
            $patterns = [
                $cachePrefix . self::SUPPLIER_RETURN_LIST_CACHE_PREFIX . '*',
                $cachePrefix . self::SUPPLIER_RETURN_SEARCH_CACHE_PREFIX . '*',
                $cachePrefix . self::SUPPLIER_RETURN_STATS_CACHE_PREFIX . '*',
                $cachePrefix . self::SUPPLIER_RETURN_EXPORT_CACHE_PREFIX . '*',
            ];

            foreach ($patterns as $pattern) {
                try {
                    $cursor = 0;
                    $keysToDelete = [];
                    
                    do {
                        try {
                            $result = $redis->scan($cursor, ['match' => $pattern, 'count' => 100]);
                            if (is_array($result) && isset($result[0])) {
                                $cursor = (int) $result[0];
                                $keys = $result[1] ?? [];
                            } else {
                                $cursor = (int) ($result['cursor'] ?? 0);
                                $keys = $result['keys'] ?? [];
                            }
                            
                            if (!empty($keys) && is_array($keys)) {
                                $keysToDelete = array_merge($keysToDelete, $keys);
                            }
                            
                            if (count($keysToDelete) >= 100) {
                                $redis->del($keysToDelete);
                                $keysToDelete = [];
                            }
                        } catch (\Exception $scanException) {
                            Log::warning('SCAN iteration failed', ['error' => $scanException->getMessage()]);
                            break;
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
            Log::warning('Failed to invalidate supplier return caches', [
                'error' => $e->getMessage()
            ]);
        }
    }
}
