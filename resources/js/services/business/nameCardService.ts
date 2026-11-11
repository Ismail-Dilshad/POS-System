import axios from '../../bootstrap';

export interface NameCard {
    id: number;
    name: string;
    image_path?: string;
    image_original_name?: string;
    image_size?: number;
    image_mime_type?: string;
    image_url?: string;
    has_image: boolean;
    cards_count: number;
    formatted_size?: string;
    created_at: string;
    updated_at: string;
}

export interface NameCardStatistics {
    total_name_cards: number;
    name_cards_with_images: number;
    name_cards_without_images: number;
    total_associated_cards: number;
}

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
    errors?: Record<string, string[]>;
    error?: string;
}

class NameCardService {
    /**
     * Get all name cards with optional search and filters
     */
    async getNameCards(
        search: string = '',
        hasImage?: boolean,
    ): Promise<ApiResponse<NameCard[]>> {
        try {
            const params: Record<string, string> = {};
            if (search) params.search = search;
            if (hasImage !== undefined) params.has_image = hasImage.toString();

            const response = await axios.get('/api/name-cards', { params });

            // Handle paginated response structure
            if (response.data.success && response.data.data) {
                // Extract the actual data array from pagination wrapper
                const nameCardsData =
                    response.data.data.data || response.data.data;

                return {
                    success: true,
                    data: Array.isArray(nameCardsData) ? nameCardsData : [],
                    message: response.data.message,
                };
            }

            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message ||
                    'Failed to fetch name cards',
            };
        }
    }

    /**
     * Create a new name card
     */
    async createNameCard(nameCardData: {
        name: string;
        image?: File;
    }): Promise<ApiResponse<NameCard>> {
        try {
            const formData = new FormData();
            formData.append('name', nameCardData.name);

            if (nameCardData.image) {
                formData.append('image', nameCardData.image);
            }

            const response = await axios.post('/api/name-cards', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message ||
                    'Failed to create name card',
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
     * Update an existing name card
     */
    async updateNameCard(
        id: number,
        nameCardData: { name: string; image?: File; removeImage?: boolean },
    ): Promise<ApiResponse<NameCard>> {
        try {
            const formData = new FormData();
            formData.append('name', nameCardData.name);
            formData.append('_method', 'PUT');

            if (nameCardData.image) {
                formData.append('image', nameCardData.image);
            }

            if (nameCardData.removeImage) {
                formData.append('remove_image', 'true');
            }

            const response = await axios.post(
                `/api/name-cards/${id}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                },
            );
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message ||
                    'Failed to update name card',
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
     * Delete a name card
     */
    async deleteNameCard(id: number): Promise<ApiResponse<void>> {
        try {
            const response = await axios.delete(`/api/name-cards/${id}`);
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message ||
                    'Failed to delete name card',
            };
        }
    }

    /**
     * Get a single name card
     */
    async getNameCard(id: number): Promise<ApiResponse<NameCard>> {
        try {
            const response = await axios.get(`/api/name-cards/${id}`);
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message || 'Failed to fetch name card',
            };
        }
    }

    /**
     * Get name card statistics
     */
    async getNameCardStatistics(): Promise<ApiResponse<NameCardStatistics>> {
        try {
            const response = await axios.get('/api/name-cards/statistics');
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message ||
                    'Failed to fetch name card statistics',
            };
        }
    }

    /**
     * Get name cards for dropdown/select options
     */
    async getNameCardOptions(): Promise<
        ApiResponse<{ id: number; name: string }[]>
    > {
        try {
            const response = await axios.get('/api/name-cards/options');
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message ||
                    'Failed to fetch name card options',
            };
        }
    }
}

export const nameCardService = new NameCardService();
