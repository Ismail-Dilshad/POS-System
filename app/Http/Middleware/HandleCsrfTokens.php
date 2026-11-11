<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class HandleCsrfTokens extends Middleware
{
    protected function newCookie($request, $config)
    {
        return new \Symfony\Component\HttpFoundation\Cookie(
            'XSRF-TOKEN-'.$request->attributes->get('portal', 'admin'),
            $request->session()->token(),
            $this->availableAt(60 * $config['lifetime']),
            $config['path'],
            $config['domain'],
            $config['secure'],
            false,
            false,
            $config['same_site'] ?? null,
            $config['partitioned'] ?? false,
        );
    }

    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array<int, string>
     */
    protected $except = [
        'api/*',  // Exclude all API routes from CSRF verification
    ];

    /**
     * Determine if the session and input CSRF tokens match.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return bool
     */
    protected function tokensMatch($request)
    {
        $token = $this->getTokenFromRequest($request);

        return is_string($request->session()->token()) &&
               is_string($token) &&
               hash_equals($request->session()->token(), $token);
    }

    /**
     * Get the CSRF token from the request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return string|null
     */
    protected function getTokenFromRequest($request)
    {
        $token = $request->input('_token') ?: $request->header('X-CSRF-TOKEN');

        if (! $token && $header = $request->header('X-XSRF-TOKEN')) {
            try {
                $token = \Illuminate\Cookie\CookieValuePrefix::remove(
                    $this->encrypter->decrypt($header, static::serialized())
                );
            } catch (\Illuminate\Contracts\Encryption\DecryptException $exception) {
                $token = '';
            }
        }

        return $token;
    }

    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     *
     * @throws \Illuminate\Session\TokenMismatchException
     */
    public function handle($request, \Closure $next)
    {
        if (
            $this->isReading($request) ||
            $this->runningUnitTests() ||
            $this->inExceptArray($request) ||
            $this->tokensMatch($request)
        ) {
            return tap($next($request), function ($response) use ($request) {
                if ($this->shouldAddXsrfTokenCookie()) {
                    $this->addCookieToResponse($request, $response);
                }
            });
        }

        // For API routes, return JSON error instead of redirecting
        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'message' => 'CSRF token mismatch.',
                'errors' => ['csrf' => ['Invalid CSRF token.']]
            ], 419);
        }

        throw new \Illuminate\Session\TokenMismatchException('CSRF token mismatch.');
    }
}
