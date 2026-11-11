import { ApiBase, getErrorDetails } from '@/lib/api-base';

export interface Category {
    id: number;
    name: string;
    products_count?: number;
    scale_products_count?: number;
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

export interface CategoryImportPreview {
    categories: Array<{
        rowNumber: number;
        name: string;
        isValid: boolean;
        errors: string[];
        warnings: string[];
        action: 'create' | 'update' | 'skip';
    }>;
    summary: {
        total_rows: number;
        valid_rows: number;
        invalid_rows: number;
        create_count: number;
        update_count: number;
        skip_count: number;
    };
}

export interface CategoryImportResult {
    success_count: number;
    error_count: number;
    skip_count: number;
    details: string[];
}

class CategoryService extends ApiBase {
    constructor() {
        super('/api');
    }

    async validateImport(file: File, skipDuplicates: boolean) {
        return this.uploadCategories<CategoryImportPreview>(
            'validate',
            file,
            skipDuplicates,
        );
    }

    async processImport(file: File, skipDuplicates: boolean) {
        return this.uploadCategories<CategoryImportResult>(
            'process',
            file,
            skipDuplicates,
        );
    }

    private async uploadCategories<T>(
        action: 'validate' | 'process',
        file: File,
        skipDuplicates: boolean,
    ): Promise<ApiResponse<T>> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('skip_duplicates', skipDuplicates ? '1' : '0');
        formData.append('update_existing', '0');

        try {
            return await this.post<ApiResponse<T>>(
                `/categories/import/${action}`,
                formData,
                {
                    timeout: 300000,
                },
            );
        } catch (error: unknown) {
            const { message, errors } = getErrorDetails(error);
            return { success: false, message, errors };
        }
    }

    /**
     * Get all categories with optional search
     */
    async getCategories(search: string = ''): Promise<ApiResponse<Category[]>> {
        try {
            const response = await this.get<ApiResponse<Category[]>>(
                '/categories',
                { search },
            );
            return response;
        } catch (error: unknown) {
            const { message, errors } = getErrorDetails(error);
            return {
                success: false,
                data: [],
                message: message || 'Failed to fetch categories',
                errors,
            };
        }
    }

    /**
     * Create a new category
     */
    async createCategory(name: string): Promise<ApiResponse<Category>> {
        try {
            const response = await this.post<ApiResponse<Category>>(
                '/categories',
                { name },
            );
            return response;
        } catch (error: unknown) {
            const { message, errors } = getErrorDetails(error);
            return {
                success: false,
                message: message || 'Failed to create category',
                errors,
            };
        }
    }

    /**
     * Update an existing category
     */
    async updateCategory(
        id: number,
        name: string,
    ): Promise<ApiResponse<Category>> {
        try {
            const response = await this.put<ApiResponse<Category>>(
                `/categories/${id}`,
                { name },
            );
            return response;
        } catch (error: unknown) {
            const { message, errors } = getErrorDetails(error);
            return {
                success: false,
                message: message || 'Failed to update category',
                errors,
            };
        }
    }

    /**
     * Check if category can be deleted (usage validation)
     */
    async checkCategoryUsage(id: number): Promise<
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
            >(`/categories/${id}/usage`);
            return response;
        } catch (error: unknown) {
            const { message } = getErrorDetails(error);
            return {
                success: false,
                message: message || 'Failed to check category usage',
            };
        }
    }

    /**
     * Delete a category
     */
    async deleteCategory(id: number): Promise<ApiResponse<void>> {
        try {
            const response = await this.delete<ApiResponse<void>>(
                `/categories/${id}`,
            );
            return response;
        } catch (error: unknown) {
            const { message } = getErrorDetails(error);
            return {
                success: false,
                message: message || 'Failed to delete category',
            };
        }
    }
}

export const categoryService = new CategoryService();
