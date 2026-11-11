import axios from '../../bootstrap';

export interface Purchase {
    id: number;
    invoice_name: string;
    invoice_id: string;
    total_orders: number;
    total_amount: number;
    status: 'order' | 'receive';
    notes?: string;
    created_at: string;
    updated_at: string;
    items?: PurchaseItem[];
}

export interface PurchaseItem {
    id: number;
    purchase_id: number;
    product_id: number;
    product_type: 'product' | 'scale_product';
    product_name: string;
    identifier: string;
    cost_price: number;
    sell_price: number;
    quantity: number;
    total_cost: number;
    profit_margin: number;
    supplier_id?: number;
    supplier_name?: string;
    created_at: string;
    updated_at: string;
}

export interface CreatePurchaseData {
    invoice_name: string;
    invoice_id: string;
    notes?: string;
    items: {
        product_id: number;
        product_type: 'product' | 'scale_product';
        product_name: string;
        identifier: string;
        cost_price: number;
        sell_price: number;
        quantity: number;
        supplier_id?: number;
        supplier_name?: string;
    }[];
}

export interface UpdatePurchaseData {
    invoice_name: string;
    invoice_id: string;
    notes?: string;
    status?: 'order' | 'receive';
    items?: {
        product_id: number;
        product_type: 'product' | 'scale_product';
        product_name: string;
        identifier: string;
        cost_price: number;
        sell_price: number;
        quantity: number;
        supplier_id?: number;
        supplier_name?: string;
    }[];
}

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
    errors?: Record<string, string[]>;
    error?: string;
}

export interface PurchaseHistoryByProductData {
    total_quantity_in: number;
    quantity_this_month: number;
    first_purchase_date: string | null;
    last_purchase_date: string | null;
}

