import axios from '../../bootstrap';

export interface PosProduct {
    image_url?: string | null;
    id: number;
    type: 'product' | 'scale_product';
    name: string;
    barcode: string;
    secondary_barcode?: string;
    plu?: string; // Only for scale products
    sell_price: number;
    stock: number; // Added stock information
    per_carton?: number | null; // Items per carton for bulk tracking
    carton_price?: number | null;
}

export interface BarcodeSearchResponse {
    success: boolean;
    data: PosProduct[];
    count: number;
    cached: boolean;
    message?: string;
    error?: string;
}

export interface CacheStatsResponse {
    success: boolean;
    data: {
        barcode_index_exists: boolean;
        all_products_exists: boolean;
        cache_valid: boolean;
        barcode_index_ttl?: number;
        all_products_ttl?: number;
    };
    message?: string;
    error?: string;
}

export interface CacheActionResponse {
    success: boolean;
    message: string;
    stats?: Record<string, unknown>;
    error?: string;
}

class PosService {
    private readonly baseUrl = '/api/pos';

    /**
     * Get all products cache at POS startup (called once)
     */
    async getAllProductsCache(): Promise<{
        success: boolean;
        data: PosProduct[];
        count: number;
        timestamp: number;
        message?: string;
    }> {
        try {
            const response = await axios.get(`${this.baseUrl}/all-products-cache`);
            
            // Decompress compact format to full objects
            const products = response.data.data.map((p: {
                i: number;
                t: string;
                n: string;
                b: string;
                s: string;
                p: number;
                k: number;
                u?: string;
                c?: number; // per_carton field
                r?: number; // carton_price field
                m?: string | null; // image URL
            }) => {
                const product = {
                    id: p.i,
                    type: p.t,
                    name: p.n,
                    image_url: p.m ?? null,
                    barcode: p.b,
                    secondary_barcode: p.s,
                    sell_price: p.p,
                    stock: p.k,
                    plu: p.u,
                    per_carton: p.c || null,
                    carton_price: p.r || null,
                };
                
                
                return product;
            });
            
            return {
                success: true,
                data: products,
                count: response.data.count,
                timestamp: response.data.timestamp,
            };
        } catch (error: unknown) {
            return {
                success: false,
                data: [],
                count: 0,
                timestamp: 0,
                message: (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load cache',
            };
        }
    }

    /**
     * Search products by barcode (Redis-powered, zero delay)
     */
    async searchByBarcode(barcode: string): Promise<BarcodeSearchResponse> {
        try {
            const response = await axios.get(`${this.baseUrl}/search-barcode`, {
                params: { barcode: barcode.trim() },
            });

            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                data: [],
                count: 0,
                cached: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message || 'Search failed',
                error:
                    (error as { response?: { data?: { error?: string } } })
                        .response?.data?.error ||
                    (error as { message?: string }).message,
            };
        }
    }

    /**
     * Search products by name (Redis-powered, zero delay)
     */
    async searchByName(name: string): Promise<BarcodeSearchResponse> {
        try {
            const response = await axios.get(`${this.baseUrl}/search-name`, {
                params: { name: name.trim() },
            });

            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                data: [],
                count: 0,
                cached: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message || 'Search failed',
                error:
                    (error as { response?: { data?: { error?: string } } })
                        .response?.data?.error ||
                    (error as { message?: string }).message,
            };
        }
    }

    /**
     * Get cache statistics
     */
    async getCacheStats(): Promise<CacheStatsResponse> {
        try {
            const response = await axios.get(`${this.baseUrl}/cache-stats`);
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                data: {
                    barcode_index_exists: false,
                    all_products_exists: false,
                    cache_valid: false,
                },
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message || 'Failed to get cache stats',
                error:
                    (error as { response?: { data?: { error?: string } } })
                        .response?.data?.error ||
                    (error as { message?: string }).message,
            };
        }
    }

    /**
     * Rebuild product cache
     */
    async rebuildCache(): Promise<CacheActionResponse> {
        try {
            const response = await axios.post(`${this.baseUrl}/rebuild-cache`);
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message || 'Failed to rebuild cache',
                error:
                    (error as { response?: { data?: { error?: string } } })
                        .response?.data?.error ||
                    (error as { message?: string }).message,
            };
        }
    }

    /**
     * Complete cache refresh - clear all caches and rebuild from database
     */
    async refreshCache(): Promise<CacheActionResponse & { timestamp?: string }> {
        try {
            const response = await axios.post(`${this.baseUrl}/refresh-cache`);
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message || 'Failed to refresh cache',
                error:
                    (error as { response?: { data?: { error?: string } } })
                        .response?.data?.error ||
                    (error as { message?: string }).message,
            };
        }
    }

    /**
     * Clear product cache
     */
    async clearCache(): Promise<CacheActionResponse> {
        try {
            const response = await axios.delete(`${this.baseUrl}/clear-cache`);
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message || 'Failed to clear cache',
                error:
                    (error as { response?: { data?: { error?: string } } })
                        .response?.data?.error ||
                    (error as { message?: string }).message,
            };
        }
    }

    /**
     * Check if a barcode matches exactly (for instant lookup)
     */
    isExactBarcodeMatch(product: PosProduct, search: string): boolean {
        const searchLower = search.toLowerCase().trim();
        return (
            product.barcode?.toLowerCase() === searchLower ||
            product.secondary_barcode?.toLowerCase() === searchLower ||
            (product.type === 'scale_product' &&
                product.plu?.toLowerCase() === searchLower)
        );
    }

    /**
     * Format barcode display for POS (simplified)
     */
    formatBarcodeDisplay(product: PosProduct): string {
        return product.barcode;
    }

    /**
     * Get barcode display for product (handles both regular and scale products)
     */
    getPrimaryBarcode(product: PosProduct): string {
        if (product.type === 'scale_product' && product.plu) {
            return product.plu;
        }
        return product.barcode;
    }
}

export const posService = new PosService();
