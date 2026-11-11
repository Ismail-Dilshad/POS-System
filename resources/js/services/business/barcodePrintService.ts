import axios from '../../bootstrap';
import type { ApiResponse } from '../../types';

export interface BarcodePrintProduct {
    id: number;
    name: string;
    barcode: string;
    category?: string;
    supplier?: string;
    sell_price: number;
    barcode_type?: string | null;
    created_at: string;
    updated_at: string;
}

export interface BarcodePrintFilters {
    name?: string;
    barcode?: string;
    category?: string;
    supplier?: string;
}

class BarcodePrintService {
    /**
     * Get products for barcode printing with backend filtering and pagination
     */
    async getProducts(
        filters: BarcodePrintFilters = {},
        page: number = 1,
        perPage: number = 10,
    ): Promise<
        ApiResponse<BarcodePrintProduct[]> & {
            pagination?: {
                total: number;
                per_page: number;
                current_page: number;
                last_page: number;
                from: number;
                to: number;
            };
        }
    > {
        try {
            const params: Record<string, string | number> = {
                page,
                per_page: perPage,
            };

            if (filters.name) params.name = filters.name;
            if (filters.barcode) params.barcode = filters.barcode;
            if (filters.category && filters.category !== 'all') params.category = filters.category;
            if (filters.supplier && filters.supplier !== 'all') params.supplier = filters.supplier;

            const response = await axios.get('/api/barcode/products', { params });
            return response.data;
        } catch {
            return {
                success: false,
                message: 'Failed to fetch products',
            };
        }
    }

}

export const barcodePrintService = new BarcodePrintService();
