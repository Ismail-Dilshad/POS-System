import { ApiBase, getErrorDetails } from '@/lib/api-base';

export interface Supplier {
    id: number;
    name: string;
    phone: string;
    supplier_code: string;
    email: string | null;
    business_name: string | null;
    business_address: string | null;
    business_phone: string | null;
    business_email: string | null;
    billing_contact_name: string | null;
    billing_contact_phone: string | null;
    billing_contact_email: string | null;
    biller_position: string | null;
    total_amount: number;
    total_paid: number;
    remain_amount: number;
    created_at: string;
    updated_at: string;
}

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
    errors?: Record<string, string[]>;
    error?: string;
}

class SupplierService extends ApiBase {
    constructor() {
        super('/api');
    }

    /**
     * Get all suppliers with optional search
     */
    async getSuppliers(search: string = ''): Promise<ApiResponse<Supplier[]>> {
        try {
            const response = await this.get<ApiResponse<Supplier[]>>(
                '/suppliers',
                { search },
            );
            return response;
        } catch (error: unknown) {
            const { message, errors } = getErrorDetails(error);
            return {
                success: false,
                data: [],
                message: message || 'Failed to fetch suppliers',
                errors,
            };
        }
    }

    /**
     * Get a specific supplier by ID
     */
    async getSupplier(id: number): Promise<ApiResponse<Supplier>> {
        try {
            const response = await this.get<ApiResponse<Supplier>>(
                `/suppliers/${id}`,
            );
            return response;
        } catch (error: unknown) {
            const { message } = getErrorDetails(error);
            return {
                success: false,
                message: message || 'Failed to fetch supplier',
            };
        }
    }

    /**
     * Create a new supplier
     */
    async createSupplier(
        supplierData: Partial<Supplier>,
    ): Promise<ApiResponse<Supplier>> {
        try {
            const response = await this.post<ApiResponse<Supplier>>(
                '/suppliers',
                supplierData,
            );
            return response;
        } catch (error: unknown) {
            const { message } = getErrorDetails(error);
            return {
                success: false,
                message: message || 'Failed to create supplier',
                errors: undefined,
            };
        }
    }

    /**
     * Update an existing supplier
     */
    async updateSupplier(
        id: number,
        supplierData: Partial<Supplier>,
    ): Promise<ApiResponse<Supplier>> {
        try {
            const response = await this.put<ApiResponse<Supplier>>(
                `/suppliers/${id}`,
                supplierData,
            );
            return response;
        } catch (error: unknown) {
            const { message } = getErrorDetails(error);
            return {
                success: false,
                message: message || 'Failed to update supplier',
                errors: undefined,
            };
        }
    }

    /**
     * Delete a supplier
     */
    async deleteSupplier(id: number): Promise<ApiResponse<void>> {
        try {
            const response = await this.delete<ApiResponse<void>>(
                `/suppliers/${id}`,
            );
            return response;
        } catch (error: unknown) {
            const { message } = getErrorDetails(error);
            return {
                success: false,
                message: message || 'Failed to delete supplier',
            };
        }
    }

    /**
     * Generate a new supplier code
     */
    async generateCode(): Promise<ApiResponse<{ code: string }>> {
        try {
            const response = await this.get<ApiResponse<{ code: string }>>(
                '/suppliers/generate-code',
            );
            return response;
        } catch (error: unknown) {
            const { message } = getErrorDetails(error);
            return {
                success: false,
                message: message || 'Failed to generate supplier code',
            };
        }
    }

    /**
     * Check supplier usage before deletion
     */
    async checkUsage(id: number): Promise<
        ApiResponse<{
            can_delete: boolean;
            products_count: number;
            scale_products_count: number;
            total_usage: number;
            message: string;
        }>
    > {
        try {
            const response = await this.get<
                ApiResponse<{
                    can_delete: boolean;
                    products_count: number;
                    scale_products_count: number;
                    total_usage: number;
                    message: string;
                }>
            >(`/suppliers/${id}/usage`);
            return response;
        } catch (error: unknown) {
            const { message } = getErrorDetails(error);
            return {
                success: false,
                message: message || 'Failed to check supplier usage',
            };
        }
    }

    /**
     * Get supplier payments
     */
    async getPayments(id: number): Promise<
        ApiResponse<{
            payments: Record<string, unknown>[];
            summary: {
                total_purchases: number;
                total_amount: number;
                total_paid: number;
                total_remaining: number;
                paid_purchases: number;
                partial_purchases: number;
                debt_purchases: number;
            };
        }>
    > {
        try {
            const response = await this.get<
                ApiResponse<{
                    payments: Record<string, unknown>[];
                    summary: {
                        total_purchases: number;
                        total_amount: number;
                        total_paid: number;
                        total_remaining: number;
                        paid_purchases: number;
                        partial_purchases: number;
                        debt_purchases: number;
                    };
                }>
            >(`/suppliers/${id}/payments`);
            return response;
        } catch (error: unknown) {
            const { message } = getErrorDetails(error);
            return {
                success: false,
                message: message || 'Failed to fetch supplier payments',
            };
        }
    }

    /**
     * Check supplier usage (alias for checkUsage)
     */
    async checkSupplierUsage(id: number): Promise<
        ApiResponse<{
            can_delete: boolean;
            products_count: number;
            scale_products_count: number;
            total_usage: number;
            message: string;
        }>
    > {
        return this.checkUsage(id);
    }

    /**
     * Get supplier payments (alias for getPayments)
     */
    async getSupplierPayments(id: number): Promise<
        ApiResponse<{
            payments: Record<string, unknown>[];
            summary: {
                total_purchases: number;
                total_amount: number;
                total_paid: number;
                total_remaining: number;
                paid_purchases: number;
                partial_purchases: number;
                debt_purchases: number;
            };
        }>
    > {
        return this.getPayments(id);
    }
}

export const supplierService = new SupplierService();
