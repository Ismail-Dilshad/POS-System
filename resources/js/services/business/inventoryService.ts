import axios from '../../bootstrap';
import { SCALE_PRODUCTS_ENABLED } from '@/config/features';
import {
    type ApiResponse,
    type InventoryItem,
    type InventoryStatistics,
} from '../../types';

export type ProductType = 'product' | 'scale_product' | 'card';

// Re-export InventoryItem for components that need it
export type { InventoryItem };

export interface AdjustmentItem {
    id: number;
    product_type: 'product' | 'scale_product';
    adjust_type: 'add' | 'delete' | 'set';
    adjust_qty: number;
}

export interface AdjustmentResult {
    id: number;
    product_type: 'product' | 'scale_product';
    name: string;
    identifier: string;
    old_stock: number;
    new_stock: number;
    adjust_qty: number;
    adjust_type: 'add' | 'delete' | 'set';
    [key: string]: unknown;
}

export interface AdjustmentResponse {
    success: boolean;
    message: string;
    data?: {
        adjusted_items: AdjustmentResult[];
        errors: string[];
        total_processed: number;
        total_errors: number;
    };
    errors?: Record<string, string[]>;
}

export interface InventoryFilters {
    search?: string;
    status?: string;
    category?: string;
    supplier?: string;
    productType?: string;
    priceMin?: string;
    priceMax?: string;
    stockMin?: string;
    stockMax?: string;
    dateFrom?: string;
    dateTo?: string;
    notSoldPeriod?: string;
    profitMarginMin?: string;
    profitMarginMax?: string;
}

