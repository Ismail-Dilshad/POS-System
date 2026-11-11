<?php

namespace App\Http\Controllers;

use App\Models\NameCard;
use App\Services\CardCacheService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class NameCardController extends Controller
{
    private $cardCacheService;

    public function __construct(CardCacheService $cardCacheService)
    {
        $this->cardCacheService = $cardCacheService;
    }
    /**
     * Display a listing of name cards.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $includeImages = $request->get('include_images', false);
            $useCache = $request->get('use_cache', true);
            
            // Try cache first for better performance
            if ($useCache) {
                $nameCards = $this->cardCacheService->getNameCardsWithCards();
                if (!empty($nameCards)) {
                    return response()->json([
                        'success' => true,
                        'data' => $nameCards,
                        'message' => 'Name cards retrieved from cache',
                        'cached' => true
                    ]);
                }
            }

            // Fallback to database if cache miss
            $query = NameCard::withCount('cards');

            // Search functionality
            if ($request->has('search') && !empty($request->search)) {
                $query->search($request->search);
            }

            // Filter by image presence
            if ($request->has('has_image')) {
                if ($request->has_image === 'true') {
                    $query->withImages();
                } elseif ($request->has_image === 'false') {
                    $query->withoutImages();
                }
            }

            // Pagination
            $perPage = $request->get('per_page', 15);
            $nameCards = $query->latest()->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $nameCards,
                'message' => 'Name cards retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve name cards',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created name card.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:name_cards,name',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120', // 5MB max
            ]);

            $nameCardData = [
                'name' => $validated['name'],
            ];

            // Handle image upload
            if ($request->hasFile('image')) {
                $image = $request->file('image');

                // Generate unique filename
                $filename = Str::uuid() . '.' . $image->getClientOriginalExtension();

                // Store image in public/name-cards directory
                $imagePath = $image->storeAs('name-cards', $filename, 'public');

                $nameCardData['image_path'] = $imagePath;
                $nameCardData['image_original_name'] = $image->getClientOriginalName();
                $nameCardData['image_size'] = $image->getSize();
                $nameCardData['image_mime_type'] = $image->getMimeType();
            }

            $nameCard = NameCard::create($nameCardData);

            // Invalidate cache after creation
            $this->cardCacheService->clearCache();

            return response()->json([
                'success' => true,
                'data' => $nameCard,
                'message' => 'Name card created successfully'
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
                'message' => 'Failed to create name card',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified name card.
     */
    public function show(NameCard $nameCard): JsonResponse
    {
        try {
            $nameCard->load(['cards' => function ($query) {
                $query->orderBy('created_at', 'desc');
            }]);

            return response()->json([
                'success' => true,
                'data' => $nameCard,
                'message' => 'Name card retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve name card',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified name card.
     */
    public function update(Request $request, NameCard $nameCard): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:name_cards,name,' . $nameCard->id,
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120', // 5MB max, added webp support
                'remove_image' => 'nullable|string|in:0,1,true,false'
            ]);

            $updateData = [
                'name' => $validated['name']
            ];

            // Handle image removal - convert string boolean to actual boolean
            if ($request->has('remove_image')) {
                $removeImage = filter_var($request->input('remove_image'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                if ($removeImage === true) {
                    // Delete existing image file if it exists
                    if ($nameCard->image_path && \Storage::disk('public')->exists($nameCard->image_path)) {
                        \Storage::disk('public')->delete($nameCard->image_path);
                    }
                    $updateData['image_path'] = null;
                    $updateData['image_original_name'] = null;
                    $updateData['image_size'] = null;
                    $updateData['image_mime_type'] = null;
                }
            }

            // Handle new image upload
            if ($request->hasFile('image')) {
                $image = $request->file('image');
                
                // Additional validation for image
                if (!$image->isValid()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid image file',
                        'errors' => ['image' => ['The uploaded file is not valid.']]
                    ], 422);
                }
                
                // Check file size (5MB = 5120 KB)
                if ($image->getSize() > 5120 * 1024) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Image file too large',
                        'errors' => ['image' => ['The image must not be larger than 5MB.']]
                    ], 422);
                }
                
                // Delete old image if it exists
                if ($nameCard->image_path && \Storage::disk('public')->exists($nameCard->image_path)) {
                    \Storage::disk('public')->delete($nameCard->image_path);
                }
                
                // Generate unique filename
                $filename = \Str::uuid() . '.' . $image->getClientOriginalExtension();
                
                // Store image in public/name-cards directory
                $imagePath = $image->storeAs('name-cards', $filename, 'public');
                
                $updateData['image_path'] = $imagePath;
                $updateData['image_original_name'] = $image->getClientOriginalName();
                $updateData['image_size'] = $image->getSize();
                $updateData['image_mime_type'] = $image->getMimeType();
            }

            $nameCard->update($updateData);

            // Invalidate cache after update
            $this->cardCacheService->clearCache();

            return response()->json([
                'success' => true,
                'data' => $nameCard->fresh(),
                'message' => 'Name card updated successfully'
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
                'message' => 'Failed to update name card',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified name card.
     */
    public function destroy(NameCard $nameCard): JsonResponse
    {
        try {
            // Check if name card has associated cards
            if ($nameCard->cards()->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete name card that has associated cards'
                ], 422);
            }

            $nameCard->delete();

            // Invalidate cache after deletion
            $this->cardCacheService->clearCache();

            return response()->json([
                'success' => true,
                'message' => 'Name card deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete name card',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get name cards statistics.
     */
    public function statistics(): JsonResponse
    {
        try {
            $totalNameCards = NameCard::count();
            $nameCardsWithImages = NameCard::withImages()->count();
            $nameCardsWithoutImages = NameCard::withoutImages()->count();
            $totalAssociatedCards = NameCard::withCount('cards')->get()->sum('cards_count');

            return response()->json([
                'success' => true,
                'data' => [
                    'total_name_cards' => $totalNameCards,
                    'name_cards_with_images' => $nameCardsWithImages,
                    'name_cards_without_images' => $nameCardsWithoutImages,
                    'total_associated_cards' => $totalAssociatedCards,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve name cards statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get name cards for dropdown/select options.
     */
    public function options(): JsonResponse
    {
        try {
            $nameCards = NameCard::select('id', 'name')
                ->orderBy('name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $nameCards,
                'message' => 'Name card options retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve name card options',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}