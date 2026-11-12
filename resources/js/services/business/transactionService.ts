import axios from '../../bootstrap';

export interface TransactionItem {
    price_overridden?: boolean;
    product_id?: number;
    card_id?: number;
    scale_product_id?: number;
    barcode: string;
    name: string;
    price: number;
    cost_price?: number;
    quantity: number | null;
    weight?: number;
    total: number;
    is_scale_product: boolean;
    category?: string;
    supplier?: string;
}

export interface Transaction {
    id: number;
    transaction_number: string;
    total_amount: number;
    amount_paid: number;
    change_due: number;
    discount?: number;
    items_count: number;
    status: 'completed' | 'pending' | 'cancelled';
    items: TransactionItem[];
    user?: {
        id: number;
        full_name: string;
        username: string;
        role: string;
    } | null;
    created_at: string;
    updated_at: string;
}

export interface CreateTransactionData {
    items: TransactionItem[];
    total_amount: number;
    amount_paid: number;
    change_due: number;
    discount?: number;
}

export interface StockIssueDetail {
    name: string;
    barcode?: string | null;
    available: number;
    requested: number;
}

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
    errors?: Record<string, string[]>;
    error?: string;
    details?: StockIssueDetail[];
}

export interface TransactionReportFilters {
    page?: number;
    perPage?: number;
    search?: string;
    barcode?: string;
    dateFrom?: string;
    dateTo?: string;
    timeFrom?: string;
    timeTo?: string;
    productType?: 'all' | 'normal' | 'scale' | 'card';
    cashier?: string;
    category?: string;
    supplier?: string;
    priceFrom?: number;
    priceTo?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
}

export interface TransactionStatisticsResponse {
    total_sales: number;
    total_transactions: number;
    average_transaction_value: number;
    total_items_sold: number;
    total_quantity?: number;
    total_profit?: number;
    daily_sales: Array<{
        date: string;
        total_amount: number;
        transactions_count: number;
    }>;
}