class PurchaseService {
    /**
     * Get purchase history summary for a product (for "going in" tracking).
     */
    async getPurchaseHistoryByProduct(
        productId: number,
        productType: 'product' | 'scale_product',
    ): Promise<ApiResponse<PurchaseHistoryByProductData>> {
        try {
            const response = await axios.get('/api/purchases/by-product', {
                params: { product_id: productId, product_type: productType },
            });
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message ||
                    'Failed to fetch purchase history',
            };
        }
    }

    /**
     * Get purchases with pagination and comprehensive filtering
     */
    async getPurchases(
        filters: {
            search?: string;
            status?: string;
            multiSupplier?: string;
            priceMin?: string;
            priceMax?: string;
            dateFrom?: string;
            dateTo?: string;
            timeFrom?: string;
            timeTo?: string;
        } = {},
        page: number = 1,
        perPage: number = 10,
        exportMode: boolean = false,
    ): Promise<ApiResponse<Purchase[]> & {
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
            };

            // Add all filter parameters
            if (filters.search) params.search = filters.search;
            if (filters.status) params.status = filters.status;
            if (filters.multiSupplier) params.multiSupplier = filters.multiSupplier;
            if (filters.priceMin) params.priceMin = filters.priceMin;
            if (filters.priceMax) params.priceMax = filters.priceMax;
            if (filters.dateFrom) params.dateFrom = filters.dateFrom;
            if (filters.dateTo) params.dateTo = filters.dateTo;
            if (filters.timeFrom) params.timeFrom = filters.timeFrom;
            if (filters.timeTo) params.timeTo = filters.timeTo;
            
            // Add user's timezone
            params.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

            // Export mode - return all filtered items without pagination
            if (exportMode) {
                params.export = true;
            }

            const response = await axios.get('/api/purchases', { params });
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message || 'Failed to fetch purchases',
                error: (error as { message?: string }).message,
            };
        }
    }

    /**
     * Get purchase statistics with comprehensive filtering
     */
    async getStatistics(
        filters: {
            search?: string;
            status?: string;
            multiSupplier?: string;
            priceMin?: string;
            priceMax?: string;
            dateFrom?: string;
            dateTo?: string;
            timeFrom?: string;
            timeTo?: string;
        } = {},
    ): Promise<ApiResponse<Record<string, unknown>>> {
        try {
            const params: Record<string, string> = {};

            // Add all filter parameters
            if (filters.search) params.search = filters.search;
            if (filters.status) params.status = filters.status;
            if (filters.multiSupplier) params.multiSupplier = filters.multiSupplier;
            if (filters.priceMin) params.priceMin = filters.priceMin;
            if (filters.priceMax) params.priceMax = filters.priceMax;
            if (filters.dateFrom) params.dateFrom = filters.dateFrom;
            if (filters.dateTo) params.dateTo = filters.dateTo;
            if (filters.timeFrom) params.timeFrom = filters.timeFrom;
            if (filters.timeTo) params.timeTo = filters.timeTo;
            
            // Add user's timezone
            params.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

            const response = await axios.get('/api/purchases/statistics', { params });
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message ||
                    'Failed to fetch statistics',
                error: (error as { message?: string }).message,
            };
        }
    }

    /**
     * Get a single purchase by ID
     */
    async getPurchase(id: number): Promise<ApiResponse<Purchase>> {
        try {
            const response = await axios.get(`/api/purchases/${id}`);
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message || 'Failed to fetch purchase',
                error: (error as { message?: string }).message,
            };
        }
    }

    /**
     * Create a new purchase
     */
    async createPurchase(
        data: CreatePurchaseData,
    ): Promise<ApiResponse<Purchase>> {
        try {
            const response = await axios.post('/api/purchases', data);
            return response.data;
        } catch (error: unknown) {
            if (
                (error as { response?: { status?: number } }).response
                    ?.status === 422
            ) {
                return {
                    success: false,
                    message: 'Validation failed',
                    errors: (
                        error as {
                            response?: {
                                data?: { errors?: Record<string, string[]> };
                            };
                        }
                    ).response?.data?.errors,
                };
            }
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message || 'Failed to create purchase',
                error: (error as { message?: string }).message,
            };
        }
    }

    /**
     * Update an existing purchase
     */
    async updatePurchase(
        id: number,
        data: UpdatePurchaseData,
    ): Promise<ApiResponse<Purchase>> {
        try {
            const response = await axios.put(`/api/purchases/${id}`, data);
            return response.data;
        } catch (error: unknown) {
            if (
                (error as { response?: { status?: number } }).response
                    ?.status === 422
            ) {
                return {
                    success: false,
                    message: 'Validation failed',
                    errors: (
                        error as {
                            response?: {
                                data?: { errors?: Record<string, string[]> };
                            };
                        }
                    ).response?.data?.errors,
                };
            }
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message || 'Failed to update purchase',
                error: (error as { message?: string }).message,
            };
        }
    }

    /**
     * Mark purchase as received with optional supplier payments
     */
    async markAsReceived(
        id: number,
        supplierPayments?: Record<string, unknown>[],
    ): Promise<ApiResponse<Purchase>> {
        try {
            const data: Record<string, unknown> = {};
            if (supplierPayments && supplierPayments.length > 0) {
                data.supplier_payments = supplierPayments;
            }

            const response = await axios.patch(
                `/api/purchases/${id}/receive`,
                data,
            );
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message ||
                    'Failed to mark purchase as received',
                error: (error as { message?: string }).message,
            };
        }
    }

    /**
     * Delete a purchase
     */
    async deletePurchase(id: number): Promise<ApiResponse<void>> {
        try {
            const response = await axios.delete(`/api/purchases/${id}`);
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message || 'Failed to delete purchase',
                error: (error as { message?: string }).message,
            };
        }
    }

    /**
     * Delete all purchases with password verification
     */
    async deleteAllPurchases(password: string): Promise<ApiResponse<{ deleted_count: number }>> {
        try {
            const response = await axios.post('/api/purchases/delete-all', {
                password,
            });
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message ||
                    'Failed to delete all purchases',
            };
        }
    }

    /**
     * Get purchase report data (one row per item) - separate from regular purchase endpoint
     */
    async getPurchaseReport(
        filters: {
            page?: number;
            per_page?: number;
            barcode?: string;
            product_type?: 'all' | 'normal' | 'scale';
            category?: string;
            supplier?: string;
            price_from?: number;
            price_to?: number;
            date_from?: string;
            date_to?: string;
            time_from?: string;
            time_to?: string;
            sort_by?: string;
            sort_order?: 'asc' | 'desc';
        } = {},
    ): Promise<
        ApiResponse<{
            data: Array<{
                id: string;
                purchase_id: number;
                invoice_id: string;
                invoice_name: string;
                status: string;
                supplier_name?: string;
                product_name: string;
                product_type: string;
                identifier: string;
                quantity: number;
                cost_price: number;
                sell_price: number;
                total_cost: number;
                profit_margin: number;
                created_at: string;
                updated_at: string;
            }>;
            current_page: number;
            last_page: number;
            per_page: number;
            total: number;
        }>
    > {
        try {
            const params: Record<string, string | number> = {};
            
            if (filters.page) params.page = filters.page;
            if (filters.per_page) params.per_page = filters.per_page;
            if (filters.barcode && filters.barcode.trim()) params.barcode = filters.barcode.trim();
            if (filters.product_type && filters.product_type !== 'all') params.product_type = filters.product_type;
            if (filters.supplier) params.supplier = filters.supplier;
            if (filters.price_from) params.price_from = filters.price_from;
            if (filters.price_to) params.price_to = filters.price_to;
            if (filters.date_from) params.date_from = filters.date_from;
            if (filters.date_to) params.date_to = filters.date_to;
            if (filters.time_from) params.time_from = filters.time_from;
            if (filters.time_to) params.time_to = filters.time_to;
            if (filters.sort_by) params.sort_by = filters.sort_by;
            if (filters.sort_order) params.sort_order = filters.sort_order;
            
            params.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

            const response = await axios.get('/api/purchases/report', { params });
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message ||
                    'Failed to fetch purchase report',
            };
        }
    }

    /**
     * Get purchase report statistics (filtered based on filters)
     */
    async getPurchaseReportStatistics(
        filters: {
            barcode?: string;
            product_type?: 'all' | 'normal' | 'scale';
            category?: string;
            supplier?: string;
            price_from?: number;
            price_to?: number;
            date_from?: string;
            date_to?: string;
            time_from?: string;
            time_to?: string;
        } = {},
    ): Promise<ApiResponse<{
        total_purchases: number;
        total_items: number;
        total_quantity: number;
        total_amount: number;
    }>> {
        try {
            const params: Record<string, string | number> = {};
            
            if (filters.barcode && filters.barcode.trim()) params.barcode = filters.barcode.trim();
            if (filters.product_type && filters.product_type !== 'all') params.product_type = filters.product_type;
            if (filters.category) params.category = filters.category;
            if (filters.supplier) params.supplier = filters.supplier;
            if (filters.price_from) params.price_from = filters.price_from;
            if (filters.price_to) params.price_to = filters.price_to;
            if (filters.date_from) params.date_from = filters.date_from;
            if (filters.date_to) params.date_to = filters.date_to;
            if (filters.time_from) params.time_from = filters.time_from;
            if (filters.time_to) params.time_to = filters.time_to;
            
            params.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

            const response = await axios.get('/api/purchases/report/statistics', { params });
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message ||
                    'Failed to fetch purchase report statistics',
            };
        }
    }

    /**
     * Get all purchase report data for export
     */
    async getAllPurchaseReport(
        filters: {
            barcode?: string;
            product_type?: 'all' | 'normal' | 'scale';
            category?: string;
            supplier?: string;
            price_from?: number;
            price_to?: number;
            date_from?: string;
            date_to?: string;
            time_from?: string;
            time_to?: string;
        } = {},
    ): Promise<ApiResponse<Array<{
        id: string;
        purchase_id: number;
        invoice_id: string;
        invoice_name: string;
        status: string;
        supplier_name?: string;
        product_name: string;
        product_type: string;
        identifier: string;
        category?: string;
        quantity: number;
        cost_price: number;
        sell_price: number;
        total_cost: number;
        profit_margin: number;
        created_at: string;
        updated_at: string;
    }>>> {
        try {
            const params: Record<string, string | number> = {};
            
            if (filters.barcode && filters.barcode.trim()) params.barcode = filters.barcode.trim();
            if (filters.product_type && filters.product_type !== 'all') params.product_type = filters.product_type;
            if (filters.category) params.category = filters.category;
            if (filters.supplier) params.supplier = filters.supplier;
            if (filters.price_from) params.price_from = filters.price_from;
            if (filters.price_to) params.price_to = filters.price_to;
            if (filters.date_from) params.date_from = filters.date_from;
            if (filters.date_to) params.date_to = filters.date_to;
            if (filters.time_from) params.time_from = filters.time_from;
            if (filters.time_to) params.time_to = filters.time_to;
            
            params.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

            const response = await axios.get('/api/purchases/report/export', { params });
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message ||
                    'Failed to export purchase report',
            };
        }
    }
}

export const purchaseService = new PurchaseService();
export default purchaseService;
