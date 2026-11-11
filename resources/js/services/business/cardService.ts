import type { Card as CardType } from '@/types';
import axios from '../../bootstrap';
import { NameCard } from './nameCardService';

export type Card = CardType;

export interface CardDuplicate {
    id: number;
    name_card_id: number;
    cost_price: number;
    sell_price: number;
    profit_margin: number;
    is_active: boolean;
    calculated_profit_margin: number;
    profit_amount: number;
    card_name: string;
    name_card?: NameCard;
    created_at: string;
    updated_at: string;
}

export interface CardStatistics {
    total_cards: number;
    active_cards: number;
    inactive_cards: number;
    profitable_cards: number;
    not_profitable_cards: number;
    total_value: number;
    total_cost: number;
    total_profit: number;
    average_profit_margin: number;
}

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
    errors?: Record<string, string[]>;
    error?: string;
}

class CardService {
    /**
     * Get all cards with optional search and filters
     */
    async getCards(
        search: string = '',
        nameCardId?: number,
        isActive?: boolean,
        profitable?: boolean,
        minPrice?: number,
        maxPrice?: number,
        perPage: number = 10000,
    ): Promise<ApiResponse<Card[]>> {
        try {
            const params: Record<string, string | number> = {
                per_page: perPage, // Set high limit to get all cards
            };
            if (search) params.search = search;
            if (nameCardId) params.name_card_id = nameCardId;
            if (isActive !== undefined) params.is_active = isActive.toString();
            if (profitable !== undefined)
                params.profitable = profitable.toString();
            if (minPrice !== undefined) params.min_price = minPrice;
            if (maxPrice !== undefined) params.max_price = maxPrice;

            const response = await axios.get('/api/cards', { params });
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message || 'Failed to fetch cards',
            };
        }
    }

    /**
     * Create a new card
     */
    async createCard(cardData: {
        name_card_id: number;
        cost_price: number;
        sell_price: number;
        is_active?: boolean;
    }): Promise<ApiResponse<Card>> {
        try {
            const response = await axios.post('/api/cards', cardData);
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message || 'Failed to create card',
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
     * Update a card
     */
    async updateCard(id: number, cardData: {
        name_card_id: number;
        cost_price: number;
        sell_price: number;
        is_active?: boolean;
    }): Promise<ApiResponse<Card>> {
        try {
            const response = await axios.put(`/api/cards/${id}`, cardData);
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message || 'Failed to update card',
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
     * Delete a card
     */
    async deleteCard(id: number): Promise<ApiResponse<void>> {
        try {
            const response = await axios.delete(`/api/cards/${id}`);
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message || 'Failed to delete card',
            };
        }
    }

    /**
     * Get a single card
     */
    async getCard(id: number): Promise<ApiResponse<Card>> {
        try {
            const response = await axios.get(`/api/cards/${id}`);
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message || 'Failed to fetch card',
            };
        }
    }

    /**
     * Toggle card active status
     */
    async toggleCardStatus(id: number): Promise<ApiResponse<Card>> {
        try {
            const response = await axios.patch(
                `/api/cards/${id}/toggle-status`,
            );
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message ||
                    'Failed to toggle card status',
            };
        }
    }

    /**
     * Get card statistics
     */
    async getCardStatistics(): Promise<ApiResponse<CardStatistics>> {
        try {
            const response = await axios.get('/api/cards/statistics');
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message ||
                    'Failed to fetch card statistics',
            };
        }
    }

    /**
     * Get cards by name card ID
     */
    async getCardsByNameCard(nameCardId: number): Promise<ApiResponse<Card[]>> {
        try {
            const response = await axios.get(
                `/api/cards/by-name-card/${nameCardId}`,
            );

            // Handle paginated response structure
            if (response.data.success && response.data.data) {
                // Extract the actual data array from pagination wrapper
                const cardsData = response.data.data.data || response.data.data;

                return {
                    success: true,
                    data: Array.isArray(cardsData) ? cardsData : [],
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
                    'Failed to fetch cards by name card',
            };
        }
    }

    /**
     * Bulk update card statuses
     */
    async bulkUpdateStatus(
        cardIds: number[],
        isActive: boolean,
    ): Promise<ApiResponse<{ updated_count: number }>> {
        try {
            const response = await axios.post('/api/cards/bulk-update-status', {
                card_ids: cardIds,
                is_active: isActive,
            });
            return response.data;
        } catch (error: unknown) {
            return {
                success: false,
                message:
                    (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message ||
                    'Failed to bulk update card statuses',
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
}

export const cardService = new CardService();
