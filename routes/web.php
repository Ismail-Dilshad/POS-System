<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Root route: redirect to login for guests, role-specific dashboard for authenticated users
Route::get('/', function () {
    if (auth()->check()) {
        $user = auth()->user();

        if ($user && method_exists($user, 'isCashier') && $user->isCashier()) {
            return redirect()->route('cashier.point-of-sale');
        }

        if ($user && method_exists($user, 'isDataEntry') && $user->isDataEntry()) {
            return redirect()->route('data-entry.inventory');
        }

        return redirect()->route('admin.point-of-sale');
    }

    return redirect()->route('login');
});

// Home route: redirect to the appropriate dashboard based on user role
Route::get('/home', function () {
    if (auth()->check()) {
        $user = auth()->user();

        if ($user && method_exists($user, 'isCashier') && $user->isCashier()) {
            return redirect()->route('cashier.point-of-sale');
        }

        if ($user && method_exists($user, 'isDataEntry') && $user->isDataEntry()) {
            return redirect()->route('data-entry.inventory');
        }

        return redirect()->route('admin.point-of-sale');
    }

    return redirect()->route('login');
})->name('home');

Route::middleware(['auth', 'verified', 'role:admin'])->group(function () {

    Route::get('/admin/point-of-sale', function () {
        return Inertia::render('admin/point-of-sale');
    })->name('admin.point-of-sale');

    Route::get('/admin/inventory', function () {
        return Inertia::render('admin/inventory');
    })->name('admin.inventory');

    Route::get('/admin/suppliers', function () {
        return Inertia::render('admin/suppliers');
    })->name('admin.suppliers');

    Route::get('/admin/supplier-returns', function () {
        return Inertia::render('admin/supplier-returns');
    })->name('admin.supplier-returns');

    Route::get('/admin/expenses', function () {
        return Inertia::render('admin/expenses');
    })->name('admin.expenses');

    Route::get('/admin/purchases', function () {
        return Inertia::render('admin/purchases');
    })->name('admin.purchases');

    Route::get('/admin/returns', function () {
        return Inertia::render('admin/returns');
    })->name('admin.returns');

    Route::get('/admin/reports', function () {
        return Inertia::render('admin/reports');
    })->name('admin.reports');

    Route::get('/admin/settings', function () {
        return Inertia::render('admin/settings');
    })->name('admin.settings');

    Route::get('/admin/transactions', function () {
        return Inertia::render('admin/transactions');
    })->name('admin.transactions');

    Route::get('/admin/users', function () {
        return Inertia::render('admin/users');
    })->name('admin.users');

    Route::get('/admin/print-barcode', function () {
        return Inertia::render('admin/print-barcode');
    })->name('admin.print-barcode');
});

Route::middleware(['auth', 'verified', 'role:cashier'])->group(function () {
    Route::get('/cashier/point-of-sale', function () {
        return Inertia::render('cashier/point-of-sale');
    })->name('cashier.point-of-sale');
});

Route::middleware(['auth', 'verified', 'role:dataentry'])
    ->prefix('data-entry')
    ->as('data-entry.')
    ->group(function () {
        Route::get('/', function () {
            return redirect()->route('data-entry.inventory');
        });

        Route::get('/inventory', function () {
            return Inertia::render('data-entry/inventory');
        })->name('inventory');

        Route::get('/purchase', function () {
            return Inertia::render('data-entry/purchase');
        })->name('purchase');

        Route::get('/point-of-sale', function () {
            return Inertia::render('data-entry/point-of-sale');
        })->name('point-of-sale');

        Route::get('/suppliers', function () {
            return Inertia::render('data-entry/suppliers');
        })->name('suppliers');

        Route::get('/print-barcode', function () {
            return Inertia::render('data-entry/print-barcode');
        })->name('print-barcode');

        Route::get('/supplier-return', function () {
            return Inertia::render('data-entry/supplier-return');
        })->name('supplier-return');
    });

require __DIR__.'/auth.php';