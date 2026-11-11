<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CompressResponse
{
    /**
     * Handle an incoming request and compress the response if supported.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Only compress if client supports it and response is compressible
        if (!$this->shouldCompress($request, $response)) {
            return $response;
        }

        // Get the content
        $content = $response->getContent();

        // Determine compression method
        $acceptEncoding = $request->header('Accept-Encoding', '');
        $compressed = false;

        // Try Brotli first (better compression)
        if (function_exists('brotli_compress') && str_contains($acceptEncoding, 'br')) {
            $compressed = brotli_compress($content, 4); // Level 4 is a good balance
            if ($compressed !== false) {
                $response->setContent($compressed);
                $response->headers->set('Content-Encoding', 'br');
                $response->headers->set('Vary', 'Accept-Encoding');
                $compressed = true;
            }
        }

        // Fallback to Gzip
        if (!$compressed && function_exists('gzencode') && str_contains($acceptEncoding, 'gzip')) {
            $compressed = gzencode($content, 6); // Level 6 is a good balance
            if ($compressed !== false) {
                $response->setContent($compressed);
                $response->headers->set('Content-Encoding', 'gzip');
                $response->headers->set('Vary', 'Accept-Encoding');
            }
        }

        return $response;
    }

    /**
     * Determine if the response should be compressed.
     */
    private function shouldCompress(Request $request, Response $response): bool
    {
        // Don't compress if client doesn't support it
        $acceptEncoding = $request->header('Accept-Encoding', '');
        if (empty($acceptEncoding) || (!str_contains($acceptEncoding, 'gzip') && !str_contains($acceptEncoding, 'br'))) {
            return false;
        }

        // Don't compress if already compressed
        if ($response->headers->has('Content-Encoding')) {
            return false;
        }

        // Only compress text-based content types
        $contentType = $response->headers->get('Content-Type', '');
        $compressibleTypes = [
            'text/',
            'application/json',
            'application/javascript',
            'application/xml',
            'application/xhtml+xml',
            'application/rss+xml',
            'application/atom+xml',
        ];

        $shouldCompress = false;
        foreach ($compressibleTypes as $type) {
            if (str_starts_with($contentType, $type)) {
                $shouldCompress = true;
                break;
            }
        }

        if (!$shouldCompress) {
            return false;
        }

        // Don't compress very small responses (overhead not worth it)
        $contentLength = strlen($response->getContent());
        if ($contentLength < 1024) { // Less than 1KB
            return false;
        }

        return true;
    }
}
