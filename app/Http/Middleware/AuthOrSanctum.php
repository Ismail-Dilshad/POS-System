<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthOrSanctum
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        // Check if user is authenticated via session (web guard)
        if (Auth::check()) {
            return $next($request);
        }

        // Check if user is authenticated via sanctum (API guard)
        if (Auth::guard('sanctum')->check()) {
            Auth::shouldUse('sanctum');
            return $next($request);
        }

        // If neither authentication method works, return unauthorized
        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Unauthenticated.',
                'errors' => ['auth' => ['You must be logged in to access this resource.']]
            ], 401);
        }

        return redirect(\App\Support\Portal::loginUrl(\App\Support\Portal::resolve($request)));
    }
}
