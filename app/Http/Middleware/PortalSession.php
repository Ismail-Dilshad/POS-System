<?php

namespace App\Http\Middleware;

use App\Support\Portal;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PortalSession
{
    public function handle(Request $request, Closure $next)
    {
        $portal = Portal::resolve($request);
        $request->attributes->set('portal', $portal);
        config([
            'session.cookie' => config('session.portal_cookie_base').'_'.$portal,
            'fortify.guard' => $portal,
            'fortify.home' => Portal::homeUrl($portal),
            'sanctum.guard' => [$portal],
        ]);
        Auth::shouldUse($portal);
        return $next($request);
    }
}
