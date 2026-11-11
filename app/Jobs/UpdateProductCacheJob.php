<?php

namespace App\Jobs;

use App\Services\ProductCacheService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class UpdateProductCacheJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public array $productIds;
    public string $type;

    /**
     * Create a new job instance.
     */
    public function __construct(array $productIds, string $type = 'product')
    {
        $this->productIds = $productIds;
        $this->type = $type;
    }

    /**
     * Execute the job.
     */
    public function handle(ProductCacheService $cacheService): void
    {
        try {
            $startTime = microtime(true);
            $successCount = 0;
            $failureCount = 0;
            
            foreach ($this->productIds as $productId) {
                try {
                    $cacheService->updateProductStock($productId, $this->type);
                    $successCount++;
                } catch (\Exception $e) {
                    $failureCount++;
                    Log::warning('Failed to update cache for individual product', [
                        'product_id' => $productId,
                        'type' => $this->type,
                        'error' => $e->getMessage()
                    ]);
                }
            }
            
            $duration = (microtime(true) - $startTime) * 1000;
            
            Log::info('Product cache update job completed', [
                'total_products' => count($this->productIds),
                'success_count' => $successCount,
                'failure_count' => $failureCount,
                'type' => $this->type,
                'duration_ms' => round($duration, 2)
            ]);
            
            // If more than 50% failed, mark job as failed
            if ($failureCount > count($this->productIds) / 2) {
                throw new \Exception("Too many cache update failures: {$failureCount}/" . count($this->productIds));
            }
            
        } catch (\Exception $e) {
            Log::error('Product cache update job failed', [
                'product_ids' => $this->productIds,
                'type' => $this->type,
                'error' => $e->getMessage()
            ]);
            
            // Re-throw to mark job as failed
            throw $e;
        }
    }
}
