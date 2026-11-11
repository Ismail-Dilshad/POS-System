import axios from '../../bootstrap';

export interface Expense {
    id: number;
    price: number; // API returns 'price' field, not 'amount'
    description: string;
    created_at: string;
    updated_at: string;
}

export interface ExpenseStatistics {
    total_expenses: number;
    total_amount: number;
    average_amount: number;
    this_month_amount: number;
    today_expenses: number;
    today_amount: number;
}

export interface ExpenseFilters {
    search?: string;
    min_price?: string;
    max_price?: string;
    date_from?: string;
    date_to?: string;
    time_from?: string;
    time_to?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
}

export interface ExpenseResponse {
    success: boolean;
    data: Expense[];
    pagination: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    message: string;
}

export interface ExpenseStatisticsResponse {
    success: boolean;
    data: ExpenseStatistics;
    message: string;
}

class ExpenseService {
    private baseUrl = '/api/expenses';

    /**
     * Get all expenses with optional filtering and pagination
     */
    async getExpenses(filters: ExpenseFilters = {}): Promise<ExpenseResponse> {
        try {
            const params = new URLSearchParams();

            if (filters.search) params.append('search', filters.search);
            if (filters.min_price)
                params.append('min_price', filters.min_price);
            if (filters.max_price)
                params.append('max_price', filters.max_price);
            if (filters.date_from) params.append('date_from', filters.date_from);
            if (filters.date_to) params.append('date_to', filters.date_to);
            if (filters.time_from) params.append('time_from', filters.time_from);
            if (filters.time_to) params.append('time_to', filters.time_to);
            if (filters.sort_by) params.append('sort_by', filters.sort_by);
            if (filters.sort_order)
                params.append('sort_order', filters.sort_order);
            if (filters.per_page)
                params.append('per_page', filters.per_page.toString());
            if (filters.page) params.append('page', filters.page.toString());
            
            // Add timezone
            params.append('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone);

            const response = await axios.get(
                `${this.baseUrl}?${params.toString()}`,
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching expenses:', error);
            throw error;
        }
    }

    /**
     * Get a specific expense by ID
     */
    async getExpense(
        id: number,
    ): Promise<{ success: boolean; data: Expense; message: string }> {
        try {
            const response = await axios.get(`${this.baseUrl}/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching expense:', error);
            throw error;
        }
    }

    /**
     * Create a new expense
     */
    async createExpense(data: {
        price: number;
        description: string;
    }): Promise<{ success: boolean; data: Expense; message: string }> {
        try {
            const response = await axios.post(this.baseUrl, data);
            return response.data;
        } catch (error) {
            console.error('Error creating expense:', error);
            throw error;
        }
    }

    /**
     * Update an existing expense
     */
    async updateExpense(
        id: number,
        data: { price?: number; description?: string },
    ): Promise<{ success: boolean; data: Expense; message: string }> {
        try {
            const response = await axios.put(`${this.baseUrl}/${id}`, data);
            return response.data;
        } catch (error) {
            console.error('Error updating expense:', error);
            throw error;
        }
    }

    /**
     * Delete an expense
     */
    async deleteExpense(
        id: number,
    ): Promise<{ success: boolean; message: string }> {
        try {
            const response = await axios.delete(`${this.baseUrl}/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting expense:', error);
            throw error;
        }
    }

    /**
     * Get all expenses with filters (for exports) - cursor-based pagination
     * Returns 10,000 records per batch. Use cursor to get next batch.
     */
    async getAllExpenses(
        filters: ExpenseFilters = {},
        cursor?: number,
    ): Promise<{ success: boolean; data: Expense[]; cursor?: number; has_more?: boolean; count?: number; message: string }> {
        try {
            const params = new URLSearchParams();

            if (filters.search) params.append('search', filters.search);
            if (filters.min_price) params.append('min_price', filters.min_price);
            if (filters.max_price) params.append('max_price', filters.max_price);
            if (filters.date_from) params.append('date_from', filters.date_from);
            if (filters.date_to) params.append('date_to', filters.date_to);
            if (filters.time_from) params.append('time_from', filters.time_from);
            if (filters.time_to) params.append('time_to', filters.time_to);
            if (cursor) params.append('cursor', cursor.toString());
            
            // Add timezone
            params.append('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone);

            const response = await axios.get(`${this.baseUrl}/all?${params.toString()}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching all expenses:', error);
            throw error;
        }
    }

    /**
     * Get expense statistics
     */
    async getStatistics(): Promise<ExpenseStatisticsResponse> {
        try {
            const response = await axios.get(`${this.baseUrl}/statistics`);
            return response.data;
        } catch (error) {
            console.error('Error fetching expense statistics:', error);
            throw error;
        }
    }

    /**
     * Delete all expenses with password verification
     */
    async deleteAllExpenses(password: string): Promise<{ success: boolean; message: string; data?: { deleted_count: number } }> {
        try {
            const response = await axios.post(`${this.baseUrl}/delete-all`, {
                password,
            });
            return response.data;
        } catch (error) {
            console.error('Error deleting all expenses:', error);
            throw error;
        }
    }
}

export const expenseService = new ExpenseService();
