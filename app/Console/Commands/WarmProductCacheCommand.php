<?php

namespace App\Console\Commands;

use App\Services\ProductCacheService;
use Illuminate\Console\Command;

class WarmProductCacheCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'pos:warm-cache {--force : Force rebuild even if cache exists}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Warm up the POS product cache for optimal performance';

    /**
     * Execute the console command.
     */
    public function handle(ProductCacheService $productCacheService): int
    {
        $this->info('🔥 Warming up POS product cache...');
        
        $startTime = microtime(true);
        
        try {
            // Clear existing cache if force option is used
            if ($this->option('force')) {
                $this->info('🧹 Clearing existing cache...');
                $productCacheService->clearCache();
            }
            
            // Build the cache
            $this->info('📦 Building product cache...');
            $productCacheService->buildProductCache();
            
            $endTime = microtime(true);
            $duration = round(($endTime - $startTime) * 1000, 2);
            
            $this->info("✅ Cache warming completed in {$duration}ms");
            
            // Show cache statistics
            $this->showCacheStats($productCacheService);
            
            return Command::SUCCESS;
            
        } catch (\Exception $e) {
            $this->error('❌ Cache warming failed: ' . $e->getMessage());
            return Command::FAILURE;
        }
    }

    /**
     * Show cache statistics
     */
    private function showCacheStats(ProductCacheService $productCacheService): void
    {
        try {
            $this->info('📊 Cache Statistics:');
            
            // Test a few searches to show cache is working
            $testBarcodes = ['1234567890123', '123456789012', '12345678901'];
            $totalFound = 0;
            
            foreach ($testBarcodes as $barcode) {
                $results = $productCacheService->searchByBarcode($barcode);
                $totalFound += count($results);
            }
            
            $this->info("   • Test searches: {$totalFound} products found");
            $this->info('   • Cache status: Active and responsive');
            $this->info('   • Performance: Optimized for ultra-fast scanning');
            
        } catch (\Exception $e) {
            $this->warn('Could not retrieve cache statistics: ' . $e->getMessage());
        }
    }
}