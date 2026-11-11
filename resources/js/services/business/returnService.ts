import axios from '../../bootstrap';

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
    errors?: Record<string, string[]>;
    error?: string;
}

interface ReturnItem {
    product_id?: number;
    return_quantity: number;
    return_total: number;
    original_price: number;
}

interface ReturnData {
    return_type: 'receipt' | 'manual';
    original_transaction_id?: number;
    original_transaction_number?: string;
    items: ReturnItem[];
    processed_by_user_id: number;
    adjust_inventory?: boolean;
}

interface ReturnRecord {
    id: number;
    return_code: string;
    return_type: 'receipt' | 'manual';
    original_transaction_id?: number;
    original_transaction_number?: string;
    total_return_amount: number;
    processed_by_user_id: number;
    created_at: string;
    updated_at: string;
    processed_by?: {
        id: number;
        name: string;
    };
    items_count?: number; // Count of items returned by withCount('items')
    items?: Array<{
        id: number;
        product_id: number;
        product_name: string;
        product_barcode: string;
        product_category: string;
        product_supplier: string;
        original_price: number;
        return_quantity: number;
        return_total: number;
        stock_adjusted: boolean;
        stock_adjusted_at?: string;
        stock_adjusted_by?: number;
    }>;
}

interface TransactionHistoryResult {
    product_id: number;
    product_name: string;
    product_barcode: string;
    category_name: string;
    supplier_name: string;
    sell_price: number;
    total_sold: number;
    total_returned: number;
    max_available: number;
    transaction_history: Array<{
        transaction_number: string;
        transaction_date: string;
        quantity: number;
        total: number;
    }>;
}

interface ReturnStatistics {
    total_returns: number;
    total_amount: number;
    receipt_returns: number;
    manual_returns: number;
    average_return_value: number;
}

interface CreateReturnResponse {
    data: ReturnRecord;
    transaction_deleted: boolean;
    message: string;
}

