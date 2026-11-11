/**
 * Deep refresh utility that mimics Ctrl+Shift+R behavior
 * This will perform a hard refresh of the entire application
 * clearing all caches and reloading all resources
 */

export interface DeepRefreshOptions {
    /**
     * Whether to show a loading state during refresh
     * @default true
     */
    showLoading?: boolean;
    
    /**
     * Custom message to show during refresh
     * @default 'Refreshing...'
     */
    loadingMessage?: string;
    
    /**
     * Whether to clear localStorage before refresh
     * @default false
     */
    clearLocalStorage?: boolean;
    
    /**
     * Whether to clear sessionStorage before refresh
     * @default false
     */
    clearSessionStorage?: boolean;
    
    /**
     * Whether to clear all caches before refresh
     * @default true
     */
    clearCaches?: boolean;
}

/**
 * Creates a loading overlay for the refresh process
 */
const createLoadingOverlay = (message: string): HTMLElement => {
    const overlay = document.createElement('div');
    overlay.id = 'deep-refresh-loading';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 18px;
        font-weight: 500;
        backdrop-filter: blur(4px);
    `;
    
    overlay.innerHTML = `
        <div style="text-align: center; max-width: 300px; padding: 20px;">
            <div style="
                width: 50px;
                height: 50px;
                border: 4px solid rgba(255, 255, 255, 0.2);
                border-top: 4px solid #3b82f6;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 20px;
            "></div>
            <div style="font-size: 16px; opacity: 0.9;">${message}</div>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    
    return overlay;
};

/**
 * Clears all browser caches and service workers
 */
const clearAllCaches = async (): Promise<void> => {
    try {
        // Clear service workers first
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(
                registrations.map(registration => registration.unregister())
            );
        }

        // Clear all caches
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames.map(cacheName => caches.delete(cacheName))
            );
        }

        // Clear IndexedDB if available
        if ('indexedDB' in window) {
            try {
                // Try to clear IndexedDB databases
                const databases = await indexedDB.databases?.();
                if (databases) {
                    await Promise.all(
                        databases.map(db => {
                            return new Promise<void>((resolve) => {
                                if (!db.name) {
                                    resolve();
                                    return;
                                }
                                const deleteReq = indexedDB.deleteDatabase(db.name);
                                deleteReq.onsuccess = () => resolve();
                                deleteReq.onerror = () => resolve();
                                deleteReq.onblocked = () => resolve();
                            });
                        })
                    );
                }
            } catch (error) {
                console.warn('Failed to clear IndexedDB:', error);
            }
        }
    } catch (error) {
        console.warn('Failed to clear some caches:', error);
    }
};

/**
 * Performs a hard refresh using the most reliable method
 */
const performHardRefresh = (): void => {
    try {
        // Method 1: Try to use location.reload with force parameter
        if (typeof location.reload === 'function') {
            // Add a cache-busting parameter to force reload
            const url = new URL(window.location.href);
            url.searchParams.set('_refresh', Date.now().toString());
            
            // Try to reload with force parameter (if supported)
            try {
                (location as { reload: (force?: boolean) => void }).reload(true);
                return;
            } catch {
                // Fallback to URL change
                window.location.href = url.toString();
                return;
            }
        }
    } catch (error) {
        console.warn('Primary refresh method failed:', error);
    }

    try {
        // Method 2: Force reload by changing location
        const url = new URL(window.location.href);
        url.searchParams.set('_refresh', Date.now().toString());
        window.location.href = url.toString();
    } catch (error) {
        console.warn('Secondary refresh method failed:', error);
        
        // Method 3: Ultimate fallback
        window.location.reload();
    }
};

/**
 * Performs a deep refresh of the application
 * This is equivalent to Ctrl+Shift+R (hard refresh)
 * 
 * @param options - Configuration options for the refresh
 */
