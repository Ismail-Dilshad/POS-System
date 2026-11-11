import axios from 'axios';

export interface SupplierReturn {
    id: number;
    purchase_id?: number;
    user_id?: number;
    original_order_id: string;
    original_order_name: string;
    return_reason: string;
    total_amount: number;
    items_count: number;
    created_at: string;
    updated_at?: string;
    user?: {
        id: number;
        full_name: string;
        username: string;
    };
    items?: SupplierReturnItem[];
}

export interface SupplierReturnItem {
    id: number;
    supplier_return_id: number;
    purchase_item_id: number;
    product_id?: number;
    product_type: string;
    product_name: string;
    identifier: string;
    return_quantity: number;
    return_amount: number;
    cost_price: number;
}

export interface SupplierReturnStatistics {
    total_returns: number;
    total_amount: number;
    total_items: number;
    this_month_returns: number;
    this_month_amount: number;
    this_month_items: number;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    pagination?: {
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
        from: number;
        to: number;
    };
}

const supplierReturnService = {
    async getSupplierReturns(params?: {
        page?: number;
        per_page?: number;
        order_id?: string;
        order_name?: string;
        date_from?: string;
        date_to?: string;
        min_amount?: string;
        max_amount?: string;
        sort_by?: string;
        sort_order?: 'asc' | 'desc';
    }): Promise<{
        data: SupplierReturn[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    }> {
        try {
            const response = await axios.get('/api/supplier-returns', {
                params: {
                    page: params?.page,
                    per_page: params?.per_page,
                    order_id: params?.order_id,
                    search: params?.order_id,
                    order_name: params?.order_name,
                    date_from: params?.date_from,
                    date_to: params?.date_to,
                    min_amount: params?.min_amount,
                    max_amount: params?.max_amount,
                    sort_by: params?.sort_by,
                    sort_order: params?.sort_order,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                },
            });

            if (response.data.success && response.data.data) {
                const paginatedData = response.data.data;
                return {
                    data: paginatedData.data || [],
                    current_page: paginatedData.current_page || 1,
                    last_page: paginatedData.last_page || 1,
                    per_page: paginatedData.per_page || 10,
                    total: paginatedData.total || 0,
                };
            }

            return {
                data: [],
                current_page: 1,
                last_page: 1,
                per_page: 10,
                total: 0,
            };
        } catch {
            return {
                data: [],
                current_page: 1,
                last_page: 1,
                per_page: 10,
                total: 0,
            };
        }
    },

    async getAllSupplierReturns(params?: {
        order_id?: string;
        order_name?: string;
        date_from?: string;
        date_to?: string;
        min_amount?: string;
        max_amount?: string;
        sort_by?: string;
        sort_order?: 'asc' | 'desc';
        export?: boolean;
    }): Promise<ApiResponse<SupplierReturn[] & { pagination?: { total: number; per_page: number; current_page: number; last_page: number; from: number; to: number } }>> {
        try {
            const response = await axios.get('/api/supplier-returns/all', {
                params: {
                    order_id: params?.order_id,
                    search: params?.order_id,
                    order_name: params?.order_name,
                    date_from: params?.date_from,
                    date_to: params?.date_to,
                    min_amount: params?.min_amount,
                    max_amount: params?.max_amount,
                    sort_by: params?.sort_by,
                    sort_order: params?.sort_order,
                    export: params?.export,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                },
            });

            if (response.data.success) {
                if (response.data.pagination) {
                    return {
                        success: true,
                        data: response.data.data || [],
                        pagination: response.data.pagination,
                    } as ApiResponse<SupplierReturn[] & { pagination?: { total: number; per_page: number; current_page: number; last_page: number; from: number; to: number } }>;
                }
                
                return {
                    success: true,
                    data: response.data.data || [],
                };
            }

            return {
                success: false,
                message: 'Failed to fetch all supplier returns',
            };
        } catch {
            return {
                success: false,
                message: 'Failed to fetch all supplier returns',
            };
        }
    },

    async getSupplierReturnStatistics(): Promise<SupplierReturnStatistics> {
        try {
            const response = await axios.get('/api/supplier-returns/statistics', {
                params: {
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                },
            });

            if (response.data.success && response.data.data) {
                return response.data.data;
            }

            return {
                total_returns: 0,
                total_amount: 0,
                total_items: 0,
                this_month_returns: 0,
                this_month_amount: 0,
                this_month_items: 0,
            };
        } catch {
            return {
                total_returns: 0,
                total_amount: 0,
                total_items: 0,
                this_month_returns: 0,
                this_month_amount: 0,
                this_month_items: 0,
            };
        }
    },

    async getSupplierReturn(id: number): Promise<SupplierReturn | null> {
        try {
            const response = await axios.get(`/api/supplier-returns/${id}`);
            if (response.data.success && response.data.data) {
                return response.data.data;
            }
            return null;
        } catch {
            return null;
        }
    },
};

export default supplierReturnService;
