import { ApiBase, getErrorDetails } from '@/lib/api-base';

export interface User {
    id?: number;
    full_name: string;
    username: string;
    password?: string;
    confirmPassword?: string;
    role: 'admin' | 'cashier' | 'dataentry';
    is_active?: boolean;
    phone?: string;
    created_at?: string;
    updated_at?: string;
}

export interface UserResponse {
    success: boolean;
    data?: User | User[];
    message?: string;
    errors?: Record<string, string[]>;
}

class UserService extends ApiBase {
    constructor() {
        super('/api');
    }

    /**
     * Get all users with optional search
     */
    async getUsers(
        search: string = '',
    ): Promise<{ success: boolean; data?: User[]; message?: string }> {
        try {
            const params = search ? { search } : {};
            const response = await this.get<{
                success: boolean;
                data?: User[];
                message?: string;
            }>('/users', params);
            return response;
        } catch (error: unknown) {
            const { message } = getErrorDetails(error);
            return {
                success: false,
                message: message || 'Failed to fetch users',
            };
        }
    }

    /**
     * Get cashiers only (users with cashier role) with optional search
     */
    async getCashiers(
        search: string = '',
    ): Promise<{ success: boolean; data?: User[]; message?: string }> {
        try {
            const params = search
                ? { search, role: 'cashier' }
                : { role: 'cashier' };
            const response = await this.get<{
                success: boolean;
                data?: User[];
                message?: string;
            }>('/users', params);
            return response;
        } catch (error: unknown) {
            const { message } = getErrorDetails(error);
            return {
                success: false,
                message: message || 'Failed to fetch cashiers',
            };
        }
    }

    /**
     * Get admin and cashier users only (excluding data entry)
     */
    async getAdminAndCashiers(
        search: string = '',
    ): Promise<{ success: boolean; data?: User[]; message?: string }> {
        try {
            const params = search
                ? { search, role: 'admin,cashier' }
                : { role: 'admin,cashier' };
            const response = await this.get<{
                success: boolean;
                data?: User[];
                message?: string;
            }>('/users', params);
            return response;
        } catch (error: unknown) {
            const { message } = getErrorDetails(error);
            return {
                success: false,
                message: message || 'Failed to fetch admin and cashiers',
            };
        }
    }

    /**
     * Get a specific user by ID
     */
    async getUser(
        id: number,
    ): Promise<{ success: boolean; data?: User; message?: string }> {
        try {
            const response = await this.get<{
                success: boolean;
                data?: User;
                message?: string;
            }>(`/users/${id}`);
            return response;
        } catch (error: unknown) {
            const { message } = getErrorDetails(error);
            return {
                success: false,
                message: message || 'Failed to fetch user',
            };
        }
    }

    /**
     * Create a new user
     */
    async createUser(userData: Partial<User>): Promise<UserResponse> {
        try {
            const response = await this.post<UserResponse>('/users', userData);
            return response;
        } catch (error: unknown) {
            const { message } = getErrorDetails(error);
            return {
                success: false,
                message: message || 'Failed to create user',
                errors: undefined,
            };
        }
    }

    /**
     * Update an existing user
     */
    async updateUser(
        id: number,
        userData: Partial<User>,
    ): Promise<UserResponse> {
        try {
            const response = await this.put<UserResponse>(
                `/users/${id}`,
                userData,
            );
            return response;
        } catch (error: unknown) {
            const { message } = getErrorDetails(error);
            return {
                success: false,
                message: message || 'Failed to update user',
                errors: undefined,
            };
        }
    }

    /**
     * Delete a user
     */
    async deleteUser(
        id: number,
    ): Promise<{ success: boolean; message?: string }> {
        try {
            const response = await this.delete<{
                success: boolean;
                message?: string;
            }>(`/users/${id}`);
            return response;
        } catch (error: unknown) {
            const { message } = getErrorDetails(error);
            return {
                success: false,
                message: message || 'Failed to delete user',
            };
        }
    }

    /**
     * Toggle user status (active/inactive)
     */
    async toggleStatus(
        id: number,
    ): Promise<{ success: boolean; data?: User; message?: string }> {
        try {
            const response = await this.patch<{
                success: boolean;
                data?: User;
                message?: string;
            }>(`/users/${id}/toggle-status`);
            return response;
        } catch (error: unknown) {
            const { message } = getErrorDetails(error);
            return {
                success: false,
                message: message || 'Failed to toggle user status',
            };
        }
    }
}

export const userService = new UserService();