class InventoryService {
    /**
     * Get inventory items with intelligent pagination and comprehensive filtering
     * ALL filters are sent to backend for database-level filtering (maximum performance)
     */
    async getInventoryItems(
        filters: InventoryFilters = {},
        page: number = 1,
        perPage: number = 10,
        exportMode: boolean = false,
        minimalMode: boolean = false,
        signal?: AbortSignal,
        refresh: boolean = false,
    ): Promise<ApiResponse<InventoryItem[]> & {
        pagination?: {
            total: number;
            per_page: number;
            current_page: number;
            last_page: number;
            from: number;
            to: number;
        };
    }> {
        try {
            // Keep the existing backend untouched. Combine its regular-product and
            // card pages so hidden scale rows cannot leave gaps or inflate pagination.
            if (!SCALE_PRODUCTS_ENABLED &&
                (!filters.productType || ['all', 'scale', 'scale_product'].includes(filters.productType))) {
                const fetchType = (productType: string, requestedPage: number) =>
                    this.getInventoryItems(
                        { ...filters, productType }, requestedPage, perPage,
                        exportMode, minimalMode, signal, refresh,
                    );
                const [products, cards] = await Promise.all([
                    fetchType('product', page), fetchType('card', 1),
                ]);
                if (!products.success || !cards.success) {
                    return { success: false, message: 'Failed to fetch inventory items' };
                }
                const productCount = products.pagination?.total ?? products.data?.length ?? 0;
                const cardCount = cards.pagination?.total ?? cards.data?.length ?? 0;
                const total = productCount + cardCount;
                const pageSize = Math.max(1, Math.min(perPage, 100));
                const currentPage = exportMode ? 1 : Math.max(1, page);
                const offset = exportMode ? 0 : (currentPage - 1) * pageSize;
                let data = products.data ?? [];
                if (exportMode) {
                    data = [...data, ...(cards.data ?? [])];
                } else if (data.length < pageSize && offset < total) {
                    const cardOffset = Math.max(0, offset - productCount);
                    const firstCardPage = Math.floor(cardOffset / pageSize) + 1;
                    const withinPage = cardOffset % pageSize;
                    const firstCards = firstCardPage === 1 ? cards : await fetchType('card', firstCardPage);
                    if (!firstCards.success) return firstCards;
                    let cardData = (firstCards.data ?? []).slice(withinPage);
                    const needed = Math.min(pageSize - data.length, cardCount - cardOffset);
                    if (cardData.length < needed) {
                        const nextCards = await fetchType('card', firstCardPage + 1);
                        if (!nextCards.success) return nextCards;
                        cardData = [...cardData, ...(nextCards.data ?? [])];
                    }
                    data = [...data, ...cardData.slice(0, needed)];
                }
                return {
                    success: true,
                    data,
                    pagination: {
                        total, per_page: exportMode ? total : pageSize,
                        current_page: currentPage,
                        last_page: exportMode ? 1 : Math.max(1, Math.ceil(total / pageSize)),
                        from: data.length ? offset + 1 : 0,
                        to: data.length ? offset + data.length : 0,
                    },
                };
            }

            const params: Record<string, string | number | boolean> = {
                page,
                per_page: perPage,
                ...(refresh ? { refresh: true } : {}),
            };
            
            if (exportMode) {
                params.export = true;
            }

            if (minimalMode) {
                params.minimal = 'true';
            }

            // Build search query from search filter
            if (filters.search) {
                params.search = filters.search;
            }

            // Add all filter parameters
            if (filters.status && filters.status !== 'all') {
                params.status = filters.status;
            }
            if (filters.category && filters.category !== 'all') {
                params.category = filters.category;
            }
            if (filters.supplier && filters.supplier !== 'all') {
                params.supplier = filters.supplier;
            }
            if (filters.productType && filters.productType !== 'all') {
                params.productType = filters.productType;
            }
            if (filters.priceMin) {
                params.priceMin = filters.priceMin;
            }
            if (filters.priceMax) {
                params.priceMax = filters.priceMax;
            }
            if (filters.stockMin) {
                params.stockMin = filters.stockMin;
            }
            if (filters.stockMax) {
                params.stockMax = filters.stockMax;
            }
            if (filters.dateFrom) {
                params.dateFrom = filters.dateFrom;
            }
            if (filters.dateTo) {
                params.dateTo = filters.dateTo;
            }
            if (filters.notSoldPeriod && filters.notSoldPeriod !== 'all') {
                params.notSoldPeriod = filters.notSoldPeriod;
            }
            if (filters.profitMarginMin) {
                params.profitMarginMin = filters.profitMarginMin;
            }
            if (filters.profitMarginMax) {
                params.profitMarginMax = filters.profitMarginMax;
            }

            const response = await axios.get('/api/inventory', { params, signal });
            // Backend returns: { success: true, data: [...], pagination: {...} }
            return response.data;
        } catch {
            return {
                success: false,
                message: 'Failed to fetch inventory items',
            };
        }
    }

    /**
     * Get comprehensive statistics for inventory dashboard
     */
    async getComprehensiveStatistics(refresh: boolean = false): Promise<
        ApiResponse<InventoryStatistics>
    > {
        try {
            const response = await axios.get('/api/inventory/statistics', { params: refresh ? { refresh: true } : undefined });
            return response.data;
        } catch {
            return {
                success: false,
                message: 'Failed to fetch inventory statistics',
            };
        }
    }

    /**
     * Validate adjustment items
     */
    async validateAdjustments(
        items: AdjustmentItem[],
    ): Promise<ApiResponse<{ valid: boolean; errors: string[] }>> {
        try {
            const response = await axios.post(
                '/api/inventory/validate-adjustments',
                { items },
            );
            return response.data;
        } catch {
            return {
                success: false,
                message: 'Failed to validate adjustments',
            };
        }
    }

    /**
     * Adjust inventory stock
     */
    async adjustInventory(
        items: AdjustmentItem[],
    ): Promise<AdjustmentResponse> {
        try {
            const response = await axios.post('/api/inventory/adjust', {
                items,
            });
            return response.data;
        } catch {
            return {
                success: false,
                message: 'Failed to adjust inventory',
            };
        }
    }
}

export default new InventoryService();
