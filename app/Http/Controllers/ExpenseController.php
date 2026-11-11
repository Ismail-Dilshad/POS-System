<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class ExpenseController extends Controller
{
    /**
     * Display a listing of expenses.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Expense::query();

            // Search by description
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where('description', 'like', "%{$search}%");
            }

            // Filter by amount range
            if ($request->has('min_price') && $request->min_price) {
                $minAmount = $request->min_price;
                // Remove any non-numeric characters except decimal point
                $minAmount = preg_replace('/[^0-9.]/', '', $minAmount);

                if (is_numeric($minAmount) && $minAmount > 0) {
                    $query->where('amount', '>=', (float) $minAmount);
                }
            }

            if ($request->has('max_price') && $request->max_price) {
                $maxAmount = $request->max_price;
                // Remove any non-numeric characters except decimal point
                $maxAmount = preg_replace('/[^0-9.]/', '', $maxAmount);

                if (is_numeric($maxAmount) && $maxAmount > 0) {
                    $query->where('amount', '<=', (float) $maxAmount);
                }
            }

            // Date and time filtering with timezone support
            if ($request->has('date_from') || $request->has('date_to') || $request->has('time_from') || $request->has('time_to')) {
                $userTimezone = $request->get('timezone', 'UTC');
                
                // If only time filters are provided, use today's date
                if (!$request->has('date_from') && !$request->has('date_to')) {
                    $start = Carbon::today($userTimezone);
                    $end = Carbon::today($userTimezone);
                } else {
                    $start = $request->has('date_from')
                        ? Carbon::parse($request->get('date_from'), $userTimezone)
                        : Carbon::createFromTimestamp(0, $userTimezone);
                    
                    $end = $request->has('date_to')
                        ? Carbon::parse($request->get('date_to'), $userTimezone)
                        : Carbon::now($userTimezone)->addYears(100);
                }

                // Apply time filters if provided
                if ($request->has('time_from')) {
                    $timeFrom = $request->get('time_from'); // Format: "HH:MM"
                    $start = $start->copy()->setTimeFromTimeString($timeFrom . ':00');
                } else {
                    $start = $start->startOfDay();
                }

                if ($request->has('time_to')) {
                    $timeTo = $request->get('time_to'); // Format: "HH:MM"
                    $end = $end->copy()->setTimeFromTimeString($timeTo . ':00');
                } else {
                    $end = $end->endOfDay();
                }

                // Convert to UTC for database comparison
                $start = $start->utc();
                $end = $end->utc();

                $query->whereBetween('created_at', [$start, $end]);
            }

            // Sorting
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');

            if (in_array($sortBy, ['amount', 'description', 'created_at', 'updated_at'])) {
                $query->orderBy($sortBy, $sortOrder);
            }

            // Pagination
            $perPage = $request->get('per_page', 15);
            $expenses = $query->paginate($perPage);

            // Transform data to match frontend expectations
            $transformedData = collect($expenses->items())->map(function ($expense) {
                return [
                    'id' => $expense->id,
                    'price' => $expense->amount, // Map amount to price for frontend
                    'description' => $expense->description,
                    'created_at' => $expense->created_at,
                    'updated_at' => $expense->updated_at,
                ];
            })->all();

            return response()->json([
                'success' => true,
                'data' => $transformedData,
                'pagination' => [
                    'current_page' => $expenses->currentPage(),
                    'last_page' => $expenses->lastPage(),
                    'per_page' => $expenses->perPage(),
                    'total' => $expenses->total(),
                ],
                'message' => 'Expenses retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve expenses: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created expense.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'price' => 'required|numeric|min:0',
                'description' => 'required|string|max:1000',
            ]);

            $expense = Expense::create([
                'amount' => $validated['price'], // Map price to amount
                'description' => $validated['description'],
            ]);

            // Transform response to match frontend expectations
            $responseData = [
                'id' => $expense->id,
                'price' => $expense->amount, // Map amount back to price for frontend
                'description' => $expense->description,
                'created_at' => $expense->created_at,
                'updated_at' => $expense->updated_at,
            ];

            return response()->json([
                'success' => true,
                'data' => $responseData,
                'message' => 'Expense created successfully'
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
                'message' => 'Failed to create expense: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified expense.
     */
    public function show(Expense $expense): JsonResponse
    {
        try {
            // Transform data to match frontend expectations
            $responseData = [
                'id' => $expense->id,
                'price' => $expense->amount, // Map amount to price for frontend
                'description' => $expense->description,
                'created_at' => $expense->created_at,
                'updated_at' => $expense->updated_at,
            ];

            return response()->json([
                'success' => true,
                'data' => $responseData,
                'message' => 'Expense retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve expense: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified expense.
     */
    public function update(Request $request, Expense $expense): JsonResponse
    {
        try {
            $validated = $request->validate([
                'price' => 'sometimes|required|numeric|min:0',
                'description' => 'sometimes|required|string|max:1000',
            ]);

            // Map frontend fields to database fields
            $updateData = [];
            if (isset($validated['price'])) {
                $updateData['amount'] = $validated['price'];
            }
            if (isset($validated['description'])) {
                $updateData['description'] = $validated['description'];
            }

            $expense->update($updateData);

            // Transform response to match frontend expectations
            $responseData = [
                'id' => $expense->id,
                'price' => $expense->amount, // Map amount to price for frontend
                'description' => $expense->description,
                'created_at' => $expense->created_at,
                'updated_at' => $expense->updated_at,
            ];

            return response()->json([
                'success' => true,
                'data' => $responseData,
                'message' => 'Expense updated successfully'
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
                'message' => 'Failed to update expense: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified expense.
     */
    public function destroy(Expense $expense): JsonResponse
    {
        try {
            $expense->delete();

            return response()->json([
                'success' => true,
                'message' => 'Expense deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete expense: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get expense statistics.
     */
    public function statistics(): JsonResponse
    {
        try {
            $totalExpenses = Expense::count();
            $totalAmount = Expense::sum('amount') ?: 0;
            $averageAmount = Expense::avg('amount') ?: 0;
            $thisMonthExpenses = Expense::whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->sum('amount') ?: 0;
            
            // Today's expenses
            $todayExpenses = Expense::whereDate('created_at', now()->toDateString())->count();
            $todayAmount = Expense::whereDate('created_at', now()->toDateString())->sum('amount') ?: 0;

            return response()->json([
                'success' => true,
                'data' => [
                    'total_expenses' => (int) $totalExpenses,
                    'total_amount' => (float) $totalAmount,
                    'average_amount' => round((float) $averageAmount, 2),
                    'this_month_amount' => (float) $thisMonthExpenses,
                    'today_expenses' => (int) $todayExpenses,
                    'today_amount' => (float) $todayAmount,
                ],
                'message' => 'Expense statistics retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve expense statistics: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all expenses with filters (not paginated) for exports
     */
    public function getAll(Request $request): JsonResponse
    {
        try {
            $query = Expense::query();

            // Search by description
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where('description', 'like', "%{$search}%");
            }

            // Filter by amount range
            if ($request->has('min_price') && $request->min_price) {
                $minAmount = $request->min_price;
                // Remove any non-numeric characters except decimal point
                $minAmount = preg_replace('/[^0-9.]/', '', $minAmount);

                if (is_numeric($minAmount) && $minAmount > 0) {
                    $query->where('amount', '>=', (float) $minAmount);
                }
            }

            if ($request->has('max_price') && $request->max_price) {
                $maxAmount = $request->max_price;
                // Remove any non-numeric characters except decimal point
                $maxAmount = preg_replace('/[^0-9.]/', '', $maxAmount);

                if (is_numeric($maxAmount) && $maxAmount > 0) {
                    $query->where('amount', '<=', (float) $maxAmount);
                }
            }

            // Date and time filtering with timezone support
            if ($request->has('date_from') || $request->has('date_to') || $request->has('time_from') || $request->has('time_to')) {
                $userTimezone = $request->get('timezone', 'UTC');
                
                $dateFrom = $request->get('date_from');
                $dateTo = $request->get('date_to');
                $timeFrom = $request->get('time_from');
                $timeTo = $request->get('time_to');

                // Handle time-only filters
                if ($timeFrom && !$dateFrom) {
                    $dateFrom = Carbon::today($userTimezone)->format('Y-m-d');
                }
                if ($timeTo && !$dateTo) {
                    $dateTo = Carbon::today($userTimezone)->format('Y-m-d');
                }

                if ($dateFrom) {
                    $start = Carbon::parse($dateFrom, $userTimezone);
                    if ($timeFrom) {
                        $timeFrom = strlen($timeFrom) === 5 ? $timeFrom . ':00' : $timeFrom;
                        $start->setTimeFromTimeString($timeFrom);
                    } else {
                        $start->startOfDay();
                    }
                    $query->where('created_at', '>=', $start->utc());
                }

                if ($dateTo) {
                    $end = Carbon::parse($dateTo, $userTimezone);
                    if ($timeTo) {
                        $timeTo = strlen($timeTo) === 5 ? $timeTo . ':00' : $timeTo;
                        $end->setTimeFromTimeString($timeTo);
                    } else {
                        $end->endOfDay();
                    }
                    $query->where('created_at', '<=', $end->utc());
                }
            }

            // Cursor-based pagination (reduced limit for better performance)
            $limit = 500; // Reduced from 10000 to prevent memory issues
            $cursor = $request->get('cursor'); // Last expense ID from previous batch

            // Apply cursor to get records before this ID (older records)
            if ($cursor) {
                $query->where('id', '<', $cursor);
            }

            // Order by ID for efficient cursor pagination
            $query->orderByDesc('id');

            // Get one extra record to check if more exists
            $expenses = $query->limit($limit + 1)->get();

            // Check if more records exist
            $hasMore = $expenses->count() > $limit;

            // Remove the extra record if exists
            if ($hasMore) {
                $expenses = $expenses->take($limit);
            }

            // Get cursor for next request (last ID in this batch)
            $nextCursor = $expenses->isNotEmpty() ? $expenses->last()->id : null;

            return response()->json([
                'success' => true,
                'data' => $expenses,
                'cursor' => $nextCursor,
                'has_more' => $hasMore,
                'count' => $expenses->count(),
                'message' => 'All expenses retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve all expenses: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export expenses to CSV.
     * Uses cursor-based pagination to handle large datasets.
     */
    public function export(Request $request): JsonResponse
    {
        try {
            // Use cursor-based pagination for efficient export (max 50k records)
            $limit = 500; // Reduced chunk size for better performance
            $maxRecords = 50000;
            $cursor = $request->get('cursor');
            $allExpenses = collect();
            
            do {
                $query = Expense::query()->orderByDesc('id');
                
                if ($cursor) {
                    $query->where('id', '<', $cursor);
                }
                
                $expenses = $query->limit($limit + 1)->get();
                $hasMore = $expenses->count() > $limit;
                
                if ($hasMore) {
                    $expenses = $expenses->take($limit);
                }
                
                $allExpenses = $allExpenses->concat($expenses);
                $cursor = $expenses->isNotEmpty() ? $expenses->last()->id : null;
                
                // Safety limit: prevent memory issues
                if ($allExpenses->count() >= $maxRecords) {
                    break;
                }
            } while ($hasMore && $cursor);

            $csvData = $allExpenses->map(function ($expense) {
                return [
                    'ID' => $expense->id,
                    'Amount' => $expense->amount,
                    'Description' => $expense->description,
                    'Created At' => $expense->created_at->format('Y-m-d H:i:s'),
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $csvData,
                'message' => 'Expenses exported successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to export expenses: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete all expenses with password verification.
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
                $expenseCount = Expense::count();
                
                // Delete all expenses
                Expense::truncate();

                DB::commit();

                Log::info("All expenses deleted by user: " . (Auth::user()?->full_name ?? 'Unknown'));

                return response()->json([
                    'success' => true,
                    'message' => "Successfully deleted {$expenseCount} expense(s)",
                    'deleted_count' => $expenseCount
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('Failed to delete all expenses: ' . $e->getMessage());
                throw $e;
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete expenses: ' . $e->getMessage()
            ], 500);
        }
    }
}