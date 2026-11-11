<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\HandleCsrfTokens;
use App\Http\Middleware\CheckRole;
use App\Http\Middleware\EnsureProductCache;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->append(\App\Http\Middleware\PortalSession::class);
        $middleware->redirectGuestsTo(fn ($request) => \App\Support\Portal::loginUrl(\App\Support\Portal::resolve($request)));
        $middleware->redirectUsersTo(fn ($request) => \App\Support\Portal::homeUrl(\App\Support\Portal::resolve($request)));
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        // Use our custom CSRF middleware
        $middleware->validateCsrfTokens(except: []);

        $middleware->web(replace: [
            \Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class => HandleCsrfTokens::class,
        ], append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        // Add session middleware to API routes for web authentication
        $middleware->api(prepend: [
            \Illuminate\Cookie\Middleware\EncryptCookies::class,
            \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
            \Illuminate\Session\Middleware\StartSession::class,
            \Illuminate\View\Middleware\ShareErrorsFromSession::class,
            \Illuminate\Http\Middleware\HandleCors::class,
            HandleCsrfTokens::class,
        ]);

        // Add response compression to API routes for better performance
        $middleware->api(append: [
            \App\Http\Middleware\CompressResponse::class,
        ]);

        // Register middleware aliases
        $middleware->alias([
            'role' => CheckRole::class,
            'ensure.product.cache' => EnsureProductCache::class,
            'auth.or.sanctum' => \App\Http\Middleware\AuthOrSanctum::class,
        ]);

    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->respond(function (\Symfony\Component\HttpFoundation\Response $response, \Throwable $exception, $request) {
            if (!app()->environment('local') && in_array($response->getStatusCode(), [500, 503, 404, 403, 401])) {
                return \Inertia\Inertia::render('errors/' . $response->getStatusCode())
                    ->toResponse($request)
                    ->setStatusCode($response->getStatusCode());
            }

            return $response;
        });
    })->create();
