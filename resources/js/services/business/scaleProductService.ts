import { itemImagePayload } from '@/lib/item-image-payload';
import type { ScaleProduct as ScaleProductType } from '@/types';
import axios from '../../bootstrap';

export type ScaleProduct = ScaleProductType;

export interface ScaleProductDuplicate {
    id: number;
    name: string;
    category_id?: number;
    supplier_id?: number;
    scale_id: string;
    plu: string;
    unit_type: 'kg';
    cost_price: number;
    sell_price: number;
    stock: number;
    min_stock: number;
    show_in_pos: boolean;
    profit_margin?: number;
    is_low_stock?: boolean;
    is_out_of_stock?: boolean;
    stock_value?: number;
    category?: {
        id: number;
        name: string;
    };
    supplier?: {
        id: number;
        name: string;
        supplier_code: string;
    };
    created_at: string;
    updated_at: string;
}

export interface ScaleProductStatistics {
    total_scale_products: number;
    low_stock_products: number;
    out_of_stock_products: number;
    in_stock_products: number;
    total_stock_value: number;
    total_cost_value: number;
    potential_profit: number;
}

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
    errors?: Record<string, string[]>;
    error?: string;
}

class ScaleProductService {
    /**
     * Get all scale products with optional search and filters
     */
    async getScaleProducts(
        search: string = '',
        categoryId?: number,
        supplierId?: number,
        perPage: number = 10000,
    ): Promise<ApiResponse<ScaleProduct[]>> {
        try {
            const params: Record<string, string | number> = {
                per_page: perPage, // Set high limit to get all scale products
            };
            if (search) params.search = search;
            if (categoryId) params.category_id = categoryId;
            if (supplierId) params.supplier_id = supplierId;

            const response = await axios.get('/api/scale-products', { params });
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message ||
                    'Failed to fetch scale products',
            };
        }
    }

    /**
     * Create a new scale product
     */
    async createScaleProduct(
        scaleProductData: Partial<ScaleProduct>,
        image?: File | null,
        removeImage = false,
    ): Promise<ApiResponse<ScaleProduct>> {
        try {
            const payload = itemImagePayload(scaleProductData, image, removeImage, false);
            const response = await axios.post(
                '/api/scale-products',
                payload,
            );
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message ||
                    'Failed to create scale product',
                errors: (
                    error as {
                        response?: {
                            data?: { errors?: Record<string, string[]> };
                        };
                    }
                ).response?.data?.errors,
            };
        }
    }

    /**
     * Update an existing scale product
     */
    async updateScaleProduct(
        id: number,
        scaleProductData: Partial<ScaleProduct>,
        image?: File | null,
        removeImage = false,
    ): Promise<ApiResponse<ScaleProduct>> {
        try {
            const payload = itemImagePayload(scaleProductData, image, removeImage, true);
            const response = payload instanceof FormData
                ? await axios.post('/api/scale-products/' + id, payload)
                : await axios.put('/api/scale-products/' + id, payload);
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message ||
                    'Failed to update scale product',
                errors: (
                    error as {
                        response?: {
                            data?: { errors?: Record<string, string[]> };
                        };
                    }
                ).response?.data?.errors,
            };
        }
    }

    /**
     * Delete a scale product
     */
    async deleteScaleProduct(id: number): Promise<ApiResponse<void>> {
        try {
            const response = await axios.delete(`/api/scale-products/${id}`);
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message ||
                    'Failed to delete scale product',
            };
        }
    }

    /**
     * Get a single scale product
     */
    async getScaleProduct(id: number): Promise<ApiResponse<ScaleProduct>> {
        try {
            const response = await axios.get(`/api/scale-products/${id}`);
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message ||
                    'Failed to fetch scale product',
            };
        }
    }

    /**
     * Get scale product statistics
     */
    async getScaleProductStatistics(): Promise<
        ApiResponse<ScaleProductStatistics>
    > {
        try {
            const response = await axios.get('/api/scale-products/statistics');
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message ||
                    'Failed to fetch scale product statistics',
            };
        }
    }

    /**
     * Check if PLU is unique
     */
    async checkPlu(
        plu: string,
        scaleProductId?: number,
    ): Promise<ApiResponse<{ is_unique: boolean; plu: string }>> {
        try {
            const data: Record<string, string | number> = { plu };
            if (scaleProductId) data.scale_product_id = scaleProductId;

            const response = await axios.post(
                '/api/scale-products/check-plu',
                data,
            );
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message || 'Failed to check PLU',
            };
        }
    }

    /**
     * Toggle POS visibility for a scale product
     */
    async togglePosVisibility(
        scaleProductId: number,
    ): Promise<ApiResponse<ScaleProduct>> {
        try {
            const response = await axios.patch(
                `/api/scale-products/${scaleProductId}/toggle-pos`,
            );
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message ||
                    'Failed to toggle POS visibility',
            };
        }
    }

    /**
     * Find scale product by scale ID and PLU
     */
    async findByScaleIdAndPlu(
        scaleId: string,
        plu: string,
    ): Promise<ApiResponse<ScaleProduct>> {
        try {
            const response = await axios.get('/api/scale-products', {
                params: {
                    scale_id: scaleId,
                    plu: plu,
                    per_page: 1,
                },
            });

            if (response.data.success && response.data.data) {
                // Check if it's paginated data (has data property) or direct array
                const products = response.data.data.data || response.data.data;

                if (Array.isArray(products) && products.length > 0) {
                    return {
                        success: true,
                        data: products[0],
                    };
                }
            }

            return {
                success: false,
                message: `Scale product not found with Scale ID: ${scaleId} and PLU: ${plu}`,
            };
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message ||
                    'Failed to find scale product',
            };
        }
    }

    /**
     * Search scale products by query
     */
    async searchProducts(params: {
        query: string;
    }): Promise<ApiResponse<ScaleProduct[]>> {
        try {
            const response = await axios.get('/api/scale-products/search', {
                params,
            });
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message ||
                    'Failed to search scale products',
            };
        }
    }
}

export const scaleProductService = new ScaleProductService();
