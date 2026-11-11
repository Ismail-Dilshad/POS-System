<?php

namespace App\Providers;

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\ServiceProvider;
use App\Models\Transaction;
use App\Models\Product;
use App\Models\ScaleProduct;
use App\Observers\TransactionObserver;
use App\Observers\ProductObserver;
use App\Observers\ScaleProductObserver;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->ensureCacheStoreIsReady();
        
        // Suppress PHP 8.5 deprecation warnings for PDO constants in Laravel vendor files
        // These will be fixed in future Laravel updates
        if (PHP_VERSION_ID >= 80500) {
            set_error_handler(function ($errno, $errstr, $errfile, $errline) {
                // Suppress specific PDO deprecation warnings from vendor files
                if ($errno === E_DEPRECATED && 
                    str_contains($errfile, 'vendor/laravel/framework') &&
                    (str_contains($errstr, 'PDO::MYSQL_ATTR_SSL_CA') || 
                     str_contains($errstr, 'PDO::PGSQL_ATTR_DISABLE_PREPARES'))) {
                    return true; // Suppress this warning
                }
                // Let other errors through
                return false;
            }, E_DEPRECATED);
        }
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $timezone = config('app.timezone');

        if (is_string($timezone) && $timezone !== '') {
            date_default_timezone_set($timezone);

            try {
                $sanitizedTimezone = str_replace("'", "''", $timezone);
                DB::statement("SET TIME ZONE '{$sanitizedTimezone}'");
            } catch (\Throwable $exception) {
                Log::warning('Failed to set database timezone', [
                    'timezone' => $timezone,
                    'error' => $exception->getMessage(),
                ]);
            }
        }

        // Removed duplicate Inertia sharing - handled in HandleInertiaRequests middleware

        // Register observers
        Transaction::observe(TransactionObserver::class);
        Product::observe(ProductObserver::class);
        ScaleProduct::observe(ScaleProductObserver::class);
    }

    private function ensureCacheStoreIsReady(): void
    {
        if (config('cache.default') !== 'database') {
            return;
        }

        if (! app()->runningInConsole()) {
            return;
        }

        try {
            $connection = config('cache.stores.database.connection');
            $table = config('cache.stores.database.table', 'cache');

            if (Schema::connection($connection)->hasTable($table)) {
                return;
            }
        } catch (\Throwable $exception) {
            // If the database connection is unavailable, fall back to file cache.
        }

        config(['cache.default' => 'file']);
    }
}