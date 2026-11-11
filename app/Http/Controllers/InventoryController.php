<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ScaleProduct;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class InventoryController extends Controller
{
    /**
     * Get all inventory items
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $search = $request->get('search', '');

            // Get all products
            $products = Product::with(['category', 'supplier'])
                ->when($search, function ($query) use ($search) {
                    $query->where(function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%")
                          ->orWhere('barcode', 'like', "%{$search}%");
                    });
                })
                ->get()
                ->map(function ($product) {
                    return [
                        'id' => $product->id,
                        'name' => $product->name,
                        'product_type' => 'product',
                        'identifier' => $product->barcode,
                        'stock' => $product->stock,
                        'min_stock' => $product->min_stock,
                        'cost_price' => $product->cost_price,
                        'sell_price' => $product->sell_price,
                        'category' => $product->category?->name,
                        'supplier' => $product->supplier?->name,
                    ];
                });

            // Get all scale products
            $scaleProducts = ScaleProduct::with(['category', 'supplier'])
                ->when($search, function ($query) use ($search) {
                    $query->where(function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%")
                          ->orWhere('plu', 'like', "%{$search}%");
                    });
                })
                ->get()
                ->map(function ($product) {
                    return [
                        'id' => $product->id,
                        'name' => $product->name,
                        'product_type' => 'scale_product',
                        'identifier' => $product->plu,
                        'stock' => $product->stock,
                        'min_stock' => $product->min_stock,
                        'cost_price' => $product->cost_price,
                        'sell_price' => $product->sell_price,
                        'category' => $product->category?->name,
                        'supplier' => $product->supplier?->name,
                    ];
                });

            // Merge and return
            $allItems = $products->concat($scaleProducts);

            return response()->json([
                'success' => true,
                'data' => $allItems,
                'message' => 'Inventory items retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve inventory items: ' . $e->getMessage()
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
            $validator = Validator::make(['items' => $items], [
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
                    'data' => [
                        'valid' => false,
                        'errors' => $validator->errors()->all()
                    ]
                ], 422);
            }

            // Additional validation: check if products exist
            $errors = [];
            foreach ($items as $item) {
                if ($item['product_type'] === 'product') {
                    $exists = Product::where('id', $item['id'])->exists();
                    if (!$exists) {
                        $errors[] = "Product with ID {$item['id']} not found";
                    }
                } elseif ($item['product_type'] === 'scale_product') {
                    $exists = ScaleProduct::where('id', $item['id'])->exists();
                    if (!$exists) {
                        $errors[] = "Scale product with ID {$item['id']} not found";
                    }
                }
            }

            $isValid = empty($errors);

            return response()->json([
                'success' => true,
                'data' => [
                    'valid' => $isValid,
                    'errors' => $errors
                ],
                'message' => $isValid ? 'Validation passed' : 'Validation failed'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error: ' . $e->getMessage(),
                'data' => [
                    'valid' => false,
                    'errors' => [$e->getMessage()]
                ]
            ], 500);
        }
    }

    /**
     * Adjust inventory stock for multiple products
     */
    public function adjust(Request $request): JsonResponse
    {
        try {
            // Accept both 'items' and 'adjustments' parameter names for flexibility
            $adjustments = $request->input('items') ?? $request->input('adjustments');

            // Validate request
            $validator = Validator::make(['adjustments' => $adjustments], [
                'adjustments' => 'required|array|min:1',
                'adjustments.*.id' => 'required|integer',
                'adjustments.*.product_type' => 'required|in:product,scale_product',
                'adjustments.*.adjust_type' => 'required|in:add,delete,set',
                'adjustments.*.adjust_qty' => 'required|numeric|min:0',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $adjustments = $request->input('adjustments');
            $results = [];
            $errors = [];

            // Group adjustments by product type for efficiency
            $productAdjustments = collect($adjustments)->filter(fn($adj) => $adj['product_type'] === 'product');
            $scaleProductAdjustments = collect($adjustments)->filter(fn($adj) => $adj['product_type'] === 'scale_product');

            DB::beginTransaction();

            try {
                // Process product adjustments
                if ($productAdjustments->isNotEmpty()) {
                    $productIds = $productAdjustments->pluck('id')->toArray();
                    $products = Product::whereIn('id', $productIds)->get()->keyBy('id');

                    foreach ($productAdjustments as $adjustment) {
                        $product = $products->get($adjustment['id']);

                        if (!$product) {
                            $errors[] = "Product with ID {$adjustment['id']} not found";
                            continue;
                        }

                        $currentStock = $product->stock;
                        $adjustQty = $adjustment['adjust_qty'];
                        $newStock = $this->calculateNewStock($currentStock, $adjustQty, $adjustment['adjust_type']);

                        // Update the product stock
                        $product->update(['stock' => $newStock]);

                        $results[] = [
                            'id' => $product->id,
                            'product_type' => 'product',
                            'name' => $product->name,
                            'identifier' => $product->barcode,
                            'old_stock' => $currentStock,
                            'new_stock' => $newStock,
                            'adjust_qty' => $adjustQty,
                            'adjust_type' => $adjustment['adjust_type']
                        ];
                    }
                }

                // Process scale product adjustments
                if ($scaleProductAdjustments->isNotEmpty()) {
                    $scaleProductIds = $scaleProductAdjustments->pluck('id')->toArray();
                    $scaleProducts = ScaleProduct::whereIn('id', $scaleProductIds)->get()->keyBy('id');

                    foreach ($scaleProductAdjustments as $adjustment) {
                        $scaleProduct = $scaleProducts->get($adjustment['id']);

                        if (!$scaleProduct) {
                            $errors[] = "Scale product with ID {$adjustment['id']} not found";
                            continue;
                        }

                        $currentStock = $scaleProduct->stock;
                        $adjustQty = $adjustment['adjust_qty'];
                        $newStock = $this->calculateNewStock($currentStock, $adjustQty, $adjustment['adjust_type']);

                        // Update the scale product stock
                        $scaleProduct->update(['stock' => $newStock]);

                        $results[] = [
                            'id' => $scaleProduct->id,
                            'product_type' => 'scale_product',
                            'name' => $scaleProduct->name,
                            'identifier' => $scaleProduct->plu,
                            'old_stock' => $currentStock,
                            'new_stock' => $newStock,
                            'adjust_qty' => $adjustQty,
                            'adjust_type' => $adjustment['adjust_type']
                        ];
                    }
                }

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => count($results) . ' product(s) adjusted successfully' .
                        (count($errors) > 0 ? ' with ' . count($errors) . ' error(s)' : ''),
                    'data' => [
                        'adjusted_items' => $results,
                        'errors' => $errors,
                        'total_processed' => count($results),
                        'total_errors' => count($errors)
                    ]
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to adjust inventory: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Calculate new stock based on adjustment type
     */
    private function calculateNewStock(float $currentStock, float $adjustQty, string $adjustType): float
    {
        switch ($adjustType) {
            case 'add':
                return $currentStock + $adjustQty;
            case 'delete':
                return max(0, $currentStock - $adjustQty);
            case 'set':
                return max(0, $adjustQty);
            default:
                return $currentStock;
        }
    }

    /**
     * Get inventory summary with low stock alerts
     */
    public function summary(): JsonResponse
    {
        try {
            // Get product statistics
            $productStats = Product::selectRaw('
                COUNT(*) as total_products,
                SUM(CASE WHEN stock <= min_stock THEN 1 ELSE 0 END) as low_stock_products,
                SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) as out_of_stock_products,
                SUM(stock * cost_price) as total_inventory_value
            ')->first();

            // Get scale product statistics
            $scaleProductStats = ScaleProduct::selectRaw('
                COUNT(*) as total_scale_products,
                SUM(CASE WHEN stock <= min_stock THEN 1 ELSE 0 END) as low_stock_scale_products,
                SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) as out_of_stock_scale_products,
                SUM(stock * cost_price) as total_scale_inventory_value
            ')->first();

            // Get low stock items
            $lowStockProducts = Product::with(['category', 'supplier'])
                ->whereRaw('stock <= min_stock')
                ->orderBy('stock', 'asc')
                ->limit(10)
                ->get();

            $lowStockScaleProducts = ScaleProduct::with(['category', 'supplier'])
                ->whereRaw('stock <= min_stock')
                ->orderBy('stock', 'asc')
                ->limit(10)
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'products' => $productStats,
                    'scale_products' => $scaleProductStats,
                    'low_stock_items' => [
                        'products' => $lowStockProducts,
                        'scale_products' => $lowStockScaleProducts
                    ],
                    'total_inventory_value' =>
                        ($productStats->total_inventory_value ?? 0) +
                        ($scaleProductStats->total_scale_inventory_value ?? 0)
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get inventory summary: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get comprehensive statistics for inventory dashboard
     */
    public function getComprehensiveStatistics(): JsonResponse
    {
        try {
            // Get product statistics with sales value
            $productStats = Product::selectRaw('
                COUNT(*) as total_products,
                SUM(CASE WHEN stock > min_stock THEN 1 ELSE 0 END) as active_items,
                SUM(CASE WHEN stock <= min_stock AND stock > 0 THEN 1 ELSE 0 END) as low_stock_items,
                SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) as out_of_stock_items,
                SUM(stock * cost_price) as total_value,
                SUM(stock * sell_price) as total_sales_value,
                SUM(CASE WHEN expire_date IS NOT NULL AND expire_date < NOW() THEN 1 ELSE 0 END) as expired_items,
                SUM(CASE WHEN expire_date IS NOT NULL AND expire_date >= NOW() AND expire_date <= DATE_ADD(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as expiring_in_30_days
            ')->first();

            // Get scale product statistics
            $scaleProductStats = ScaleProduct::selectRaw('
                COUNT(*) as total_scale_products
            ')->first();

            // Get card statistics
            $cardStats = DB::table('cards')->selectRaw('
                COUNT(*) as total_cards
            ')->first();

            // Calculate total items
            $totalItems = ($productStats->total_products ?? 0) +
                         ($scaleProductStats->total_scale_products ?? 0) +
                         ($cardStats->total_cards ?? 0);

            return response()->json([
                'success' => true,
                'data' => [
                    // Product counts
                    'total_products' => $productStats->total_products ?? 0,
                    'total_scale_products' => $scaleProductStats->total_scale_products ?? 0,
                    'total_cards' => $cardStats->total_cards ?? 0,
                    'total_items' => $totalItems,

                    // Stock status
                    'active_items' => $productStats->active_items ?? 0,
                    'low_stock_items' => $productStats->low_stock_items ?? 0,
                    'out_of_stock_items' => $productStats->out_of_stock_items ?? 0,

                    // Financial values
                    'total_value' => round($productStats->total_value ?? 0, 2),
                    'total_sales_value' => round($productStats->total_sales_value ?? 0, 2),

                    // Expiry calculations
                    'expiry_calculations' => [
                        'expired_items' => $productStats->expired_items ?? 0,
                        'expiring_in_30_days' => $productStats->expiring_in_30_days ?? 0
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get comprehensive statistics: ' . $e->getMessage()
            ], 500);
        }
    }
}