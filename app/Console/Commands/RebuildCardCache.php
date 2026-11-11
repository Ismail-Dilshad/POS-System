<?php

namespace App\Console\Commands;

use App\Services\CardCacheService;
use Illuminate\Console\Command;

class RebuildCardCache extends Command
{
    protected $signature = 'cards:rebuild-cache {--with-images : Include image caching}';
    protected $description = 'Rebuild the card cache with images for better POS performance';

    public function handle(CardCacheService $cardCacheService)
    {
        $this->info('Rebuilding card cache with images...');
        
        try {
            $startTime = microtime(true);
            $cardCacheService->buildCardCache();
            $endTime = microtime(true);
            
            $executionTime = round(($endTime - $startTime) * 1000, 2);
            $this->info("Card cache rebuilt successfully in {$executionTime}ms!");
            
            // Show cache stats
            $stats = $cardCacheService->getCacheStats();
            $this->table(
                ['Metric', 'Value'],
                [
                    ['Name Cards Cached', $stats['name_cards_exists'] ? 'Yes' : 'No'],
                    ['All Cards Cached', $stats['all_cards_exists'] ? 'Yes' : 'No'],
                    ['Cached Images', $stats['cached_images_count']],
                    ['Memory Cache Size', $stats['memory_cache_size']],
                    ['Cache Driver', $stats['cache_driver']],
                ]
            );
        } catch (\Exception $e) {
            $this->error('Failed to rebuild card cache: ' . $e->getMessage());
            return 1;
        }

        return 0;
    }
}
