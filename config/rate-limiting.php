<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Rate Limiting Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure the rate limiting for different parts of the
    | application. These limits help prevent abuse and ensure fair usage.
    |
    */

    'inventory' => [
        'max_attempts' => 60, // 60 requests per minute
        'decay_minutes' => 1,
    ],

    'cache' => [
        'max_attempts' => 30, // 30 requests per minute (stricter for cache operations)
        'decay_minutes' => 1,
    ],

    'adjustments' => [
        'max_attempts' => 20, // 20 requests per minute (moderate for adjustments)
        'decay_minutes' => 1,
    ],

    'api' => [
        'max_attempts' => 100, // 100 requests per minute (general API)
        'decay_minutes' => 1,
    ],
];
