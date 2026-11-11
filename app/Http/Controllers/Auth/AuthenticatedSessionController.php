<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Fortify\Features;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/login', [
            'status' => $request->session()->get('status'),
            'csrf_token' => csrf_token(),
            'portal_role' => \App\Support\Portal::resolve($request),
            'login_url' => \App\Support\Portal::loginUrl(\App\Support\Portal::resolve($request)),
            'portal_links' => collect(\App\Support\Portal::PREFIXES)->map(fn ($prefix, $role) => ['role' => $role, 'url' => \App\Support\Portal::loginUrl($role)])->values(),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request)
    {
        $user = $request->validateCredentials();

        if (Features::enabled(Features::twoFactorAuthentication()) && $user->hasEnabledTwoFactorAuthentication()) {
            $request->session()->put([
                'login.id' => $user->getKey(),
                'login.remember' => $request->boolean('remember'),
            ]);

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'requires_2fa' => true,
                    'redirect' => route('two-factor.login', ['portal' => \App\Support\Portal::resolve($request)])
                ]);
            }

            return to_route('two-factor.login');
        }

        Auth::login($user, $request->boolean('remember'));

        $request->session()->regenerate();

        if ($user->isCashier()) {
            $redirectRoute = 'cashier.point-of-sale';
        } elseif ($user->isDataEntry()) {
            $redirectRoute = 'data-entry.inventory';
        } else {
            $redirectRoute = 'admin.point-of-sale';
        }

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Login successful',
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'full_name' => $user->full_name,
                    'role' => $user->role,
                ],
                'redirect' => route($redirectRoute),
                'auth_state' => 'authenticated'
            ]);
        }

        return redirect()->route($redirectRoute);
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Logout successful',
                'auth_state' => 'unauthenticated'
            ]);
        }

        return redirect(\App\Support\Portal::loginUrl(\App\Support\Portal::resolve($request)));
    }
}