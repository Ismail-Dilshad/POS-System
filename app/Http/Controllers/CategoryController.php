<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Cache;

class CategoryController extends Controller
{
    private const CACHE_KEY = 'categories:all';
    private const CACHE_TTL = 3600; // 1 hour

    /**
     * Clear categories cache
     */
    private function clearCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    /**
     * Display a listing of the categories.
     */
    public function index(Request $request)
    {
        $search = $request->get('search', '');

        // If searching, bypass cache
        if ($search) {
            $categories = Category::where('name', 'like', '%' . $search . '%')
                ->withCount(['products', 'scaleProducts'])
                ->orderBy('name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $categories
            ]);
        }

        // Use Redis cache for non-search requests
        $categories = Cache::remember(self::CACHE_KEY, self::CACHE_TTL, function () {
            return Category::withCount(['products', 'scaleProducts'])
                ->orderBy('name')
                ->get();
        });

        return response()->json([
            'success' => true,
            'data' => $categories
        ]);
    }

    /**
     * Store a newly created category in storage.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:categories,name',
            ]);

            $category = Category::create($validated);

            // Clear cache after creating
            $this->clearCache();

            return response()->json([
                'success' => true,
                'data' => $category,
                'message' => 'Category created successfully'
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
                'message' => 'Failed to create category'
            ], 500);
        }
    }

    /**
     * Display the specified category.
     */
    public function show(Category $category)
    {
        // Load relationships and counts
        $category->loadCount(['products', 'scaleProducts']);

        return response()->json([
            'success' => true,
            'data' => $category
        ]);
    }

    /**
     * Update the specified category in storage.
     */
    public function update(Request $request, Category $category)
    {
        try {
            $validated = $request->validate([
                'name' => [
                    'required',
                    'string',
                    'max:255',
                    Rule::unique('categories', 'name')->ignore($category->id)
                ],
            ]);

            $category->update($validated);

            // Clear cache after updating
            $this->clearCache();

            return response()->json([
                'success' => true,
                'data' => $category,
                'message' => 'Category updated successfully'
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
                'message' => 'Failed to update category'
            ], 500);
        }
    }

    /**
     * Check if category can be deleted (usage validation).
     */
    public function checkUsage(Category $category)
    {
        $productsCount = $category->products()->count();
        $scaleProductsCount = $category->scaleProducts()->count();
        $totalUsage = $productsCount + $scaleProductsCount;

        return response()->json([
            'success' => true,
            'data' => [
                'can_delete' => $totalUsage === 0,
                'products_count' => $productsCount,
                'scale_products_count' => $scaleProductsCount,
                'total_usage' => $totalUsage,
                'message' => $totalUsage > 0 
                    ? "This category is used by {$totalUsage} product(s)" 
                    : 'Category can be safely deleted'
            ]
        ]);
    }

    /**
     * Remove the specified category from storage.
     */
    public function destroy(Category $category)
    {
        try {
            // Check if category is being used by any products
            if ($category->isInUse()) {
                $usageCount = $category->getUsageCount();
                return response()->json([
                    'success' => false,
                    'message' => "Cannot delete category. It is currently being used by {$usageCount} product(s). Please remove or reassign these products first."
                ], 422);
            }

            $category->delete();

            // Clear cache after deleting
            $this->clearCache();

            return response()->json([
                'success' => true,
                'message' => 'Category deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete category'
            ], 500);
        }
    }

    /**
     * Export categories as CSV file
     */
    public function export(Request $request)
    {
        try {
            $categories = Category::withCount(['products', 'scaleProducts'])
                ->orderBy('name')
                ->get();

            $filename = 'categories_export_' . date('Y-m-d_H-i-s') . '.csv';

            $headers = [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                'Cache-Control' => 'no-cache, must-revalidate'
            ];

            $callback = function () use ($categories) {
                $file = fopen('php://output', 'w');

                // Add BOM for proper UTF-8 encoding in Excel
                fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));

                // Write CSV header
                fputcsv($file, ['ID', 'Name', 'Products Count', 'Scale Products Count', 'Created At', 'Updated At']);

                // Write category data
                foreach ($categories as $category) {
                    fputcsv($file, [
                        $category->id,
                        $category->name,
                        $category->products_count,
                        $category->scale_products_count,
                        $category->created_at ? $category->created_at->format('Y-m-d H:i:s') : '',
                        $category->updated_at ? $category->updated_at->format('Y-m-d H:i:s') : ''
                    ]);
                }

                fclose($file);
            };

            return response()->stream($callback, 200, $headers);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to export categories: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Validate CSV file for import
     */
    public function validateImport(Request $request)
    {
        \Log::info('Category import validation started', [
            'has_file' => $request->hasFile('file'),
            'file_size' => $request->hasFile('file') ? $request->file('file')->getSize() : null,
            'update_existing' => $request->input('update_existing'),
            'skip_duplicates' => $request->input('skip_duplicates'),
            'all_inputs' => $request->all()
        ]);
        
        try {
            $request->validate([
                'file' => 'required|file|max:10240', // 10MB max - validate extension manually
                'update_existing' => 'nullable',
                'skip_duplicates' => 'nullable',
            ]);

            $file = $request->file('file');
            
            // Handle boolean parameters that might come as strings
            $updateExisting = filter_var($request->input('update_existing', false), FILTER_VALIDATE_BOOLEAN);
            $skipDuplicates = filter_var($request->input('skip_duplicates', true), FILTER_VALIDATE_BOOLEAN);

            // Validate file extension - only CSV allowed
            $extension = strtolower($file->getClientOriginalExtension());
            if ($extension !== 'csv') {
                return response()->json([
                    'success' => false,
                    'message' => 'File must be a CSV file (.csv extension only)'
                ], 422);
            }

            // Read CSV file
            $csvData = [];
            if (($handle = fopen($file->getPathname(), 'r')) !== false) {
                $header = fgetcsv($handle); // Read header row
                
                while (($data = fgetcsv($handle)) !== false) {
                    if (count($data) >= 1 && !empty(trim($data[0]))) { // At least Name
                        $csvData[] = $data;
                    }
                }
                fclose($handle);
            }

            if (empty($csvData)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No valid data found in CSV file'
                ], 400);
            }

            // Get existing categories for comparison
            $existingCategories = Category::pluck('name', 'id')->toArray();

            $importData = [];
            $summary = [
                'total_rows' => count($csvData),
                'valid_rows' => 0,
                'invalid_rows' => 0,
                'create_count' => 0,
                'update_count' => 0,
                'skip_count' => 0
            ];

            foreach ($csvData as $index => $row) {
                $rowNumber = $index + 2; // +2 because array is 0-indexed and we skip header row
                $categoryData = [
                    'rowNumber' => $rowNumber,
                    'name' => isset($row[0]) ? trim($row[0]) : '',
                    'isValid' => true,
                    'errors' => [],
                    'warnings' => [],
                    'action' => 'create'
                ];

                // Validate name
                if (empty($categoryData['name'])) {
                    $categoryData['errors'][] = 'Category name is required';
                    $categoryData['isValid'] = false;
                } elseif (mb_strlen($categoryData['name']) > 255) {
                    $categoryData['errors'][] = 'Category name must not exceed 255 characters';
                    $categoryData['isValid'] = false;
                }

                // Check if category exists
                $existingCategory = null;
                if (!empty($categoryData['name'])) {
                    $existingCategory = array_search($categoryData['name'], $existingCategories);
                    
                    if ($existingCategory !== false) {
                        if ($updateExisting) {
                            $categoryData['action'] = 'update';
                            $categoryData['warnings'][] = 'Category will be updated';
                        } elseif ($skipDuplicates) {
                            $categoryData['action'] = 'skip';
                            $categoryData['warnings'][] = 'Category already exists - will be skipped';
                        } else {
                            $categoryData['errors'][] = 'Category already exists';
                            $categoryData['isValid'] = false;
                        }
                    }
                }

                // Update summary
                if ($categoryData['isValid']) {
                    $summary['valid_rows']++;
                    switch ($categoryData['action']) {
                        case 'create':
                            $summary['create_count']++;
                            break;
                        case 'update':
                            $summary['update_count']++;
                            break;
                        case 'skip':
                            $summary['skip_count']++;
                            break;
                    }
                } else {
                    $summary['invalid_rows']++;
                }

                $importData[] = $categoryData;
                if ($categoryData['isValid'] && $categoryData['action'] === 'create') {
                    $existingCategories[] = $categoryData['name'];
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'categories' => $importData,
                    'summary' => $summary
                ]
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Category import validation failed', [
                'errors' => $e->errors(),
                'request_data' => $request->all()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Category import validation exception', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to validate import: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Process the category import
     */
    public function processImport(Request $request)
    {
        \Log::info('Category import process started', [
            'has_file' => $request->hasFile('file'),
            'file_size' => $request->hasFile('file') ? $request->file('file')->getSize() : null,
            'update_existing' => $request->input('update_existing'),
            'skip_duplicates' => $request->input('skip_duplicates'),
        ]);

        try {
            $request->validate([
                'file' => 'required|file|max:10240', // 10MB max - validate extension manually
                'update_existing' => 'nullable',
                'skip_duplicates' => 'nullable',
            ]);

            $file = $request->file('file');
            
            // Handle boolean parameters that might come as strings
            $updateExisting = filter_var($request->input('update_existing', false), FILTER_VALIDATE_BOOLEAN);
            $skipDuplicates = filter_var($request->input('skip_duplicates', true), FILTER_VALIDATE_BOOLEAN);

            // Validate file extension - only CSV allowed
            $extension = strtolower($file->getClientOriginalExtension());
            if ($extension !== 'csv') {
                return response()->json([
                    'success' => false,
                    'message' => 'File must be a CSV file (.csv extension only)'
                ], 422);
            }

            // Read CSV file
            $csvData = [];
            if (($handle = fopen($file->getPathname(), 'r')) !== false) {
                $header = fgetcsv($handle); // Read header row
                
                while (($data = fgetcsv($handle)) !== false) {
                    if (count($data) >= 1 && !empty(trim($data[0]))) { // At least name
                        $csvData[] = $data;
                    }
                }
                fclose($handle);
            }

            if (empty($csvData)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No valid data found in CSV file'
                ], 400);
            }

            // Get existing categories for comparison
            $existingCategories = Category::pluck('name')->toArray();

            $results = [
                'success_count' => 0,
                'error_count' => 0,
                'skip_count' => 0,
                'details' => []
            ];

            foreach ($csvData as $index => $row) {
                try {
                    $name = isset($row[0]) ? trim($row[0]) : '';

                    if (empty($name)) {
                        $results['error_count']++;
                        $results['details'][] = "Row " . ($index + 2) . ": Category name is required";
                        continue;
                    }
                    if (mb_strlen($name) > 255) {
                        $results['error_count']++;
                        $results['details'][] = "Row " . ($index + 2) . ": Category name must not exceed 255 characters";
                        continue;
                    }

                    // Check if category exists
                    if (in_array($name, $existingCategories)) {
                        if ($skipDuplicates) {
                            $results['skip_count']++;
                            $results['details'][] = "Skipped existing category: {$name}";
                            continue;
                        } elseif ($updateExisting) {
                            // For categories, there's nothing to update really
                            $results['skip_count']++;
                            $results['details'][] = "Category already exists: {$name}";
                            continue;
                        } else {
                            $results['error_count']++;
                            $results['details'][] = "Category already exists: {$name}";
                            continue;
                        }
                    }

                    // Create new category
                    Category::create(['name' => $name]);
                    $existingCategories[] = $name;
                    $results['success_count']++;
                    $results['details'][] = "Created category: {$name}";

                } catch (\Exception $e) {
                    $results['error_count']++;
                    $results['details'][] = "Error processing row " . ($index + 2) . ": " . $e->getMessage();
                }
            }

            // Clear cache after import if any categories were created
            if ($results['success_count'] > 0) {
                $this->clearCache();
            }

            return response()->json([
                'success' => true,
                'data' => $results,
                'message' => "Import completed: {$results['success_count']} created, {$results['skip_count']} skipped, {$results['error_count']} errors"
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Category import process validation failed', [
                'errors' => $e->errors(),
                'request_data' => $request->all()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Category import process exception', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to process import: ' . $e->getMessage()
            ], 500);
        }
    }
}
