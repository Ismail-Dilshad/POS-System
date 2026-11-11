<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ReturnRecord;
use App\Models\ReturnItem;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\Product;
use App\Models\ScaleProduct;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redis;
use Carbon\Carbon;

class ReturnController extends Controller
{
    private const RETURN_LIST_CACHE_PREFIX = 'returns:list:';
    private const RETURN_SEARCH_CACHE_PREFIX = 'returns:search:';
    private const RETURN_STATS_CACHE_PREFIX = 'returns:stats:';
    private const RETURN_EXPORT_CACHE_PREFIX = 'returns:export:';
    
    private const CACHE_TTL_LIST = 300;
    private const CACHE_TTL_SEARCH = 180;
    private const CACHE_TTL_STATS = 600;
    private const CACHE_TTL_EXPORT = 600;

    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = max(1, min((int) $request->get('per_page', 10), 100));
            $loadItems = $request->get('include_items', false);

            $query = ReturnRecord::query()
                ->select([
                    'id',
                    'return_code',
                    'return_type',
                    'original_transaction_id',
                    'original_transaction_number',
                    'total_return_amount',
                    'processed_by_user_id',
                    'created_at',
                    'updated_at',
                ])
                // Add items_count as a subquery for efficient counting without loading all items
                ->withCount('items')
                ->with([
                    'processedBy:id,full_name,username',
                ]);

            if ($loadItems) {
                $query->with([
                    'items' => function ($itemQuery) {
                        $itemQuery->select([
                            'id',
                            'return_id',
                            'product_id',
                            'product_name',
                            'product_barcode',
                            'quantity',
                            'return_total',
                            'original_price',
                        ])->orderBy('id');
                    },
                ]);
            }

            if ($request->filled('search') || $request->filled('return_id')) {
                $search = $request->get('search') ?? $request->get('return_id');
                $query->where(function ($q) use ($search) {
                    $q->where('return_code', 'like', "{$search}%")
                        ->orWhere('original_transaction_number', 'like', "{$search}%");
                });
            }

            if ($dateRange = $this->resolveDateRange($request)) {
                $query->whereBetween('created_at', $dateRange);
            }

            if ($request->filled('return_type') && $request->get('return_type') !== 'all') {
                $query->where('return_type', $request->get('return_type'));
            }

            if ($request->filled('amount_min') || $request->filled('amountMin')) {
                $amountMin = $request->get('amount_min') ?? $request->get('amountMin');
                $query->where('total_return_amount', '>=', (float) $amountMin);
            }

            if ($request->filled('amount_max') || $request->filled('amountMax')) {
                $amountMax = $request->get('amount_max') ?? $request->get('amountMax');
                $query->where('total_return_amount', '<=', (float) $amountMax);
                }

            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            
            $allowedSortColumns = ['id', 'return_code', 'total_return_amount', 'created_at', 'updated_at'];
            if (!in_array($sortBy, $allowedSortColumns)) {
                $sortBy = 'created_at';
                }

            $sortOrder = strtolower($sortOrder) === 'asc' ? 'asc' : 'desc';
            $query->orderBy($sortBy, $sortOrder);

            $hasSearch = $request->filled('search') || $request->filled('return_id');
            $cacheKey = ($hasSearch ? self::RETURN_SEARCH_CACHE_PREFIX : self::RETURN_LIST_CACHE_PREFIX) 
                . md5(serialize([
                    'page' => $request->get('page', 1),
                    'per_page' => $perPage,
                    'load_items' => $loadItems,
                    'search' => $request->get('search') ?? $request->get('return_id'),
                    'date_range' => $dateRange,
                    'return_type' => $request->get('return_type'),
                    'amount_min' => $request->get('amount_min') ?? $request->get('amountMin'),
                    'amount_max' => $request->get('amount_max') ?? $request->get('amountMax'),
                    'sort_by' => $sortBy,
                    'sort_order' => $sortOrder,
                ]));

            $cacheTime = $hasSearch ? self::CACHE_TTL_SEARCH : self::CACHE_TTL_LIST;
            
            try {
                $returns = Cache::store('redis')->remember($cacheKey, $cacheTime, function () use ($query, $perPage) {
                    return $query->paginate($perPage);
                });
            } catch (\Exception $e) {
                Log::warning('Redis cache failed for return list, using default cache store', [
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
            Log::error('Failed to fetch returns', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch returns'
            ], 500);
        }
    }

