<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use App\Models\Purchase;
use App\Models\SupplierPayment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Carbon;

class SupplierController extends Controller
{
    private const CACHE_KEY = 'suppliers:all';
    private const CACHE_TTL = 3600; // 1 hour

    /**
     * Clear suppliers cache
     */
    private function clearCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    /**
     * Display a listing of the suppliers.
     */
    public function index(Request $request)
    {
        try {
            $search = $request->get('search', '');

            // If searching, bypass cache
            if ($search) {
                $suppliers = Supplier::where(function ($query) use ($search) {
                    $query->where('name', 'like', '%' . $search . '%')
                          ->orWhere('supplier_code', 'like', '%' . $search . '%')
                          ->orWhere('phone', 'like', '%' . $search . '%')
                          ->orWhere('email', 'like', '%' . $search . '%')
                          ->orWhere('business_name', 'like', '%' . $search . '%')
                          ->orWhere('billing_contact_name', 'like', '%' . $search . '%');
                })
                ->withCount(['products', 'scaleProducts'])
                ->orderBy('name')
                ->get();

                return response()->json([
                    'success' => true,
                    'data' => $suppliers
                ]);
            }

            // Use Redis cache for non-search requests
            $suppliers = Cache::remember(self::CACHE_KEY, self::CACHE_TTL, function () {
                return Supplier::withCount(['products', 'scaleProducts'])
                    ->orderBy('name')
                    ->get();
            });


            // Add calculated fields for the frontend
            $suppliers = $suppliers->map(function ($supplier) {
                try {
                    // Try both supplier_id and supplier_name matching
                    $directQuery = DB::table('supplier_payments')
                        ->where(function($query) use ($supplier) {
                            $query->where('supplier_id', $supplier->id)
                                  ->orWhere('supplier_name', $supplier->name);
                        })
                        ->selectRaw('SUM(total_amount) as total_amount, SUM(paid_amount) as total_paid')
                        ->first();
                    
                    $totalAmount = $directQuery->total_amount ?? 0;
                    $totalPaid = $directQuery->total_paid ?? 0;
                    $remainAmount = $totalAmount - $totalPaid;
                    
                    $supplier->total_amount = $totalAmount;
                    $supplier->total_paid = $totalPaid;
                    $supplier->remain_amount = $remainAmount;
                    
                } catch (\Exception $e) {
                    // If supplierPayments relationship fails, set default values
                    $supplier->total_amount = 0;
                    $supplier->total_paid = 0;
                    $supplier->remain_amount = 0;
                    
                }
                
                return $supplier;
            });

            return response()->json([
                'success' => true,
                'data' => $suppliers
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch suppliers: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified supplier.
     */
    public function show(Supplier $supplier)
    {
        try {
            // Load relationships and calculated fields
            $supplier->loadCount(['products', 'scaleProducts']);
            
            try {
                $supplier->total_amount = $supplier->supplierPayments()->sum('total_amount') ?? 0;
                $supplier->total_paid = $supplier->supplierPayments()->sum('paid_amount') ?? 0;
                $supplier->remain_amount = $supplier->total_amount - $supplier->total_paid;
            } catch (\Exception $e) {
                // If supplierPayments relationship fails, set default values
                $supplier->total_amount = 0;
                $supplier->total_paid = 0;
                $supplier->remain_amount = 0;
            }

            return response()->json([
                'success' => true,
                'data' => $supplier
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch supplier: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created supplier in storage.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:suppliers,name',
                'phone' => 'nullable|string|max:255',
                'supplier_code' => 'nullable|string|max:255|unique:suppliers,supplier_code',
                'email' => 'nullable|email|max:255',

                // Business info
                'business_name' => 'nullable|string|max:255',
                'business_address' => 'nullable|string|max:500',
                'business_phone' => 'nullable|string|max:255',
                'business_email' => 'nullable|email|max:255',

                // Biller person info
                'billing_contact_name' => 'nullable|string|max:255',
                'billing_contact_phone' => 'nullable|string|max:255',
                'billing_contact_email' => 'nullable|email|max:255',
                'biller_position' => 'nullable|string|max:255',
            ]);

            $supplier = Supplier::create($validated);

            // Clear cache after creating
            $this->clearCache();

            return response()->json([
                'success' => true,
                'data' => $supplier,
                'message' => 'Supplier created successfully'
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
                'message' => 'Failed to create supplier'
            ], 500);
        }
    }

    /**
     * Update the specified supplier in storage.
     */
    public function update(Request $request, Supplier $supplier)
    {
        try {
            $validated = $request->validate([
                'name' => [
                    'required',
                    'string',
                    'max:255',
                    Rule::unique('suppliers', 'name')->ignore($supplier->id)
                ],
                'phone' => 'nullable|string|max:255',
                'supplier_code' => [
                    'nullable',
                    'string',
                    'max:255',
                    Rule::unique('suppliers', 'supplier_code')->ignore($supplier->id)
                ],
                'email' => 'nullable|email|max:255',

                // Business info
                'business_name' => 'nullable|string|max:255',
                'business_address' => 'nullable|string|max:500',
                'business_phone' => 'nullable|string|max:255',
                'business_email' => 'nullable|email|max:255',

                // Biller person info
                'billing_contact_name' => 'nullable|string|max:255',
                'billing_contact_phone' => 'nullable|string|max:255',
                'billing_contact_email' => 'nullable|email|max:255',
                'biller_position' => 'nullable|string|max:255',
            ]);

            $supplier->update($validated);

            // Clear cache after updating
            $this->clearCache();

            return response()->json([
                'success' => true,
                'data' => $supplier,
                'message' => 'Supplier updated successfully'
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
                'message' => 'Failed to update supplier'
            ], 500);
        }
    }

    /**
     * Check if supplier can be deleted (usage validation).
     */
    public function checkUsage(Supplier $supplier)
    {
        $productsCount = $supplier->products()->count();
        $scaleProductsCount = $supplier->scaleProducts()->count();
        $totalUsage = $productsCount + $scaleProductsCount;

        return response()->json([
            'success' => true,
            'data' => [
                'can_delete' => $totalUsage === 0,
                'products_count' => $productsCount,
                'scale_products_count' => $scaleProductsCount,
                'total_usage' => $totalUsage,
                'message' => $totalUsage > 0 
                    ? "This supplier is used by {$totalUsage} product(s)" 
                    : 'Supplier can be safely deleted'
            ]
        ]);
    }

    /**
     * Remove the specified supplier from storage.
     */
    public function destroy(Supplier $supplier)
    {
        try {
            // Check if supplier is being used by any products
            if ($supplier->isInUse()) {
                $usageCount = $supplier->getUsageCount();
                return response()->json([
                    'success' => false,
                    'message' => "Cannot delete supplier. It is currently being used by {$usageCount} product(s). Please remove or reassign these products first."
                ], 422);
            }

            $supplier->delete();

            // Clear cache after deleting
            $this->clearCache();

            return response()->json([
                'success' => true,
                'message' => 'Supplier deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete supplier'
            ], 500);
        }
    }

    /**
     * Generate a new unique supplier code.
     */
    public function generateCode()
    {
        $supplierCode = Supplier::generateSupplierCode();

        return response()->json([
            'success' => true,
            'data' => [
                'supplier_code' => $supplierCode
            ]
        ]);
    }

    /**
     * Get supplier purchase and payment history with summary.
     */
    public function payments(Supplier $supplier)
    {
        try {
            // Get actual supplier payment records from the database
            $supplierPayments = DB::table('supplier_payments')
                ->where(function($query) use ($supplier) {
                    $query->where('supplier_id', $supplier->id)
                          ->orWhere('supplier_name', $supplier->name);
                })
                ->leftJoin('purchases', 'supplier_payments.purchase_id', '=', 'purchases.id')
                ->select(
                    'supplier_payments.*',
                    'purchases.invoice_name',
                    'purchases.invoice_id',
                    'purchases.created_at as purchase_created_at',
                    'purchases.updated_at as purchase_updated_at',
                    'purchases.status as purchase_status'
                )
                ->orderBy('supplier_payments.created_at', 'desc')
                ->get();

            // If no payment records exist, create them from purchases
            if ($supplierPayments->isEmpty()) {
                // Get purchases for this supplier
                $purchaseIds = DB::table('purchase_items')
                    ->where(function($query) use ($supplier) {
                        $query->where('supplier_id', $supplier->id)
                              ->orWhere('supplier_name', $supplier->name);
                    })
                    ->distinct()
                    ->pluck('purchase_id')
                    ->toArray();

                if (!empty($purchaseIds)) {
                    $purchases = DB::table('purchases')
                        ->whereIn('id', $purchaseIds)
                        ->where('status', 'receive') // Only received purchases
                        ->select('id', 'invoice_name', 'invoice_id', 'status', 'total_amount', 'created_at', 'updated_at')
                        ->get();

                    // Create payment records for each purchase
                    foreach ($purchases as $purchase) {
                        $totalAmount = $purchase->total_amount ?? 0;
                        $paidAmount = 0; // No payments made yet
                        $remainingAmount = $totalAmount - $paidAmount;
                        $paymentStatus = $paidAmount >= $totalAmount ? 'paid' : ($paidAmount > 0 ? 'partial' : 'debt');

                        $purchaseCreatedAt = $purchase->created_at ? Carbon::parse($purchase->created_at) : now();
                        $purchaseUpdatedAt = $purchase->updated_at ? Carbon::parse($purchase->updated_at) : $purchaseCreatedAt;

                        // Insert payment record
                        $paymentId = DB::table('supplier_payments')->insertGetId([
                            'purchase_id' => $purchase->id,
                            'supplier_id' => $supplier->id,
                            'supplier_name' => $supplier->name,
                            'total_amount' => $totalAmount,
                            'paid_amount' => $paidAmount,
                            'remaining_amount' => $remainingAmount,
                            'payment_status' => $paymentStatus,
                            'notes' => 'Auto-generated payment record',
                            'created_at' => $purchaseCreatedAt,
                            'updated_at' => $purchaseUpdatedAt,
                        ]);

                        // Add to collection
                        $supplierPayments->push((object)[
                            'id' => $paymentId,
                            'purchase_id' => $purchase->id,
                            'supplier_id' => $supplier->id,
                            'supplier_name' => $supplier->name,
                            'total_amount' => $totalAmount,
                            'paid_amount' => $paidAmount,
                            'remaining_amount' => $remainingAmount,
                            'payment_status' => $paymentStatus,
                            'notes' => 'Auto-generated payment record',
                            'created_at' => $purchaseCreatedAt->toIso8601String(),
                            'updated_at' => $purchaseUpdatedAt->toIso8601String(),
                            'invoice_name' => $purchase->invoice_name,
                            'invoice_id' => $purchase->invoice_id,
                            'purchase_created_at' => $purchaseCreatedAt->toIso8601String(),
                            'purchase_updated_at' => $purchaseUpdatedAt->toIso8601String(),
                            'purchase_status' => $purchase->status,
                        ]);
                    }
                }
            }

            $supplierPayments = $supplierPayments->map(function ($payment) {
                $createdAt = $payment->created_at ? Carbon::parse($payment->created_at) : null;
                $purchaseCreatedAt = $payment->purchase_created_at ? Carbon::parse($payment->purchase_created_at) : null;
                $purchaseUpdatedAt = $payment->purchase_updated_at ? Carbon::parse($payment->purchase_updated_at) : null;
                $updatedAt = $payment->updated_at ? Carbon::parse($payment->updated_at) : null;
                $purchaseStatus = $payment->purchase_status ?? null;

                $effectiveCreated = $createdAt ?? $purchaseCreatedAt;

                if ($payment->payment_status === 'paid' && $updatedAt) {
                    $payment->payment_date = $updatedAt->toIso8601String();
                } elseif ($effectiveCreated) {
                    $payment->payment_date = $effectiveCreated->toIso8601String();
                } else {
                    $payment->payment_date = null;
                }

                $receivedTimestamp = null;
                if ($purchaseStatus === 'receive') {
                    $receivedTimestamp = $purchaseUpdatedAt ?? $purchaseCreatedAt;
                } else {
                    $receivedTimestamp = $purchaseCreatedAt;
                }

                $payment->purchase_received_at = $receivedTimestamp
                    ? $receivedTimestamp->toIso8601String()
                    : null;

                if ($createdAt) {
                    $payment->created_at = $createdAt->toIso8601String();
                }

                if ($updatedAt) {
                    $payment->updated_at = $updatedAt->toIso8601String();
                }

                if ($purchaseCreatedAt) {
                    $payment->purchase_created_at = $purchaseCreatedAt->toIso8601String();
                }

                if ($purchaseUpdatedAt) {
                    $payment->purchase_updated_at = $purchaseUpdatedAt->toIso8601String();
                }

                return $payment;
            });

            // Calculate summary
            $summary = [
                'total_purchases' => $supplierPayments->count(),
                'total_amount' => $supplierPayments->sum('total_amount'),
                'total_paid' => $supplierPayments->sum('paid_amount'),
                'total_remaining' => $supplierPayments->sum('remaining_amount'),
                'paid_purchases' => $supplierPayments->where('payment_status', 'paid')->count(),
                'partial_purchases' => $supplierPayments->where('payment_status', 'partial')->count(),
                'debt_purchases' => $supplierPayments->where('payment_status', 'debt')->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'payments' => $supplierPayments,
                    'summary' => $summary
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch supplier payments: ' . $e->getMessage(),
                'data' => [
                    'payments' => [],
                    'summary' => [
                        'total_purchases' => 0,
                        'total_amount' => 0,
                        'total_paid' => 0,
                        'total_remaining' => 0,
                        'paid_purchases' => 0,
                        'partial_purchases' => 0,
                        'debt_purchases' => 0,
                    ]
                ]
            ], 500);
        }
    }

    /**
     * Create a new supplier payment record.
     */
    public function createPayment(Request $request)
    {
        try {
            $validated = $request->validate([
                'purchase_id' => 'required|exists:purchases,id',
                'supplier_id' => 'required|exists:suppliers,id',
                'supplier_name' => 'required|string|max:255',
                'total_amount' => 'required|numeric|min:0',
                'paid_amount' => 'required|numeric|min:0',
            ]);

            // Calculate remaining amount and payment status
            $remainingAmount = $validated['total_amount'] - $validated['paid_amount'];
            $paymentStatus = 'debt';
            if ($validated['paid_amount'] >= $validated['total_amount']) {
                $paymentStatus = 'paid';
            } elseif ($validated['paid_amount'] > 0) {
                $paymentStatus = 'partial';
            }

            $timestamp = now();

            $payment = DB::table('supplier_payments')->insertGetId([
                'purchase_id' => $validated['purchase_id'],
                'supplier_id' => $validated['supplier_id'],
                'supplier_name' => $validated['supplier_name'],
                'total_amount' => $validated['total_amount'],
                'paid_amount' => $validated['paid_amount'],
                'remaining_amount' => $remainingAmount,
                'payment_status' => $paymentStatus,
                'notes' => null,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Payment record created successfully',
                'data' => [
                    'id' => $payment,
                    'purchase_id' => $validated['purchase_id'],
                    'supplier_id' => $validated['supplier_id'],
                    'supplier_name' => $validated['supplier_name'],
                    'total_amount' => $validated['total_amount'],
                    'paid_amount' => $validated['paid_amount'],
                    'remaining_amount' => $remainingAmount,
                    'payment_status' => $paymentStatus,
                    'payment_date' => $timestamp->toIso8601String(),
                    'created_at' => $timestamp->toIso8601String(),
                    'updated_at' => $timestamp->toIso8601String(),
                ]
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
                'message' => 'Failed to create payment record: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update an existing supplier payment record.
     */
    public function updatePayment(Request $request, $paymentId)
    {
        try {
            $validated = $request->validate([
                'paid_amount' => 'required|numeric|min:0',
            ]);

            // Get existing payment record
            $payment = DB::table('supplier_payments')->where('id', $paymentId)->first();
            if (!$payment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment record not found'
                ], 404);
            }

            // Calculate new remaining amount and payment status
            $newPaidAmount = $validated['paid_amount'];
            $remainingAmount = $payment->total_amount - $newPaidAmount;
            $paymentStatus = 'debt';
            if ($newPaidAmount >= $payment->total_amount) {
                $paymentStatus = 'paid';
            } elseif ($newPaidAmount > 0) {
                $paymentStatus = 'partial';
            }

            // Update payment record
            $timestamp = now();

            DB::table('supplier_payments')
                ->where('id', $paymentId)
                ->update([
                    'paid_amount' => $newPaidAmount,
                    'remaining_amount' => $remainingAmount,
                    'payment_status' => $paymentStatus,
                    'updated_at' => $timestamp,
                ]);

            return response()->json([
                'success' => true,
                'message' => 'Payment record updated successfully',
                'data' => [
                    'id' => $paymentId,
                    'purchase_id' => $payment->purchase_id,
                    'supplier_id' => $payment->supplier_id,
                    'supplier_name' => $payment->supplier_name,
                    'total_amount' => $payment->total_amount,
                    'paid_amount' => $newPaidAmount,
                    'remaining_amount' => $remainingAmount,
                    'payment_status' => $paymentStatus,
                    'payment_date' => $timestamp->toIso8601String(),
                    'updated_at' => $timestamp->toIso8601String(),
                ]
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
                'message' => 'Failed to update payment record: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a supplier payment record.
     */
    public function deletePayment($paymentId)
    {
        try {
            $payment = DB::table('supplier_payments')->where('id', $paymentId)->first();
            if (!$payment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment record not found'
                ], 404);
            }

            DB::table('supplier_payments')->where('id', $paymentId)->delete();

            return response()->json([
                'success' => true,
                'message' => 'Payment record deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete payment record: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export suppliers as CSV file
     */
    public function export(Request $request)
    {
        try {
            $suppliers = Supplier::withCount(['products', 'scaleProducts'])
                ->orderBy('name')
                ->get();

            $filename = 'suppliers_export_' . date('Y-m-d_H-i-s') . '.csv';

            $headers = [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                'Cache-Control' => 'no-cache, must-revalidate'
            ];

            $callback = function () use ($suppliers) {
                $file = fopen('php://output', 'w');

                // Add BOM for proper UTF-8 encoding in Excel
                fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));

                // Write CSV header
                fputcsv($file, [
                    'ID', 'Name', 'Phone', 'Supplier Code', 'Email',
                    'Business Name', 'Business Address', 'Business Phone', 'Business Email',
                    'Billing Contact Name', 'Billing Contact Phone', 'Billing Contact Email', 'Biller Position',
                    'Products Count', 'Scale Products Count', 'Created At', 'Updated At'
                ]);

                // Write supplier data
                foreach ($suppliers as $supplier) {
                    fputcsv($file, [
                        $supplier->id,
                        $supplier->name,
                        $supplier->phone,
                        $supplier->supplier_code,
                        $supplier->email,
                        $supplier->business_name,
                        $supplier->business_address,
                        $supplier->business_phone,
                        $supplier->business_email,
                        $supplier->billing_contact_name,
                        $supplier->billing_contact_phone,
                        $supplier->billing_contact_email,
                        $supplier->biller_position,
                        $supplier->products_count,
                        $supplier->scale_products_count,
                        $supplier->created_at ? $supplier->created_at->format('Y-m-d H:i:s') : '',
                        $supplier->updated_at ? $supplier->updated_at->format('Y-m-d H:i:s') : ''
                    ]);
                }

                fclose($file);
            };

            return response()->stream($callback, 200, $headers);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to export suppliers: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Validate CSV file for import
     */
    public function validateImport(Request $request)
    {
        \Log::info('Supplier import validation started', [
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

            // Get existing suppliers for comparison
            $existingSuppliers = Supplier::pluck('name')->toArray();

            $suppliers = [];
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
                $supplierData = [
                    'rowNumber' => $rowNumber,
                    'name' => isset($row[0]) ? trim($row[0]) : '',
                    'phone' => isset($row[1]) ? trim($row[1]) : '',
                    'supplier_code' => isset($row[2]) ? trim($row[2]) : '',
                    'email' => isset($row[3]) ? trim($row[3]) : '',
                    'contact_person' => isset($row[4]) ? trim($row[4]) : '',
                    'address' => isset($row[5]) ? trim($row[5]) : '',
                    'isValid' => true,
                    'errors' => [],
                    'warnings' => [],
                    'action' => 'create'
                ];

                // Validate name
                if (empty($supplierData['name'])) {
                    $supplierData['errors'][] = 'Supplier name is required';
                    $supplierData['isValid'] = false;
                }

                // Check if supplier exists
                $existingSupplier = null;
                if (!empty($supplierData['name'])) {
                    $existingSupplier = array_search($supplierData['name'], $existingSuppliers);
                    if ($existingSupplier !== false) {
                        if ($updateExisting) {
                            $supplierData['action'] = 'update';
                            $supplierData['warnings'][] = 'Will update existing supplier';
                            $summary['update_count']++;
                        } elseif ($skipDuplicates) {
                            $supplierData['action'] = 'skip';
                            $supplierData['warnings'][] = 'Will skip existing supplier';
                            $summary['skip_count']++;
                        } else {
                            $supplierData['errors'][] = 'Supplier already exists';
                            $supplierData['isValid'] = false;
                        }
                    } else {
                        $summary['create_count']++;
                    }
                }

                if ($supplierData['isValid']) {
                    $summary['valid_rows']++;
                } else {
                    $summary['invalid_rows']++;
                }

                $suppliers[] = $supplierData;
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'suppliers' => $suppliers,
                    'summary' => [
                        'totalRows' => $summary['total_rows'],
                        'validRows' => $summary['valid_rows'],
                        'invalidRows' => $summary['invalid_rows'],
                        'createCount' => $summary['create_count'],
                        'updateCount' => $summary['update_count'],
                        'duplicateNames' => 0, // Not tracked in current implementation
                        'duplicateCodes' => 0, // Not tracked in current implementation
                    ]
                ]
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Supplier import validation failed', [
                'errors' => $e->errors(),
                'request_data' => $request->all()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Supplier import validation exception', [
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
     * Process supplier import from CSV file
     */
    public function processImport(Request $request)
    {
        \Log::info('Supplier import process started', [
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

            // Get existing suppliers for comparison
            $existingSuppliers = Supplier::pluck('name')->toArray();

            $results = [
                'success_count' => 0,
                'error_count' => 0,
                'skip_count' => 0,
                'details' => []
            ];

            foreach ($csvData as $index => $row) {
                try {
                    $name = isset($row[0]) ? trim($row[0]) : '';
                    $phone = isset($row[1]) ? trim($row[1]) : '';
                    $supplierCode = isset($row[2]) ? trim($row[2]) : '';
                    $email = isset($row[3]) ? trim($row[3]) : '';
                    $contactPerson = isset($row[4]) ? trim($row[4]) : '';
                    $address = isset($row[5]) ? trim($row[5]) : '';

                    if (empty($name)) {
                        $results['error_count']++;
                        $results['details'][] = "Row " . ($index + 2) . ": Supplier name is required";
                        continue;
                    }

                    // Check if supplier exists
                    if (in_array($name, $existingSuppliers)) {
                        if ($skipDuplicates) {
                            $results['skip_count']++;
                            $results['details'][] = "Skipped existing supplier: {$name}";
                            continue;
                        } elseif ($updateExisting) {
                            // Update existing supplier
                            $supplier = Supplier::where('name', $name)->first();
                            if ($supplier) {
                                $supplier->update([
                                    'phone' => $phone ?: $supplier->phone,
                                    'supplier_code' => $supplierCode ?: $supplier->supplier_code,
                                    'email' => $email ?: $supplier->email,
                                    'contact_person' => $contactPerson ?: $supplier->contact_person,
                                    'address' => $address ?: $supplier->address,
                                ]);
                                $results['success_count']++;
                                $results['details'][] = "Updated supplier: {$name}";
                            }
                            continue;
                        } else {
                            $results['error_count']++;
                            $results['details'][] = "Supplier already exists: {$name}";
                            continue;
                        }
                    }

                    // Create new supplier
                    $supplierData = [
                        'name' => $name,
                        'phone' => $phone,
                        'email' => $email,
                        'contact_person' => $contactPerson,
                        'address' => $address,
                    ];

                    if (!empty($supplierCode)) {
                        $supplierData['supplier_code'] = $supplierCode;
                    }

                    Supplier::create($supplierData);
                    $results['success_count']++;
                    $results['details'][] = "Created supplier: {$name}";

                } catch (\Exception $e) {
                    $results['error_count']++;
                    $results['details'][] = "Error processing row " . ($index + 2) . ": " . $e->getMessage();
                }
            }

            // Clear cache after import if any suppliers were created or updated
            if ($results['success_count'] > 0) {
                $this->clearCache();
            }

            return response()->json([
                'success' => true,
                'data' => $results,
                'message' => "Import completed: {$results['success_count']} created/updated, {$results['skip_count']} skipped, {$results['error_count']} errors"
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Supplier import process validation failed', [
                'errors' => $e->errors(),
                'request_data' => $request->all()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Supplier import process exception', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to process import: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete all supplier payments with password verification.
     */
    public function deleteAllPayments(Request $request): JsonResponse
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
                $paymentCount = SupplierPayment::count();
                
                // Delete all supplier payments
                SupplierPayment::truncate();

                DB::commit();

                Log::info("All supplier payments deleted by user: " . (Auth::user()?->full_name ?? 'Unknown'));

                return response()->json([
                    'success' => true,
                    'message' => "Successfully deleted {$paymentCount} supplier payment(s)",
                    'deleted_count' => $paymentCount
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('Failed to delete all supplier payments: ' . $e->getMessage());
                throw $e;
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete supplier payments: ' . $e->getMessage()
            ], 500);
        }
    }
}