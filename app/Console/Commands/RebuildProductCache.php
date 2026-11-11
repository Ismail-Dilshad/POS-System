<?php

namespace App\Console\Commands;

use App\Services\ProductCacheService;
use Illuminate\Console\Command;

class RebuildProductCache extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cache:rebuild-products {--force : Force rebuild even if cache is valid}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Rebuild the product cache for POS system with smart invalidation and deletion management';

    /**
     * Execute the console command.
     */
    public function handle(ProductCacheService $cacheService)
    {
        $this->info('🚀 Starting product cache rebuild...');

        try {
            // Check if cache is already valid
            if (!$this->option('force') && $cacheService->isCacheValid()) {
                $this->info('✅ Product cache is already valid.');

                if (!$this->confirm('Do you want to rebuild anyway?')) {
                    $this->info('Cache rebuild cancelled.');
                    return 0;
                }
            }

            // Show current stats
            $this->info('📊 Current cache status:');
            $stats = $cacheService->getCacheStats();
            $this->table(
                ['Cache Key', 'Status'],
                [
                    ['Barcode Index', $stats['barcode_index_exists'] ? '✅ Exists' : '❌ Missing'],
                    ['All Products', $stats['all_products_exists'] ? '✅ Exists' : '❌ Missing'],
                    ['Cache Valid', $stats['cache_valid'] ? '✅ Valid' : '❌ Invalid'],
                ]
            );

            // Invalidate existing cache
            $this->info('🗑️  Invalidating existing cache...');
            $cacheService->invalidateCache();

            // Rebuild cache
            $this->info('🔄 Rebuilding product cache...');
            $cacheService->buildProductCache();

            // Show new stats
            $this->info('✅ Cache rebuild completed successfully!');
            $newStats = $cacheService->getCacheStats();
            $this->table(
                ['Cache Key', 'Status'],
                [
                    ['Barcode Index', $newStats['barcode_index_exists'] ? '✅ Exists' : '❌ Missing'],
                    ['All Products', $newStats['all_products_exists'] ? '✅ Exists' : '❌ Missing'],
                    ['Cache Valid', $newStats['cache_valid'] ? '✅ Valid' : '❌ Invalid'],
                ]
            );

            // Test search functionality
            $this->info('🔍 Testing cache functionality...');
            $testResults = $cacheService->searchByBarcode('8434350102008');
            $this->info("Found " . count($testResults) . " products for test barcode search");

            $this->info('🎉 Product cache rebuild completed successfully!');
            return 0;

        } catch (\Exception $e) {
            $this->error('❌ Failed to rebuild product cache:');
            $this->error($e->getMessage());
            return 1;
        }
    }
}