    /**
     * Get all returns with filters (for exports)
     */
    public function getAll(Request $request): JsonResponse
    {
        try {
            $exportMode = $request->get('export', false);
            
            if ($exportMode) {
                $query = ReturnRecord::query()
                    ->select([
                        'id',
                        'return_code',
                        'return_type',
                        'original_transaction_id',
                        'original_transaction_number',
                        'total_return_amount',
                        'processed_by_user_id',
                        'created_at',
                        'updated_at',
                    ])
                    ->with([
                        'processedBy:id,full_name,username',
                        'items' => function ($itemQuery) {
                            $itemQuery->select([
                                'id',
                                'return_id',
                                'product_id',
                                'product_name',
                                'product_barcode',
                                'quantity',
                                'return_total',
                                'original_price',
                            ])->orderBy('id');
                        },
                    ]);

                if ($request->filled('search') || $request->filled('return_id')) {
                    $search = $request->get('search') ?? $request->get('return_id');
                    $query->where(function ($q) use ($search) {
                        $q->where('return_code', 'like', "{$search}%")
                            ->orWhere('original_transaction_number', 'like', "{$search}%");
                    });
                }

                if ($dateRange = $this->resolveDateRange($request)) {
                    $query->whereBetween('created_at', $dateRange);
                }

                if ($request->filled('return_type') && $request->get('return_type') !== 'all') {
                    $query->where('return_type', $request->get('return_type'));
                }

                if ($request->filled('amount_min') || $request->filled('amountMin')) {
                    $amountMin = $request->get('amount_min') ?? $request->get('amountMin');
                    $query->where('total_return_amount', '>=', (float) $amountMin);
                }

                if ($request->filled('amount_max') || $request->filled('amountMax')) {
                    $amountMax = $request->get('amount_max') ?? $request->get('amountMax');
                    $query->where('total_return_amount', '<=', (float) $amountMax);
                }

                $sortBy = $request->get('sort_by', 'created_at');
                $sortOrder = $request->get('sort_order', 'desc');
                $allowedSortColumns = ['id', 'return_code', 'total_return_amount', 'created_at', 'updated_at'];
                if (!in_array($sortBy, $allowedSortColumns)) {
                    $sortBy = 'created_at';
                }
                $sortOrder = strtolower($sortOrder) === 'asc' ? 'asc' : 'desc';
                $query->orderBy($sortBy, $sortOrder);

                $exportCacheKey = self::RETURN_EXPORT_CACHE_PREFIX . md5(serialize([
                    'filters' => [
                        'search' => $request->get('search') ?? $request->get('return_id'),
                        'date_range' => $dateRange,
                        'return_type' => $request->get('return_type'),
                        'amount_min' => $request->get('amount_min') ?? $request->get('amountMin'),
                        'amount_max' => $request->get('amount_max') ?? $request->get('amountMax'),
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
                    Log::warning('Redis cache failed for return export, using default cache store', [
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

            $limit = 500; // Reduced from 10000 for better performance
            $cursor = $request->get('cursor');

            $query = ReturnRecord::query()
                ->select([
                    'id',
                    'return_code',
                    'return_type',
                    'original_transaction_id',
                    'original_transaction_number',
                    'total_return_amount',
                    'processed_by_user_id',
                    'created_at',
                    'updated_at',
                ])
                ->with([
                    'processedBy:id,full_name,username',
                    'items' => function ($itemQuery) {
                        $itemQuery->select([
                            'id',
                            'return_id',
                            'product_id',
                            'product_name',
                            'product_barcode',
                            'quantity',
                            'return_total',
                            'original_price',
                        ])->orderBy('id');
                    },
                ])
                ->orderByDesc('id');

            if ($cursor) {
                $query->where('id', '<', $cursor);
            }

            if ($request->filled('search') || $request->filled('return_id')) {
                $search = $request->get('search') ?? $request->get('return_id');
                $query->where(function ($q) use ($search) {
                    $q->where('return_code', 'LIKE', "%{$search}%")
                        ->orWhere('original_transaction_number', 'LIKE', "%{$search}%");
                });
            }

            if ($dateRange = $this->resolveDateRange($request)) {
                $query->whereBetween('created_at', $dateRange);
            }

            if ($request->filled('return_type') && $request->get('return_type') !== 'all') {
                $query->where('return_type', $request->get('return_type'));
            }

            if ($request->filled('amount_min') || $request->filled('amountMin')) {
                $amountMin = $request->get('amount_min') ?? $request->get('amountMin');
                $query->where('total_return_amount', '>=', (float) $amountMin);
            }

            if ($request->filled('amount_max') || $request->filled('amountMax')) {
                $amountMax = $request->get('amount_max') ?? $request->get('amountMax');
                $query->where('total_return_amount', '<=', (float) $amountMax);
            }

            $returns = $query->limit($limit + 1)->get();
            $hasMore = $returns->count() > $limit;

            if ($hasMore) {
                $returns = $returns->take($limit);
            }

            $nextCursor = $returns->isNotEmpty() ? $returns->last()->id : null;

            return response()->json([
                'success' => true,
                'data' => $returns,
                'cursor' => $nextCursor,
                'has_more' => $hasMore,
                'count' => $returns->count(),
                'message' => 'All returns retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve all returns: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get available return quantity for a product
     */
    private function getAvailableReturnQuantity(int $productId): int
    {
        // Get total sold quantity from all transactions
        $totalSold = TransactionItem::where('product_id', $productId)
            ->whereHas('transaction', function ($query) {
                $query->where('status', 'completed');
            })
            ->sum('quantity');

        // Get total already returned quantity
        $totalReturned = ReturnItem::where('product_id', $productId)->sum('quantity');

        // Calculate available for return
        return max(0, $totalSold - $totalReturned);
    }

    /**
     * Process manual return with locking to prevent race conditions
     */
    private function processManualReturnWithLocking($transactions, array $item, &$transactionsProcessed, &$transactionsDeleted): bool
    {
        $remainingReturnQuantity = $item['return_quantity'];

        // Process returns starting from the most recent transactions first
        foreach ($transactions as $transaction) {
            if ($remainingReturnQuantity <= 0) break;

            $transactionItem = $transaction->items->first();
            if (!$transactionItem) continue;

            // Calculate how much we can return from this transaction
            $availableQuantity = $transactionItem->quantity;
            $quantityToReturn = min($remainingReturnQuantity, $availableQuantity);

            if ($quantityToReturn > 0) {
                // Get product to include barcode for proper matching
                $product = Product::find($item['product_id']);

                // Process partial return for this transaction (starting with most recent)
                $returnItemData = [[
                    'product_id' => $item['product_id'],
                    'return_quantity' => $quantityToReturn,
                    'barcode' => $product ? $product->barcode : null
                ]];

                $wasDeleted = $transaction->processPartialReturn($returnItemData);
                $transactionsProcessed++;

                if ($wasDeleted) {
                    $transactionsDeleted++;
                    Log::info("Transaction {$transaction->transaction_number} (MOST RECENT) deleted - manual return processed");
                } else {
                    Log::info("Transaction {$transaction->transaction_number} (MOST RECENT) updated - manual return processed");
                }

                $remainingReturnQuantity -= $quantityToReturn;
                
                // Log the priority processing
                Log::info("Manual return: Processed {$quantityToReturn} qty from recent transaction {$transaction->transaction_number}, {$remainingReturnQuantity} qty remaining");
            }
        }

        if ($remainingReturnQuantity > 0) {
            Log::warning("Manual return: Could not process {$remainingReturnQuantity} units of product {$item['product_id']} - insufficient transaction history");
            return false;
        }

        return true;
    }

    /**
     * Validate receipt-based return
     */
    private function validateReceiptReturn(Transaction $transaction, array $returnItems): bool
    {
        // Check transaction status
        if ($transaction->status !== 'completed') {
            throw new \Exception("Only completed transactions can be returned");
        }

        // Check return period (30 days)
        $returnPeriod = config('returns.return_period_days', 30);
        $daysSincePurchase = now()->diffInDays($transaction->created_at);
        if ($daysSincePurchase > $returnPeriod) {
            throw new \Exception("Return period has expired. Only returns within {$returnPeriod} days are allowed");
        }

        // Check transaction ownership (if needed)
        if (auth()->check() && $transaction->user_id !== auth()->id()) {
            // Add ownership validation if required by business rules
            // For now, we'll allow any authenticated user to process returns
        }

        // Validate return items match transaction items
        foreach ($returnItems as $returnItem) {
            $transactionItem = $transaction->items()
                ->where('product_id', $returnItem['product_id'])
                ->first();
            
            if (!$transactionItem) {
                throw new \Exception("Product not found in original transaction");
            }

            if ($returnItem['return_quantity'] > $transactionItem->quantity) {
                throw new \Exception("Cannot return more than originally purchased");
            }
        }

        return true;
    }

    /**
     * Validate business rules for returns
     */
    private function validateBusinessRules(array $items): bool
    {
        foreach ($items as $item) {
            // Validate return pricing
            $product = Product::find($item['product_id']);
            if ($product && abs($item['original_price'] - $product->sell_price) > 1.00) {
                // Allow small price differences due to rounding, but flag large differences
                throw new \Exception("Return price does not match current product price for product {$product->name}");
            }
        }

        return true;
    }

    public function store(Request $request): JsonResponse
    {
        // Check authorization
        if (!auth()->check()) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required'
            ], 401);
        }

        $validator = Validator::make($request->all(), [
            'return_type' => 'required|in:receipt,manual',
            'original_transaction_id' => 'nullable|exists:transactions,id',
            'original_transaction_number' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.return_quantity' => 'required|integer|min:1',
            'items.*.return_total' => 'required|numeric|min:0',
            'items.*.original_price' => 'required|numeric|min:0',
            'processed_by_user_id' => 'required|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Validate return quantities against available quantities (only for receipt-based returns)
        if ($request->return_type === 'receipt') {
            foreach ($request->items as $item) {
                $availableQuantity = $this->getAvailableReturnQuantity($item['product_id']);
                if ($item['return_quantity'] > $availableQuantity) {
                    $product = Product::find($item['product_id']);
                    return response()->json([
                        'success' => false,
                        'message' => "Cannot return {$item['return_quantity']} units of {$product->name}. Only {$availableQuantity} units are available for return."
                    ], 422);
                }
            }
        }

        // Validate business rules
        try {
            $this->validateBusinessRules($request->items);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Calculate total return amount
            $totalReturnAmount = collect($request->items)->sum('return_total');

            // Create return record
            $returnRecord = ReturnRecord::create([
                'return_code' => ReturnRecord::generateReturnCode(),
                'return_type' => $request->return_type,
                'original_transaction_id' => $request->original_transaction_id,
                'original_transaction_number' => $request->original_transaction_number,
                'total_return_amount' => $totalReturnAmount,
                'processed_by_user_id' => $request->processed_by_user_id,
            ]);

            // Create return items
            foreach ($request->items as $item) {
                $product = Product::find($item['product_id']);

                if (!$product) {
                    throw new \Exception("Product not found: {$item['product_id']}");
                }

                // Add null safety checks
                $returnQuantity = $item['return_quantity'] ?? 0;
                $originalPrice = $item['original_price'] ?? 0;
                $returnTotal = $item['return_total'] ?? 0;

                // Validate required fields
                if ($returnQuantity <= 0) {
                    throw new \Exception("Invalid return quantity: {$returnQuantity}");
                }

                if ($originalPrice <= 0) {
                    throw new \Exception("Invalid original price: {$originalPrice}");
                }

                if ($returnTotal <= 0) {
                    throw new \Exception("Invalid return total: {$returnTotal}");
                }

                // Get product relationships safely
                $categoryName = '';
                $supplierName = '';
                
                try {
                    $categoryName = $product->category ? $product->category->name : '';
                } catch (\Exception $e) {
                    \Log::warning("Failed to get category for product {$product->id}: " . $e->getMessage());
                }

                try {
                    $supplierName = $product->supplier ? $product->supplier->name : '';
                } catch (\Exception $e) {
                    \Log::warning("Failed to get supplier for product {$product->id}: " . $e->getMessage());
                }

                ReturnItem::create([
                    'return_id' => $returnRecord->id,
                    'product_id' => $product->id,
                    'product_name' => $product->name ?? '',
                    'product_barcode' => $product->barcode ?? '',
                    'product_category' => $categoryName,
                    'product_supplier' => $supplierName,
                    'original_price' => $originalPrice,
                    'quantity' => $returnQuantity,
                    'return_total' => $returnTotal,
                    'stock_adjusted' => false,
                ]);
            }

            // Process inventory adjustments (ALWAYS adjust stock for returns)
            $user = User::find($request->processed_by_user_id);
            if ($user) {
                \Log::info("Processing inventory adjustments for return {$returnRecord->return_code}");
                $success = $returnRecord->processInventoryAdjustments($user);
                if (!$success) {
                    \Log::error("Failed to process inventory adjustments for return {$returnRecord->id}");
                    // Don't fail the return, but log the issue
                } else {
                    \Log::info("Successfully processed inventory adjustments for return {$returnRecord->return_code}");
                }
            } else {
                \Log::error("User not found for inventory adjustment: {$request->processed_by_user_id}");
            }

            // Process partial or full return for transactions (both receipt and manual)
            $transactionDeleted = false;
            $transactionsProcessed = 0;
            $transactionsDeleted = 0;

            if ($returnRecord->return_type === 'receipt' && $returnRecord->original_transaction_id) {
                // Receipt-based return: Process the specific transaction
                $originalTransaction = Transaction::find($returnRecord->original_transaction_id);
                if ($originalTransaction) {
                    // Validate receipt return
                    try {
                        $this->validateReceiptReturn($originalTransaction, $request->items);
                    } catch (\Exception $e) {
                        DB::rollBack();
                        return response()->json([
                            'success' => false,
                            'message' => $e->getMessage()
                        ], 422);
                    }
                    // Prepare return items data for transaction processing
                    $returnItemsData = [];
                    foreach ($request->items as $item) {
                        // Get product to include barcode for proper matching
                        $product = Product::find($item['product_id']);
                        $returnItemsData[] = [
                            'product_id' => $item['product_id'],
                            'return_quantity' => $item['return_quantity'],
                            'barcode' => $product ? $product->barcode : null
                        ];
                    }

                    // Process partial return (this will either update quantities or delete the transaction)
                    $wasDeleted = $originalTransaction->processPartialReturn($returnItemsData);
                    $transactionsProcessed = 1;

                    if ($wasDeleted) {
                        $transactionDeleted = true;
                        $transactionsDeleted = 1;
                        Log::info("Transaction {$originalTransaction->transaction_number} deleted - all items returned");
                    } else {
                        Log::info("Transaction {$originalTransaction->transaction_number} updated - partial return processed");
                    }
                }
            } elseif ($returnRecord->return_type === 'manual') {
                // Manual return: Find and process transactions for each returned product
                foreach ($request->items as $item) {
                    // Add retry logic for deadlocks
                    $maxRetries = 3;
                    $retryCount = 0;
                    $success = false;

                    do {
                        try {
                            // Find transactions that contain this product with locking (ordered by most recent first)
                            $transactions = Transaction::whereHas('items', function ($query) use ($item) {
                                $query->where('product_id', $item['product_id'])
                                      ->where('quantity', '>', 0); // Only transactions with available quantity
                            })
                            ->with(['items' => function ($query) use ($item) {
                                $query->where('product_id', $item['product_id']);
                            }])
                            ->lockForUpdate() // Add pessimistic locking to prevent race conditions
                            ->orderBy('created_at', 'desc') // Most recent transactions first
                            ->get();

                            $success = $this->processManualReturnWithLocking($transactions, $item, $transactionsProcessed, $transactionsDeleted);
                            break;
                        } catch (\Exception $e) {
                            if (str_contains($e->getMessage(), 'deadlock') && $retryCount < $maxRetries) {
                                $retryCount++;
                                usleep(100000); // Wait 100ms before retry
                                Log::info("Deadlock detected, retrying manual return for product {$item['product_id']} (attempt {$retryCount})");
                                continue;
                            }
                            throw $e;
                        }
                    } while ($retryCount < $maxRetries);

                    if (!$success) {
                        throw new \Exception("Failed to process manual return for product {$item['product_id']} after {$maxRetries} attempts");
                    }
                }

                $transactionDeleted = $transactionsDeleted > 0;
            }

            DB::commit();

            $this->invalidateReturnCaches();

            if ($transactionDeleted || $returnRecord->original_transaction_id) {
                $this->invalidateTransactionCaches();
            }

            $returnRecord->load(['processedBy', 'items.product']);

            $message = 'Return processed successfully';

            if ($returnRecord->return_type === 'receipt') {
                if ($transactionDeleted) {
                    $message .= '. Original transaction was fully returned and has been removed.';
                } elseif ($returnRecord->original_transaction_id) {
                    $message .= '. Original transaction quantities have been updated.';
                }
            } elseif ($returnRecord->return_type === 'manual' && $transactionsProcessed > 0) {
                if ($transactionsDeleted > 0) {
                    $message .= ". {$transactionsProcessed} transaction(s) processed, {$transactionsDeleted} transaction(s) fully returned and removed.";
                } else {
                    $message .= ". {$transactionsProcessed} transaction(s) updated with new quantities.";
                }
            }

            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => $returnRecord,
                'transaction_deleted' => $transactionDeleted,
                'original_transaction_id' => $returnRecord->original_transaction_id
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            // Log detailed error information
            Log::error('Return processing failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all(),
                'user_id' => auth()->id()
            ]);
            
            // Return user-friendly error message
            return response()->json([
                'success' => false,
                'message' => 'Failed to process return. Please try again or contact support.',
                'error_code' => 'RETURN_PROCESSING_FAILED'
            ], 500);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $returnRecord = ReturnRecord::with(['processedBy', 'items.product', 'originalTransaction'])
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $returnRecord
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Return not found'
            ], 404);
        }
    }

    public function processInventoryAdjustment($id): JsonResponse
    {
        // Check authorization
        if (!auth()->check()) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required'
            ], 401);
        }

        try {
            $returnRecord = ReturnRecord::findOrFail($id);
            $user = auth()->user();

            if ($returnRecord->isInventoryFullyAdjusted()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Inventory has already been adjusted for this return'
                ], 400);
            }

            $success = $returnRecord->processInventoryAdjustments($user);

            if ($success) {
                return response()->json([
                    'success' => true,
                    'message' => 'Inventory adjustments processed successfully'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to process inventory adjustments'
                ], 500);
            }
        } catch (\Exception $e) {
            Log::error('Failed to process inventory adjustment: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to process inventory adjustment'
            ], 500);
        }
    }

    public function getStatistics(Request $request): JsonResponse
    {
        try {
            $cacheKey = self::RETURN_STATS_CACHE_PREFIX . md5(serialize([
                'filters' => $request->except(['page', 'per_page', 'cache_bust'])
            ]));

            $cacheTime = self::CACHE_TTL_STATS;
            
            if ($request->has('cache_bust')) {
                Cache::forget($cacheKey);
            }

            try {
                $statistics = Cache::store('redis')->remember($cacheKey, $cacheTime, function () use ($request) {
            $dateFrom = $request->get('date_from');
            $dateTo = $request->get('date_to');
            $timeFrom = $request->get('time_from');
            $timeTo = $request->get('time_to');
            $userTimezone = $request->get('timezone', 'UTC');
                    return ReturnRecord::getStatistics($dateFrom, $dateTo, $timeFrom, $timeTo, $userTimezone);
                });
            } catch (\Exception $e) {
                Log::warning('Redis cache failed for return statistics, using default cache store', [
                    'error' => $e->getMessage()
                ]);
                $dateFrom = $request->get('date_from');
                $dateTo = $request->get('date_to');
                $timeFrom = $request->get('time_from');
                $timeTo = $request->get('time_to');
                $userTimezone = $request->get('timezone', 'UTC');
                $statistics = Cache::remember($cacheKey, $cacheTime, function () use ($dateFrom, $dateTo, $timeFrom, $timeTo, $userTimezone) {
                    return ReturnRecord::getStatistics($dateFrom, $dateTo, $timeFrom, $timeTo, $userTimezone);
                });
            }

            return response()->json([
                'success' => true,
                'data' => $statistics
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get return statistics', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to get return statistics'
            ], 500);
        }
    }

    /**
     * Cancel a return
     */
    public function cancelReturn($id): JsonResponse
    {
        // Check authorization
        if (!auth()->check()) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required'
            ], 401);
        }

        try {
            $returnRecord = ReturnRecord::findOrFail($id);
            
            // Check if return can be cancelled (not older than 24 hours)
            $hoursSinceCreated = now()->diffInHours($returnRecord->created_at);
            if ($hoursSinceCreated > 24) {
                return response()->json([
                    'success' => false,
                    'message' => 'Returns can only be cancelled within 24 hours of creation'
                ], 422);
            }

            DB::beginTransaction();

            // Reverse inventory adjustments if they were made
            if ($returnRecord->isInventoryFullyAdjusted()) {
                foreach ($returnRecord->items as $item) {
                    $item->reverseInventoryAdjustment(auth()->user());
                }
            }

            // Delete the return record
            $returnRecord->delete();

            DB::commit();

            $this->invalidateReturnCaches();

            return response()->json([
                'success' => true,
                'message' => 'Return cancelled successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to cancel return: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel return'
            ], 500);
        }
    }

    /**
     * Bulk process returns
     */
    public function bulkProcess(Request $request): JsonResponse
    {
        // Check authorization
        if (!auth()->check()) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required'
            ], 401);
        }

        $validator = Validator::make($request->all(), [
            'return_ids' => 'required|array|min:1',
            'return_ids.*' => 'exists:returns,id',
            'action' => 'required|in:adjust_inventory,cancel,export'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $returnIds = $request->return_ids;
            $action = $request->action;
            $results = [];

            DB::beginTransaction();

            foreach ($returnIds as $returnId) {
                $returnRecord = ReturnRecord::findOrFail($returnId);
                
                switch ($action) {
                    case 'adjust_inventory':
                        if (!$returnRecord->isInventoryFullyAdjusted()) {
                            $success = $returnRecord->processInventoryAdjustments(auth()->user());
                            $results[] = [
                                'return_id' => $returnId,
                                'success' => $success,
                                'message' => $success ? 'Inventory adjusted' : 'Failed to adjust inventory'
                            ];
                        } else {
                            $results[] = [
                                'return_id' => $returnId,
                                'success' => true,
                                'message' => 'Inventory already adjusted'
                            ];
                        }
                        break;
                        
                    case 'cancel':
                        $hoursSinceCreated = now()->diffInHours($returnRecord->created_at);
                        if ($hoursSinceCreated <= 24) {
                            // Reverse inventory adjustments if made
                            if ($returnRecord->isInventoryFullyAdjusted()) {
                                foreach ($returnRecord->items as $item) {
                                    $item->reverseInventoryAdjustment(auth()->user());
                                }
                            }
                            $returnRecord->delete();
                            $results[] = [
                                'return_id' => $returnId,
                                'success' => true,
                                'message' => 'Return cancelled'
                            ];
                        } else {
                            $results[] = [
                                'return_id' => $returnId,
                                'success' => false,
                                'message' => 'Cannot cancel return older than 24 hours'
                            ];
                        }
                        break;
                }
            }

            DB::commit();

            $this->invalidateReturnCaches();

            return response()->json([
                'success' => true,
                'message' => 'Bulk operation completed',
                'results' => $results
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Bulk return processing failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Bulk operation failed'
            ], 500);
        }
    }

    /**
     * Get return analytics
     */
    public function getAnalytics(Request $request): JsonResponse
    {
        try {
            $dateFrom = $request->get('date_from');
            $dateTo = $request->get('date_to');
            $userTimezone = $request->get('timezone', 'UTC');
            
            $query = ReturnRecord::query();
            
            if ($dateFrom && $dateTo) {
                $query->dateRange($dateFrom, $dateTo, $userTimezone);
            }

            $statsQuery = clone $query;
            $totalReturns = $statsQuery->count();
            $totalAmount = $statsQuery->sum('total_return_amount');
            $averageReturn = $totalReturns > 0 ? $totalAmount / $totalReturns : 0;

            $receiptQuery = clone $query;
            $receiptReturns = $receiptQuery->receipt()->count();
            
            $manualQuery = clone $query;
            $manualReturns = $manualQuery->manual()->count();

            // Top returned products
            $topReturnedProducts = ReturnItem::select('product_name', 'product_barcode')
                ->selectRaw('SUM(quantity) as total_returned')
                ->selectRaw('COUNT(*) as return_count')
                ->selectRaw('SUM(return_total) as total_value')
                ->when($dateFrom && $dateTo, function ($q) use ($dateFrom, $dateTo, $userTimezone) {
                    $q->whereHas('returnRecord', function ($query) use ($dateFrom, $dateTo, $userTimezone) {
                        $query->dateRange($dateFrom, $dateTo, $userTimezone);
                    });
                })
                ->groupBy('product_name', 'product_barcode')
                ->orderByDesc('total_returned')
                ->limit(10)
                ->get();

            // Daily return trends
            $dailyTrends = $query->clone()
                ->selectRaw('DATE(created_at) as date')
                ->selectRaw('COUNT(*) as return_count')
                ->selectRaw('SUM(total_return_amount) as total_amount')
                ->groupBy('date')
                ->orderBy('date')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'overview' => [
                        'total_returns' => $totalReturns,
                        'total_amount' => $totalAmount,
                        'average_return' => $averageReturn,
                        'receipt_returns' => $receiptReturns,
                        'manual_returns' => $manualReturns
                    ],
                    'top_returned_products' => $topReturnedProducts,
                    'daily_trends' => $dailyTrends
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to get return analytics: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to get analytics'
            ], 500);
        }
    }

    /**
     * Export returns data
     */
    public function exportReturns(Request $request): JsonResponse
    {
        try {
            $dateFrom = $request->get('date_from');
            $dateTo = $request->get('date_to');
            $format = $request->get('format', 'json');

            $query = ReturnRecord::with(['processedBy', 'items']);
            
            if ($dateFrom && $dateTo) {
                $query->dateRange($dateFrom, $dateTo);
            }

            $returns = $query->get();

            if ($format === 'csv') {
                // Generate CSV data
                $csvData = "Return Number,Type,Transaction ID,Total Amount,Processed By,Created At\n";
                foreach ($returns as $return) {
                    $csvData .= sprintf(
                        "%s,%s,%s,%.2f,%s,%s\n",
                        $return->return_code,
                        $return->return_type,
                        $return->original_transaction_id ?? 'N/A',
                        $return->total_return_amount,
                        $return->processedBy->name ?? 'Unknown',
                        $return->created_at->format('Y-m-d H:i:s')
                    );
                }

                return response()->json([
                    'success' => true,
                    'data' => base64_encode($csvData),
                    'format' => 'csv',
                    'filename' => 'returns_export_' . now()->format('Y-m-d_H-i-s') . '.csv'
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => $returns,
                'format' => 'json'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to export returns: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to export returns'
            ], 500);
        }
    }

    public function searchTransactionHistory(Request $request): JsonResponse
    {
        try {
            $barcodes = $request->get('barcodes', []);

            if (empty($barcodes)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No barcodes provided'
                ], 400);
            }

            $results = [];

            foreach ($barcodes as $barcode) {
                Log::info("Searching for barcode: {$barcode}");
                
                // Find product by barcode
                $product = Product::where('barcode', $barcode)
                    ->orWhere('secondary_barcode', $barcode)
                    ->first();

                if (!$product) {
                    Log::info("Product not found for barcode: {$barcode}");
                    continue;
                }

                Log::info("Product found: {$product->name} (ID: {$product->id})");

                // Get ALL transaction items for this product (including scale products and cards)
                $transactionItems = TransactionItem::where(function($query) use ($product, $barcode) {
                    $query->where('product_id', $product->id)
                          ->orWhere('barcode', $barcode); // Also search by barcode directly
                })
                ->with(['transaction' => function ($query) {
                    $query->orderBy('created_at', 'desc');
                }, 'product'])
                ->whereHas('transaction', function ($query) {
                    $query->where('status', 'completed');
                })
                ->orderBy('created_at', 'desc')
                ->get();

                Log::info("Transaction items found: " . $transactionItems->count());

                if ($transactionItems->isEmpty()) {
                    Log::info("No transaction items found for barcode: {$barcode}");
                    continue;
                }

                // Calculate total sold quantity from ALL transactions
                $totalSold = $transactionItems->sum('quantity');

                // Calculate total already returned for this product
                $totalReturned = ReturnItem::where('product_id', $product->id)->sum('quantity');

                // Calculate available for return
                $availableForReturn = max(0, $totalSold - $totalReturned);

                Log::info("Product {$product->name}: Total sold: {$totalSold}, Total returned: {$totalReturned}, Available: {$availableForReturn}");

                // Build transaction history with ALL receipts where this product was sold
                $transactionHistory = $transactionItems->map(function ($item) {
                    return [
                        'transaction_number' => $item->transaction->transaction_number,
                        'transaction_date' => $item->transaction->created_at,
                        'quantity' => $item->quantity,
                        'total' => $item->total,
                        'price' => $item->price,
                        'cashier' => $item->transaction->user->full_name ?? 'Unknown',
                        'transaction_id' => $item->transaction->id,
                        'is_scale_product' => $item->is_scale_product ?? false,
                        'weight' => $item->weight ?? null,
                    ];
                })->sortByDesc('transaction_date')->values();

                // Include the product with full transaction history
                $results[] = [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'product_barcode' => $product->barcode,
                    'category_name' => $product->category->name ?? '',
                    'supplier_name' => $product->supplier->name ?? '',
                    'sell_price' => $product->sell_price,
                    'total_sold' => $totalSold,
                    'total_returned' => $totalReturned,
                    'max_available' => $availableForReturn,
                    'transaction_history' => $transactionHistory,
                    'recent_transaction' => $transactionHistory->first(), // Most recent transaction for default return
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $results
            ]);

        } catch (\Exception $e) {
            Log::error('Transaction search error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to search transaction history'
            ], 500);
        }
    }

    /**
     * Delete all returns with password verification.
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
                $returnCount = ReturnRecord::count();
                
                // Delete all return items first (foreign key constraint)
                ReturnItem::truncate();
                
                // Delete all returns
                ReturnRecord::truncate();

                DB::commit();

                $this->invalidateReturnCaches();

                Log::info("All returns deleted by user: " . (Auth::user()?->full_name ?? 'Unknown'));

                return response()->json([
                    'success' => true,
                    'message' => "Successfully deleted {$returnCount} return(s)",
                    'deleted_count' => $returnCount
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('Failed to delete all returns: ' . $e->getMessage());
                throw $e;
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete returns: ' . $e->getMessage()
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

        return [$start->utc(), $end->utc()];
    }

    private function invalidateReturnCaches(): void
    {
        try {
            try {
                $redis = Redis::connection('cache');
            } catch (\Exception $e) {
                $redis = Redis::connection('default');
            }

            $cachePrefix = config('cache.prefix', '');
            $patterns = [
                $cachePrefix . self::RETURN_LIST_CACHE_PREFIX . '*',
                $cachePrefix . self::RETURN_SEARCH_CACHE_PREFIX . '*',
                $cachePrefix . self::RETURN_STATS_CACHE_PREFIX . '*',
                $cachePrefix . self::RETURN_EXPORT_CACHE_PREFIX . '*',
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
            Log::warning('Failed to invalidate return caches', [
                'error' => $e->getMessage()
            ]);
        }
    }

    private function invalidateTransactionCaches(): void
    {
        try {
            try {
                $redis = Redis::connection('cache');
            } catch (\Exception $e) {
                $redis = Redis::connection('default');
            }

            $cachePrefix = config('cache.prefix', '');
            $patterns = [
                $cachePrefix . 'transactions:list:*',
                $cachePrefix . 'transactions:search:*',
                $cachePrefix . 'transactions:stats:*',
                $cachePrefix . 'transactions:export:*',
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
                            Log::warning('SCAN iteration failed for transaction cache invalidation', ['error' => $scanException->getMessage()]);
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
                        Log::warning('Both SCAN and KEYS failed for transaction cache invalidation', [
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
}