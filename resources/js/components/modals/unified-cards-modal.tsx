import { getItemImageUrl } from '@/lib/item-image';
import { NameCardImage } from '@/components/layout/name-card-image';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { useFocusManagement } from '@/hooks/use-focus-management';
import type { Card as CardType } from '@/types';
import { cardCacheService, type CachedNameCard } from '@/services/business/cardCacheService';
import { formatCurrency } from '@/lib/currency';
import {
    ArrowLeft,
    CreditCard,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

interface UnifiedCardsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCardSelect?: (card: CardType) => void;
}

type ViewMode = 'nameCards' | 'cards';

export const UnifiedCardsModal: React.FC<UnifiedCardsModalProps> = ({
    isOpen,
    onClose,
    onCardSelect,
}) => {
    const { t } = useTranslation();
    
    // State for name cards view
    const [nameCards, setNameCards] = useState<CachedNameCard[]>([]);
    const [nameCardsLoading, setNameCardsLoading] = useState(false);
    const [nameCardsError, setNameCardsError] = useState<string | null>(null);
    
    // State for cards view
    const [cards, setCards] = useState<CardType[]>([]);
    const [cardsError, setCardsError] = useState<string | null>(null);
    
    // Current view mode and selected name card
    const [viewMode, setViewMode] = useState<ViewMode>('nameCards');
    const [selectedNameCard, setSelectedNameCard] = useState<CachedNameCard | null>(null);
    
    // Keyboard navigation state
    const [selectedIndex, setSelectedIndex] = useState(0);
    const gridRef = useRef<HTMLDivElement>(null);
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Grid configuration for responsive navigation
    const getGridColumns = () => {
        if (typeof window === 'undefined') return 3;
        if (window.innerWidth < 640) return 1; // sm breakpoint
        if (window.innerWidth < 1024) return 2; // lg breakpoint
        return 3;
    };

    // Load name cards with cached data
    const loadNameCards = async () => {
        setNameCardsLoading(true);
        setNameCardsError(null);
        try {
            const nameCards = await cardCacheService.getNameCardsWithCards();
            
            if (Array.isArray(nameCards) && nameCards.length > 0) {
                setNameCards(nameCards);
                setSelectedIndex(0);
            } else {
                setNameCardsError('No name cards available');
                setNameCards([]);
            }
        } catch (err: unknown) {
            const error = err as { message?: string };
            setNameCardsError(error.message || 'Failed to load name cards');
            setNameCards([]);
        } finally {
            setNameCardsLoading(false);
        }
    };

    // Handle name card click - switch to cards view (instant with cached data)
    const handleNameCardClick = useCallback((nameCard: CachedNameCard) => {
        setSelectedNameCard(nameCard);
        setViewMode('cards');
        
        // Use cached cards directly from name card data (instant)
        if (nameCard.cards && nameCard.cards.length > 0) {
            setCards(nameCard.cards.map(card => ({
                ...card,
                name_card: {
                    ...card.name_card,
                    id: nameCard.id,
                    name: nameCard.name,
                    image_url: getItemImageUrl(card) || getItemImageUrl(nameCard),
                },
            })) as unknown as CardType[]);
            setSelectedIndex(0);
            setCardsError(null);
        } else {
            setCardsError('No cards available for this name card');
            setCards([]);
        }
    }, []);

    // Handle modal close
    const handleClose = useCallback(() => {
        setViewMode('nameCards');
        setSelectedNameCard(null);
        setCards([]);
        setSelectedIndex(0);
        onClose();
        // Focus barcode search after modal closes
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const barcodeSearchInput = document.querySelector('[data-testid="barcode-search"]') as HTMLInputElement;
                if (barcodeSearchInput) {
                    barcodeSearchInput.focus();
                    barcodeSearchInput.select();
                }
            });
        });
    }, [onClose]);

    // Handle card selection
    const handleCardSelect = useCallback((card: CardType) => {
        if (onCardSelect) {
            onCardSelect(card);
        }
        
        // Trigger smart cache refresh to ensure data is up-to-date
        // This will refresh the cache without a full reload
        cardCacheService.getNameCardsWithCards(true);
        
        handleClose();
    }, [onCardSelect, handleClose]);

    // Handle back to name cards
    const handleBackToNameCards = () => {
        setViewMode('nameCards');
        setSelectedNameCard(null);
        setCards([]);
        setSelectedIndex(0);
    };

    // Keyboard navigation
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!isOpen) return;

        const currentItems = viewMode === 'nameCards' ? nameCards : cards;
        const columns = getGridColumns();
        const totalItems = currentItems.length;

        if (totalItems === 0) return;

        switch (e.key) {
            case 'ArrowRight':
                e.preventDefault();
                setSelectedIndex(prev => 
                    prev < totalItems - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowLeft':
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
                break;
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => 
                    prev + columns < totalItems ? prev + columns : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => 
                    prev - columns >= 0 ? prev - columns : prev
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (viewMode === 'nameCards' && nameCards[selectedIndex]) {
                    handleNameCardClick(nameCards[selectedIndex]);
                } else if (viewMode === 'cards' && cards[selectedIndex]) {
                    handleCardSelect(cards[selectedIndex]);
                }
                break;
            case 'Escape':
                e.preventDefault();
                if (viewMode === 'cards') {
                    handleBackToNameCards();
                } else {
                    handleClose();
                }
                break;
        }
    }, [isOpen, viewMode, nameCards, cards, selectedIndex, handleClose, handleCardSelect, handleNameCardClick]);

    // Scroll to selected item
    const scrollToSelected = useCallback(() => {
        if (cardRefs.current[selectedIndex]) {
            cardRefs.current[selectedIndex]?.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
            });
        }
    }, [selectedIndex]);

    // Use focus management hook
    useFocusManagement(isOpen);

    // Load name cards when modal opens
    useEffect(() => {
        if (isOpen && viewMode === 'nameCards') {
            loadNameCards();
        }
        
        // Clean up any focused elements that might conflict with aria-hidden
        if (isOpen) {
            const cleanupFocus = () => {
                const activeElement = document.activeElement as HTMLElement;
                if (activeElement && activeElement !== document.body) {
                    const isInHiddenArea = activeElement.closest('[aria-hidden="true"]');
                    if (isInHiddenArea) {
                        activeElement.blur();
                    }
                }
            };
            
            // Run cleanup after a short delay to ensure DOM is updated
            setTimeout(cleanupFocus, 0);
        }
    }, [isOpen, viewMode]);

    // Add keyboard event listener
    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Scroll to selected item when selection changes
    useEffect(() => {
        if (isOpen) {
            scrollToSelected();
        }
    }, [selectedIndex, isOpen, scrollToSelected]);

    // Reset selection when switching views
    useEffect(() => {
        setSelectedIndex(0);
    }, [viewMode]);

    const currentLoading = nameCardsLoading;
    const currentError = viewMode === 'nameCards' ? nameCardsError : cardsError;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent 
                className="flex max-h-[90vh] flex-col overflow-hidden p-0"
                style={{
                    zIndex: 9999,
                    maxWidth: '80vw',
                    width: '1200px',
                }}
                onOpenAutoFocus={(e) => {
                    e.preventDefault();
                    // Ensure any previously focused elements are blurred
                    const activeElement = document.activeElement as HTMLElement;
                    if (activeElement && activeElement !== document.body) {
                        activeElement.blur();
                    }
                    
                    // Focus the first focusable element after a short delay
                    setTimeout(() => {
                        const firstFocusable = document.querySelector('[data-radix-collection-item]') as HTMLElement;
                        if (firstFocusable) {
                            firstFocusable.focus();
                        }
                    }, 100);
                }}
            >
                <DialogHeader className="shrink-0 border-b bg-gradient-to-r from-emerald-50 to-emerald-100 px-6 py-6 dark:from-emerald-900/20 dark:to-emerald-800/20">
                    <DialogTitle className="flex items-center gap-4 text-2xl font-bold text-emerald-800 dark:text-emerald-200">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
                            <CreditCard className="h-7 w-7 text-white" />
                        </div>
                        <div className="flex-1">
                            <div className="text-2xl font-bold">
                                {viewMode === 'nameCards' 
                                    ? t('point_of_sale.name_cards')
                                    : selectedNameCard?.name || 'Cards'
                                }
                            </div>
                            <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-1">
                                {viewMode === 'nameCards' 
                                    ? t('point_of_sale.name_cards_desc')
                                    : t('point_of_sale.select_card_desc')
                                }
                            </div>
                        </div>
                        {viewMode === 'cards' && (
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={handleBackToNameCards}
                                className="flex items-center gap-3 border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 hover:border-emerald-500 hover:bg-gradient-to-r hover:from-emerald-100 hover:to-emerald-200 hover:text-emerald-800 focus:border-emerald-500 focus:bg-gradient-to-r focus:from-emerald-100 focus:to-emerald-200 focus:ring-2 focus:ring-emerald-200 focus:outline-none dark:border-emerald-600 dark:bg-gradient-to-r dark:from-emerald-900/20 dark:to-emerald-800/20 dark:text-emerald-300 dark:hover:border-emerald-500 dark:hover:bg-gradient-to-r dark:hover:from-emerald-900/30 dark:hover:to-emerald-800/30 dark:hover:text-emerald-200 dark:focus:border-emerald-500 dark:focus:bg-gradient-to-r dark:focus:from-emerald-900/30 dark:focus:to-emerald-800/30 dark:focus:ring-2 dark:focus:ring-emerald-400 shadow-lg"
                            >
                                <ArrowLeft className="h-5 w-5" />
                                <span className="font-semibold">{t('point_of_sale.back_to_name_cards')}</span>
                            </Button>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                    {/* Loading State */}
                    {currentLoading && viewMode === 'nameCards' && (
                        <div className="flex items-center justify-center py-16">
                            <div className="flex flex-col items-center space-y-6">
                                <div className="relative">
                                    <div className="h-16 w-16 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-500 shadow-lg"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <CreditCard className="h-6 w-6 text-emerald-500" />
                                    </div>
                                </div>
                                <div className="text-center space-y-2">
                                    <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-200">
                                        {t('point_of_sale.loading_name_cards')}
                                    </h3>
                                    <p className="text-emerald-600 dark:text-emerald-400">
                                        Loading your card collection...
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {currentError && (
                        <div className="flex items-center justify-center py-16">
                            <div className="text-center space-y-4">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/20">
                                    <CreditCard className="h-8 w-8 text-emerald-500" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-200">
                                        Error Loading Cards
                                    </h3>
                                    <p className="text-emerald-600 dark:text-emerald-400 mt-2">
                                        {currentError}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Name Cards View */}
                    {!currentLoading && !currentError && viewMode === 'nameCards' && (
                        <div className="space-y-6">
                            {nameCards.length > 0 ? (
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" ref={gridRef}>
                                        {nameCards.map((nameCard, index) => (
                                            <div
                                                key={nameCard.id}
                                                ref={(el) => { cardRefs.current[index] = el; }}
                                                className={`group cursor-pointer rounded-xl border border-emerald-200 bg-white dark:bg-gray-800 p-3 transition-all duration-200 hover:shadow-lg hover:scale-102 ${
                                                    selectedIndex === index
                                                        ? 'border-emerald-400 shadow-lg ring-2 ring-emerald-200 dark:border-emerald-500 dark:ring-emerald-400'
                                                        : 'hover:border-emerald-300 dark:hover:border-emerald-400'
                                                }`}
                                            onClick={() => handleNameCardClick(nameCard)}
                                        >
                                            {/* Large Image Display */}
                                            <div className="mb-3">
                                                <NameCardImage
                                                    nameCard={nameCard}
                                                    className="w-full h-40 rounded-lg object-cover shadow-sm"
                                                    useCache={true}
                                                />
                                            </div>

                                            {/* Simple Card Info */}
                                            <div className="text-center space-y-2">
                                                <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate">
                                                    {nameCard.name}
                                                </h3>
                                                <div className="text-xs text-emerald-600 dark:text-emerald-400">
                                                    {nameCard.cards_count} {t('point_of_sale.cards_count')}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center py-20">
                                    <div className="text-center space-y-6">
                                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/20">
                                            <CreditCard className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-200">
                                                {t('point_of_sale.no_name_cards_available')}
                                            </h3>
                                            <p className="text-emerald-600 dark:text-emerald-400 mt-2">
                                                {t('point_of_sale.no_name_cards_retry')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Cards View - Enhanced Design */}
                    {!currentError && viewMode === 'cards' && (
                        <div className="space-y-6">
                            {cards.length > 0 ? (
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" ref={gridRef}>
                                        {cards.map((card, index) => (
                                            <div
                                                key={card.id}
                                                ref={(el) => { cardRefs.current[index] = el; }}
                                                className={`group cursor-pointer rounded-xl border border-emerald-200 bg-white dark:bg-gray-800 p-3 transition-all duration-200 hover:shadow-lg hover:scale-102 ${
                                                    selectedIndex === index
                                                        ? 'border-emerald-400 shadow-lg ring-2 ring-emerald-200 dark:border-emerald-500 dark:ring-emerald-400'
                                                        : 'hover:border-emerald-300 dark:hover:border-emerald-400'
                                                }`}
                                            onClick={() => handleCardSelect(card)}
                                        >
                                            {/* Large Image Display */}
                                            <div className="mb-3">
                                                <NameCardImage
                                                    nameCard={{
                                                        id: card.name_card.id,
                                                        name: card.name_card.name,
                                                        image_url: (card.name_card as { image_url?: string }).image_url,
                                                        has_image: (card.name_card as { has_image?: boolean }).has_image || false,
                                                        image_data: (card.name_card as { image_data?: { base64: string; mime_type: string; size: number; original_name: string; data_url: string } }).image_data,
                                                    }}
                                                    className="w-full h-40 rounded-lg object-cover shadow-sm"
                                                    useCache={true}
                                                />
                                            </div>

                                            {/* Simple Card Info */}
                                            <div className="text-center space-y-2">
                                                <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate">
                                                    {String(card.card_name).replace(/\s*-\s*\$[\d,]+\.?\d*\s*$/, '')}
                                                </h3>
                                                
                                                {/* Simple Price Display */}
                                                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
                                                    <div className="text-lg font-bold text-green-700 dark:text-green-300">
                                                        {formatCurrency(card.sell_price)}
                                                    </div>
                                                    <div className="text-xs text-green-600 dark:text-green-400">
                                                        {t('point_of_sale.currency_iqd_label')}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center py-20">
                                    <div className="text-center space-y-6">
                                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/20">
                                            <CreditCard className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-200">
                                                {t('point_of_sale.no_cards_available')}
                                            </h3>
                                            <p className="text-emerald-600 dark:text-emerald-400 mt-2">
                                                {t('point_of_sale.no_cards_retry')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </DialogContent>
        </Dialog>
    );
};
