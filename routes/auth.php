<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use Illuminate\Support\Facades\Route;

foreach (\App\Support\Portal::PREFIXES as $prefix) {
    Route::prefix($prefix)->name($prefix.'.')->group(function () {
        Route::get('login', [AuthenticatedSessionController::class, 'create'])->middleware('guest')->name('login');
        Route::post('login', [AuthenticatedSessionController::class, 'store'])->middleware('guest')->name('login.store');
        Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])->middleware('auth')->name('logout');
    });
}

Route::get('login', fn () => redirect()->route('admin.login'))->name('login');
Route::post('login', [AuthenticatedSessionController::class, 'store'])->middleware('guest')->name('login.store');
Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])->middleware('auth')->name('logout');
