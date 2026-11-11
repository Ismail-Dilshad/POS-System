<?php

namespace App\Http\Controllers;

use App\Models\Card;
use App\Models\NameCard;
use App\Services\CardCacheService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CardController extends Controller
{
    private $cardCacheService;

    public function __construct(CardCacheService $cardCacheService)
    {
        $this->cardCacheService = $cardCacheService;
    }
    /**
     * Display a listing of cards.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $useCache = $request->get('use_cache', true);
            
            // Try cache first for better performance
            if ($useCache) {
                $cards = $this->cardCacheService->getAllCards();
                if (!empty($cards)) {
                    return response()->json([
                        'success' => true,
                        'data' => $cards,
                        'message' => 'Cards retrieved from cache',
                        'cached' => true
                    ]);
                }
            }

            // Fallback to database if cache miss
            $query = Card::with('nameCard');

            // Search functionality
            if ($request->has('search') && !empty($request->search)) {
                $query->search($request->search);
            }

            // Filter by name card
            if ($request->has('name_card_id') && !empty($request->name_card_id)) {
                $query->where('name_card_id', $request->name_card_id);
            }

            // Filter by active status
            if ($request->has('is_active')) {
                if ($request->is_active === 'true') {
                    $query->active();
                } elseif ($request->is_active === 'false') {
                    $query->inactive();
                }
            }

            // Filter by profitability
            if ($request->has('profitable')) {
                if ($request->profitable === 'true') {
                    $query->profitable();
                } elseif ($request->profitable === 'false') {
                    $query->notProfitable();
                }
            }

            // Filter by price range
            if ($request->has('min_price') || $request->has('max_price')) {
                $query->priceRange($request->min_price, $request->max_price);
            }

            // Pagination
            $perPage = $request->get('per_page', 15);
            $cards = $query->latest()->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $cards,
                'message' => 'Cards retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve cards',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created card.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name_card_id' => 'required|exists:name_cards,id',
            'cost_price' => 'required|numeric|min:0',
            'sell_price' => 'required|numeric|min:0',
            'is_active' => 'boolean'
        ]);

        // Set defaults
        $cardData = $request->all();
        $cardData['is_active'] = $cardData['is_active'] ?? true;

        $card = Card::create($cardData);
        $card->load('nameCard');

        // Invalidate cache after creation
        $this->cardCacheService->clearCache();

        return response()->json([
            'success' => true,
            'data' => $card,
            'message' => 'Card created successfully'
        ]);
    }

    /**
     * Display the specified card.
     */
    public function show(Card $card): JsonResponse
    {
        try {
            $card->load('nameCard');

            return response()->json([
                'success' => true,
                'data' => $card,
                'message' => 'Card retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve card',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified card.
     */
    public function update(Request $request, Card $card): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name_card_id' => 'required|integer|exists:name_cards,id',
                'cost_price' => 'required|numeric|min:0',
                'sell_price' => 'required|numeric|min:0',
                'is_active' => 'boolean'
            ]);

            $card->update($validated);

            // Invalidate cache after update
            $this->cardCacheService->clearCache();

            return response()->json([
                'success' => true,
                'data' => $card->load('nameCard'),
                'message' => 'Card updated successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update card',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified card.
     */
    public function destroy(Card $card): JsonResponse
    {
        try {
            $card->delete();

            // Invalidate cache after deletion
            $this->cardCacheService->clearCache();

            return response()->json([
                'success' => true,
                'message' => 'Card deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete card',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Toggle card active status.
     */
    public function toggleStatus(Card $card): JsonResponse
    {
        try {
            $card->update(['is_active' => !$card->is_active]);
            $card->load('nameCard');

            // Invalidate cache after status change
            $this->cardCacheService->clearCache();

            return response()->json([
                'success' => true,
                'data' => $card,
                'message' => 'Card status updated successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update card status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get cards statistics.
     */
    public function statistics(): JsonResponse
    {
        try {
            $totalCards = Card::count();
            $activeCards = Card::active()->count();
            $inactiveCards = Card::inactive()->count();
            $profitableCards = Card::profitable()->count();
            $notProfitableCards = Card::notProfitable()->count();

            $totalValue = Card::active()->sum('sell_price');
            $totalCost = Card::active()->sum('cost_price');
            $totalProfit = $totalValue - $totalCost;

            $averageProfit = Card::active()->avg('profit_margin') ?? 0;

            return response()->json([
                'success' => true,
                'data' => [
                    'total_cards' => $totalCards,
                    'active_cards' => $activeCards,
                    'inactive_cards' => $inactiveCards,
                    'profitable_cards' => $profitableCards,
                    'not_profitable_cards' => $notProfitableCards,
                    'total_value' => round($totalValue, 2),
                    'total_cost' => round($totalCost, 2),
                    'total_profit' => round($totalProfit, 2),
                    'average_profit_margin' => round($averageProfit, 2),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve cards statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get cards by name card ID.
     */
    public function byNameCard(NameCard $nameCard): JsonResponse
    {
        try {
            $cards = $nameCard->cards()
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $cards,
                'message' => 'Cards retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve cards',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk update card statuses.
     */
    public function bulkUpdateStatus(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'card_ids' => 'required|array',
                'card_ids.*' => 'exists:cards,id',
                'is_active' => 'required|boolean'
            ]);

            $updated = Card::whereIn('id', $validated['card_ids'])
                ->update(['is_active' => $validated['is_active']]);

            // Invalidate cache after bulk update
            $this->cardCacheService->clearCache();

            return response()->json([
                'success' => true,
                'data' => [
                    'updated_count' => $updated
                ],
                'message' => 'Cards status updated successfully'
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
                'message' => 'Failed to update cards status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Rebuild card cache
     */
    public function rebuildCache(): JsonResponse
    {
        try {
            $this->cardCacheService->buildCardCache();
            
            return response()->json([
                'success' => true,
                'message' => 'Card cache rebuilt successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to rebuild card cache: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get cache statistics
     */
    public function cacheStats(): JsonResponse
    {
        try {
            $stats = $this->cardCacheService->getCacheStats();
            
            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get cache stats: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Clear card cache
     */
    public function clearCache(): JsonResponse
    {
        try {
            $this->cardCacheService->clearCache();
            
            return response()->json([
                'success' => true,
                'message' => 'Card cache cleared successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to clear card cache: ' . $e->getMessage()
            ], 500);
        }
    }
}