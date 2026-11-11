import axios from '../../bootstrap';

interface CachedImageData {
    base64: string;
    mime_type: string;
    size: number;
    original_name: string;
    data_url: string;
}

export interface CachedNameCard {
    id: number;
    name: string;
    image_url?: string;
    has_image: boolean;
    image_data?: CachedImageData;
    cards_count: number;
    cards: Card[];
}

interface Card {
    id: number;
    name_card_id: number;
    name_card: {
        id: number;
        name: string;
        image_url?: string;
        has_image: boolean;
        image_data?: CachedImageData;
    };
    cost_price: number;
    sell_price: number;
    profit_margin: number;
    is_active: boolean;
    calculated_profit_margin: number;
    profit_amount: number;
    card_name: string;
}

class CardCacheService {
    private cache: CachedNameCard[] | null = null;
    private cacheTimestamp: number = 0;
    private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes
    private imageCache: Map<number, CachedImageData> = new Map();

    /**
     * Get name cards with cards and images from cache or API
     */
    async getNameCardsWithCards(forceRefresh = false): Promise<CachedNameCard[]> {
        // Check if cache is valid
        if (!forceRefresh && this.isCacheValid()) {
            return this.getFromCache();
        }

        try {
            const response = await axios.get('/api/name-cards', {
                params: { use_cache: true, include_images: true }
            });

            if (response.data.success && response.data.data) {
                // Ensure data is an array
                const nameCards = Array.isArray(response.data.data) ? response.data.data : [];
                this.setCache(nameCards);
                return nameCards;
            }

            return [];
        } catch {
            return this.getFromCache() || [];
        }
    }

    /**
     * Preload cards with images when POS page loads
     */
    async preloadCards(): Promise<void> {
        try {
            const nameCards = await this.getNameCardsWithCards();
            
            // Ensure we have valid data
            if (Array.isArray(nameCards) && nameCards.length > 0) {
                // Preload images into browser cache
                await this.preloadImages(nameCards);
            }
        } catch {
            // Silently handle errors to avoid console noise
        }
    }

    /**
     * Preload images into browser cache
     */
    private async preloadImages(nameCards: CachedNameCard[]): Promise<void> {
        // Ensure nameCards is an array
        if (!Array.isArray(nameCards)) {
            // nameCards is not an array
            return;
        }

        const imagePromises = nameCards
            .filter(nameCard => nameCard && nameCard.has_image && nameCard.image_data)
            .map(nameCard => this.preloadImage(nameCard.id, nameCard.image_data!));

        if (imagePromises.length > 0) {
            await Promise.all(imagePromises);
        }
    }

    /**
     * Preload individual image
     */
    private async preloadImage(nameCardId: number, imageData: CachedImageData): Promise<void> {
        try {
            // Store in image cache
            this.imageCache.set(nameCardId, imageData);
            
            // Create image element to preload
            const img = new Image();
            img.src = imageData.data_url;
            
            return new Promise((resolve) => {
                img.onload = () => resolve();
                img.onerror = () => resolve(); // Continue even if image fails
            });
        } catch {
            // Silently handle image preload errors
        }
    }

    /**
     * Get image data from cache
     */
    getImageData(nameCardId: number): CachedImageData | null {
        return this.imageCache.get(nameCardId) || null;
    }

    /**
     * Get cards by name card with cached images
     */
    async getCardsByNameCard(nameCardId: number): Promise<Card[]> {
        try {
            const response = await axios.get(`/api/cards/by-name-card/${nameCardId}`, {
                params: { use_cache: true, include_images: true }
            });

            if (response.data.success && response.data.data) {
                return response.data.data;
            }

            return [];
        } catch {
            return [];
        }
    }

    /**
     * Clear all caches
     */
    clearCache(): void {
        this.cache = null;
        this.cacheTimestamp = 0;
        this.imageCache.clear();
    }

    /**
     * Force refresh from server
     */
    async forceRefresh(): Promise<CachedNameCard[]> {
        this.clearCache();
        return await this.getNameCardsWithCards(true);
    }

    /**
     * Smart refresh - add new card to cache without full reload
     */
    addCardToCache(newCard: Card, nameCardId: number): void {
        if (this.cache) {
            const nameCardIndex = this.cache.findIndex(nc => nc.id === nameCardId);
            if (nameCardIndex !== -1) {
                // Add the new card to the existing name card
                this.cache[nameCardIndex].cards.push(newCard);
                this.cache[nameCardIndex].cards_count = this.cache[nameCardIndex].cards.length;
                
                // Update cache timestamp to mark as fresh
                this.cacheTimestamp = Date.now();
            }
        }
    }

    /**
     * Smart refresh - update existing card in cache
     */
    updateCardInCache(updatedCard: Card, nameCardId: number): void {
        if (this.cache) {
            const nameCardIndex = this.cache.findIndex(nc => nc.id === nameCardId);
            if (nameCardIndex !== -1) {
                const cardIndex = this.cache[nameCardIndex].cards.findIndex(c => c.id === updatedCard.id);
                if (cardIndex !== -1) {
                    this.cache[nameCardIndex].cards[cardIndex] = updatedCard;
                    this.cacheTimestamp = Date.now();
                }
            }
        }
    }

    /**
     * Smart refresh - remove card from cache
     */
    removeCardFromCache(cardId: number, nameCardId: number): void {
        if (this.cache) {
            const nameCardIndex = this.cache.findIndex(nc => nc.id === nameCardId);
            if (nameCardIndex !== -1) {
                this.cache[nameCardIndex].cards = this.cache[nameCardIndex].cards.filter(c => c.id !== cardId);
                this.cache[nameCardIndex].cards_count = this.cache[nameCardIndex].cards.length;
                this.cacheTimestamp = Date.now();
            }
        }
    }

    /**
     * Smart refresh - add new name card to cache
     */
    addNameCardToCache(newNameCard: CachedNameCard): void {
        if (this.cache) {
            this.cache.push(newNameCard);
            this.cacheTimestamp = Date.now();
        }
    }

    /**
     * Smart refresh - update existing name card in cache
     */
    updateNameCardInCache(updatedNameCard: CachedNameCard): void {
        if (this.cache) {
            const nameCardIndex = this.cache.findIndex(nc => nc.id === updatedNameCard.id);
            if (nameCardIndex !== -1) {
                // Preserve existing cards if not provided in update
                const existingCards = this.cache[nameCardIndex].cards || [];
                const updatedWithCards = {
                    ...updatedNameCard,
                    cards: updatedNameCard.cards && updatedNameCard.cards.length > 0 
                        ? updatedNameCard.cards 
                        : existingCards,
                    cards_count: updatedNameCard.cards && updatedNameCard.cards.length > 0 
                        ? updatedNameCard.cards.length 
                        : existingCards.length
                };
                
                this.cache[nameCardIndex] = updatedWithCards;
                this.cacheTimestamp = Date.now();
            }
        }
    }

    /**
     * Check if cache is valid
     */
    private isCacheValid(): boolean {
        return this.cache !== null && 
               (Date.now() - this.cacheTimestamp) < this.CACHE_TTL;
    }

    /**
     * Get from cache
     */
    private getFromCache(): CachedNameCard[] {
        return this.cache || [];
    }

    /**
     * Set cache
     */
    private setCache(data: CachedNameCard[]): void {
        this.cache = data;
        this.cacheTimestamp = Date.now();
    }
}

export const cardCacheService = new CardCacheService();
