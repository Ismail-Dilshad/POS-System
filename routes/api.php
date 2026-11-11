<?php

use App\Http\Controllers\Api\BarcodePrintController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\ReturnController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\PosController;
use App\Http\Controllers\Api\BackupController;
use App\Http\Controllers\Api\ReceiptPrintController;
use App\Http\Controllers\Api\DiscountVisibilityController;
use App\Http\Controllers\Api\PosVisibilityController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\ScaleProductController;
use App\Http\Controllers\CardController;
use App\Http\Controllers\NameCardController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\SupplierReturnController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth.or.sanctum'])->group(function () {
    // Product routes
    Route::get('/products', [ProductController::class, 'index']);
    Route::post('/products', [ProductController::class, 'store']);
    Route::get('/products/{product}', [ProductController::class, 'show']);
    Route::put('/products/{product}', [ProductController::class, 'update']);
    Route::delete('/products/{product}', [ProductController::class, 'destroy']);
    Route::get('/products/search/{query}', [ProductController::class, 'search']);
    Route::post('/products/import', [ProductController::class, 'import']);
    Route::post('/products/import/validate', [ProductController::class, 'validateImport']);
    Route::post('/products/import/process', [ProductController::class, 'import']);
    Route::get('/products/export', [ProductController::class, 'export']);
    Route::patch('/products/{product}/toggle-pos', [ProductController::class, 'togglePosVisibility']);

    // Category routes - specific routes first to avoid parameter conflicts
    Route::get('/categories/export', [CategoryController::class, 'export']);
    Route::post('/categories/import/validate', [CategoryController::class, 'validateImport']);
    Route::post('/categories/import/process', [CategoryController::class, 'processImport']);
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::get('/categories/{category}', [CategoryController::class, 'show']);
    Route::put('/categories/{category}', [CategoryController::class, 'update']);
    Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);
    Route::get('/categories/{category}/usage', [CategoryController::class, 'checkUsage']);

    // Supplier routes - specific routes first to avoid parameter conflicts
    Route::get('/suppliers/export', [SupplierController::class, 'export']);
    Route::post('/suppliers/import/validate', [SupplierController::class, 'validateImport']);
    Route::post('/suppliers/import/process', [SupplierController::class, 'processImport']);
    Route::get('/suppliers/generate-code', [SupplierController::class, 'generateCode']);
    Route::get('/suppliers', [SupplierController::class, 'index']);
    Route::post('/suppliers', [SupplierController::class, 'store']);
    Route::get('/suppliers/{supplier}', [SupplierController::class, 'show']);
    Route::put('/suppliers/{supplier}', [SupplierController::class, 'update']);
    Route::delete('/suppliers/{supplier}', [SupplierController::class, 'destroy']);
    Route::get('/suppliers/{supplier}/usage', [SupplierController::class, 'checkUsage']);
    Route::get('/suppliers/{supplier}/payments', [SupplierController::class, 'payments']);
    
    // Supplier Payment routes
    Route::post('/supplier-payments', [SupplierController::class, 'createPayment']);
    Route::put('/supplier-payments/{payment}', [SupplierController::class, 'updatePayment']);
    Route::delete('/supplier-payments/{payment}', [SupplierController::class, 'deletePayment']);
    Route::post('/supplier-payments/delete-all', [SupplierController::class, 'deleteAllPayments']);

    // Transaction routes - specific routes first to avoid parameter conflicts
    Route::get('/transactions/statistics', [TransactionController::class, 'statistics']);
    Route::get('/transactions/all', [TransactionController::class, 'getAll']);
    Route::get('/transactions/by-number/{transactionNumber}', [TransactionController::class, 'getByTransactionNumber']);
    Route::post('/transactions/return', [TransactionController::class, 'processReturn']);
    Route::get('/transactions/search-history/{barcode}', [TransactionController::class, 'searchTransactionHistory']);
    Route::post('/transactions/delete-all', [TransactionController::class, 'deleteAll']);
    
    // Transaction report routes (separate from regular transaction endpoints) - MUST come before /transactions/{transaction}
    Route::get('/transactions/report/statistics', [TransactionController::class, 'reportStatistics']);
    Route::get('/transactions/report/export', [TransactionController::class, 'reportExport']);
    Route::get('/transactions/report', [TransactionController::class, 'report']);
    
    // Transaction CRUD routes - must come after specific routes
    Route::get('/transactions', [TransactionController::class, 'index']);
    Route::post('/transactions', [TransactionController::class, 'store']);
    Route::get('/transactions/{transaction}', [TransactionController::class, 'show']);
    Route::put('/transactions/{transaction}', [TransactionController::class, 'update']);
    Route::delete('/transactions/{transaction}', [TransactionController::class, 'destroy']);

    // Purchase routes - specific routes first to avoid parameter conflicts
    Route::get('/purchases/statistics', [PurchaseController::class, 'statistics']);
    Route::get('/purchases/by-product', [PurchaseController::class, 'purchaseHistoryByProduct']);
    Route::post('/purchases/search', [PurchaseController::class, 'search']);
    Route::patch('/purchases/{purchase}/receive', [PurchaseController::class, 'markAsReceived']);
    Route::post('/purchases/delete-all', [PurchaseController::class, 'deleteAll']);
    
    // Purchase report routes (separate from regular purchase endpoints) - MUST come before /purchases/{purchase}
    Route::get('/purchases/report/statistics', [PurchaseController::class, 'reportStatistics']);
    Route::get('/purchases/report/export', [PurchaseController::class, 'reportExport']);
    Route::get('/purchases/report', [PurchaseController::class, 'report']);
    
    // Purchase CRUD routes - must come after specific routes
    Route::get('/purchases', [PurchaseController::class, 'index']);
    Route::post('/purchases', [PurchaseController::class, 'store']);
    Route::get('/purchases/{purchase}', [PurchaseController::class, 'show']);
    Route::put('/purchases/{purchase}', [PurchaseController::class, 'update']);
    Route::delete('/purchases/{purchase}', [PurchaseController::class, 'destroy']);

    // Scale Product routes - specific routes first to avoid parameter conflicts
    Route::get('/scale-products/statistics', [ScaleProductController::class, 'statistics']);
    Route::get('/scale-products/search', [ScaleProductController::class, 'search']);
    Route::post('/scale-products/check-plu', [ScaleProductController::class, 'checkPlu']);
    Route::delete('/scale-products/bulk-destroy', [ScaleProductController::class, 'bulkDestroy']);
    Route::get('/scale-products', [ScaleProductController::class, 'index']);
    Route::post('/scale-products', [ScaleProductController::class, 'store']);
    Route::get('/scale-products/{scaleProduct}', [ScaleProductController::class, 'show']);
    Route::put('/scale-products/{scaleProduct}', [ScaleProductController::class, 'update']);
    Route::delete('/scale-products/{scaleProduct}', [ScaleProductController::class, 'destroy']);
    Route::patch('/scale-products/{scaleProduct}/toggle-pos', [ScaleProductController::class, 'togglePosVisibility']);

    // Card routes - specific routes first to avoid parameter conflicts
    Route::get('/cards/statistics', [CardController::class, 'statistics']);
    Route::get('/cards/by-name-card/{nameCard}', [CardController::class, 'byNameCard']);
    Route::get('/cards', [CardController::class, 'index']);
    Route::post('/cards', [CardController::class, 'store']);
    Route::get('/cards/{card}', [CardController::class, 'show']);
    Route::put('/cards/{card}', [CardController::class, 'update']);
    Route::delete('/cards/{card}', [CardController::class, 'destroy']);
    
    // Card cache management routes
    Route::post('/cards/rebuild-cache', [CardController::class, 'rebuildCache']);
    Route::get('/cards/cache-stats', [CardController::class, 'cacheStats']);
    Route::delete('/cards/clear-cache', [CardController::class, 'clearCache']);

    // Name Card routes - specific routes first to avoid parameter conflicts
    Route::get('/name-cards/statistics', [NameCardController::class, 'statistics']);
    Route::get('/name-cards/options', [NameCardController::class, 'options']);
    Route::get('/name-cards', [NameCardController::class, 'index']);
    Route::post('/name-cards', [NameCardController::class, 'store']);
    Route::get('/name-cards/{nameCard}', [NameCardController::class, 'show']);
    Route::put('/name-cards/{nameCard}', [NameCardController::class, 'update']);
    Route::delete('/name-cards/{nameCard}', [NameCardController::class, 'destroy']);

    // Inventory routes - simple structure like suppliers
    Route::get('/inventory', [InventoryController::class, 'index']);
    Route::get('/inventory/statistics', [InventoryController::class, 'getComprehensiveStatistics']);

    // Inventory adjustment with moderate rate limiting
    Route::middleware(['throttle:20,1'])->group(function () {
        Route::post('/inventory/validate-adjustments', [InventoryController::class, 'validateAdjustments']);
        Route::post('/inventory/adjust', [InventoryController::class, 'adjust']);
    });

    // Expense routes
    Route::get('/expenses', [ExpenseController::class, 'index']);
    Route::get('/expenses/all', [ExpenseController::class, 'getAll']);
    Route::get('/expenses/statistics', [ExpenseController::class, 'statistics']);
    Route::get('/expenses/export', [ExpenseController::class, 'export']);
    Route::post('/expenses', [ExpenseController::class, 'store']);
    Route::get('/expenses/{expense}', [ExpenseController::class, 'show']);
    Route::put('/expenses/{expense}', [ExpenseController::class, 'update']);
    Route::delete('/expenses/{expense}', [ExpenseController::class, 'destroy']);
    Route::post('/expenses/delete-all', [ExpenseController::class, 'deleteAll']);

    // User routes
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::get('/users/{user}', [UserController::class, 'show']);
    Route::put('/users/{user}', [UserController::class, 'update']);
    Route::delete('/users/{user}', [UserController::class, 'destroy']);

    // Return routes - specific routes first to avoid conflicts
    Route::get('/returns/statistics', [ReturnController::class, 'getStatistics']);
    Route::get('/returns/analytics', [ReturnController::class, 'getAnalytics']);
    Route::get('/returns/export', [ReturnController::class, 'exportReturns']);
    Route::post('/returns/search-history', [ReturnController::class, 'searchTransactionHistory']);
    Route::post('/returns/bulk-process', [ReturnController::class, 'bulkProcess']);
    Route::get('/returns', [ReturnController::class, 'index']);
    Route::get('/returns/all', [ReturnController::class, 'getAll']);
    Route::post('/returns', [ReturnController::class, 'store']);
    Route::get('/returns/{return}', [ReturnController::class, 'show']);
    Route::put('/returns/{return}', [ReturnController::class, 'update']);
    Route::delete('/returns/{return}', [ReturnController::class, 'destroy']);
    Route::post('/returns/delete-all', [ReturnController::class, 'deleteAll']);
    Route::post('/returns/{return}/adjust-inventory', [ReturnController::class, 'processInventoryAdjustment']);
    Route::delete('/returns/{return}/cancel', [ReturnController::class, 'cancelReturn']);



    // Barcode Print routes
    Route::get('/barcode/products', [BarcodePrintController::class, 'index']);
    Route::get('/barcode/printers', [BarcodePrintController::class, 'getPrinters']);
    Route::post('/barcode/print-labels', [BarcodePrintController::class, 'printLabels']);

    // POS routes
    Route::get('/pos/discount-visibility', [DiscountVisibilityController::class, 'show']);
    Route::post('/pos/discount-visibility', [DiscountVisibilityController::class, 'update']);
    Route::get('/pos/visibility-sync', [PosVisibilityController::class, 'show']);
    Route::post('/pos/visibility-sync', [PosVisibilityController::class, 'update']);
    Route::get('/pos/all-products-cache', [PosController::class, 'getAllProductsCache']);
    Route::get('/pos/search-barcode', [PosController::class, 'searchByBarcode']);
    Route::get('/pos/search-name', [PosController::class, 'searchByName']);
    Route::get('/pos/cache-stats', [PosController::class, 'cacheStats']);
    Route::post('/pos/rebuild-cache', [PosController::class, 'rebuildCache']);
    Route::delete('/pos/clear-cache', [PosController::class, 'clearCache']);

    // Backup routes
    Route::post('/backup/create', [BackupController::class, 'createBackup']);
    Route::post('/backup/import', [BackupController::class, 'importBackup']);
    Route::get('/backup/download', [BackupController::class, 'downloadBackup']);
    Route::get('/backup/list', [BackupController::class, 'listBackups']);
    Route::delete('/backup/delete', [BackupController::class, 'deleteBackup']);

    // Receipt Print routes
    Route::post('/receipt/print-test', [ReceiptPrintController::class, 'printTest']);
    Route::post('/receipt/print', [ReceiptPrintController::class, 'printReceipt']);
    Route::post('/receipt/stream', [ReceiptPrintController::class, 'streamReceipt']);

    // Supplier Return routes
    Route::get('/supplier-returns', [SupplierReturnController::class, 'index']);
    Route::get('/supplier-returns/statistics', [SupplierReturnController::class, 'getStatistics']);
    Route::get('/supplier-returns/all', [SupplierReturnController::class, 'getAll']);
    Route::get('/supplier-returns/{id}', [SupplierReturnController::class, 'show']);
    Route::post('/supplier-returns/process', [SupplierReturnController::class, 'processReturn']);
    Route::post('/supplier-returns/delete-all', [SupplierReturnController::class, 'deleteAll']);

    // POS routes
    Route::get('/pos/search-barcode/{barcode}', [PosController::class, 'searchByBarcode']);
    Route::get('/pos/search-name/{name}', [PosController::class, 'searchByName']);
    Route::post('/pos/rebuild-cache', [PosController::class, 'rebuildCache']);
    Route::post('/pos/refresh-cache', [PosController::class, 'refreshCache']);
    Route::get('/pos/cache-stats', [PosController::class, 'cacheStats']);
    Route::delete('/pos/clear-cache', [PosController::class, 'clearCache']);

});

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth.or.sanctum');