const returnService = {
    async createReturn(returnData: ReturnData): Promise<CreateReturnResponse> {
        const response = await fetch('/api/returns', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLhttpsRequest',
                'X-CSRF-TOKEN':
                    document
                        .querySelector('meta[name="csrf-token"]')
                        ?.getAttribute('content') || '',
            },
            body: JSON.stringify(returnData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to process return');
        }

        const result = await response.json();
        return {
            data: result.data,
            transaction_deleted: result.transaction_deleted || false,
            message: result.message,
        };
    },

    async getReturns(params?: {
        page?: number;
        per_page?: number;
        return_id?: string;
        date_from?: string;
        date_to?: string;
        time_from?: string;
        time_to?: string;
        return_type?: 'receipt' | 'manual';
        amount_min?: string;
        amount_max?: string;
        sort_by?: string;
        sort_order?: 'asc' | 'desc';
    }): Promise<{
        data: ReturnRecord[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    }> {
        try {
            const response = await axios.get('/api/returns', {
                params: {
                    page: params?.page,
                    per_page: params?.per_page,
                    return_id: params?.return_id,
                    search: params?.return_id,
                    date_from: params?.date_from,
                    date_to: params?.date_to,
                    time_from: params?.time_from,
                    time_to: params?.time_to,
                    return_type: params?.return_type,
                    amount_min: params?.amount_min,
                    amount_max: params?.amount_max,
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

    async getAllReturns(params?: {
        return_id?: string;
        date_from?: string;
        date_to?: string;
        time_from?: string;
        time_to?: string;
        return_type?: 'receipt' | 'manual';
        amount_min?: string;
        amount_max?: string;
        sort_by?: string;
        sort_order?: 'asc' | 'desc';
        export?: boolean;
        cursor?: number;
    }): Promise<ApiResponse<ReturnRecord[] & { cursor?: number; has_more?: boolean; count?: number; pagination?: { total: number; per_page: number; current_page: number; last_page: number; from: number; to: number } }>> {
        try {
            const response = await axios.get('/api/returns/all', {
                params: {
                    return_id: params?.return_id,
                    search: params?.return_id,
                    date_from: params?.date_from,
                    date_to: params?.date_to,
                    time_from: params?.time_from,
                    time_to: params?.time_to,
                    return_type: params?.return_type,
                    amount_min: params?.amount_min,
                    amount_max: params?.amount_max,
                    sort_by: params?.sort_by,
                    sort_order: params?.sort_order,
                    export: params?.export,
                    cursor: params?.cursor,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                },
            });

            if (response.data.success) {
                if (response.data.pagination) {
                    return {
                        success: true,
                        data: response.data.data || [],
                        pagination: response.data.pagination,
                    } as ApiResponse<ReturnRecord[] & { pagination?: { total: number; per_page: number; current_page: number; last_page: number; from: number; to: number } }>;
                }

            return {
                success: true,
                data: response.data.data || [],
                ...(response.data.cursor !== undefined && { cursor: response.data.cursor }),
                ...(response.data.has_more !== undefined && { has_more: response.data.has_more }),
                ...(response.data.count !== undefined && { count: response.data.count }),
            } as ApiResponse<ReturnRecord[] & { cursor?: number; has_more?: boolean; count?: number }>;
            }

            return {
                success: false,
                message: 'Failed to fetch all returns',
            };
        } catch {
            return {
                success: false,
                message: 'Failed to fetch all returns',
            };
        }
    },

    async getReturn(id: number): Promise<ReturnRecord> {
        const response = await fetch(`/api/returns/${id}`, {
            headers: {
                'X-Requested-With': 'XMLhttpsRequest',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch return details');
        }

        const result = await response.json();
        return result.data;
    },

    async searchTransactionHistory(
        barcodes: string[],
    ): Promise<TransactionHistoryResult[]> {
        const response = await fetch('/api/returns/search-history', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLhttpsRequest',
                'X-CSRF-TOKEN':
                    document
                        .querySelector('meta[name="csrf-token"]')
                        ?.getAttribute('content') || '',
            },
            body: JSON.stringify({ barcodes }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.message || 'Failed to search transaction history',
            );
        }

        const result = await response.json();
        return result.data;
    },

    async processInventoryAdjustment(returnId: number): Promise<void> {
        const response = await fetch(
            `/api/returns/${returnId}/adjust-inventory`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLhttpsRequest',
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') || '',
                },
            },
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.message || 'Failed to process inventory adjustment',
            );
        }
    },

    async getStatistics(params?: {
        date_from?: string;
        date_to?: string;
        time_from?: string;
        time_to?: string;
        cache_bust?: number;
    }): Promise<ReturnStatistics> {
        try {
            const response = await axios.get('/api/returns/statistics', {
                params: {
                    date_from: params?.date_from,
                    date_to: params?.date_to,
                    time_from: params?.time_from,
                    time_to: params?.time_to,
                    cache_bust: params?.cache_bust,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                },
            });

            // Validate the response structure
            if (!response.data.success || !response.data.data) {
                throw new Error(
                    'Invalid response structure from statistics API',
                );
            }

            // Ensure all required fields are present and valid
            const stats = response.data.data;

            const validatedStats: ReturnStatistics = {
                total_returns: Number(stats.total_returns) || 0,
                total_amount: Number(stats.total_amount) || 0,
                receipt_returns: Number(stats.receipt_returns) || 0,
                manual_returns: Number(stats.manual_returns) || 0,
                average_return_value: Number(stats.average_return_value) || 0,
            };

            return validatedStats;
        } catch (error) {
            // Handle specific error types
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    // Unauthorized
                } else if (error.response?.status === 419) {
                    // CSRF token mismatch
                }
            }

            // Return default values instead of throwing to prevent UI crashes
            return {
                total_returns: 0,
                total_amount: 0,
                receipt_returns: 0,
                manual_returns: 0,
                average_return_value: 0,
            };
        }
    },

    // Enhanced Return Service Methods
    async cancelReturn(returnId: number): Promise<void> {
        const response = await fetch(`/api/returns/${returnId}/cancel`, {
            method: 'DELETE',
            headers: {
                'X-Requested-With': 'XMLhttpsRequest',
                'X-CSRF-TOKEN':
                    document
                        .querySelector('meta[name="csrf-token"]')
                        ?.getAttribute('content') || '',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to cancel return');
        }
    },

    async bulkProcess(
        returnIds: number[],
        action: 'adjust_inventory' | 'cancel' | 'export',
    ): Promise<{
        results: Array<{
            return_id: number;
            success: boolean;
            message: string;
        }>;
    }> {
        const response = await fetch('/api/returns/bulk-process', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLhttpsRequest',
                'X-CSRF-TOKEN':
                    document
                        .querySelector('meta[name="csrf-token"]')
                        ?.getAttribute('content') || '',
            },
            body: JSON.stringify({
                return_ids: returnIds,
                action: action,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.message || 'Failed to process bulk operation',
            );
        }

        const result = await response.json();
        return result;
    },

    async getAnalytics(params?: {
        date_from?: string;
        date_to?: string;
    }): Promise<{
        overview: {
            total_returns: number;
            total_amount: number;
            average_return: number;
            receipt_returns: number;
            manual_returns: number;
        };
        top_returned_products: Array<{
            product_name: string;
            product_barcode: string;
            total_returned: number;
            return_count: number;
            total_value: number;
        }>;
        daily_trends: Array<{
            date: string;
            return_count: number;
            total_amount: number;
        }>;
    }> {
        const queryParams = new URLSearchParams();

        if (params?.date_from)
            queryParams.append('date_from', params.date_from);
        if (params?.date_to) queryParams.append('date_to', params.date_to);

        const response = await fetch(
            `/api/returns/analytics?${queryParams.toString()}`,
            {
                headers: {
                    'X-Requested-With': 'XMLhttpsRequest',
                },
            },
        );

        if (!response.ok) {
            throw new Error('Failed to fetch return analytics');
        }

        const result = await response.json();
        return result.data;
    },

    async exportReturns(params?: {
        date_from?: string;
        date_to?: string;
        format?: 'json' | 'csv';
    }): Promise<{
        data: unknown;
        format: string;
        filename?: string;
    }> {
        const queryParams = new URLSearchParams();

        if (params?.date_from)
            queryParams.append('date_from', params.date_from);
        if (params?.date_to) queryParams.append('date_to', params.date_to);
        if (params?.format) queryParams.append('format', params.format);

        const response = await fetch(
            `/api/returns/export?${queryParams.toString()}`,
            {
                headers: {
                    'X-Requested-With': 'XMLhttpsRequest',
                },
            },
        );

        if (!response.ok) {
            throw new Error('Failed to export returns');
        }

        const result = await response.json();
        return result;
    },

    /**
     * Delete all returns with password verification
     */
    async deleteAllReturns(password: string): Promise<ApiResponse<{ deleted_count: number }>> {
        try {
            const response = await axios.post('/api/returns/delete-all', {
                password,
            });
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message ||
                    'Failed to delete all returns',
            };
        }
    },
};

export {
    returnService,
    type CreateReturnResponse,
    type ReturnData,
    type ReturnItem,
    type ReturnRecord,
    type ReturnStatistics,
    type TransactionHistoryResult,
};
