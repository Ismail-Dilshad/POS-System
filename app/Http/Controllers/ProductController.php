<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ProductController extends Controller
{
    /**
     * Auto-detect barcode type based on barcode format
     */
    private function detectBarcodeType($barcode): string
    {
        $barcode = trim($barcode);
        $length = strlen($barcode);

        // Check if it's numeric
        if (ctype_digit($barcode)) {
            if ($length == 13) return 'ean13';
            if ($length == 8) return 'ean8';
            if ($length == 12) return 'upc';
        }

        // Default to code128 for alphanumeric or other formats
        return 'code128';
    }


    /**
     * Display a listing of products with advanced filtering.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Product::with(['category', 'supplier']);

            if ($request->has('search') && !empty($request->search)) {
                $query->search($request->search);
            }

            if ($request->has('category_id') && !empty($request->category_id)) {
                $query->where('category_id', $request->category_id);
            }

            if ($request->has('supplier_id') && !empty($request->supplier_id)) {
                $query->where('supplier_id', $request->supplier_id);
            }

            if ($request->has('stock_status')) {
                if ($request->stock_status === 'low') {
                    $query->lowStock();
                } elseif ($request->stock_status === 'out') {
                    $query->where('stock', 0);
                }
            }

            if ($request->has('show_in_pos')) {
                if ($request->show_in_pos === 'true') {
                    $query->visibleInPos();
                } elseif ($request->show_in_pos === 'false') {
                    $query->where('show_in_pos', false);
                }
            }

            if ($request->has('expiry_status')) {
                if ($request->expiry_status === 'expired') {
                    $query->expired();
                } elseif ($request->expiry_status === 'near_expiry') {
                    $query->where('expire_date', '>', now())
                          ->where('expire_date', '<=', now()->addDays(30));
                }
            }

            $perPage = $request->get('per_page', 15);
            $products = $query->latest()->paginate($perPage);

            // Computed attributes are automatically available via $appends in model

            return response()->json([
                'success' => true,
                'data' => $products,
                'message' => 'Products retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve products',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:products,name',
                'category_id' => 'required|exists:categories,id',
                'supplier_id' => 'required|exists:suppliers,id',
                'barcode_type' => 'required|in:ean13,ean8,upc,code128,code39,custom',
                'barcode' => 'required|string|max:255', // Removed unique constraint to allow duplicate barcodes
                'secondary_barcode' => 'nullable|string|max:255', // Removed unique constraint to allow duplicate secondary barcodes
                'cost_price' => 'required|numeric|min:0',
                'sell_price' => 'required|numeric|min:0',
                'stock' => 'required|integer|min:0',
                'min_stock' => 'required|integer|min:0',
                'per_carton' => 'nullable|integer|min:1',
                'carton_price' => 'nullable|numeric|min:0',
                'show_in_pos' => 'boolean',
                'expire_date' => 'nullable|date',
            ] + \App\Services\ItemImageService::rules());

            $validated['show_in_pos'] = $validated['show_in_pos'] ?? false;

            $cartonPriceInput = $request->input('carton_price');
            $perCarton = $validated['per_carton'] ?? null;
            $sellPrice = $validated['sell_price'] ?? null;
            $validated['carton_price'] = $cartonPriceInput !== null
                ? $cartonPriceInput
                : (($perCarton && $sellPrice) ? round($perCarton * $sellPrice, 2) : null);

            $product = app(\App\Services\ItemImageService::class)->save(new Product(), $validated, $request->file('image'), $request->boolean('remove_image'));
            $product->load(['category', 'supplier']);


            // Computed attributes are automatically available via $appends

            return response()->json([
                'success' => true,
                'data' => $product,
                'message' => 'Product created successfully'
            ], 201);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(Product $product): JsonResponse
    {
        try {
            $product->load(['category', 'supplier']);

            // Computed attributes are automatically available via $appends

            return response()->json([
                'success' => true,
                'data' => $product,
                'message' => 'Product retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:products,name,' . $product->id,
                'category_id' => 'required|exists:categories,id',
                'supplier_id' => 'required|exists:suppliers,id',
                'barcode_type' => 'required|in:ean13,ean8,upc,code128,code39,custom',
                'barcode' => 'required|string|max:255', // Removed unique constraint to allow duplicate barcodes
                'secondary_barcode' => 'nullable|string|max:255', // Removed unique constraint to allow duplicate secondary barcodes
                'cost_price' => 'required|numeric|min:0',
                'sell_price' => 'required|numeric|min:0',
                'stock' => 'required|integer|min:0',
                'min_stock' => 'required|integer|min:0',
                'per_carton' => 'nullable|integer|min:1',
                'carton_price' => 'nullable|numeric|min:0',
                'show_in_pos' => 'boolean',
                'expire_date' => 'nullable|date',
            ] + \App\Services\ItemImageService::rules());

            $validated['show_in_pos'] = $validated['show_in_pos'] ?? false;

            $cartonPriceInput = $request->input('carton_price');
            $perCarton = $validated['per_carton'] ?? null;
            $sellPrice = $validated['sell_price'] ?? null;
            $validated['carton_price'] = $cartonPriceInput !== null
                ? $cartonPriceInput
                : (($perCarton && $sellPrice) ? round($perCarton * $sellPrice, 2) : null);

            app(\App\Services\ItemImageService::class)->save($product, $validated, $request->file('image'), $request->boolean('remove_image'));
            $product->load(['category', 'supplier']);


            // Computed attributes are automatically available via $appends

            return response()->json([
                'success' => true,
                'data' => $product,
                'message' => 'Product updated successfully'
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Product $product): JsonResponse
    {
        try {
            $productName = $product->name;
            $productId = $product->id;
            
            $product->delete();

            return response()->json([
                'success' => true,
                'message' => "Product '{$productName}' deleted successfully"
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk delete products with smart caching
     */
    public function bulkDestroy(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'product_ids' => 'required|array|min:1|max:100',
                'product_ids.*' => 'required|integer|exists:products,id'
            ]);

            $productIds = $validated['product_ids'];

            DB::beginTransaction();

            $deletedProducts = [];
            $failedProducts = [];

            foreach ($productIds as $productId) {
                try {
                    $product = Product::find($productId);
                    if ($product) {
                        $productName = $product->name;
                        
                        $product->delete();
                        $deletedProducts[] = $productName;
                    }
                } catch (\Exception $e) {
                    $failedProducts[] = "Product ID {$productId}: " . $e->getMessage();
                }
            }

            DB::commit();

            $successCount = count($deletedProducts);
            $failureCount = count($failedProducts);

            return response()->json([
                'success' => $failureCount === 0,
                'message' => "Bulk operation completed: {$successCount} products processed" .
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

    public function statistics(): JsonResponse
    {
        try {
            $totalProducts = Product::count();
            $lowStockProducts = Product::lowStock()->count();
            $expiredProducts = Product::expired()->count();
            $nearExpiryProducts = Product::where('expire_date', '>', now())
                ->where('expire_date', '<=', now()->addDays(30))
                ->count();

            $totalStockValue = Product::sum(DB::raw('stock * cost_price'));
            $totalSellValue = Product::sum(DB::raw('stock * sell_price'));
            $potentialProfit = $totalSellValue - $totalStockValue;

            return response()->json([
                'success' => true,
                'data' => [
                    'total_products' => $totalProducts,
                    'low_stock_products' => $lowStockProducts,
                    'expired_products' => $expiredProducts,
                    'near_expiry_products' => $nearExpiryProducts,
                    'total_stock_value' => round($totalStockValue, 2),
                    'total_sell_value' => round($totalSellValue, 2),
                    'potential_profit' => round($potentialProfit, 2),
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve product statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function checkBarcode(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'barcode' => 'required|string',
                'product_id' => 'nullable|exists:products,id',
            ]);

            $query = Product::where('barcode', $validated['barcode'])
                ->orWhere('secondary_barcode', $validated['barcode']);

            if (isset($validated['product_id'])) {
                $query->where('id', '!=', $validated['product_id']);
            }

            $products = $query->get();
            $count = $products->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'is_unique' => $count === 0,
                    'is_duplicate' => $count > 1,
                    'count' => $count,
                    'products' => $products,
                    'barcode' => $validated['barcode']
                ]
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to check barcode',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function togglePosVisibility(Product $product): JsonResponse
    {
        try {
            $product->update(['show_in_pos' => !$product->show_in_pos]);
            $product->load(['category', 'supplier']);


            // Computed attributes are automatically available via $appends

            return response()->json([
                'success' => true,
                'data' => $product,
                'message' => 'Product POS visibility updated successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update product POS visibility',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Search products by query
     */
    public function search(Request $request)
    {
        try {
            $query = $request->get('query', '');

            if (empty($query)) {
                return response()->json([
                    'success' => true,
                    'data' => [],
                    'message' => 'No search query provided'
                ]);
            }

            $products = Product::with(['category', 'supplier'])
                ->where(function($q) use ($query) {
                    $q->where('name', 'like', "%{$query}%")
                      ->orWhere('barcode', 'like', "%{$query}%")
                      ->orWhere('secondary_barcode', 'like', "%{$query}%");
                })
                ->where('show_in_pos', true)
                ->limit(10)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $products,
                'message' => 'Products found successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to search products',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Validate import file before actual import
     */
    public function validateImport(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'file' => 'required|file|mimes:csv,txt|max:102400', // 100MB
                'skip_duplicates' => 'boolean',
                'update_existing' => 'boolean',
            ]);

            $file = $request->file('file');
            $skipDuplicates = $validated['skip_duplicates'] ?? false;
            $updateExisting = $validated['update_existing'] ?? false;
            $path = $file->getRealPath();

            [$header, $csvData] = $this->readImportCsv($path);

            $requiredHeaders = [
                'name', 'category', 'supplier', 'barcode', 'secondary_barcode',
                'cost_price', 'sell_price', 'stock', 'min_stock'
            ];

            $optionalHeaders = ['per_carton'];

            $allHeaders = array_merge($requiredHeaders, $optionalHeaders);

            $missingHeaders = array_diff($requiredHeaders, $header);
            $extraHeaders = array_diff($header, $allHeaders);

            $errors = [];
            $warnings = [];

            if (!empty($missingHeaders)) {
                $errors[] = 'Missing required column(s): ' . implode(', ', $missingHeaders);
                return response()->json([
                    'success' => false,
                    'message' => 'Missing required column(s): ' . implode(', ', $missingHeaders),
                    'data' => [
                        'errors' => $errors
                    ]
                ], 422);
            }

            if (!empty($extraHeaders)) {
                $warnings[] = 'Unknown headers (will be ignored): ' . implode(', ', $extraHeaders);
            }

            // Get all categories and suppliers for validation
            $categories = DB::table('categories')->pluck('id', 'name')->toArray();
            $suppliers = DB::table('suppliers')->pluck('id', 'name')->toArray();

            // Get all existing product names from database for duplicate checking
            $existingProductNames = array_fill_keys(DB::table('products')
                ->pluck('name')
                ->map(fn($name) => trim(strtolower($name)))
                ->toArray(), true);

            $rowErrors = [];
            $validRows = [];
            $namesSeen = [];
            $totalRows = count($csvData);

            for ($i = 0; $i < $totalRows; $i++) {
                $row = $csvData[$i];
                $rowNumber = $i + 2;
                if (count($row) !== count($header)) {
                    $rowErrors[] = ['row' => $rowNumber, 'data' => $row, 'errors' => ['Row column count does not match the CSV header']];
                    continue;
                }
                $rowData = array_combine($header, $row);
                $rowErrorMessages = [];

                // Basic validation
                $validator = validator($rowData, $this->importRowRules());

                if ($validator->fails()) {
                    $rowErrorMessages = array_merge($rowErrorMessages, $validator->errors()->all());
                }

                $productName = trim($rowData['name']);
                $productNameLower = strtolower($productName);

                // Check for name duplication within CSV
                if (isset($namesSeen[$productNameLower])) {
                    $rowErrorMessages[] = "Product name '{$productName}' is duplicated in the CSV file";
                } else {
                    $namesSeen[$productNameLower] = true;
                }

                // Check if product name already exists in database
                if (isset($existingProductNames[$productNameLower])) {
                    if ($updateExisting) {
                        // Mark as update action
                        $rowData['_action'] = 'update';
                    } elseif (!$skipDuplicates) {
                        $rowErrorMessages[] = "Product name '{$productName}' already exists in database";
                    } else {
                        // Will be skipped during import
                        $rowData['_action'] = 'skip';
                    }
                } else {
                    $rowData['_action'] = 'create';
                }

                // Check if category exists in database
                $categoryName = trim($rowData['category']);
                if (!isset($categories[$categoryName])) {
                    $rowErrorMessages[] = "Category '{$categoryName}' does not exist in database";
                }

                // Check if supplier exists in database
                $supplierName = trim($rowData['supplier']);
                if (!isset($suppliers[$supplierName])) {
                    $rowErrorMessages[] = "Supplier '{$supplierName}' does not exist in database";
                }

                if (!empty($rowErrorMessages)) {
                    $rowErrors[] = [
                        'row' => $rowNumber,
                        'data' => $row,
                        'errors' => $rowErrorMessages
                    ];
                } else {
                    $validRows[] = [
                        'row' => $rowNumber,
                        'data' => $row,
                        'action' => $rowData['_action'] ?? 'create'
                    ];
                }
            }

            $isValid = empty($errors) && empty($rowErrors);

            return response()->json([
                'success' => true,
                'data' => [
                    'is_valid' => $isValid,
                    'total_rows' => $totalRows,
                    'valid_rows_count' => count($validRows),
                    'invalid_rows_count' => count($rowErrors),
                    'headers' => $header,
                    'required_headers' => $requiredHeaders,
                    'optional_headers' => $optionalHeaders,
                    'errors' => $errors,
                    'warnings' => $warnings,
                    'valid_rows' => $validRows,
                    'invalid_rows' => $rowErrors
                ],
                'message' => $isValid ? 'File validation passed' : 'File validation failed'
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to validate import file',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Optimized bulk import with chunked processing
     */
    public function import(Request $request): JsonResponse
    {
        // Extend execution time and memory for large imports
        set_time_limit(0);
        ini_set('memory_limit', '1G');
        
        try {
            $validated = $request->validate([
                'file' => 'required|file|mimes:csv,txt|max:102400', // 100MB max
                'skip_duplicates' => 'boolean',
                'update_existing' => 'boolean',
            ]);

            $file = $request->file('file');
            $skipDuplicates = $validated['skip_duplicates'] ?? false;
            $updateExisting = $validated['update_existing'] ?? false;

            // Process file in chunks to prevent memory issues
            $result = $this->processBulkImport($file, $skipDuplicates, $updateExisting);

            return response()->json([
                'success' => true,
                'message' => 'Products imported successfully',
                'data' => $result
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Bulk import failed', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Import failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Process bulk import with chunked operations
     */
    private function readImportCsv(string $path): array
    {
        $handle = fopen($path, 'r');
        if ($handle === false) {
            throw ValidationException::withMessages(['file' => ['Unable to read CSV file']]);
        }
        try {
            $header = fgetcsv($handle, 0, ',', '"', '');
            if ($header === false || $header === [null]) {
                throw ValidationException::withMessages(['file' => ['CSV file is empty']]);
            }
            $header = array_map(fn ($name) => trim((string) $name), $header);
            $header[0] = preg_replace('/^\xEF\xBB\xBF/', '', $header[0]);
            if (count(array_unique($header)) !== count($header)) {
                throw ValidationException::withMessages(['file' => ['CSV contains duplicate column headers']]);
            }
            $rows = [];
            while (($row = fgetcsv($handle, 0, ',', '"', '')) !== false) {
                $rows[] = $row;
            }
            return [$header, $rows];
        } finally {
            fclose($handle);
        }
    }

    private function importRowRules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'supplier' => 'required|string|max:255',
            'barcode' => 'required|string|max:255',
            'secondary_barcode' => 'nullable|string|max:255',
            'cost_price' => 'required|numeric|min:0',
            'sell_price' => 'required|numeric|min:0',
            'stock' => 'required|numeric|min:0',
            'min_stock' => 'required|numeric|min:0',
            'per_carton' => 'nullable|numeric|min:1',
        ];
    }

    private function processBulkImport($file, bool $skipDuplicates, bool $updateExisting): array
    {
        $path = $file->getRealPath();
        [$header, $csvData] = $this->readImportCsv($path);
        $requiredHeaders = array_diff(array_keys($this->importRowRules()), ['per_carton']);
        $missingHeaders = array_diff($requiredHeaders, $header);
        if ($missingHeaders) {
            throw ValidationException::withMessages(['file' => ['Missing required column(s): ' . implode(', ', $missingHeaders)]]);
        }

        // Get categories and suppliers mapping (single query)
        $categories = DB::table('categories')->pluck('id', 'name')->toArray();
        $suppliers = DB::table('suppliers')->pluck('id', 'name')->toArray();

        // Get all existing product names from database (case-insensitive)
        $existingProductNames = DB::table('products')
            ->select('id', 'name', 'barcode')
            ->get()
            ->keyBy(fn($product) => strtolower(trim($product->name)))
            ->toArray();

        $created = 0;
        $updated = 0;
        $skipped = 0;
        $errors = [];

        // Track names seen in CSV to prevent CSV duplicates
        $namesSeen = [];

        // Process in chunks of 1000 rows
        $chunkSize = 1000;
        $chunks = array_chunk($csvData, $chunkSize);

        DB::beginTransaction();

        try {
            foreach ($chunks as $chunkIndex => $chunk) {
                $productsToCreate = [];
                $productsToUpdate = [];

                foreach ($chunk as $rowIndex => $row) {
                    $rowNumber = ($chunkIndex * $chunkSize) + $rowIndex + 2;
                    if (count($row) !== count($header)) {
                        $errors[] = "Row {$rowNumber}: Row column count does not match the CSV header";
                        $skipped++;
                        continue;
                    }
                    $rowData = array_combine($header, $row);

                    try {
                        $validator = validator($rowData, $this->importRowRules());
                        if ($validator->fails()) {
                            $errors[] = "Row {$rowNumber}: " . implode(' ', $validator->errors()->all());
                            $skipped++;
                            continue;
                        }
                        $productName = trim($rowData['name']);
                        $productNameLower = strtolower($productName);

                        // Skip duplicate names within CSV
                        if (isset($namesSeen[$productNameLower])) {
                            $skipped++;
                            continue;
                        }

                        $namesSeen[$productNameLower] = true;

                        // Prepare product data
                        $productData = $this->prepareProductData($rowData, $categories, $suppliers);

                        // Check if product name already exists in database
                        $existingProduct = $existingProductNames[$productNameLower] ?? null;

                        if ($existingProduct) {
                            // Product already exists in database
                            if ($updateExisting) {
                                // Update existing product
                                $productsToUpdate[] = array_merge($productData, ['id' => $existingProduct->id]);
                            } elseif ($skipDuplicates) {
                                // Skip duplicate
                                $skipped++;
                            } else {
                                // Report error if neither skip nor update is enabled
                                $errors[] = "Row {$rowNumber}: Product '{$productName}' already exists";
                                $skipped++;
                            }
                        } else {
                            // New product - add to create list
                            $productsToCreate[] = $productData;
                        }

                    } catch (\Exception $e) {
                        $errors[] = "Row {$rowNumber}: " . $e->getMessage();
                        $skipped++;
                    }
                }

                // Bulk insert new products
                if (!empty($productsToCreate)) {
                    try {
                        Product::insert($productsToCreate);
                        $created += count($productsToCreate);
                    } catch (\Exception $e) {
                        Log::error('Bulk insert failed', ['error' => $e->getMessage()]);
                        throw $e;
                    }
                }

                // Bulk update existing products
                if (!empty($productsToUpdate)) {
                    try {
                        $this->bulkUpdateProducts($productsToUpdate);
                        $updated += count($productsToUpdate);
                    } catch (\Exception $e) {
                        Log::error('Bulk update failed', ['error' => $e->getMessage()]);
                        throw $e;
                    }
                }

                // Clear memory periodically
                if ($chunkIndex % 10 === 0) {
                    gc_collect_cycles();
                }
            }

            DB::commit();

            // After bulk operations, rebuild cache since observers don't fire for bulk insert
            if ($created > 0 || $updated > 0) {
                try {
                    $cacheService = app(\App\Services\ProductCacheService::class);
                    
                    Log::info('Starting cache rebuild after bulk import', [
                        'created' => $created,
                        'updated' => $updated,
                        'total_processed' => $created + $updated
                    ]);
                    
                    // Clear only the specific caches that need rebuilding
                    \Illuminate\Support\Facades\Cache::forget('pos_products:all_products');
                    \Illuminate\Support\Facades\Cache::forget('pos_products:barcode_index');
                    \Illuminate\Support\Facades\Cache::forget('pos_products:name_index');
                    \Illuminate\Support\Facades\Cache::forget('inventory:index:v2:all');
                    \Illuminate\Support\Facades\Cache::forget('inventory:index:all');
                    \Illuminate\Support\Facades\Cache::forget('inventory:comprehensive_stats');
                    \Illuminate\Support\Facades\Cache::forget('inventory:updated');
                    
                    // Rebuild cache with fresh data from database
                    $cacheService->buildProductCache();
                    
                    // Verify cache was built successfully
                    $cacheStats = $cacheService->getCacheStats();
                    $allProducts = \Illuminate\Support\Facades\Cache::get('pos_products:all_products', []);
                    $barcodeIndex = \Illuminate\Support\Facades\Cache::get('pos_products:barcode_index', []);
                    
                    // Verify that newly imported products are in the cache
                    $newProductsInCache = 0;
                    if (!empty($allProducts)) {
                        // Count products that were likely just imported (recently created)
                        $recentProducts = collect($allProducts)->filter(function($product) {
                            return $product['type'] === 'product' && isset($product['per_carton']);
                        });
                        $newProductsInCache = $recentProducts->count();
                    }
                    
                    Log::info('Cache rebuilt successfully after bulk import', [
                        'created' => $created,
                        'updated' => $updated,
                        'total_products_in_cache' => count($allProducts),
                        'barcode_index_entries' => count($barcodeIndex),
                        'new_products_in_cache' => $newProductsInCache,
                        'cache_stats' => $cacheStats,
                        'cache_keys_verified' => [
                            'all_products' => !empty($allProducts),
                            'barcode_index' => !empty($barcodeIndex),
                            'cache_valid' => $cacheStats['cache_valid']
                        ]
                    ]);
                    
                } catch (\Exception $e) {
                    Log::error('Failed to rebuild cache after import', [
                        'created' => $created,
                        'updated' => $updated,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                }
            }

            return [
                'imported' => $created,
                'created' => $created,
                'updated' => $updated,
                'skipped' => $skipped,
                'errors' => $errors,
                'total_processed' => $created + $updated + $skipped
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Import transaction failed', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Prepare product data for bulk operations
     */
    private function prepareProductData(array $rowData, array $categories, array $suppliers): array
    {
        $categoryName = trim($rowData['category']);
        $supplierName = trim($rowData['supplier']);
        $barcode = trim($rowData['barcode']);

        if (!isset($categories[$categoryName])) {
            throw new \Exception("Category '{$categoryName}' not found");
        }

        if (!isset($suppliers[$supplierName])) {
            throw new \Exception("Supplier '{$supplierName}' not found");
        }

        return [
            'name' => trim($rowData['name']),
            'category_id' => $categories[$categoryName],
            'supplier_id' => $suppliers[$supplierName],
            'barcode_type' => $this->detectBarcodeType($barcode),
            'barcode' => $barcode,
            'secondary_barcode' => isset($rowData['secondary_barcode']) && trim($rowData['secondary_barcode']) !== '' ? trim($rowData['secondary_barcode']) : null,
            'cost_price' => (float)$rowData['cost_price'],
            'sell_price' => (float)$rowData['sell_price'],
            'stock' => (int)$rowData['stock'],
            'min_stock' => (int)$rowData['min_stock'],
            'per_carton' => isset($rowData['per_carton']) && $rowData['per_carton'] !== '' ? (int)$rowData['per_carton'] : null,
            'show_in_pos' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }

    /**
     * Bulk update products using raw SQL
     */
    private function bulkUpdateProducts(array $products): void
    {
        $chunks = array_chunk($products, 500); // Process 500 at a time
        $allUpdatedIds = [];

        foreach ($chunks as $chunk) {
            $ids = array_column($chunk, 'id');
            $allUpdatedIds = array_merge($allUpdatedIds, $ids);
            $cases = [];

            foreach (['name', 'category_id', 'supplier_id', 'barcode', 'secondary_barcode', 'cost_price', 'sell_price', 'stock', 'min_stock', 'per_carton'] as $field) {
                $cases[$field] = "CASE id " . implode(' ', array_map(function($product) use ($field) {
                    $value = $product[$field] ?? null;
                    
                    // Handle null values
                    if ($value === null) {
                        return "WHEN {$product['id']} THEN NULL";
                    }
                    
                    // Handle string values (escape single quotes for SQL)
                    if (is_string($value)) {
                        $escaped = str_replace("'", "''", $value);
                        return "WHEN {$product['id']} THEN '{$escaped}'";
                    }
                    
                    // Handle numeric values
                    return "WHEN {$product['id']} THEN " . $value;
                }, $chunk)) . " END";
            }

            $sql = "UPDATE products SET " . implode(', ', array_map(function($field, $case) {
                return "{$field} = {$case}";
            }, array_keys($cases), $cases)) . " WHERE id IN (" . implode(',', $ids) . ")";

            DB::statement($sql);
        }

        // Update cache for all affected products (raw SQL bypasses observers)
        if (!empty($allUpdatedIds)) {
            try {
                $cacheService = app(\App\Services\ProductCacheService::class);
                
                Log::info('Updating cache after bulk update', [
                    'product_count' => count($allUpdatedIds),
                    'product_ids' => array_slice($allUpdatedIds, 0, 10) // Log first 10 IDs
                ]);
                
                // Update cache for each affected product
                foreach ($allUpdatedIds as $productId) {
                    $cacheService->smartUpdateProduct($productId, 'product');
                }
                
                // Clear inventory cache to ensure fresh data
                Cache::forget('inventory:index:v2:all');
                Cache::forget('inventory:index:all');
                Cache::forget('inventory:comprehensive_stats');
                
                Log::info('Cache updated successfully after bulk update', [
                    'product_count' => count($allUpdatedIds)
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to update cache after bulk update', [
                    'product_count' => count($allUpdatedIds),
                    'error' => $e->getMessage()
                ]);
            }
        }
    }


    /**
     * Export products to CSV
     */
    public function export(Request $request): JsonResponse
    {
        try {
            $query = Product::with(['category', 'supplier']);

            // Apply filters if provided
            if ($request->has('category_id') && !empty($request->category_id)) {
                $query->where('category_id', $request->category_id);
            }

            if ($request->has('supplier_id') && !empty($request->supplier_id)) {
                $query->where('supplier_id', $request->supplier_id);
            }

            if ($request->has('stock_status')) {
                if ($request->stock_status === 'low') {
                    $query->lowStock();
                } elseif ($request->stock_status === 'out') {
                    $query->where('stock', 0);
                }
            }

            $products = $query->get();

            $csvData = [];
            $csvData[] = [
                'name', 'category_id', 'category_name', 'supplier_id', 'supplier_name',
                'barcode_type', 'barcode', 'secondary_barcode', 'cost_price', 'sell_price',
                'stock', 'min_stock', 'per_carton', 'show_in_pos', 'expire_date', 'created_at'
            ];

            foreach ($products as $product) {
                $csvData[] = [
                    $product->name,
                    $product->category_id,
                    $product->category?->name,
                    $product->supplier_id,
                    $product->supplier?->name,
                    $product->barcode_type,
                    $product->barcode,
                    $product->secondary_barcode,
                    $product->cost_price,
                    $product->sell_price,
                    $product->stock,
                    $product->min_stock,
                    $product->per_carton,
                    $product->show_in_pos ? 1 : 0,
                    $product->expire_date,
                    $product->created_at->format('Y-m-d H:i:s')
                ];
            }

            $filename = 'products_export_' . now()->format('Y_m_d_H_i_s') . '.csv';
            $filePath = storage_path('app/exports/' . $filename);

            // Ensure exports directory exists
            if (!file_exists(dirname($filePath))) {
                mkdir(dirname($filePath), 0755, true);
            }

            $file = fopen($filePath, 'w');
            foreach ($csvData as $row) {
                fputcsv($file, $row);
            }
            fclose($file);

            return response()->json([
                'success' => true,
                'message' => 'Products exported successfully',
                'data' => [
                    'filename' => $filename,
                    'path' => $filePath,
                    'count' => count($products),
                    'download_url' => route('products.download', ['filename' => $filename])
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to export products',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
