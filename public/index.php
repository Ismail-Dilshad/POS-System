<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Suppress PHP 8.5 deprecation warnings for PDO constants in Laravel vendor files
// These will be fixed in future Laravel updates
if (PHP_VERSION_ID >= 80500) {
    set_error_handler(function ($errno, $errstr, $errfile, $errline) {
        // Suppress specific PDO deprecation warnings from vendor files
        if ($errno === E_DEPRECATED && 
            str_contains($errfile ?? '', 'vendor/laravel/framework') &&
            (str_contains($errstr, 'PDO::MYSQL_ATTR_SSL_CA') || 
             str_contains($errstr, 'PDO::PGSQL_ATTR_DISABLE_PREPARES'))) {
            return true; // Suppress this warning
        }
        // Let other errors through
        return false;
    }, E_DEPRECATED);
}

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$app = require_once __DIR__.'/../bootstrap/app.php';

$app->handleRequest(Request::capture());
