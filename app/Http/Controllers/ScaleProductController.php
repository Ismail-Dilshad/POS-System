<?php

namespace App\Http\Controllers;

use App\Models\ScaleProduct;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;

class ScaleProductController extends Controller
{
    /**
     * Display a listing of scale products.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = ScaleProduct::with(['category', 'supplier']);

            // Search functionality
            if ($request->has('search') && !empty($request->search)) {
                $query->search($request->search);
            }

            // Filter by category
            if ($request->has('category_id') && !empty($request->category_id)) {
                $query->where('category_id', $request->category_id);
            }

            // Filter by supplier
            if ($request->has('supplier_id') && !empty($request->supplier_id)) {
                $query->where('supplier_id', $request->supplier_id);
            }

            // Filter by scale ID
            if ($request->has('scale_id') && !empty($request->scale_id)) {
                $query->where('scale_id', $request->scale_id);
            }

            // Filter by PLU
            if ($request->has('plu') && !empty($request->plu)) {
                $query->where('plu', $request->plu);
            }

            // Filter by stock status
            if ($request->has('stock_filter')) {
                switch ($request->stock_filter) {
                    case 'low_stock':
                        $query->lowStock();
                        break;
                    case 'out_of_stock':
                        $query->outOfStock();
                        break;
                    case 'in_stock':
                        $query->inStock();
                        break;
                }
            }

            // Pagination
            $perPage = $request->get('per_page', 15);
            $scaleProducts = $query->latest()->paginate($perPage);

            // Add calculated fields to each scale product
            $scaleProducts->getCollection()->transform(function ($scaleProduct) {
                $scaleProduct->profit_margin = $scaleProduct->profit_margin;
                $scaleProduct->is_low_stock = $scaleProduct->is_low_stock;
                $scaleProduct->is_out_of_stock = $scaleProduct->is_out_of_stock;
                $scaleProduct->stock_value = $scaleProduct->stock_value;
                return $scaleProduct;
            });

            return response()->json([
                'success' => true,
                'data' => $scaleProducts,
                'message' => 'Scale products retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve scale products',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created scale product.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:scale_products,name',
                'category_id' => 'nullable|exists:categories,id',
                'supplier_id' => 'nullable|exists:suppliers,id',
                'scale_id' => 'required|string|regex:/^[1-9]\d$/',
                'plu' => 'required|string|regex:/^\d{5}$/|unique:scale_products,plu',
                'unit_type' => 'required|in:kg',
                'cost_price' => 'required|numeric|min:0',
                'sell_price' => 'required|numeric|min:0',
                'stock' => 'required|numeric|min:0',
                'min_stock' => 'nullable|numeric|min:0',
                'show_in_pos' => 'boolean'
            ] + \App\Services\ItemImageService::rules());

            // Set defaults
            $validated['scale_id'] = $validated['scale_id'] ?? '22';
            $validated['min_stock'] = $validated['min_stock'] ?? 5;
            $validated['show_in_pos'] = $validated['show_in_pos'] ?? false;

            $scaleProduct = app(\App\Services\ItemImageService::class)->save(new ScaleProduct(), $validated, $request->file('image'), $request->boolean('remove_image'));
            $scaleProduct->load(['category', 'supplier']);

            // Add calculated fields
            $scaleProduct->profit_margin = $scaleProduct->profit_margin;
            $scaleProduct->is_low_stock = $scaleProduct->is_low_stock;
            $scaleProduct->is_out_of_stock = $scaleProduct->is_out_of_stock;
            $scaleProduct->stock_value = $scaleProduct->stock_value;

            return response()->json([
                'success' => true,
                'data' => $scaleProduct,
                'message' => 'Scale product created successfully'
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create scale product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified scale product.
     */
    public function show(ScaleProduct $scaleProduct): JsonResponse
    {
        try {
            $scaleProduct->load(['category', 'supplier']);

            // Add calculated fields
            $scaleProduct->profit_margin = $scaleProduct->profit_margin;
            $scaleProduct->is_low_stock = $scaleProduct->is_low_stock;
            $scaleProduct->is_out_of_stock = $scaleProduct->is_out_of_stock;
            $scaleProduct->stock_value = $scaleProduct->stock_value;

            return response()->json([
                'success' => true,
                'data' => $scaleProduct,
                'message' => 'Scale product retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve scale product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified scale product.
     */
    public function update(Request $request, ScaleProduct $scaleProduct): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => [
                    'required',
                    'string',
                    'max:255',
                    Rule::unique('scale_products', 'name')->ignore($scaleProduct->id)
                ],
                'category_id' => 'nullable|exists:categories,id',
                'supplier_id' => 'nullable|exists:suppliers,id',
                'scale_id' => 'required|string|regex:/^[1-9]\d$/',
                'plu' => [
                    'required',
                    'string',
                    'regex:/^\d{5}$/',
                    Rule::unique('scale_products')->ignore($scaleProduct->id)
                ],
                'unit_type' => 'required|in:kg',
                'cost_price' => 'required|numeric|min:0',
                'sell_price' => 'required|numeric|min:0',
                'stock' => 'required|numeric|min:0',
                'min_stock' => 'nullable|numeric|min:0',
                'show_in_pos' => 'boolean'
            ] + \App\Services\ItemImageService::rules());

            // Set defaults
            $validated['scale_id'] = $validated['scale_id'] ?? '22';
            $validated['min_stock'] = $validated['min_stock'] ?? 5;
            $validated['show_in_pos'] = $validated['show_in_pos'] ?? false;

            app(\App\Services\ItemImageService::class)->save($scaleProduct, $validated, $request->file('image'), $request->boolean('remove_image'));
            $scaleProduct->load(['category', 'supplier']);

            // Add calculated fields
            $scaleProduct->profit_margin = $scaleProduct->profit_margin;
            $scaleProduct->is_low_stock = $scaleProduct->is_low_stock;
            $scaleProduct->is_out_of_stock = $scaleProduct->is_out_of_stock;
            $scaleProduct->stock_value = $scaleProduct->stock_value;

            return response()->json([
                'success' => true,
                'data' => $scaleProduct,
                'message' => 'Scale product updated successfully'
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update scale product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Toggle POS visibility for a scale product.
     */
    public function togglePosVisibility(ScaleProduct $scaleProduct): JsonResponse
    {
        try {
            $scaleProduct->update([
                'show_in_pos' => !$scaleProduct->show_in_pos
            ]);

            return response()->json([
                'success' => true,
                'data' => $scaleProduct,
                'message' => 'POS visibility updated successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update POS visibility',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified scale product.
     */
    public function destroy(ScaleProduct $scaleProduct): JsonResponse
    {
        try {
            $productName = $scaleProduct->name;
            
            $scaleProduct->delete();

            return response()->json([
                'success' => true,
                'message' => "Scale product '{$productName}' deleted successfully"
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete scale product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk delete scale products with smart caching
     */
    public function bulkDestroy(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'scale_product_ids' => 'required|array|min:1|max:100',
                'scale_product_ids.*' => 'required|integer|exists:scale_products,id'
            ]);

            $scaleProductIds = $validated['scale_product_ids'];

            DB::beginTransaction();

            $deletedProducts = [];
            $failedProducts = [];

            foreach ($scaleProductIds as $scaleProductId) {
                try {
                    $scaleProduct = ScaleProduct::find($scaleProductId);
                    if ($scaleProduct) {
                        $productName = $scaleProduct->name;
                        
                        $scaleProduct->delete();
                        $deletedProducts[] = $productName;
                    }
                } catch (\Exception $e) {
                    $failedProducts[] = "Scale Product ID {$scaleProductId}: " . $e->getMessage();
                }
            }

            DB::commit();

            $successCount = count($deletedProducts);
            $failureCount = count($failedProducts);

            return response()->json([
                'success' => $failureCount === 0,
                'message' => "Bulk operation completed: {$successCount} scale products processed" .
                           ($failureCount > 0 ? ", {$failureCount} failed" : ""),
                'deleted_products' => $deletedProducts,
                'failed_products' => $failedProducts
            ]);

        } catch (ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Bulk deletion failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Check if PLU is unique (excluding current scale product if updating).
     */
    public function checkPlu(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'plu' => 'required|string|regex:/^\d{5}$/',
                'scale_product_id' => 'nullable|exists:scale_products,id'
            ]);

            $query = ScaleProduct::where('plu', $request->plu);

            if ($request->scale_product_id) {
                $query->where('id', '!=', $request->scale_product_id);
            }

            $exists = $query->exists();

            return response()->json([
                'success' => true,
                'data' => [
                    'is_unique' => !$exists,
                    'plu' => $request->plu
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to check PLU',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Search scale products by query.
     */
    public function search(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'query' => 'required|string|min:1'
            ]);

            $query = $request->get('query');

            $scaleProducts = ScaleProduct::with(['category', 'supplier'])
                ->search($query)
                ->limit(50)
                ->get();

            // Add calculated fields to each scale product
            $scaleProducts->transform(function ($scaleProduct) {
                $scaleProduct->profit_margin = $scaleProduct->profit_margin;
                $scaleProduct->is_low_stock = $scaleProduct->is_low_stock;
                $scaleProduct->is_out_of_stock = $scaleProduct->is_out_of_stock;
                $scaleProduct->stock_value = $scaleProduct->stock_value;
                return $scaleProduct;
            });

            return response()->json([
                'success' => true,
                'data' => $scaleProducts,
                'message' => 'Scale products search completed successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to search scale products',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get scale products statistics.
     */
    public function statistics(): JsonResponse
    {
        try {
            $totalScaleProducts = ScaleProduct::count();
            $lowStockProducts = ScaleProduct::lowStock()->count();
            $outOfStockProducts = ScaleProduct::outOfStock()->count();
            $inStockProducts = ScaleProduct::inStock()->count();

            $totalStockValue = ScaleProduct::selectRaw('SUM(stock * sell_price) as total')
                ->first()->total ?? 0;

            $totalCostValue = ScaleProduct::selectRaw('SUM(stock * cost_price) as total')
                ->first()->total ?? 0;

            $potentialProfit = $totalStockValue - $totalCostValue;

            return response()->json([
                'success' => true,
                'data' => [
                    'total_scale_products' => $totalScaleProducts,
                    'low_stock_products' => $lowStockProducts,
                    'out_of_stock_products' => $outOfStockProducts,
                    'in_stock_products' => $inStockProducts,
                    'total_stock_value' => round($totalStockValue, 2),
                    'total_cost_value' => round($totalCostValue, 2),
                    'potential_profit' => round($potentialProfit, 2),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve scale products statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}