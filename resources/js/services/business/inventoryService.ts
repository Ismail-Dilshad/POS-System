import axios from '../../bootstrap';
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
