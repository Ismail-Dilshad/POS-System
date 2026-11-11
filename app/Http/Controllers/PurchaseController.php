<?php

namespace App\Http\Controllers;

use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\SupplierPayment;
use App\Models\Product;
use App\Models\ScaleProduct;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Redis;
use Illuminate\Validation\Rule;

class PurchaseController extends Controller
{
    private const PURCHASE_REPORT_CACHE_PREFIX = 'purchases:report:';
    private const PURCHASE_REPORT_STATS_CACHE_PREFIX = 'purchases:report:stats:';
    private const PURCHASE_REPORT_EXPORT_CACHE_PREFIX = 'purchases:report:export:';
    private const CACHE_TTL_REPORT = 300;
    private const CACHE_TTL_REPORT_STATS = 600;
    private const CACHE_TTL_REPORT_EXPORT = 600;

    /**
     * Invalidate purchase report caches
     */
    private function invalidatePurchaseCaches(): void
    {
        try {
            $redis = Redis::connection('cache');
            $cachePrefix = config('cache.prefix', '');
            $patterns = [
                $cachePrefix . self::PURCHASE_REPORT_CACHE_PREFIX . '*',
                $cachePrefix . self::PURCHASE_REPORT_STATS_CACHE_PREFIX . '*',
                $cachePrefix . self::PURCHASE_REPORT_EXPORT_CACHE_PREFIX . '*',
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
                        Log::warning('Both SCAN and KEYS failed for purchase cache invalidation', [
                            'pattern' => $pattern,
                            'scan_error' => $scanException->getMessage(),
                            'keys_error' => $keysException->getMessage()
                        ]);
                    }
                }
            }
        } catch (\Exception $e) {
            Log::warning('Failed to invalidate purchase caches', [
                'error' => $e->getMessage()
            ]);
        }
    }
    /**
     * Build purchases query with comprehensive database-level filtering
     * ALL filters are applied at database level for maximum performance
     */
    private function buildPurchasesQuery(array $filters = [], bool $includeItems = false, ?int $page = null, ?int $perPage = null)
    {
        $search = trim($filters['search'] ?? '');
        $status = $filters['status'] ?? null;
        $multiSupplier = $filters['multiSupplier'] ?? null;
        $priceMin = $filters['priceMin'] ?? null;
        $priceMax = $filters['priceMax'] ?? null;
        $dateFrom = $filters['dateFrom'] ?? null;
        $dateTo = $filters['dateTo'] ?? null;
        $timeFrom = $filters['timeFrom'] ?? null;
        $timeTo = $filters['timeTo'] ?? null;
        $timezone = $filters['timezone'] ?? 'UTC';

        // Normalize status filter
        if ($status === 'all' || $status === '') {
            $status = null;
        }

        $query = Purchase::query()
            ->select([
                'id',
                'invoice_name',
                'invoice_id',
                'notes',
                'status',
                'total_orders',
                'total_amount',
                'created_at',
                'updated_at',
            ]);

        if ($includeItems) {
            $query->with(['items' => function ($itemQuery) {
                $itemQuery->select([
                    'id',
                    'purchase_id',
                    'product_id',
                    'product_type',
                    'product_name',
                    'identifier',
                    'cost_price',
                    'sell_price',
                    'quantity',
                    'total_cost',
                    'profit_margin',
                    'supplier_id',
                    'supplier_name',
                    'created_at',
                    'updated_at',
                ]);
            }]);
        }

        // Apply search filter (database level)
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                    $q->where('invoice_name', 'like', "%{$search}%")
                        ->orWhere('invoice_id', 'like', "%{$search}%");
                });
        }

        // Apply status filter (database level)
        if ($status) {
            $query->where('status', $status);
        }

        // Apply multi-supplier filter (database level)
        if ($multiSupplier && $multiSupplier !== 'all') {
            $query->whereIn('id', function ($subQuery) use ($multiSupplier) {
                $subQuery->select('purchase_id')
                    ->from('purchase_items')
                    ->whereNotNull('supplier_name')
                    ->where('supplier_name', '!=', '')
                    ->groupBy('purchase_id')
                    ->havingRaw('COUNT(DISTINCT supplier_name) ' . ($multiSupplier === 'single' ? '= 1' : '> 1'));
                });
        }

        // Apply price range filters (database level)
        if ($priceMin !== null && $priceMin !== '') {
            $query->where('total_amount', '>=', (float) $priceMin);
        }
        if ($priceMax !== null && $priceMax !== '') {
            $query->where('total_amount', '<=', (float) $priceMax);
        }

        // Apply date and time range filters (database level)
        if ($dateFrom || $dateTo || $timeFrom || $timeTo) {
            $query->where(function ($q) use ($dateFrom, $dateTo, $timeFrom, $timeTo, $timezone) {
                // If only time filters are provided, use today's date
                if (!$dateFrom && !$dateTo) {
                    $start = Carbon::today($timezone);
                    $end = Carbon::today($timezone);
                } else {
                    $start = $dateFrom
                        ? Carbon::parse($dateFrom, $timezone)
                        : Carbon::createFromTimestamp(0, $timezone);
                    
                    $end = $dateTo
                        ? Carbon::parse($dateTo, $timezone)
                        : Carbon::now($timezone)->addYears(100);
                }

                // Apply time filters if provided
                if ($timeFrom) {
                    $start = $start->copy()->setTimeFromTimeString($timeFrom . ':00');
                } else {
                    $start = $start->startOfDay();
                }

                if ($timeTo) {
                    $end = $end->copy()->setTimeFromTimeString($timeTo . ':00');
                } else {
                    $end = $end->endOfDay();
                }

                $q->whereBetween('created_at', [$start, $end]);
            });
        }

        $query->orderByDesc('id');

        if ($page !== null && $perPage !== null) {
            $offset = ($page - 1) * $perPage;
            $query->skip($offset)->take($perPage);
        }

        return $query;
    }

    public function index(Request $request)
    {
        try {
            // Extract all filter parameters
            $filters = [
                'search' => $request->get('search'),
                'status' => $request->get('status'),
                'multiSupplier' => $request->get('multiSupplier'),
                'priceMin' => $request->get('priceMin'),
                'priceMax' => $request->get('priceMax'),
                'dateFrom' => $request->get('dateFrom'),
                'dateTo' => $request->get('dateTo'),
                'timeFrom' => $request->get('timeFrom'),
                'timeTo' => $request->get('timeTo'),
                'timezone' => $request->get('timezone', 'UTC'),
            ];

            $exportMode = $request->get('export', false);
            
            if ($exportMode) {
                // Export mode: return ALL filtered purchases with items (for correct total quantity in Excel)
                $purchases = $this->buildPurchasesQuery($filters, true, null, null)->get();
                $total = $purchases->count();

        return response()->json([
            'success' => true,
            'data' => $purchases,
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
            $cacheKey = !$hasFilters && $page === 1
                ? 'purchases:index:page:1'
                : null;

            if ($cacheKey) {
                $cachedData = Cache::remember($cacheKey, 300, function () use ($perPage) {
                    $total = $this->buildPurchasesQuery([], false, null, null)->count();
                    $purchases = $this->buildPurchasesQuery([], false, 1, $perPage)->get();

                    return [
                        'data' => $purchases->values(),
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

            $total = $this->buildPurchasesQuery($filters, false, null, null)->count();
            $purchases = $this->buildPurchasesQuery($filters, false, $page, $perPage)->get();

            return response()->json([
                'success' => true,
                'data' => $purchases->values(),
                'pagination' => [
                    'total' => $total,
                    'per_page' => $perPage,
                    'current_page' => $page,
                    'last_page' => (int) ceil($total / $perPage),
                    'from' => $total > 0 ? ($page - 1) * $perPage + 1 : 0,
                    'to' => $total > 0 ? min($page * $perPage, $total) : 0,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch purchases', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch purchases: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get purchase statistics with comprehensive filtering
     * Uses raw SQL queries for optimal performance
     */
    public function statistics(Request $request)
    {
        try {
            // Extract all filter parameters
            $filters = [
                'search' => $request->get('search'),
                'status' => $request->get('status'),
                'multiSupplier' => $request->get('multiSupplier'),
                'priceMin' => $request->get('priceMin'),
                'priceMax' => $request->get('priceMax'),
                'dateFrom' => $request->get('dateFrom'),
                'dateTo' => $request->get('dateTo'),
                'timeFrom' => $request->get('timeFrom'),
                'timeTo' => $request->get('timeTo'),
                'timezone' => $request->get('timezone', 'UTC'),
            ];

            // Build WHERE conditions for statistics query
            $whereConditions = [];
            $bindings = [];

            // Apply search filter
            if (!empty($filters['search'])) {
                $whereConditions[] = "(invoice_name LIKE ? OR invoice_id LIKE ?)";
                $searchTerm = '%' . $filters['search'] . '%';
                $bindings[] = $searchTerm;
                $bindings[] = $searchTerm;
            }

            if (!empty($filters['status']) && $filters['status'] !== 'all') {
                $whereConditions[] = "status = ?";
                $bindings[] = $filters['status'];
            }

            if (!empty($filters['priceMin'])) {
                $whereConditions[] = "total_amount >= ?";
                $bindings[] = (float) $filters['priceMin'];
            }
            if (!empty($filters['priceMax'])) {
                $whereConditions[] = "total_amount <= ?";
                $bindings[] = (float) $filters['priceMax'];
            }

            if ($filters['dateFrom'] || $filters['dateTo'] || $filters['timeFrom'] || $filters['timeTo']) {
                $timezone = $filters['timezone'];
                
                if (!$filters['dateFrom'] && !$filters['dateTo']) {
                        $start = Carbon::today($timezone);
                        $end = Carbon::today($timezone);
                    } else {
                    $start = $filters['dateFrom']
                        ? Carbon::parse($filters['dateFrom'], $timezone)
                            : Carbon::createFromTimestamp(0, $timezone);
                        
                    $end = $filters['dateTo']
                        ? Carbon::parse($filters['dateTo'], $timezone)
                            : Carbon::now($timezone)->addYears(100);
                    }

                if ($filters['timeFrom']) {
                    $start = $start->copy()->setTimeFromTimeString($filters['timeFrom'] . ':00');
                } else {
                    $start = $start->startOfDay();
                }

                if ($filters['timeTo']) {
                    $end = $end->copy()->setTimeFromTimeString($filters['timeTo'] . ':00');
                } else {
                    $end = $end->endOfDay();
                }

                $whereConditions[] = "created_at BETWEEN ? AND ?";
                $bindings[] = $start->toDateTimeString();
                $bindings[] = $end->toDateTimeString();
            }

            $whereClause = !empty($whereConditions)
                ? 'WHERE ' . implode(' AND ', $whereConditions)
                : '';
            $purchaseIdsSubquery = '';
            if (!empty($filters['multiSupplier']) && $filters['multiSupplier'] !== 'all') {
                $purchaseIdsSubquery = "AND id IN (
                    SELECT purchase_id 
                    FROM purchase_items 
                    WHERE supplier_name IS NOT NULL AND supplier_name != ''
                    GROUP BY purchase_id 
                    HAVING COUNT(DISTINCT supplier_name) " . ($filters['multiSupplier'] === 'single' ? '= 1' : '> 1') . "
                )";
            }

            $todayStart = now()->startOfDay()->toDateTimeString();
            $thisWeekStart = now()->startOfWeek()->toDateTimeString();
            $thisMonthStart = now()->startOfMonth()->toDateTimeString();

            $statsQuery = "
                SELECT 
                    COUNT(*) as total_purchases,
                    COALESCE(SUM(total_amount), 0) as total_value,
                    SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) as today_purchases,
                    COALESCE(SUM(CASE WHEN created_at >= ? THEN total_amount ELSE 0 END), 0) as today_value,
                    SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) as this_week_purchases,
                    COALESCE(SUM(CASE WHEN created_at >= ? THEN total_amount ELSE 0 END), 0) as this_week_value,
                    SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) as this_month_purchases,
                    COALESCE(SUM(CASE WHEN created_at >= ? THEN total_amount ELSE 0 END), 0) as this_month_value,
                    SUM(CASE WHEN status = 'order' THEN 1 ELSE 0 END) as pending_purchases,
                    SUM(CASE WHEN status = 'receive' THEN 1 ELSE 0 END) as completed_purchases,
                    CASE 
                        WHEN COUNT(*) > 0 THEN COALESCE(SUM(total_amount), 0) / COUNT(*)
                        ELSE 0 
                    END as average_purchase_value
                FROM purchases
                {$whereClause}
                {$purchaseIdsSubquery}
            ";

            $statsBindings = array_merge(
                [$todayStart, $todayStart, $thisWeekStart, $thisWeekStart, $thisMonthStart, $thisMonthStart],
                $bindings
            );

            $stats = DB::selectOne($statsQuery, $statsBindings);

            $itemsQuery = "
                SELECT 
                    COALESCE(SUM(total_orders), 0) as total_items_ordered,
                    COALESCE(SUM(CASE WHEN created_at >= ? THEN total_orders ELSE 0 END), 0) as today_items_ordered
                FROM purchases
                {$whereClause}
                {$purchaseIdsSubquery}
            ";

            $itemsBindings = array_merge([$todayStart], $bindings);
            $itemsStats = DB::selectOne($itemsQuery, $itemsBindings);

            $suppliersQuery = "
                SELECT COUNT(DISTINCT pi.supplier_name) as unique_suppliers
                FROM purchase_items pi
                INNER JOIN purchases p ON pi.purchase_id = p.id
                {$whereClause}
                {$purchaseIdsSubquery}
                AND pi.supplier_name IS NOT NULL AND pi.supplier_name != ''
            ";

            $suppliersStats = DB::selectOne($suppliersQuery, $bindings);

            return response()->json([
                'success' => true,
                'data' => [
                    'total_purchases' => (int) ($stats->total_purchases ?? 0),
                    'total_value' => (float) ($stats->total_value ?? 0),
                    'today_purchases' => (int) ($stats->today_purchases ?? 0),
                    'today_value' => (float) ($stats->today_value ?? 0),
                    'total_items_ordered' => (int) ($itemsStats->total_items_ordered ?? 0),
                    'today_items_ordered' => (int) ($itemsStats->today_items_ordered ?? 0),
                    'this_week_purchases' => (int) ($stats->this_week_purchases ?? 0),
                    'this_week_value' => (float) ($stats->this_week_value ?? 0),
                    'this_month_purchases' => (int) ($stats->this_month_purchases ?? 0),
                    'this_month_value' => (float) ($stats->this_month_value ?? 0),
                    'pending_purchases' => (int) ($stats->pending_purchases ?? 0),
                    'completed_purchases' => (int) ($stats->completed_purchases ?? 0),
                    'average_purchase_value' => (float) ($stats->average_purchase_value ?? 0),
                    'unique_suppliers' => (int) ($suppliersStats->unique_suppliers ?? 0),
                    'products_updated' => (int) ($stats->completed_purchases ?? 0),
                    'low_stock_replenished' => 0,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch purchase statistics', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch purchase statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $request->validate([
            'invoice_name' => 'required|string|max:255',
            'invoice_id' => 'required|string|max:255|unique:purchases,invoice_id',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer',
            'items.*.product_type' => 'required|in:product,scale_product',
            'items.*.product_name' => 'required|string|max:255',
            'items.*.identifier' => 'required|string|max:255',
            'items.*.cost_price' => 'required|numeric|min:0',
            'items.*.sell_price' => 'required|numeric|min:0',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.supplier_id' => 'nullable|exists:suppliers,id',
            'items.*.supplier_name' => 'nullable|string|max:255',
        ]);

        try {
            DB::beginTransaction();

            // Create the purchase
            $purchase = Purchase::create([
                'invoice_name' => $request->invoice_name,
                'invoice_id' => $request->invoice_id,
                'notes' => $request->notes,
                'status' => 'order', // Always start as order
                'total_orders' => 0,
                'total_amount' => 0,
            ]);

            $totalAmount = 0;
            $totalOrders = 0;

            // Create purchase items
            foreach ($request->items as $itemData) {
                $totalCost = $itemData['quantity'] * $itemData['cost_price'];
                $profitMargin = $itemData['cost_price'] > 0
                    ? (($itemData['sell_price'] - $itemData['cost_price']) / $itemData['cost_price']) * 100
                    : 0;

                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_id' => $itemData['product_id'],
                    'product_type' => $itemData['product_type'],
                    'product_name' => $itemData['product_name'],
                    'identifier' => $itemData['identifier'],
                    'cost_price' => $itemData['cost_price'],
                    'sell_price' => $itemData['sell_price'],
                    'quantity' => $itemData['quantity'],
                    'total_cost' => $totalCost,
                    'profit_margin' => $profitMargin,
                    'supplier_id' => $itemData['supplier_id'] ?? null,
                    'supplier_name' => $itemData['supplier_name'] ?? null,
                ]);

                $totalAmount += $totalCost;
                $totalOrders++;
            }

            // Update purchase totals
            $purchase->update([
                'total_orders' => $totalOrders,
                'total_amount' => $totalAmount,
            ]);

            DB::commit();

            // Invalidate caches to ensure report page shows new purchase immediately
            $this->invalidatePurchaseCaches();

            return response()->json([
                'success' => true,
                'message' => 'Purchase order created successfully',
                'data' => $purchase->load('items')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to create purchase order',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(Purchase $purchase)
    {
        $purchase->load(['items.supplier']);

        return response()->json([
            'success' => true,
            'data' => $purchase
        ]);
    }

    public function update(Request $request, Purchase $purchase)
    {
        $request->validate([
            'invoice_name' => 'required|string|max:255',
            'invoice_id' => [
                'required',
                'string',
                'max:255',
                Rule::unique('purchases', 'invoice_id')->ignore($purchase->id)
            ],
            'notes' => 'nullable|string',
            'status' => 'sometimes|in:order,receive',
            'items' => 'sometimes|array|min:1',
            'items.*.product_id' => 'required_with:items|integer',
            'items.*.product_type' => 'required_with:items|in:product,scale_product',
            'items.*.product_name' => 'required_with:items|string|max:255',
            'items.*.identifier' => 'required_with:items|string|max:255',
            'items.*.cost_price' => 'required_with:items|numeric|min:0',
            'items.*.sell_price' => 'required_with:items|numeric|min:0',
            'items.*.quantity' => 'required_with:items|numeric|min:0.001',
            'items.*.supplier_id' => 'nullable|exists:suppliers,id',
            'items.*.supplier_name' => 'nullable|string|max:255',
        ]);

        try {
            DB::beginTransaction();

            // Update purchase basic data
            $purchase->update($request->only([
                'invoice_name',
                'invoice_id',
                'notes',
                'status'
            ]));

            // If items are provided, update them
            if ($request->has('items')) {
                // Delete existing items
                $purchase->items()->delete();

                $totalAmount = 0;
                $totalOrders = 0;

                // Create new items
                foreach ($request->items as $itemData) {
                    $totalCost = $itemData['quantity'] * $itemData['cost_price'];
                    $profitMargin = $itemData['cost_price'] > 0
                        ? (($itemData['sell_price'] - $itemData['cost_price']) / $itemData['cost_price']) * 100
                        : 0;

                    PurchaseItem::create([
                        'purchase_id' => $purchase->id,
                        'product_id' => $itemData['product_id'],
                        'product_type' => $itemData['product_type'],
                        'product_name' => $itemData['product_name'],
                        'identifier' => $itemData['identifier'],
                        'cost_price' => $itemData['cost_price'],
                        'sell_price' => $itemData['sell_price'],
                        'quantity' => $itemData['quantity'],
                        'total_cost' => $totalCost,
                        'profit_margin' => $profitMargin,
                        'supplier_id' => $itemData['supplier_id'] ?? null,
                        'supplier_name' => $itemData['supplier_name'] ?? null,
                    ]);

                    $totalAmount += $totalCost;
                    $totalOrders++;
                }

                // Update purchase totals
                $purchase->update([
                    'total_orders' => $totalOrders,
                    'total_amount' => $totalAmount,
                ]);
            }

            DB::commit();

            // Invalidate caches if purchase status changed to 'receive' (affects reports)
            if ($request->has('status') && $request->get('status') === 'receive') {
                $this->invalidatePurchaseCaches();
            }

            return response()->json([
                'success' => true,
                'message' => 'Purchase updated successfully',
                'data' => $purchase->load('items')
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to update purchase',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Purchase $purchase)
    {
        try {
            $wasReceived = $purchase->status === 'receive';
            $purchase->delete(); // This will cascade delete items too

            // Invalidate caches if deleted purchase was received (affects reports)
            if ($wasReceived) {
                $this->invalidatePurchaseCaches();
            }

            return response()->json([
                'success' => true,
                'message' => 'Purchase deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete purchase',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function search(Request $request)
    {
        $request->validate([
            'search_type' => 'required|in:order_id,order_name',
            'search_query' => 'required|string|min:1'
        ]);

        try {
            $searchType = $request->search_type;
            $searchQuery = $request->search_query;

            // Only search for received purchases (status = 'receive')
            $purchases = Purchase::with(['items.supplier'])
                ->where('status', 'receive')
                ->when($searchType === 'order_id', function ($query) use ($searchQuery) {
                    return $query->where('invoice_id', 'like', '%' . $searchQuery . '%');
                })
                ->when($searchType === 'order_name', function ($query) use ($searchQuery) {
                    return $query->where('invoice_name', 'like', '%' . $searchQuery . '%');
                })
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $purchases
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Search failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function markAsReceived(Request $request, Purchase $purchase)
    {
        try {

            // Validate supplier payments if provided
            if ($request->has('supplier_payments')) {
                $request->validate([
                    'supplier_payments' => 'array',
                    'supplier_payments.*.supplier_id' => 'nullable|exists:suppliers,id',
                    'supplier_payments.*.supplier_name' => 'required|string',
                    'supplier_payments.*.total_amount' => 'required|numeric|min:0',
                    'supplier_payments.*.paid_amount' => 'required|numeric|min:0',
                ]);
            }

            // Mark purchase as received (this will update inventory)
            if (!$purchase->markAsReceived()) {
                throw new \Exception('Failed to update purchase status and inventory');
            }

            // Create supplier payment records if provided (separate transaction)
            if ($request->has('supplier_payments')) {
                DB::beginTransaction();
                try {
                    foreach ($request->supplier_payments as $paymentData) {
                        $paidAmount = (float) $paymentData['paid_amount'];
                        $totalAmount = (float) $paymentData['total_amount'];
                        $remainingAmount = $totalAmount - $paidAmount;

                        // Determine payment status
                        $paymentStatus = 'debt';
                        if ($paidAmount >= $totalAmount) {
                            $paymentStatus = 'paid';
                        } elseif ($paidAmount > 0) {
                            $paymentStatus = 'partial';
                        }

                        SupplierPayment::create([
                            'purchase_id' => $purchase->id,
                            'supplier_id' => $paymentData['supplier_id'] ?? null,
                            'supplier_name' => $paymentData['supplier_name'],
                            'total_amount' => $totalAmount,
                            'paid_amount' => $paidAmount,
                            'remaining_amount' => $remainingAmount,
                            'payment_status' => $paymentStatus,
                            'notes' => 'Payment recorded during purchase receiving',
                        ]);
                    }
                    DB::commit();
                } catch (\Exception $e) {
                    DB::rollback();
                    throw $e;
                }
            }

            Cache::forget('inventory:index:v2:all');
            Cache::forget('inventory:index:all');
            Cache::forget('inventory:comprehensive_stats');

            return response()->json([
                'success' => true,
                'message' => 'Purchase received successfully. Inventory updated and payments recorded.',
                'data' => $purchase->load(['items', 'supplierPayments'])
            ]);

        } catch (\Exception $e) {
            \Log::error('Failed to receive purchase:', [
                'purchase_id' => $purchase->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to receive purchase',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete all purchases with password verification.
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
                $purchaseCount = Purchase::count();
                
                // Delete all purchase items first (foreign key constraint)
                PurchaseItem::truncate();
                
                // Delete all purchases
                Purchase::truncate();

                DB::commit();

                Log::info("All purchases deleted by user: " . (auth()->user()?->full_name ?? 'Unknown'));

                return response()->json([
                    'success' => true,
                    'message' => "Successfully deleted {$purchaseCount} purchase(s)",
                    'deleted_count' => $purchaseCount
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('Failed to delete all purchases: ' . $e->getMessage());
                throw $e;
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete purchases: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get purchase history summary for a single product (for "going in" tracking).
     */
    public function purchaseHistoryByProduct(Request $request): JsonResponse
    {
        $productId = $request->get('product_id');
        $productType = $request->get('product_type');

        if (!$productId || !$productType) {
            return response()->json([
                'success' => false,
                'message' => 'product_id and product_type are required',
            ], 422);
        }

        if (!in_array($productType, ['product', 'scale_product'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'product_type must be product or scale_product',
            ], 422);
        }

        try {
            $baseQuery = PurchaseItem::query()
                ->where('product_id', (int) $productId)
                ->where('product_type', $productType)
                ->join('purchases', 'purchase_items.purchase_id', '=', 'purchases.id');

            $total = (clone $baseQuery)->sum('purchase_items.quantity');
            $firstDate = (clone $baseQuery)->min('purchase_items.created_at');
            $lastDate = (clone $baseQuery)->max('purchase_items.created_at');

            $now = Carbon::now();
            $startOfMonth = $now->copy()->startOfMonth();
            $quantityThisMonth = (clone $baseQuery)
                ->where('purchase_items.created_at', '>=', $startOfMonth)
                ->sum('purchase_items.quantity');

            return response()->json([
                'success' => true,
                'data' => [
                    'total_quantity_in' => (int) $total,
                    'quantity_this_month' => (int) $quantityThisMonth,
                    'first_purchase_date' => $firstDate ? Carbon::parse($firstDate)->toIso8601String() : null,
                    'last_purchase_date' => $lastDate ? Carbon::parse($lastDate)->toIso8601String() : null,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get purchase history: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Resolve date range from request
     */
    private function resolveDateRange(Request $request): ?array
    {
        $dateFrom = $request->get('date_from');
        $dateTo = $request->get('date_to');
        $userTimezone = $request->get('timezone', 'UTC');

        if (!$dateFrom && !$dateTo) {
            return null;
        }

        try {
            $start = $dateFrom 
                ? Carbon::parse($dateFrom, $userTimezone)->startOfDay()
                : Carbon::createFromTimestamp(0, $userTimezone);
            
            $end = $dateTo 
                ? Carbon::parse($dateTo, $userTimezone)->endOfDay()
                : Carbon::now($userTimezone);

            return [$start, $end];
        } catch (\Exception $e) {
            Log::warning('Invalid date range in purchase report', [
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
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
     * Get purchase report data (one row per item) - separate from regular purchase endpoint
     */
    public function report(Request $request): JsonResponse
    {
        try {
            $perPage = max(1, min((int) $request->get('per_page', 10), 100));
            $page = max(1, (int) $request->get('page', 1));

            // Optimized query for large datasets - use joins instead of eager loading
            $query = PurchaseItem::query()
                ->select([
                    'purchase_items.id',
                    'purchase_items.purchase_id',
                    'purchase_items.product_id',
                    'purchase_items.product_type',
                    'purchase_items.product_name',
                    'purchase_items.identifier',
                    'purchase_items.cost_price',
                    'purchase_items.sell_price',
                    'purchase_items.quantity',
                    'purchase_items.total_cost',
                    'purchase_items.profit_margin',
                    'purchase_items.supplier_id',
                    'purchase_items.supplier_name',
                ])
                ->join('purchases', 'purchase_items.purchase_id', '=', 'purchases.id')
                ->leftJoin('products', function ($join) {
                    $join->on('purchase_items.product_id', '=', 'products.id')
                        ->where('purchase_items.product_type', '=', 'product');
                })
                ->leftJoin('scale_products', function ($join) {
                    $join->on('purchase_items.product_id', '=', 'scale_products.id')
                        ->where('purchase_items.product_type', '=', 'scale_product');
                })
                ->leftJoin('categories', function ($join) {
                    $join->on(function ($q) {
                        $q->whereColumn('products.category_id', 'categories.id')
                            ->orWhereColumn('scale_products.category_id', 'categories.id');
                    });
                })
                ->selectRaw('purchases.invoice_name')
                ->selectRaw('purchases.invoice_id')
                ->selectRaw('purchases.status')
                ->selectRaw('purchases.created_at as purchase_created_at')
                ->selectRaw('COALESCE(categories.name, NULL) as category_name')
                ->where('purchases.status', 'receive');

            // Apply product type filter
            $productType = $request->get('product_type');
            if ($productType && $productType !== 'all') {
                if ($productType === 'scale') {
                    $query->where('purchase_items.product_type', 'scale_product');
                } elseif ($productType === 'normal') {
                    $query->where('purchase_items.product_type', 'product');
                }
            }

            // Apply supplier filter
            if ($request->filled('supplier')) {
                $query->where('purchase_items.supplier_name', $request->get('supplier'));
            }

            // Apply barcode / identifier filter (exact match)
            if ($request->filled('barcode')) {
                $query->where('purchase_items.identifier', trim($request->get('barcode')));
            }

            // Apply price range filters
            if ($request->filled('price_from') || $request->filled('price_min')) {
                $priceMin = $request->get('price_from') ?? $request->get('price_min');
                $query->where('purchase_items.total_cost', '>=', (float) $priceMin);
            }
            if ($request->filled('price_to') || $request->filled('price_max')) {
                $priceMax = $request->get('price_to') ?? $request->get('price_max');
                $query->where('purchase_items.total_cost', '<=', (float) $priceMax);
            }

            // Apply date range filter
            if ($dateRange = $this->resolveDateRange($request)) {
                $query->whereBetween('purchases.created_at', $dateRange);
            }

            // Apply time range filter
            if ($request->filled('time_from') || $request->filled('time_to')) {
                $userTimezone = $request->get('timezone', 'UTC');
                $timeFrom = $request->get('time_from');
                $timeTo = $request->get('time_to');

                if ($timeFrom || $timeTo) {
                    $query->where(function ($timeQuery) use ($timeFrom, $timeTo, $userTimezone) {
                        if ($timeFrom) {
                            $this->applyTimeComparison($timeQuery, 'purchases.created_at', '>=', $timeFrom, $userTimezone);
                        }
                        if ($timeTo) {
                            $this->applyTimeComparison($timeQuery, 'purchases.created_at', '<=', $timeTo, $userTimezone);
                        }
                    });
                }
            }

            // Sorting - optimize for large datasets with column mapping
            $sortBy = $request->get('sort_by', 'purchases.created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            
            // Map frontend column names to database columns
            $sortColumnMap = [
                'product_name' => 'purchase_items.product_name',
                'product_type' => 'purchase_items.product_type',
                'identifier' => 'purchase_items.identifier',
                'category' => 'categories.name',
                'supplier_name' => 'purchase_items.supplier_name',
                'quantity' => 'purchase_items.quantity',
                'cost_price' => 'purchase_items.cost_price',
                'sell_price' => 'purchase_items.sell_price',
                'total_cost' => 'purchase_items.total_cost',
                'profit_margin' => 'purchase_items.profit_margin',
                'invoice_id' => 'purchases.invoice_id',
                'invoice_name' => 'purchases.invoice_name',
                'created_at' => 'purchases.created_at',
            ];
            
            $dbSortColumn = $sortColumnMap[$sortBy] ?? 'purchases.created_at';
            
            // Optimize sorting for large datasets
            if ($dbSortColumn === 'purchases.created_at') {
                $query->orderBy('purchases.created_at', $sortOrder)
                    ->orderBy('purchase_items.id', 'asc'); // Secondary sort for consistency
            } else {
                $query->orderBy($dbSortColumn, $sortOrder)
                    ->orderBy('purchases.created_at', 'desc') // Secondary sort for consistency
                    ->orderBy('purchase_items.id', 'asc'); // Tertiary sort for consistency
            }

            $paginator = $query->paginate($perPage, ['*'], 'page', $page);

            $transformedData = [];

            foreach ($paginator->items() as $item) {
                $purchase = $item->purchase;

                $transformedData[] = [
                    'id' => $item->id . '-' . $item->purchase_id,
                    'purchase_id' => $item->purchase_id,
                    'invoice_id' => $purchase->invoice_id,
                    'invoice_name' => $purchase->invoice_name,
                    'status' => $purchase->status,
                    'supplier_name' => $item->supplier_name,
                    'product_name' => $item->product_name,
                    'product_type' => $item->product_type,
                    'identifier' => $item->identifier ?? '',
                    'quantity' => (float) $item->quantity,
                    'cost_price' => (float) $item->cost_price,
                    'sell_price' => (float) $item->sell_price,
                    'total_cost' => (float) $item->total_cost,
                    'profit_margin' => (float) $item->profit_margin,
                    'created_at' => $purchase->created_at,
                    'updated_at' => $item->updated_at,
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
            Log::error('Failed to fetch purchase report', [
                'message' => $e->getMessage(),
                'trace' => substr($e->getTraceAsString(), 0, 500),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch purchase report: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get purchase report statistics (filtered based on request filters)
     */
    public function reportStatistics(Request $request): JsonResponse
    {
        try {
            $stats = (function () use ($request) {
                // Build the same query as report endpoint but for statistics
                $query = PurchaseItem::query()
                    ->join('purchases', 'purchase_items.purchase_id', '=', 'purchases.id')
                    ->leftJoin('products', function ($join) {
                        $join->on('purchase_items.product_id', '=', 'products.id')
                            ->where('purchase_items.product_type', '=', 'product');
                    })
                    ->leftJoin('scale_products', function ($join) {
                        $join->on('purchase_items.product_id', '=', 'scale_products.id')
                            ->where('purchase_items.product_type', '=', 'scale_product');
                    })
                    ->leftJoin('categories', function ($join) {
                        $join->on(function ($q) {
                            $q->whereColumn('products.category_id', 'categories.id')
                                ->orWhereColumn('scale_products.category_id', 'categories.id');
                        });
                    })
                    ->where('purchases.status', 'receive');

                // Apply product type filter
                $productType = $request->get('product_type');
                if ($productType && $productType !== 'all') {
                    if ($productType === 'scale') {
                        $query->where('purchase_items.product_type', 'scale_product');
                    } elseif ($productType === 'normal') {
                        $query->where('purchase_items.product_type', 'product');
                    }
                }

                // Apply category filter - optimized with join
                if ($request->filled('category')) {
                    $categoryFilter = $request->get('category');
                    $query->where('categories.name', $categoryFilter);
                }

                // Apply supplier filter
                if ($request->filled('supplier')) {
                    $query->where('purchase_items.supplier_name', $request->get('supplier'));
                }

                // Apply barcode / identifier filter
                if ($request->filled('barcode')) {
                    $query->where('purchase_items.identifier', trim($request->get('barcode')));
                }

                // Apply price range filters
                if ($request->filled('price_from') || $request->filled('price_min')) {
                    $priceMin = $request->get('price_from') ?? $request->get('price_min');
                    $query->where('purchase_items.total_cost', '>=', (float) $priceMin);
                }
                if ($request->filled('price_to') || $request->filled('price_max')) {
                    $priceMax = $request->get('price_to') ?? $request->get('price_max');
                    $query->where('purchase_items.total_cost', '<=', (float) $priceMax);
                }

                // Apply date range filter
                if ($dateRange = $this->resolveDateRange($request)) {
                    $query->whereBetween('purchases.created_at', $dateRange);
                }

                // Apply time range filter
                if ($request->filled('time_from') || $request->filled('time_to')) {
                    $userTimezone = $request->get('timezone', 'UTC');
                    $timeFrom = $request->get('time_from');
                    $timeTo = $request->get('time_to');

                    if ($timeFrom || $timeTo) {
                        $query->where(function ($timeQuery) use ($timeFrom, $timeTo, $userTimezone) {
                            if ($timeFrom) {
                                $this->applyTimeComparison($timeQuery, 'purchases.created_at', '>=', $timeFrom, $userTimezone);
                            }
                            if ($timeTo) {
                                $this->applyTimeComparison($timeQuery, 'purchases.created_at', '<=', $timeTo, $userTimezone);
                            }
                        });
                    }
                }

                $stats = (clone $query)
                    ->selectRaw('
                        COUNT(DISTINCT purchase_items.purchase_id) as total_purchases,
                        COUNT(purchase_items.id) as total_items,
                        COALESCE(SUM(purchase_items.quantity), 0) as total_quantity,
                        COALESCE(SUM(purchase_items.total_cost), 0) as total_amount
                    ')
                    ->first();

                return [
                    'total_purchases' => (int) ($stats->total_purchases ?? 0),
                    'total_items' => (int) ($stats->total_items ?? 0),
                    'total_quantity' => (float) ($stats->total_quantity ?? 0),
                    'total_amount' => (float) ($stats->total_amount ?? 0),
                ];
            })();

            return response()->json([
                'success' => true,
                'data' => $stats,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch purchase report statistics', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch purchase report statistics: ' . $e->getMessage(),
                'data' => [
                    'total_purchases' => 0,
                    'total_items' => 0,
                    'total_quantity' => 0,
                    'total_amount' => 0,
                ],
            ], 500);
        }
    }

    /**
     * Get all purchase report data for export
     */
    public function reportExport(Request $request): JsonResponse
    {
        try {
            $query = PurchaseItem::query()
                ->select([
                    'purchase_items.id',
                    'purchase_items.purchase_id',
                    'purchase_items.product_id',
                    'purchase_items.product_type',
                    'purchase_items.product_name',
                    'purchase_items.identifier',
                    'purchase_items.cost_price',
                    'purchase_items.sell_price',
                    'purchase_items.quantity',
                    'purchase_items.total_cost',
                    'purchase_items.profit_margin',
                    'purchase_items.supplier_id',
                    'purchase_items.supplier_name',
                    'purchase_items.created_at',
                ])
                ->join('purchases', 'purchase_items.purchase_id', '=', 'purchases.id')
                ->selectRaw('purchases.invoice_name')
                ->selectRaw('purchases.invoice_id')
                ->selectRaw('purchases.status')
                ->selectRaw('purchases.created_at as purchase_created_at')
                ->with([
                    'purchase' => function ($purchaseQuery) {
                        $purchaseQuery->select([
                            'id',
                            'invoice_name',
                            'invoice_id',
                            'status',
                            'created_at',
                        ]);
                    },
                ])
                ->where('purchases.status', 'receive');

            // Apply filters (same as report endpoint)
            $productType = $request->get('product_type');
            if ($productType && $productType !== 'all') {
                if ($productType === 'scale') {
                    $query->where('purchase_items.product_type', 'scale_product');
                } elseif ($productType === 'normal') {
                    $query->where('purchase_items.product_type', 'product');
                }
            }

            // Apply category filter
            if ($request->filled('category')) {
                $categoryFilter = $request->get('category');
                $query->where(function ($categoryQuery) use ($categoryFilter) {
                    $categoryQuery->where('products.category_id', function ($subQuery) use ($categoryFilter) {
                        $subQuery->select('id')
                            ->from('categories')
                            ->where('name', $categoryFilter)
                            ->limit(1);
                    })
                    ->orWhere('scale_products.category_id', function ($subQuery) use ($categoryFilter) {
                        $subQuery->select('id')
                            ->from('categories')
                            ->where('name', $categoryFilter)
                            ->limit(1);
                    });
                });
            }

            if ($request->filled('supplier')) {
                $query->where('purchase_items.supplier_name', $request->get('supplier'));
            }

            if ($request->filled('barcode')) {
                $query->where('purchase_items.identifier', trim($request->get('barcode')));
            }

            if ($request->filled('price_from') || $request->filled('price_min')) {
                $priceMin = $request->get('price_from') ?? $request->get('price_min');
                $query->where('purchase_items.total_cost', '>=', (float) $priceMin);
            }
            if ($request->filled('price_to') || $request->filled('price_max')) {
                $priceMax = $request->get('price_to') ?? $request->get('price_max');
                $query->where('purchase_items.total_cost', '<=', (float) $priceMax);
            }

            if ($dateRange = $this->resolveDateRange($request)) {
                $query->whereBetween('purchases.created_at', $dateRange);
            }

            if ($request->filled('time_from') || $request->filled('time_to')) {
                $userTimezone = $request->get('timezone', 'UTC');
                $timeFrom = $request->get('time_from');
                $timeTo = $request->get('time_to');

                if ($timeFrom || $timeTo) {
                    $query->where(function ($timeQuery) use ($timeFrom, $timeTo, $userTimezone) {
                        if ($timeFrom) {
                            $this->applyTimeComparison($timeQuery, 'purchases.created_at', '>=', $timeFrom, $userTimezone);
                        }
                        if ($timeTo) {
                            $this->applyTimeComparison($timeQuery, 'purchases.created_at', '<=', $timeTo, $userTimezone);
                        }
                    });
                }
            }

            $items = $query->get();
            $data = [];

            foreach ($items as $item) {
                $purchase = $item->purchase;

                $data[] = [
                    'id' => $item->id . '-' . $item->purchase_id,
                    'purchase_id' => $item->purchase_id,
                    'invoice_id' => $purchase->invoice_id,
                    'invoice_name' => $purchase->invoice_name,
                    'status' => $purchase->status,
                    'supplier_name' => $item->supplier_name,
                    'product_name' => $item->product_name,
                    'product_type' => $item->product_type,
                    'identifier' => $item->identifier ?? '',
                    'quantity' => (float) $item->quantity,
                    'cost_price' => (float) $item->cost_price,
                    'sell_price' => (float) $item->sell_price,
                    'total_cost' => (float) $item->total_cost,
                    'profit_margin' => (float) $item->profit_margin,
                    'created_at' => $purchase->created_at,
                    'updated_at' => $item->updated_at,
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to export purchase report', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to export purchase report: ' . $e->getMessage(),
            ], 500);
        }
    }
}
