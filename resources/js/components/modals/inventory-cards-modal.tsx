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
import { useToast } from '@/components/ui/toast';
import { DeleteModal } from '@/components/ui/delete-modal';
import { AddCardModal } from '@/components/modals/add-card-modal';
import type { Card as CardType } from '@/types';

interface NameCardWithImage {
    id: number;
    name: string;
    image_path?: string;
    image_url?: string;
    has_image?: boolean;
    created_at?: string;
    updated_at?: string;
}
import { cardCacheService, type CachedNameCard } from '@/services/business/cardCacheService';
import { nameCardService } from '@/services/business/nameCardService';
import { cardService } from '@/services/business/cardService';
import { formatCurrency } from '@/lib/currency';
import {
    ArrowLeft,
    CreditCard,
    Edit,
    Trash2,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

interface InventoryCardsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDataChange?: () => void;
}

type ViewMode = 'nameCards' | 'cards';

export const InventoryCardsModal: React.FC<InventoryCardsModalProps> = ({
    isOpen,
    onClose,
    onDataChange,
}) => {
    const { t } = useTranslation();
    const { toast } = useToast();
    
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
    
    // Delete state
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{
        type: 'nameCard' | 'card';
        item: CachedNameCard | CardType;
    } | null>(null);
    
    // Edit state
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingNameCard, setEditingNameCard] = useState<CachedNameCard | null>(null);
    const [editingCard, setEditingCard] = useState<CardType | null>(null);


    // Load name cards with cached data
    const loadNameCards = async (forceRefresh = false) => {
        setNameCardsLoading(true);
        setNameCardsError(null);
        try {
            const nameCards = await cardCacheService.getNameCardsWithCards(forceRefresh);
            
            if (Array.isArray(nameCards) && nameCards.length > 0) {
                setNameCards(nameCards);
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
            setCards(nameCard.cards as unknown as CardType[]);
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
        onClose();
    }, [onClose]);

    // Handle back to name cards
    const handleBackToNameCards = () => {
        setViewMode('nameCards');
        setSelectedNameCard(null);
        setCards([]);
    };

    // Delete handlers
    const handleDeleteNameCard = useCallback((nameCard: CachedNameCard) => {
        setDeleteConfirm({ type: 'nameCard', item: nameCard });
    }, []);

    const handleDeleteCard = useCallback((card: CardType) => {
        setDeleteConfirm({ type: 'card', item: card });
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!deleteConfirm) return;

        setDeleteLoading(true);
        try {
            if (deleteConfirm.type === 'nameCard') {
                const nameCard = deleteConfirm.item as CachedNameCard;
                const response = await nameCardService.deleteNameCard(nameCard.id);
                
                if (response.success) {
                    // Clear cache and refresh data
                    cardCacheService.clearCache();
                    
                    // Remove from local state
                    setNameCards(prev => prev.filter(nc => nc.id !== nameCard.id));
                    
                    // Refresh name cards from server
                    await loadNameCards(true);
                    
                    // Notify parent component of data change
                    onDataChange?.();
                    
                    toast({
                        title: t('common.successful') || 'Success',
                        description: t('name_card.deleted_successfully') || 'Name card deleted successfully',
                        type: 'success',
                    });
                } else {
                    toast({
                        title: t('common.error') || 'Error',
                        description: response.message || 'Failed to delete name card',
                        type: 'error',
                    });
                }
            } else if (deleteConfirm.type === 'card') {
                const card = deleteConfirm.item as CardType;
                const response = await cardService.deleteCard(card.id);
                
                if (response.success) {
                    // Clear cache and refresh data
                    cardCacheService.clearCache();
                    
                    // Remove from local state
                    setCards(prev => prev.filter(c => c.id !== card.id));
                    
                    // Update name card cards count
                    setNameCards(prev => prev.map(nc => 
                        nc.id === selectedNameCard?.id 
                            ? { ...nc, cards: nc.cards?.filter(c => c.id !== card.id) || [], cards_count: (nc.cards_count || 0) - 1 }
                            : nc
                    ));
                    
                    // Cards are already updated in local state above
                    
                    // Refresh name cards to get updated counts
                    await loadNameCards(true);
                    
                    // Notify parent component of data change
                    onDataChange?.();
                    
                    toast({
                        title: t('common.successful') || 'Success',
                        description: t('card.deleted_successfully') || 'Card deleted successfully',
                        type: 'success',
                    });
                } else {
                    toast({
                        title: t('common.error') || 'Error',
                        description: response.message || 'Failed to delete card',
                        type: 'error',
                    });
                }
            }
        } catch {
            toast({
                title: t('common.error') || 'Error',
                description: t('common.delete_failed') || 'Delete operation failed',
                type: 'error',
            });
        } finally {
            setDeleteLoading(false);
            setDeleteConfirm(null);
        }
    }, [deleteConfirm, selectedNameCard, toast, t, onDataChange]);

    const handleDeleteCancel = useCallback(() => {
        setDeleteConfirm(null);
    }, []);

    // Edit handlers
    const handleEditNameCard = useCallback((nameCard: CachedNameCard) => {
        setEditingNameCard(nameCard);
        setEditingCard(null);
        setEditModalOpen(true);
    }, []);

    const handleEditCard = useCallback((card: CardType) => {
        setEditingCard(card);
        setEditingNameCard(null);
        setEditModalOpen(true);
    }, []);

    const handleEditClose = useCallback(async (updatedData?: NameCardWithImage | { id: number; name_card: NameCardWithImage }) => {
        setEditModalOpen(false);
        setEditingNameCard(null);
        setEditingCard(null);
        
        if (updatedData) {
            // Force refresh from server with smart cache updates
            await cardCacheService.forceRefresh();
            await loadNameCards(true); // Force refresh from server
            
            // Notify parent component of data change
            onDataChange?.();
        }
    }, [onDataChange]);

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
                <DialogHeader className="shrink-0 border-b bg-gradient-to-r from-cyan-50 to-cyan-100 px-6 py-6 dark:from-cyan-900/20 dark:to-cyan-800/20">
                    <DialogTitle className="flex items-center gap-4 text-2xl font-bold text-cyan-800 dark:text-cyan-200">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-lg">
                            <CreditCard className="h-7 w-7 text-white" />
                        </div>
                        <div className="flex-1">
                            <div className="text-2xl font-bold">
                                {viewMode === 'nameCards' 
                                    ? t('inventory.cards_management')
                                    : selectedNameCard?.name || 'Cards'
                                }
                            </div>
                            <div className="text-sm font-medium text-cyan-600 dark:text-cyan-400 mt-1">
                                {viewMode === 'nameCards' 
                                    ? t('inventory.cards_management_desc')
                                    : t('inventory.select_card_desc')
                                }
                            </div>
                        </div>
                        {viewMode === 'cards' && (
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={handleBackToNameCards}
                                className="flex items-center gap-3 border-2 border-cyan-300 bg-gradient-to-r from-cyan-50 to-cyan-100 text-cyan-700 hover:border-cyan-500 hover:bg-gradient-to-r hover:from-cyan-100 hover:to-cyan-200 hover:text-cyan-800 focus:border-cyan-500 focus:bg-gradient-to-r focus:from-cyan-100 focus:to-cyan-200 focus:ring-2 focus:ring-cyan-200 focus:outline-none dark:border-cyan-600 dark:bg-gradient-to-r dark:from-cyan-900/20 dark:to-cyan-800/20 dark:text-cyan-300 dark:hover:border-cyan-500 dark:hover:bg-gradient-to-r dark:hover:from-cyan-900/30 dark:hover:to-cyan-800/30 dark:hover:text-cyan-200 dark:focus:border-cyan-500 dark:focus:bg-gradient-to-r dark:focus:from-cyan-900/30 dark:focus:to-cyan-800/30 dark:focus:ring-2 dark:focus:ring-cyan-400 shadow-lg"
                            >
                                <ArrowLeft className="h-5 w-5" />
                                <span className="font-semibold">{t('inventory.back_to_name_cards')}</span>
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
                                    <div className="h-16 w-16 animate-spin rounded-full border-4 border-cyan-200 border-t-cyan-500 shadow-lg"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <CreditCard className="h-6 w-6 text-cyan-500" />
                                    </div>
                                </div>
                                <div className="text-center space-y-2">
                                    <h3 className="text-xl font-bold text-cyan-800 dark:text-cyan-200">
                                        {t('inventory.loading_name_cards')}
                                    </h3>
                                    <p className="text-cyan-600 dark:text-cyan-400">
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
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cyan-100 dark:bg-cyan-900/20">
                                    <CreditCard className="h-8 w-8 text-cyan-500" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-cyan-800 dark:text-cyan-200">
                                        {t('inventory.error_loading_cards')}
                                    </h3>
                                    <p className="text-cyan-600 dark:text-cyan-400 mt-2">
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
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                        {nameCards.map((nameCard) => (
                                            <div
                                                key={nameCard.id}
                                                className="group relative rounded-xl border border-cyan-200 bg-white dark:bg-gray-800 p-3 transition-all duration-200 hover:shadow-lg hover:scale-102 hover:border-cyan-300 dark:hover:border-cyan-400"
                                            >
                                                {/* Action Buttons */}
                                                <div className="absolute top-2 right-2 z-20 flex gap-1">
                                                    {/* Edit Button */}
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEditNameCard(nameCard);
                                                        }}
                                                        disabled={deleteLoading}
                                                        className="h-8 w-8 p-0 bg-blue-500 hover:bg-blue-600 text-white rounded-md border border-blue-600 shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                                        style={{ display: 'flex' }}
                                                        title={t('name_card.edit_name_card') || 'Edit name card'}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    
                                                    {/* Delete Button */}
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteNameCard(nameCard);
                                                        }}
                                                        disabled={deleteLoading || (nameCard.cards_count > 0)}
                                                        className={`h-8 w-8 p-0 rounded-md border shadow-lg flex items-center justify-center ${
                                                            nameCard.cards_count > 0
                                                                ? 'bg-gray-400 text-gray-600 border-gray-400 cursor-not-allowed'
                                                                : 'bg-red-500 hover:bg-red-600 text-white border-red-600 hover:border-red-700'
                                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                                        style={{ display: 'flex' }}
                                                        title={
                                                            nameCard.cards_count > 0
                                                                ? t('name_card.cannot_delete_with_cards') || 'Cannot delete name card with associated cards'
                                                                : t('name_card.delete_name_card') || 'Delete name card'
                                                        }
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>

                                                {/* Clickable Area */}
                                                <div
                                                    className="cursor-pointer"
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
                                                    <div className="text-xs text-cyan-600 dark:text-cyan-400">
                                                        {nameCard.cards_count} {t('inventory.cards_count')}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center py-20">
                                    <div className="text-center space-y-6">
                                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-cyan-100 dark:bg-cyan-900/20">
                                            <CreditCard className="h-10 w-10 text-cyan-600 dark:text-cyan-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-cyan-800 dark:text-cyan-200">
                                                {t('inventory.no_name_cards_available')}
                                            </h3>
                                            <p className="text-cyan-600 dark:text-cyan-400 mt-2">
                                                {t('inventory.no_name_cards_retry')}
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
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                        {cards.map((card) => (
                                            <div
                                                key={card.id}
                                                className="group relative rounded-xl border border-cyan-200 bg-white dark:bg-gray-800 p-3 transition-all duration-200 hover:shadow-lg hover:scale-102 hover:border-cyan-300 dark:hover:border-cyan-400"
                                            >
                                                {/* Action Buttons */}
                                                <div className="absolute top-2 right-2 z-20 flex gap-1">
                                                    {/* Edit Button */}
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEditCard(card);
                                                        }}
                                                        disabled={deleteLoading}
                                                        className="h-8 w-8 p-0 bg-blue-500 hover:bg-blue-600 text-white rounded-md border border-blue-600 shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                                        style={{ display: 'flex' }}
                                                        title={t('card.edit_card') || 'Edit card'}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    
                                                    {/* Delete Button */}
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteCard(card);
                                                        }}
                                                        disabled={deleteLoading}
                                                        className="h-8 w-8 p-0 bg-red-500 hover:bg-red-600 text-white rounded-md border border-red-600 shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                                        style={{ display: 'flex' }}
                                                        title={t('card.delete_card') || 'Delete card'}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>

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
                                                            {t('inventory.currency_iqd_label')}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center py-20">
                                    <div className="text-center space-y-6">
                                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-cyan-100 dark:bg-cyan-900/20">
                                            <CreditCard className="h-10 w-10 text-cyan-600 dark:text-cyan-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-cyan-800 dark:text-cyan-200">
                                                {t('inventory.no_cards_available')}
                                            </h3>
                                            <p className="text-cyan-600 dark:text-cyan-400 mt-2">
                                                {t('inventory.no_cards_retry')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </DialogContent>

            {/* Delete Confirmation Modal */}
            <DeleteModal
                isOpen={!!deleteConfirm}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                title={
                    deleteConfirm?.type === 'nameCard' 
                        ? t('name_card.confirm_delete') || 'Delete Name Card'
                        : t('card.confirm_delete') || 'Delete Card'
                }
                description={
                    deleteConfirm?.type === 'nameCard' 
                        ? t('name_card.delete_warning') || 'Are you sure you want to delete this name card? This action cannot be undone.'
                        : t('card.delete_warning') || 'Are you sure you want to delete this card? This action cannot be undone.'
                }
                confirmButtonText={t('common.delete') || 'Delete'}
                cancelButtonText={t('common.cancel') || 'Cancel'}
                warning={
                    deleteConfirm?.type === 'nameCard' 
                        ? t('name_card.cannot_delete_with_cards') || 'You cannot delete a name card that has associated cards. Please delete all cards first.'
                        : undefined
                }
                isLoading={deleteLoading}
            />

            {/* Edit Modal */}
            {editModalOpen && (
                <AddCardModal
                    isOpen={editModalOpen}
                    onClose={handleEditClose}
                    editNameCard={editingNameCard ? {
                        id: editingNameCard.id,
                        name: editingNameCard.name,
                        image_path: undefined,
                        image_url: editingNameCard.image_url,
                        has_image: editingNameCard.has_image,
                        created_at: '',
                        updated_at: ''
                    } : undefined}
                    editCard={editingCard ? {
                        id: editingCard.id,
                        name_card: editingCard.name_card,
                        cost_price: editingCard.cost_price,
                        sell_price: editingCard.sell_price,
                        is_active: Boolean(editingCard.is_active)
                    } : undefined}
                />
            )}
        </Dialog>
    );
};
