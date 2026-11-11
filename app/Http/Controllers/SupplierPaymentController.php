<?php

namespace App\Http\Controllers;

use App\Models\SupplierPayment;
use App\Models\Purchase;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SupplierPaymentController extends Controller
{
    /**
     * Store a new supplier payment.
     */
    public function store(Request $request)
    {
        $request->validate([
            'purchase_id' => 'required|exists:purchases,id',
            'supplier_id' => 'required|exists:suppliers,id',
            'payment_amount' => 'required|numeric|min:0.01',
            'total_amount' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string|max:1000',
        ]);

        try {
            DB::beginTransaction();

            $purchase = Purchase::findOrFail($request->purchase_id);
            $supplier = Supplier::findOrFail($request->supplier_id);

            // Check if purchase is received
            if ($purchase->status !== 'receive') {
                return response()->json([
                    'success' => false,
                    'message' => 'Can only make payments for received purchases'
                ], 422);
            }

            // Check if payment already exists for this purchase and supplier
            $existingPayment = SupplierPayment::where('purchase_id', $request->purchase_id)
                ->where('supplier_id', $request->supplier_id)
                ->first();

            if ($existingPayment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment record already exists for this purchase and supplier. Use update instead.'
                ], 422);
            }

            $paymentAmount = (float) $request->payment_amount;
            $totalAmount = (float) $request->total_amount;

            // Validate payment amount doesn't exceed total
            if ($paymentAmount > $totalAmount) {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment amount cannot exceed total amount'
                ], 422);
            }

            $remainingAmount = $totalAmount - $paymentAmount;

            // Determine payment status
            $paymentStatus = 'debt';
            if ($paymentAmount >= $totalAmount) {
                $paymentStatus = 'paid';
            } elseif ($paymentAmount > 0) {
                $paymentStatus = 'partial';
            }

            // Create the payment record
            $payment = SupplierPayment::create([
                'purchase_id' => $request->purchase_id,
                'supplier_id' => $request->supplier_id,
                'supplier_name' => $supplier->name,
                'total_amount' => $totalAmount,
                'paid_amount' => $paymentAmount,
                'remaining_amount' => $remainingAmount,
                'payment_status' => $paymentStatus,
                'notes' => $request->notes,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $payment,
                'message' => 'Payment recorded successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'success' => false,
                'message' => 'Failed to record payment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update an existing supplier payment.
     */
    public function update(Request $request, SupplierPayment $supplierPayment)
    {
        $request->validate([
            'payment_amount' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string|max:1000',
        ]);

        try {
            DB::beginTransaction();

            $additionalPayment = (float) $request->payment_amount;
            $newPaidAmount = $supplierPayment->paid_amount + $additionalPayment;

            // Validate new payment amount doesn't exceed total
            if ($newPaidAmount > $supplierPayment->total_amount) {
                return response()->json([
                    'success' => false,
                    'message' => 'Total payment amount cannot exceed total amount'
                ], 422);
            }

            $newRemainingAmount = $supplierPayment->total_amount - $newPaidAmount;

            // Determine new payment status
            $paymentStatus = 'debt';
            if ($newPaidAmount >= $supplierPayment->total_amount) {
                $paymentStatus = 'paid';
            } elseif ($newPaidAmount > 0) {
                $paymentStatus = 'partial';
            }

            // Update the payment record
            $supplierPayment->update([
                'paid_amount' => $newPaidAmount,
                'remaining_amount' => $newRemainingAmount,
                'payment_status' => $paymentStatus,
                'notes' => $request->notes,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $supplierPayment->fresh(),
                'message' => 'Payment updated successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update payment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show a specific supplier payment.
     */
    public function show(SupplierPayment $supplierPayment)
    {
        $supplierPayment->load(['purchase', 'supplier']);

        return response()->json([
            'success' => true,
            'data' => $supplierPayment
        ]);
    }

    /**
     * Delete a supplier payment.
     */
    public function destroy(SupplierPayment $supplierPayment)
    {
        try {
            $supplierPayment->delete();

            return response()->json([
                'success' => true,
                'message' => 'Payment record deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete payment record',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}