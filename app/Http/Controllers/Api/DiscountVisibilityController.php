<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class DiscountVisibilityController extends Controller
{
    private const CACHE_KEY = 'pos_discount_visibility_enabled';

    public function show(Request $request): JsonResponse
    {
        $enabled = Cache::rememberForever(self::CACHE_KEY, fn () => true);

        return response()->json([
            'enabled' => (bool) $enabled,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || !$user->isAdmin()) {
            return response()->json([
                'message' => 'Only administrators can update discount visibility.',
            ], 403);
        }

        $validated = $request->validate([
            'enabled' => ['required', 'boolean'],
        ]);

        $enabled = (bool) $validated['enabled'];

        Cache::forever(self::CACHE_KEY, $enabled);

        return response()->json([
            'enabled' => $enabled,
        ]);
    }
}
