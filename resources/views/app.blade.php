<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <meta name="portal" content="{{ request()->attributes->get('portal', 'admin') }}">
        <meta name="auth-user" content="{{ auth()->user() ? json_encode(auth()->user()->only(['id', 'full_name', 'username', 'role', 'email'])) : 'null' }}">
        
        {{-- Content Security Policy Meta Tag - Fully Offline System --}}
        @if(app()->environment('local'))
    <meta https-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' data: blob: https://192.168.0.25:* https://192.168.0.25:* http://127.0.0.1:* http://localhost:* https://127.0.0.1:* http://127.0.0.1:* http://localhost:* https://127.0.0.1:*; style-src 'self' 'unsafe-inline'; font-src 'self' https://192.168.0.25:* https://192.168.0.25:* http://127.0.0.1:* http://localhost:* https://127.0.0.1:* http://127.0.0.1:* http://localhost:* https://127.0.0.1:*; connect-src 'self' ws://192.168.0.25:* ws://127.0.0.1:* ws://localhost:* https://192.168.0.25:* https://192.168.0.25:* http://127.0.0.1:* http://localhost:* https://127.0.0.1:* http://127.0.0.1:* http://localhost:* https://127.0.0.1:*; img-src 'self' data: blob: https://192.168.0.25:* https://192.168.0.25:* http://127.0.0.1:* http://localhost:* https://127.0.0.1:* http://127.0.0.1:* http://localhost:* https://127.0.0.1:*; script-src 'self' 'unsafe-inline' https://192.168.0.25:* https://192.168.0.25:* http://127.0.0.1:* http://localhost:* https://127.0.0.1:* http://127.0.0.1:* http://localhost:* https://127.0.0.1:*; object-src 'none'; base-uri 'self'">
        @else
        <meta https-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' data: blob:; style-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'self'; img-src 'self' data: blob:; script-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'self'">
        @endif

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }
        </style>

        <title inertia>{{ config('app.display_name', 'Ali Network POS') }}</title>

    <link rel="icon" href="{{ asset('favicon.png') }}?v=alinetwork" type="image/png">
    <link rel="icon" href="{{ asset('favicon.ico') }}?v=alinetwork" sizes="any">
    <link rel="apple-touch-icon" href="{{ asset('apple-touch-icon.png') }}?v=alinetwork">
    
    {{-- PWA Manifest --}}
    <link rel="manifest" href="{{ asset('build/manifest.webmanifest') }}">
    <meta name="theme-color" content="#1F3F3F">

        {{-- Font preloading for Kurdish text rendering (used in receipts and UI) - Fully Offline --}}
    <link rel="preload" href="{{ asset('fonts/Rabar_021.woff2') }}" as="font" type="font/woff2" crossorigin="anonymous">
        
        {{-- Local fonts only - no CDN dependencies for fully offline system --}}
        <style>
            @font-face {
                font-family: 'Instrument Sans';
                font-style: normal;
                font-weight: 400;
                font-display: swap;
                src: local('Instrument Sans Regular'), local('InstrumentSans-Regular');
            }
            @font-face {
                font-family: 'Instrument Sans';
                font-style: normal;
                font-weight: 500;
                font-display: swap;
                src: local('Instrument Sans Medium'), local('InstrumentSans-Medium');
            }
            @font-face {
                font-family: 'Instrument Sans';
                font-style: normal;
                font-weight: 600;
                font-display: swap;
                src: local('Instrument Sans SemiBold'), local('InstrumentSans-SemiBold');
            }
        </style>

        @if(app()->environment('local'))
            @viteReactRefresh
            @vite(['resources/js/app.tsx'])
        @else
            {{-- Production build assets --}}
            @php
                $manifest = json_decode(file_get_contents(public_path('build/manifest.json')), true);
            @endphp
            @if(isset($manifest['resources/js/app.tsx']))
                @if(isset($manifest['resources/js/app.tsx']['css']))
                    @foreach($manifest['resources/js/app.tsx']['css'] as $css)
                        <link rel="stylesheet" href="{{ asset('build/' . $css) }}">
                    @endforeach
                @endif
                <script type="module" src="{{ asset('build/' . $manifest['resources/js/app.tsx']['file']) }}"></script>
            @endif
        @endif
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