export const deepRefresh = async (options: DeepRefreshOptions = {}): Promise<void> => {
    const {
        showLoading = true,
        loadingMessage = 'Refreshing system...',
        clearLocalStorage = false,
        clearSessionStorage = false,
        clearCaches = true
    } = options;

    let loadingOverlay: HTMLElement | null = null;

    try {
        // Show loading state if requested
        if (showLoading) {
            loadingOverlay = createLoadingOverlay(loadingMessage);
            document.body.appendChild(loadingOverlay);
            
            // Ensure the overlay is visible
            requestAnimationFrame(() => {
                if (loadingOverlay) {
                    loadingOverlay.style.opacity = '1';
                }
            });
        }

        // Clear storage if requested
        if (clearLocalStorage) {
            try {
                localStorage.clear();
            } catch (error) {
                console.warn('Failed to clear localStorage:', error);
            }
        }
        
        if (clearSessionStorage) {
            try {
                sessionStorage.clear();
            } catch (error) {
                console.warn('Failed to clear sessionStorage:', error);
            }
        }

        // Clear caches if requested
        if (clearCaches) {
            await clearAllCaches();
        }

        // Small delay to ensure loading state is visible and operations complete
        await new Promise(resolve => setTimeout(resolve, 200));

        // Perform the hard refresh
        performHardRefresh();

    } catch (error) {
        console.error('Deep refresh failed:', error);
        
        // Remove loading overlay if it exists
        if (loadingOverlay) {
            loadingOverlay.remove();
        }
        
        // Fallback to regular page reload
        try {
            window.location.reload();
        } catch (fallbackError) {
            console.error('Fallback reload also failed:', fallbackError);
            // Last resort - redirect to current URL
            window.location.assign(window.location.href);
        }
    }
};

/**
 * Simple and robust deep refresh method
 * This is the most reliable way to perform a hard refresh
 */
export const simpleDeepRefresh = (): void => {
    try {
        // Method 1: Force reload with cache busting
        const url = new URL(window.location.href);
        url.searchParams.set('_t', Date.now().toString());
        url.searchParams.set('_refresh', 'true');
        
        // Clear any existing refresh parameters first
        url.searchParams.delete('_t');
        url.searchParams.delete('_refresh');
        url.searchParams.set('_t', Date.now().toString());
        
        window.location.href = url.toString();
    } catch (error) {
        console.warn('Simple deep refresh failed, using fallback:', error);
        // Fallback to regular reload
        window.location.reload();
    }
};

/**
 * Alternative deep refresh using iframe technique
 * This method is very reliable across all browsers
 */
export const iframeDeepRefresh = (): void => {
    try {
        // Create a hidden iframe that loads the current page
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = window.location.href + '?_refresh=' + Date.now();
        
        // Add to document to trigger load
        document.body.appendChild(iframe);
        
        // After a short delay, reload the main page
        setTimeout(() => {
            window.location.reload();
        }, 100);
        
    } catch (error) {
        console.warn('Iframe refresh failed, using simple method:', error);
        simpleDeepRefresh();
    }
};

/**
 * The most robust deep refresh method
 * Uses multiple fallback strategies
 */
export const robustDeepRefresh = async (options: DeepRefreshOptions = {}): Promise<void> => {
    const {
        showLoading = true,
        loadingMessage = 'Refreshing system...',
        clearCaches = true
    } = options;

    let loadingOverlay: HTMLElement | null = null;

    try {
        // Show loading overlay
        if (showLoading) {
            loadingOverlay = createLoadingOverlay(loadingMessage);
            document.body.appendChild(loadingOverlay);
        }

        // Clear caches if requested
        if (clearCaches) {
            await clearAllCaches();
        }

        // Wait a moment for operations to complete
        await new Promise(resolve => setTimeout(resolve, 300));

        // Try the most reliable method first
        try {
            // Force a complete page reload with cache busting
            const url = new URL(window.location.href);
            url.searchParams.set('_refresh', Date.now().toString());
            url.searchParams.set('_cache_bust', Math.random().toString(36));
            
            // Use replace to avoid back button issues
            window.location.replace(url.toString());
        } catch (error) {
            console.warn('Primary robust refresh failed:', error);
            // Fallback to simple method
            simpleDeepRefresh();
        }

    } catch (error) {
        console.error('Robust deep refresh failed:', error);
        
        // Clean up loading overlay
        if (loadingOverlay) {
            loadingOverlay.remove();
        }
        
        // Final fallback
        window.location.reload();
    }
};

/**
 * Hook for using deep refresh in React components
 * Provides loading state and error handling
 */
export const useDeepRefresh = () => {
    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const refresh = React.useCallback(async (options?: DeepRefreshOptions) => {
        setIsRefreshing(true);
        setError(null);
        
        try {
            await robustDeepRefresh(options);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Refresh failed');
            setIsRefreshing(false);
        }
    }, []);

    return {
        refresh,
        isRefreshing,
        error
    };
};

// Import React for the hook
import React from 'react';
