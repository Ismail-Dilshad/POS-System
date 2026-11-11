<?php

namespace App\Support;

use Illuminate\Http\Request;

class Portal
{
    public const PREFIXES = ['admin' => 'admin', 'cashier' => 'cashier', 'dataentry' => 'data-entry'];

    public static function resolve(Request $request): string
    {
        $prefix = explode('/', trim($request->path(), '/'))[0];
        $portal = array_search($prefix, self::PREFIXES, true);
        if ($portal !== false) return $portal;

        $requested = $request->header('X-Portal') ?? $request->query('portal');
        if (is_string($requested) && isset(self::PREFIXES[$requested])) return $requested;

        $referer = $request->header('Referer', '');
        if (parse_url($referer, PHP_URL_HOST) === $request->getHost()) {
            $prefix = explode('/', trim(parse_url($referer, PHP_URL_PATH) ?? '', '/'))[0];
            $portal = array_search($prefix, self::PREFIXES, true);
            if ($portal !== false) return $portal;
        }
        return 'admin';
    }

    public static function loginUrl(string $portal): string
    {
        return url('/'.self::PREFIXES[$portal].'/login');
    }

    public static function homeUrl(string $portal): string
    {
        return url('/'.self::PREFIXES[$portal].($portal === 'dataentry' ? '/inventory' : '/point-of-sale'));
    }
}