class TransactionService {
    private buildQueryParams(
        filters: TransactionReportFilters = {},
        includePagination: boolean = false,
    ): Record<string, string | number> {
        const params: Record<string, string | number> = {};

        if (includePagination) {
            params.page = filters.page ?? 1;
            params.per_page = filters.perPage ?? 10;
        }

        if (filters.search) {
            params.search = filters.search;
        }

        if (filters.barcode && filters.barcode.trim()) {
            params.barcode = filters.barcode.trim();
        }

        if (filters.dateFrom) {
            params.date_from = filters.dateFrom;
        }

        if (filters.dateTo) {
            params.date_to = filters.dateTo;
        }

        if (filters.timeFrom) {
            params.time_from = filters.timeFrom;
        }

        if (filters.timeTo) {
            params.time_to = filters.timeTo;
        }

        if (filters.productType && filters.productType !== 'all') {
            params.product_type = filters.productType;
        }

        if (filters.cashier) {
            params.cashier = filters.cashier;
        }

        if (filters.category) {
            params.category = filters.category;
        }

        if (filters.supplier) {
            params.supplier = filters.supplier;
        }

        if (typeof filters.priceFrom === 'number') {
            params.price_from = filters.priceFrom;
        }

        if (typeof filters.priceTo === 'number') {
            params.price_to = filters.priceTo;
        }

        params.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        return params;
    }
    /**
     * Create a new transaction
     */
    async createTransaction(
        transactionData: CreateTransactionData,
    ): Promise<ApiResponse<Transaction>> {
        try {
            const response = await axios.post(
                '/api/transactions',
                transactionData,
            );
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message ||
                    'Failed to create transaction',
                errors: (
                    error as {
                        response?: {
                            data?: {
                                errors?: Record<string, string[]>;
                                details?: StockIssueDetail[];
                            };
                        };
                    }
                ).response?.data?.errors,
                details: (
                    error as {
                        response?: {
                            data?: { details?: StockIssueDetail[] };
                        };
                    }
                ).response?.data?.details,
            };
        }
    }

    /**
     * Get transactions with pagination and comprehensive filtering
     */
    async getTransactions(
        filters: {
            page?: number;
            perPage?: number;
            search?: string;
            orderId?: string;
            cashierFullName?: string;
            dateFrom?: string;
            dateTo?: string;
            timeFrom?: string;
            timeTo?: string;
            priceMin?: string;
            priceMax?: string;
            status?: string;
            sortBy?: string;
            sortOrder?: 'asc' | 'desc';
        } = {},
    ): Promise<
        ApiResponse<{
            data: Transaction[];
            current_page: number;
            last_page: number;
            per_page: number;
            total: number;
        }>
    > {
        try {
            const params: Record<string, string | number> = {
                page: filters.page ?? 1,
                per_page: filters.perPage ?? 10,
            };

            if (filters.search) params.search = filters.search;
            if (filters.orderId) params.search = filters.orderId;
            if (filters.cashierFullName) params.cashier_full_name = filters.cashierFullName;
            if (filters.dateFrom) params.date_from = filters.dateFrom;
            if (filters.dateTo) params.date_to = filters.dateTo;
            if (filters.timeFrom) params.time_from = filters.timeFrom;
            if (filters.timeTo) params.time_to = filters.timeTo;
            if (filters.priceMin) params.price_min = filters.priceMin;
            if (filters.priceMax) params.price_max = filters.priceMax;
            if (filters.status) params.status = filters.status;
            if (filters.sortBy) params.sort_by = filters.sortBy;
            if (filters.sortOrder) params.sort_order = filters.sortOrder;
            
            params.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

            const response = await axios.get('/api/transactions', { params });
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message ||
                    'Failed to fetch transactions',
            };
        }
    }

    async getTransactionsReport(
        filters: TransactionReportFilters = {},
    ): Promise<
        ApiResponse<{
            data: Transaction[];
            current_page: number;
            last_page: number;
            per_page: number;
            total: number;
        }>
    > {
        try {
            const params = this.buildQueryParams(filters, true);
            const response = await axios.get('/api/transactions', { params });
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message ||
                    'Failed to fetch transactions',
            };
        }
    }

    /**
     * Get all transactions with comprehensive filters (for exports)
     * Supports export mode to get all filtered transactions without pagination
     */
    async getAllTransactions(
        filters: {
            search?: string;
            orderId?: string;
            cashierFullName?: string;
            dateFrom?: string;
            dateTo?: string;
            timeFrom?: string;
            timeTo?: string;
            priceMin?: string;
            priceMax?: string;
            status?: string;
            sortBy?: string;
            sortOrder?: 'asc' | 'desc';
            export?: boolean;
            cursor?: number;
        } = {},
    ): Promise<ApiResponse<Transaction[] & { cursor?: number; has_more?: boolean; count?: number; pagination?: { total: number; per_page: number; current_page: number; last_page: number; from: number; to: number } }>> {
        try {
            const params: Record<string, string | number | boolean> = {};

            if (filters.search || filters.orderId) params.search = filters.search || filters.orderId || '';
            if (filters.cashierFullName) params.cashier_full_name = filters.cashierFullName;
            if (filters.dateFrom) params.date_from = filters.dateFrom;
            if (filters.dateTo) params.date_to = filters.dateTo;
            if (filters.timeFrom) params.time_from = filters.timeFrom;
            if (filters.timeTo) params.time_to = filters.timeTo;
            if (filters.priceMin) params.price_min = filters.priceMin;
            if (filters.priceMax) params.price_max = filters.priceMax;
            if (filters.status) params.status = filters.status;
            if (filters.sortBy) params.sort_by = filters.sortBy;
            if (filters.sortOrder) params.sort_order = filters.sortOrder;
            if (filters.export) params.export = true;
            if (filters.cursor) params.cursor = filters.cursor;
            
            params.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

            const response = await axios.get('/api/transactions/all', { params });
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message ||
                    'Failed to fetch all transactions',
            };
        }
    }

    async getAllTransactionsReport(
        filters: TransactionReportFilters = {},
    ): Promise<ApiResponse<Transaction[]>> {
        try {
            const params = this.buildQueryParams(filters, false);
            const response = await axios.get('/api/transactions/all', {
                params,
            });
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message ||
                    'Failed to fetch all transactions',
            };
        }
    }

    /**
     * Get a single transaction
     */
    async getTransaction(id: number): Promise<ApiResponse<Transaction>> {
        try {
            const response = await axios.get(`/api/transactions/${id}`);
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message ||
                    'Failed to fetch transaction',
            };
        }
    }

    /**
     * Get transaction by transaction number
     */
    async getByTransactionNumber(
        transactionNumber: string,
    ): Promise<ApiResponse<Transaction>> {
        try {
            const response = await axios.get(
                `/api/transactions/by-number/${transactionNumber}`,
            );
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message ||
                    'Failed to fetch transaction',
            };
        }
    }

    /**
     * Process return transaction
     */
    async processReturn(
        returnData: Record<string, unknown>,
    ): Promise<ApiResponse<Transaction>> {
        try {
            const response = await axios.post(
                '/api/transactions/return',
                returnData,
            );
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message || 'Failed to process return',
            };
        }
    }

    /**
     * Search transaction history by barcode
     */
    async searchTransactionHistory(barcode: string): Promise<
        ApiResponse<{
            barcode: string;
            name: string;
            total_sold: number;
            last_price: number;
            first_sold: string;
            last_sold: string;
            transactions: Array<{
                id: number;
                transaction_number: string;
                date: string;
                quantity: number;
                price: number;
                total: number;
            }>;
        }>
    > {
        try {
            const response = await axios.get(
                `/api/transactions/search-history/${encodeURIComponent(barcode)}`,
            );
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message ||
                    'Failed to search transaction history',
            };
        }
    }


    /**
     * Get transaction statistics
     */
    async getTransactionStatistics(
        dateFrom?: string,
        dateTo?: string,
        timeFrom?: string,
        timeTo?: string,
    ): Promise<ApiResponse<TransactionStatisticsResponse>> {
        return this.getTransactionStatisticsReport({
            dateFrom,
            dateTo,
            timeFrom,
            timeTo,
        });
    }

    async getTransactionStatisticsReport(
        filters: TransactionReportFilters = {},
    ): Promise<ApiResponse<TransactionStatisticsResponse>> {
        try {
            const params = this.buildQueryParams(filters, false);
            const response = await axios.get('/api/transactions/statistics', {
                params,
            });
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message ||
                    'Failed to fetch transaction statistics',
            };
        }
    }

    /**
     * Delete all transactions with password verification
     */
    async deleteAllTransactions(password: string): Promise<ApiResponse<{ deleted_count: number }>> {
        try {
            const response = await axios.post('/api/transactions/delete-all', {
                password,
            });
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message ||
                    'Failed to delete all transactions',
            };
        }
    }

    /**
     * Get transaction report data (one row per item) - separate from regular transaction endpoint
     */
    async getTransactionReport(
        filters: TransactionReportFilters = {},
    ): Promise<
        ApiResponse<{
            data: Array<{
                id: number;
                transaction_id: number;
                transaction_number: string;
                cashier_name: string;
                product_name: string;
                product_type: string;
                identifier: string;
                identifier_type: string;
                category?: string;
                supplier?: string;
                quantity: number;
                cost_price: number;
                sell_price: number;
                line_total: number;
                profit_margin: number;
                profit_amount: number;
                created_at: string;
            }>;
            current_page: number;
            last_page: number;
            per_page: number;
            total: number;
        }>
    > {
        try {
            const params = this.buildQueryParams(filters, true);
            const response = await axios.get('/api/transactions/report', { params });
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message ||
                    'Failed to fetch transaction report',
            };
        }
    }

    /**
     * Get transaction report statistics (filtered based on filters)
     */
    async getTransactionReportStatistics(
        filters: TransactionReportFilters = {},
    ): Promise<ApiResponse<TransactionStatisticsResponse>> {
        try {
            const params = this.buildQueryParams(filters, false);
            const response = await axios.get('/api/transactions/report/statistics', { params });
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message ||
                    'Failed to fetch transaction report statistics',
            };
        }
    }

    /**
     * Get all transaction report data for export
     */
    async getAllTransactionReport(
        filters: TransactionReportFilters = {},
    ): Promise<ApiResponse<Array<{
        id: number;
        transaction_id: number;
        transaction_number: string;
        cashier_name: string;
        product_name: string;
        product_type: string;
        identifier: string;
        category?: string;
        supplier?: string;
        quantity: number;
        cost_price: number;
        sell_price: number;
        line_total: number;
        profit_margin: number;
        profit_amount: number;
        created_at: string;
    }>>> {
        try {
            const params = this.buildQueryParams(filters, false);
            const response = await axios.get('/api/transactions/report/export', { params });
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message ||
                    'Failed to export transaction report',
            };
        }
    }
}

export const transactionService = new TransactionService();
