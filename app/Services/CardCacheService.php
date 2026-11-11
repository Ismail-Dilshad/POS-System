<?php

namespace App\Services;

use App\Models\Card;
use App\Models\NameCard;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class CardCacheService
{
    private const CACHE_PREFIX = 'pos_cards:';
    private const CACHE_TTL = 3600; // 1 hour
    private const ALL_CARDS_KEY = 'all_cards';
    private const NAME_CARDS_KEY = 'name_cards';
    private const CARDS_BY_NAME_CARD_KEY = 'cards_by_name_card:';
    private const IMAGE_CACHE_PREFIX = 'card_images:';
    
    // Multi-level caching
    private static $memoryCache = [];
    private const MEMORY_CACHE_LIMIT = 1000;
    private const MEMORY_CACHE_TTL = 300; // 5 minutes

    /**
     * Build comprehensive card cache with images
     */
    public function buildCardCache(): void
    {
        try {
            // Clear existing cache
            $this->clearCache();
            self::$memoryCache = [];
            
            // Get all name cards with their cards and images
            $nameCards = NameCard::with(['cards' => function ($query) {
                $query->where('is_active', true)
                      ->select('id', 'name_card_id', 'cost_price', 'sell_price', 'profit_margin', 'is_active');
            }])
            ->select('id', 'name', 'image_path', 'image_original_name', 'image_size', 'image_mime_type')
            ->get()
            ->map(function ($nameCard) {
                // Process image data
                $imageData = $this->processImageData($nameCard);
                
                return [
                    'id' => $nameCard->id,
                    'name' => $nameCard->name,
                    'image_path' => $nameCard->image_path,
                    'image_original_name' => $nameCard->image_original_name,
                    'image_size' => $nameCard->image_size,
                    'image_mime_type' => $nameCard->image_mime_type,
                    'image_url' => $nameCard->image_url,
                    'has_image' => $nameCard->has_image,
                    'image_data' => $imageData, // Base64 encoded image
                    'cards_count' => $nameCard->cards->count(),
                    'cards' => $nameCard->cards->map(function ($card) use ($nameCard, $imageData) {
                        return [
                            'id' => $card->id,
                            'name_card_id' => $card->name_card_id,
                            'name_card' => [
                                'id' => $nameCard->id,
                                'name' => $nameCard->name,
                                'image_url' => $nameCard->image_url,
                                'has_image' => $nameCard->has_image,
                                'image_data' => $imageData,
                            ],
                            'cost_price' => $card->cost_price,
                            'sell_price' => $card->sell_price,
                            'profit_margin' => $card->profit_margin,
                            'is_active' => $card->is_active,
                            'calculated_profit_margin' => $card->calculated_profit_margin,
                            'profit_amount' => $card->profit_amount,
                            'card_name' => $card->card_name,
                        ];
                    })->toArray()
                ];
            });

            // Cache name cards with their cards and images
            Cache::put(
                self::CACHE_PREFIX . self::NAME_CARDS_KEY,
                $nameCards->toArray(),
                self::CACHE_TTL
            );

            // Build flat cards array for quick access
            $allCards = collect();
            foreach ($nameCards as $nameCard) {
                foreach ($nameCard['cards'] as $card) {
                    $allCards->push($card);
                }
            }

            // Cache all cards
            Cache::put(
                self::CACHE_PREFIX . self::ALL_CARDS_KEY,
                $allCards->toArray(),
                self::CACHE_TTL
            );

            // Build cards by name card index
            $cardsByNameCard = [];
            foreach ($nameCards as $nameCard) {
                $cardsByNameCard[$nameCard['id']] = $nameCard['cards'];
            }

            // Cache cards by name card
            Cache::put(
                self::CACHE_PREFIX . 'cards_by_name_card_index',
                $cardsByNameCard,
                self::CACHE_TTL
            );

            // Cache individual images for faster access
            $this->cacheIndividualImages($nameCards);

            Log::info('Card cache built successfully with images', [
                'total_name_cards' => $nameCards->count(),
                'total_cards' => $allCards->count(),
                'cache_keys' => [
                    'name_cards' => self::CACHE_PREFIX . self::NAME_CARDS_KEY,
                    'all_cards' => self::CACHE_PREFIX . self::ALL_CARDS_KEY,
                    'cards_by_name_card' => self::CACHE_PREFIX . 'cards_by_name_card_index'
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to build card cache', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * Process image data for caching
     */
    private function processImageData(NameCard $nameCard): ?array
    {
        if (!$nameCard->has_image || !$nameCard->image_path) {
            return null;
        }

        try {
            // Check if image exists in storage
            if (!Storage::disk('public')->exists($nameCard->image_path)) {
                return null;
            }

            // Get image content
            $imageContent = Storage::disk('public')->get($nameCard->image_path);
            
            // Encode to base64 for caching
            $base64Image = base64_encode($imageContent);
            
            return [
                'base64' => $base64Image,
                'mime_type' => $nameCard->image_mime_type,
                'size' => $nameCard->image_size,
                'original_name' => $nameCard->image_original_name,
                'data_url' => 'data:' . $nameCard->image_mime_type . ';base64,' . $base64Image,
            ];
        } catch (\Exception $e) {
            Log::warning('Failed to process image for caching', [
                'name_card_id' => $nameCard->id,
                'image_path' => $nameCard->image_path,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Cache individual images for faster access
     */
    private function cacheIndividualImages($nameCards): void
    {
        foreach ($nameCards as $nameCard) {
            if ($nameCard['has_image'] && $nameCard['image_data']) {
                $imageKey = self::IMAGE_CACHE_PREFIX . 'name_card_' . $nameCard['id'];
                Cache::put($imageKey, $nameCard['image_data'], self::CACHE_TTL);
            }
        }
    }

    /**
     * Get all name cards with cards and images from cache
     */
    public function getNameCardsWithCards(): array
    {
        try {
            // Try memory cache first
            $cached = $this->getFromCache(self::NAME_CARDS_KEY);
            if ($cached !== null) {
                return $cached;
            }

            // Try Redis cache
            $redisData = Cache::get(self::CACHE_PREFIX . self::NAME_CARDS_KEY);
            if ($redisData !== null) {
                $this->setMemoryCache(self::NAME_CARDS_KEY, $redisData);
                return $redisData;
            }

            // Cache miss - rebuild cache
            $this->buildCardCache();
            $redisData = Cache::get(self::CACHE_PREFIX . self::NAME_CARDS_KEY);
            
            if ($redisData !== null) {
                $this->setMemoryCache(self::NAME_CARDS_KEY, $redisData);
                return $redisData;
            }

            return [];

        } catch (\Exception $e) {
            Log::error('Failed to get name cards from cache', [
                'error' => $e->getMessage()
            ]);
            return [];
        }
    }

    /**
     * Get cards by name card ID with images
     */
    public function getCardsByNameCard(int $nameCardId): array
    {
        try {
            $cacheKey = self::CARDS_BY_NAME_CARD_KEY . $nameCardId;
            
            // Try memory cache first
            $cached = $this->getFromCache($cacheKey);
            if ($cached !== null) {
                return $cached;
            }

            // Try Redis cache
            $redisData = Cache::get(self::CACHE_PREFIX . $cacheKey);
            if ($redisData !== null) {
                $this->setMemoryCache($cacheKey, $redisData);
                return $redisData;
            }

            // Try to get from cards by name card index
            $cardsByNameCardIndex = Cache::get(self::CACHE_PREFIX . 'cards_by_name_card_index');
            if ($cardsByNameCardIndex && isset($cardsByNameCardIndex[$nameCardId])) {
                $cards = $cardsByNameCardIndex[$nameCardId];
                $this->setMemoryCache($cacheKey, $cards);
                return $cards;
            }

            return [];

        } catch (\Exception $e) {
            Log::error('Failed to get cards by name card from cache', [
                'name_card_id' => $nameCardId,
                'error' => $e->getMessage()
            ]);
            return [];
        }
    }

    /**
     * Get all cards with images
     */
    public function getAllCards(): array
    {
        try {
            // Try memory cache first
            $cached = $this->getFromCache(self::ALL_CARDS_KEY);
            if ($cached !== null) {
                return $cached;
            }

            // Try Redis cache
            $redisData = Cache::get(self::CACHE_PREFIX . self::ALL_CARDS_KEY);
            if ($redisData !== null) {
                $this->setMemoryCache(self::ALL_CARDS_KEY, $redisData);
                return $redisData;
            }

            // Cache miss - rebuild cache
            $this->buildCardCache();
            $redisData = Cache::get(self::CACHE_PREFIX . self::ALL_CARDS_KEY);
            
            if ($redisData !== null) {
                $this->setMemoryCache(self::ALL_CARDS_KEY, $redisData);
                return $redisData;
            }

            return [];

        } catch (\Exception $e) {
            Log::error('Failed to get all cards from cache', [
                'error' => $e->getMessage()
            ]);
            return [];
        }
    }

    /**
     * Get specific image from cache
     */
    public function getImageData(int $nameCardId): ?array
    {
        try {
            $imageKey = self::IMAGE_CACHE_PREFIX . 'name_card_' . $nameCardId;
            
            // Try memory cache first
            $cached = $this->getFromCache($imageKey);
            if ($cached !== null) {
                return $cached;
            }

            // Try Redis cache
            $redisData = Cache::get($imageKey);
            if ($redisData !== null) {
                $this->setMemoryCache($imageKey, $redisData);
                return $redisData;
            }

            return null;

        } catch (\Exception $e) {
            Log::error('Failed to get image data from cache', [
                'name_card_id' => $nameCardId,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Multi-level cache getter (Memory → Redis → Database)
     */
    private function getFromCache(string $key): ?array
    {
        // L1: Check memory cache first (fastest)
        if (isset(self::$memoryCache[$key])) {
            $cached = self::$memoryCache[$key];
            if (time() - $cached['timestamp'] < self::MEMORY_CACHE_TTL) {
                return $cached['data'];
            }
            unset(self::$memoryCache[$key]);
        }
        return null;
    }

    /**
     * Set memory cache with size limit
     */
    private function setMemoryCache(string $key, array $data): void
    {
        if (count(self::$memoryCache) >= self::MEMORY_CACHE_LIMIT) {
            $keys = array_keys(self::$memoryCache);
            $removeCount = count($keys) - self::MEMORY_CACHE_LIMIT + 1;
            for ($i = 0; $i < $removeCount; $i++) {
                unset(self::$memoryCache[$keys[$i]]);
            }
        }

        self::$memoryCache[$key] = [
            'data' => $data,
            'timestamp' => time()
        ];
    }

    /**
     * Clear all card caches including images
     */
    public function clearCache(): void
    {
        try {
            // Clear main caches
            Cache::forget(self::CACHE_PREFIX . self::NAME_CARDS_KEY);
            Cache::forget(self::CACHE_PREFIX . self::ALL_CARDS_KEY);
            Cache::forget(self::CACHE_PREFIX . 'cards_by_name_card_index');
            
            // Clear all image caches (only for Redis driver)
            if (config('cache.default') === 'redis') {
                try {
                    $keys = Cache::getRedis()->keys(self::IMAGE_CACHE_PREFIX . '*');
                    if (!empty($keys)) {
                        Cache::getRedis()->del($keys);
                    }
                    
                    // Clear all cards by name card caches
                    $keys = Cache::getRedis()->keys(self::CACHE_PREFIX . self::CARDS_BY_NAME_CARD_KEY . '*');
                    if (!empty($keys)) {
                        Cache::getRedis()->del($keys);
                    }
                } catch (\Exception $e) {
                    Log::warning('Failed to clear Redis keys', ['error' => $e->getMessage()]);
                }
            }

            Log::info('Card cache cleared successfully (including images)');
        } catch (\Exception $e) {
            Log::error('Failed to clear card cache', [
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Invalidate all caches including memory cache
     */
    public function invalidateCache(): void
    {
        try {
            $this->clearCache();
            self::$memoryCache = [];
            Log::info('Card cache invalidated completely (Redis + Memory + Images)');
        } catch (\Exception $e) {
            Log::error('Failed to invalidate card cache', [
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Check if cache exists and is valid
     */
    public function isCacheValid(): bool
    {
        return Cache::has(self::CACHE_PREFIX . self::NAME_CARDS_KEY) &&
               Cache::has(self::CACHE_PREFIX . self::ALL_CARDS_KEY);
    }

    /**
     * Get comprehensive cache statistics
     */
    public function getCacheStats(): array
    {
        $nameCardsExists = Cache::has(self::CACHE_PREFIX . self::NAME_CARDS_KEY);
        $allCardsExists = Cache::has(self::CACHE_PREFIX . self::ALL_CARDS_KEY);
        
        // Count cached images (only for Redis driver)
        $cachedImagesCount = 0;
        if (config('cache.default') === 'redis') {
            try {
                $imageKeys = Cache::getRedis()->keys(self::IMAGE_CACHE_PREFIX . '*');
                $cachedImagesCount = count($imageKeys);
            } catch (\Exception $e) {
                Log::warning('Failed to count Redis keys', ['error' => $e->getMessage()]);
            }
        }

        $stats = [
            'name_cards_exists' => $nameCardsExists,
            'all_cards_exists' => $allCardsExists,
            'cache_valid' => $nameCardsExists && $allCardsExists,
            'cached_images_count' => $cachedImagesCount,
            'cache_driver' => config('cache.default'),
            'memory_cache_size' => count(self::$memoryCache),
            'cache_ttl' => self::CACHE_TTL,
        ];

        return $stats;
    }
}
