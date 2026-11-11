<?php

namespace App\Console\Commands;

use App\Services\ProductCacheService;
use Illuminate\Console\Command;

class BuildProductCache extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'pos:build-cache
                            {--clear : Clear the cache before building}
                            {--stats : Show cache statistics after building}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Build Redis cache for POS barcode search (zero delay lookup)';

    private ProductCacheService $productCacheService;

    public function __construct(ProductCacheService $productCacheService)
    {
        parent::__construct();
        $this->productCacheService = $productCacheService;
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('🚀 Building POS product cache for zero-delay barcode search...');

        try {
            // Clear cache if requested
            if ($this->option('clear')) {
                $this->info('🧹 Clearing existing cache...');
                $this->productCacheService->clearCache();
            }

            // Build the cache
            $this->info('⚡ Building Redis cache...');
            $startTime = microtime(true);

            $this->productCacheService->buildProductCache();

            $duration = round((microtime(true) - $startTime) * 1000, 2);
            $this->info("✅ Cache built successfully in {$duration}ms");

            // Show statistics if requested
            if ($this->option('stats')) {
                $this->showCacheStats();
            }

            $this->newLine();
            $this->info('🎯 POS barcode search is now optimized for zero-delay lookups!');

            return self::SUCCESS;

        } catch (\Exception $e) {
            $this->error('❌ Failed to build product cache:');
            $this->error($e->getMessage());

            if ($this->getOutput()->isVerbose()) {
                $this->error($e->getTraceAsString());
            }

            return self::FAILURE;
        }
    }

    /**
     * Show cache statistics
     */
    private function showCacheStats(): void
    {
        try {
            $stats = $this->productCacheService->getCacheStats();

            $this->newLine();
            $this->info('📊 Cache Statistics:');
            $this->table(
                ['Metric', 'Value'],
                [
                    ['Barcode Index', $stats['barcode_index_exists'] ? '✅ Active' : '❌ Missing'],
                    ['Products Cache', $stats['all_products_exists'] ? '✅ Active' : '❌ Missing'],
                    ['Cache Valid', $stats['cache_valid'] ? '✅ Valid' : '❌ Invalid'],
                    [
                        'Index TTL',
                        isset($stats['barcode_index_ttl'])
                            ? ($stats['barcode_index_ttl'] > 0 ? "{$stats['barcode_index_ttl']}s" : 'Expired')
                            : 'N/A'
                    ],
                    [
                        'Products TTL',
                        isset($stats['all_products_ttl'])
                            ? ($stats['all_products_ttl'] > 0 ? "{$stats['all_products_ttl']}s" : 'Expired')
                            : 'N/A'
                    ],
                ]
            );

        } catch (\Exception $e) {
            $this->warn('⚠️  Could not retrieve cache statistics: ' . $e->getMessage());
        }
    }
}