<?php

if (! function_exists('mb_split') && class_exists(\Symfony\Polyfill\Mbstring\Mbstring::class)) {
    function mb_split(string $pattern, string $string, int $limit = -1): array
    {
        return \Symfony\Polyfill\Mbstring\Mbstring::mb_split($pattern, $string, $limit);
    }
}

if (! function_exists('mb_strimwidth') && class_exists(\Symfony\Polyfill\Mbstring\Mbstring::class)) {
    function mb_strimwidth(string $string, int $start, int $width, string $trim_marker = '', ?string $encoding = null): string
    {
        return \Symfony\Polyfill\Mbstring\Mbstring::mb_strimwidth($string, $start, $width, $trim_marker, $encoding);
    }
}
