<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Return System Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration settings for the return management system
    |
    */

    // Return period settings
    'return_period_days' => env('RETURN_PERIOD_DAYS', 30),
    
    // Stock adjustment limits
    'max_stock_adjustment' => env('MAX_STOCK_ADJUSTMENT', 1000),
    
    // Business rules
    'allow_duplicate_returns' => env('ALLOW_DUPLICATE_RETURNS', false),
    'duplicate_return_window_hours' => env('DUPLICATE_RETURN_WINDOW_HOURS', 24),
    
    // Price validation
    'price_tolerance' => env('PRICE_TOLERANCE', 1.00),
    
    // Authorization
    'require_ownership_validation' => env('REQUIRE_OWNERSHIP_VALIDATION', false),
    
    // Logging
    'log_return_processing' => env('LOG_RETURN_PROCESSING', true),
    'log_stock_adjustments' => env('LOG_STOCK_ADJUSTMENTS', true),
];
