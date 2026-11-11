<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class PosVisibilityController extends Controller
{
    private const CACHE_KEY = 'pos_visibility_sync_timestamp';

    public function show(Request $request): JsonResponse
    {
        $timestamp = Cache::rememberForever(self::CACHE_KEY, fn () => now()->timestamp);

        return response()->json([
            'timestamp' => (int) $timestamp,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || !$user->isAdmin()) {
            return response()->json([
                'message' => 'Only administrators can update POS visibility.',
            ], 403);
        }

        $timestamp = now()->timestamp;
        Cache::forever(self::CACHE_KEY, $timestamp);

        return response()->json([
            'timestamp' => $timestamp,
        ]);
    }
}
