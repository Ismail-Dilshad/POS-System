import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import compression from 'vite-plugin-compression';
import { VitePWA } from 'vite-plugin-pwa';
import type { OutputAsset } from 'rollup';


// Simplified vendor chunking strategy to avoid circular dependencies

const ensureAssetMetadata = (): Plugin => ({
    name: 'ensure-asset-metadata',
    enforce: 'post',
    generateBundle(_options, bundle) {
        for (const asset of Object.values(bundle)) {
            if (asset.type === 'asset') {
                const outputAsset = asset as OutputAsset & {
                    names?: string[];
                    originalFileNames?: string[];
                };
                if (!Array.isArray(outputAsset.names)) {
                    outputAsset.names = [];
                }
                if (!Array.isArray(outputAsset.originalFileNames)) {
                    outputAsset.originalFileNames = [];
                }
            }
        }
    },
});

const isProd = process.env.NODE_ENV === 'production';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const resolvedDevPort = Number.parseInt(env.VITE_PORT ?? '5173', 10);
    const resolvedDevHost = env.VITE_HOST ?? '127.0.0.1';

    return {
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
        }),
        react({
            jsxRuntime: 'automatic',
            jsxImportSource: 'react',
        }),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.png', 'favicon.ico', 'apple-touch-icon.png', 'images/alinetwork.png'],
            manifest: {
                name: 'Ali Network POS',
                short_name: 'Ali POS',
                description: 'Point of sale and inventory management system',
                theme_color: '#1F3F3F',
                background_color: '#ffffff',
                display: 'standalone',
                start_url: '/',
                scope: '/',
                orientation: 'portrait-primary',
                categories: ['business', 'productivity'],
                lang: 'en',
                icons: [
                    {
                        src: '/favicon.ico',
                        sizes: '32x32',
                        type: 'image/x-icon'
                    },
                    {
                        src: '/apple-touch-icon.png',
                        sizes: '180x180',
                        type: 'image/png'
                    },
                    {
                        src: '/pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'any'
                    },
                    {
                        src: '/pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any'
                    },
                    {
                        src: '/pwa-maskable-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable'
                    }
                ]
            },
            workbox: {
                cleanupOutdatedCaches: true,
                skipWaiting: true,
                clientsClaim: true,
                globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,gif,webp,svg,woff2,woff,ttf,eot,mp3,mp4,webm,pdf,csv,txt,json,xml,zip,rar,7z}'],
                navigateFallback: null,
                runtimeCaching: [
                    {
                        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'images-cache',
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                            }
                        }
                    },
                    {
                        urlPattern: /\.(?:woff2|woff|ttf|eot)$/,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'fonts-cache',
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                            }
                        }
                    },
                    {
                        urlPattern: /\.(?:mp3|mp4|webm)$/,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'media-cache',
                            expiration: {
                                maxEntries: 20,
                                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
                            }
                        }
                    },
                    {
                        urlPattern: /\.(?:pdf|csv|txt|json|xml|zip|rar|7z)$/,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'documents-cache',
                            expiration: {
                                maxEntries: 30,
                                maxAgeSeconds: 60 * 60 * 24 * 1 // 1 day
                            }
                        }
                    }
                ]
            }
        }),
        ...(isProd
            ? [
                compression({
                    algorithm: 'gzip',
                    ext: '.gz',
                    threshold: 1024,
                }),
                compression({
                    algorithm: 'brotliCompress',
                    ext: '.br',
                    threshold: 1024,
                }),
            ]
            : []),
        ensureAssetMetadata(),
    ],
    esbuild: {
        jsx: 'automatic',
        jsxImportSource: 'react',
    },
    define: {
        global: 'globalThis',
    },
    base: '/build/',
    build: {
        outDir: 'public/build',
        emptyOutDir: true,
        assetsInlineLimit: 4096, // Inline small assets (< 4KB)
        chunkSizeWarningLimit: 500, // Warn if chunks exceed 500KB for better performance
        cssCodeSplit: true, // Split CSS for better caching
        sourcemap: false, // Disable sourcemaps in production
        minify: 'esbuild', // Use esbuild for faster minification
        target: 'esnext', // Target modern browsers
        rollupOptions: {
            output: {
                // Use content hash for cache busting (only changes when content changes)
                entryFileNames: 'assets/[name]-[hash].js',
                chunkFileNames: 'assets/[name]-[hash].js',
                manualChunks: (id: string) => {
                    const normalizedId = id.replace(/\\/g, '/');

                    // Only chunk node_modules to avoid circular dependencies
                    if (normalizedId.includes('node_modules')) {
                        // React ecosystem - keep in main vendor bundle
                        if (normalizedId.includes('/react/') ||
                            normalizedId.includes('/react-dom/') ||
                            normalizedId.includes('/scheduler/')) {
                            return 'vendor';
                        }

                        // Inertia.js
                        if (normalizedId.includes('/@inertiajs/')) {
                            return 'vendor-inertia';
                        }

                        // Icons
                        if (normalizedId.includes('/lucide-react/')) {
                            return 'vendor-icons';
                        }

                        // UI Libraries - keep them together to avoid circular deps
                        if (normalizedId.includes('/@radix-ui/') || 
                            normalizedId.includes('/@headlessui/')) {
                            return 'vendor-ui';
                        }

                        // Utility libraries
                        if (normalizedId.includes('/clsx/') ||
                            normalizedId.includes('/class-variance-authority/') ||
                            normalizedId.includes('/tailwind-merge/') ||
                            normalizedId.includes('/date-fns/') ||
                            normalizedId.includes('/lodash/')) {
                            return 'vendor-utils';
                        }

                        // Form handling
                        if (normalizedId.includes('/react-hook-form/') ||
                            normalizedId.includes('/zod/')) {
                            return 'vendor-forms';
                        }

                        // Data visualization (removed - not used)

                        // Internationalization
                        if (normalizedId.includes('/i18next/') ||
                            normalizedId.includes('/react-i18next/')) {
                            return 'vendor-i18n';
                        }

                        // Specialized libraries
                        if (normalizedId.includes('/jsbarcode/') ||
                            normalizedId.includes('/react-to-print/')) {
                            return 'vendor-printing';
                        }

                        if (normalizedId.includes('/axios/')) {
                            return 'vendor-data';
                        }

                        return 'vendor';
                    }

                    // Don't chunk application code to avoid circular dependencies
                    // Let Vite handle it automatically
                    return undefined;
                },
                assetFileNames: (assetInfo: { name?: string }) => {
                    if (assetInfo.name?.match(/\.(woff2?|ttf|eot|otf)$/)) {
                        return 'fonts/[name]-[hash][extname]';
                    }
                    return 'assets/[name]-[hash][extname]';
                }
            }
        }
    },
    assetsInclude: ['**/*.eot', '**/*.woff', '**/*.woff2', '**/*.ttf', '**/*.otf'],
    server: {
        port: resolvedDevPort,
        host: resolvedDevHost,
        strictPort: true,
    },
    };
});
