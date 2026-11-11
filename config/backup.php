<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Backup Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for backup and restore functionality
    |
    */

    'upload' => [
        'max_file_size' => 500 * 1024 * 1024, // 500MB in bytes
        'allowed_extensions' => ['sql'],
        'timeout' => 300, // 5 minutes
    ],

    'paths' => [
        'backup_storage' => storage_path('app/backups'),
        'temp_storage' => storage_path('app/temp'),
    ],

    'database' => [
        'driver' => env('DB_CONNECTION', 'pgsql'),
        'host' => env('DB_HOST', '127.0.0.1'),
        'port' => env('DB_PORT', '5432'),
        'database' => env('DB_DATABASE', 'quantum_market'),
        'username' => env('DB_USERNAME', 'postgres'),
        'password' => env('DB_PASSWORD', ''),
    ],
];
