import { itemImagePayload } from '@/lib/item-image-payload';
import { ApiBase, getErrorDetails } from '@/lib/api-base';
import type { Product as ProductType } from '@/types';

export type Product = ProductType;

export interface ProductDuplicate {
    id: number;
    name: string;
    category_id: number;
    supplier_id: number;
    barcode_type: 'ean13' | 'ean8' | 'upc' | 'code128' | 'code39' | 'custom';
    barcode: string;
    secondary_barcode?: string;
    cost_price: number;
    sell_price: number;
    stock: number;
    min_stock: number;
    show_in_pos: boolean;
    carton_price?: number | null;
    expire_date?: string;
    last_sold_at?: string;
    profit_margin?: number;
    days_until_expire?: number;
    is_low_stock?: boolean;
    is_expired?: boolean;
    is_near_expiry?: boolean;
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

export interface ProductStatistics {
    total_products: number;
    low_stock_products: number;
    expired_products: number;
    near_expiry_products: number;
    total_stock_value: number;
    total_sell_value: number;
    potential_profit: number;
}

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
    errors?: Record<string, string[]>;
    error?: string;
}

class ProductService extends ApiBase {
    constructor() {
        super('/api');
    }

    /**
     * Get all products with optional search and filters
     */
    async getProducts(
        search: string = '',
        categoryId?: number,
        supplierId?: number,
        perPage: number = 15,
        page: number = 1,
    ): Promise<ApiResponse<Product[]>> {
        try {
            const params: Record<string, string | number> = {
                per_page: perPage,
                page: page,
            };
            if (search) params.search = search;
            if (categoryId) params.category_id = categoryId;
            if (supplierId) params.supplier_id = supplierId;

            const response = await this.get<ApiResponse<Product[]>>(
                '/products',
                params,
            );
            return response;
        } catch (error: unknown) {
            const { message } = getErrorDetails(error);
            return {
                success: false,
                message: message || 'Failed to fetch products',
            };
        }
    }

    async getPosVisibleProducts(
        perPage: number = 60,
        page: number = 1,
    ): Promise<ApiResponse<Product[]>> {
        try {
            const response = await this.get<ApiResponse<Product[]>>(
                '/products',
                {
                    per_page: perPage,
                    page,
                    show_in_pos: 'true',
                },
            );
            return response;
        } catch (error: unknown) {
            const { message } = getErrorDetails(error);
            return {
                success: false,
                message: message || 'Failed to fetch POS products',
            };
        }
    }

    /**
     * Create a new product
     */
    async createProduct(
        productData: Partial<Product>,
        image?: File | null,
        removeImage = false,
    ): Promise<ApiResponse<Product>> {
        try {
            const payload = itemImagePayload(productData, image, removeImage, false);
            const response = await this.post<ApiResponse<Product>>(
                '/products',
                payload,
            );
            return response;
        } catch (error: unknown) {
            const { message, errors } = getErrorDetails(error);
            return {
                success: false,
                message: message || 'Failed to create product',
                errors,
            };
        }
    }

    /**
     * Update an existing product
     */
    async updateProduct(
        id: number,
        productData: Partial<Product>,
        image?: File | null,
        removeImage = false,
    ): Promise<ApiResponse<Product>> {
        try {
            const payload = itemImagePayload(productData, image, removeImage, true);
            const response = payload instanceof FormData
                ? await this.post<ApiResponse<Product>>('/products/' + id, payload)
                : await this.put<ApiResponse<Product>>('/products/' + id, payload);
            return response;
        } catch (error: unknown) {
            const { message, errors } = getErrorDetails(error);
            return {
                success: false,
                message: message || 'Failed to update product',
                errors,
            };
        }
    }

    /**
     * Delete a product
     */
    async deleteProduct(id: number): Promise<ApiResponse<void>> {
        try {
            const response = await this.delete<ApiResponse<void>>(
                `/products/${id}`,
            );
            return response;
        } catch (error: unknown) {
            const { message } = getErrorDetails(error);
            return {
                success: false,
                message: message || 'Failed to delete product',
            };
        }
    }

    /**
     * Get product statistics
     */
    async getStatistics(): Promise<ApiResponse<ProductStatistics>> {
        try {
            const response = await this.get<ApiResponse<ProductStatistics>>(
                '/products/statistics',
            );
            return response;
        } catch (error: unknown) {
            const { message } = getErrorDetails(error);
            return {
                success: false,
                message: message || 'Failed to fetch statistics',
            };
        }
    }

    /**
     * Search products by name or barcode
     */
    async searchProducts(query: string): Promise<ApiResponse<Product[]>> {
        try {
            const response = await this.get<ApiResponse<Product[]>>(
                '/products/search',
                { query },
            );
            return response;
        } catch (error: unknown) {
            const { message } = getErrorDetails(error);
            return {
                success: false,
                message: message || 'Failed to search products',
            };
        }
    }

    /**
     * Check if barcode is available
     */
    async checkBarcode(
        barcode: string,
        excludeId?: number,
    ): Promise<ApiResponse<{ available: boolean }>> {
        try {
            const response = await this.post<
                ApiResponse<{ available: boolean }>
            >('/products/check-barcode', {
                barcode,
                exclude_id: excludeId,
            });
            return response;
        } catch (error: unknown) {
            const { message } = getErrorDetails(error);
            return {
                success: false,
                message: message || 'Failed to check barcode',
            };
        }
    }

    /**
     * Toggle POS visibility for a product
     */
    async togglePosVisibility(id: number): Promise<ApiResponse<Product>> {
        try {
            const response = await this.patch<ApiResponse<Product>>(
                `/products/${id}/toggle-pos`,
            );
            return response;
        } catch (error: unknown) {
            const { message } = getErrorDetails(error);
            return {
                success: false,
                message: message || 'Failed to toggle POS visibility',
            };
        }
    }
}

export const productService = new ProductService();
