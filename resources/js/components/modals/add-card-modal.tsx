import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { useTranslation } from '@/hooks/use-translation';
import { getCurrencySymbol } from '@/lib/currency';
import { cardCacheService } from '@/services/business/cardCacheService';
import type { NameCard } from '@/types';
import axios from 'axios';
import { Loader2, Plus, Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface NameCardWithImage extends NameCard {
    image_path?: string;
    image_url?: string;
    has_image?: boolean;
}

interface AddCardModalProps {
    isOpen: boolean;
    onClose: (
        updatedData?: NameCardWithImage | { id: number; name_card: NameCardWithImage },
    ) => void;
    editNameCard?: NameCardWithImage;
    editCard?: { id: number; name_card: NameCardWithImage; cost_price: number; sell_price: number; is_active: boolean };
}

export function AddCardModal({ isOpen, onClose, editNameCard, editCard }: AddCardModalProps) {
    const { toast } = useToast();
    const { t } = useTranslation();

    // Form state for name card
    const [nameCardForm, setNameCardForm] = useState({
        id: null as number | null,
        name: '',
        image: null as File | null,
        existingImageUrl: '' as string,
        removeImage: false,
    });

    // Form state for card
    const [cardForm, setCardForm] = useState({
        nameCardId: '',
        costPrice: '',
        sellPrice: '',
    });

    // UI state
    const [currentTab, setCurrentTab] = useState<'name-card' | 'card'>(
        'name-card',
    );
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [nameCards, setNameCards] = useState<NameCardWithImage[]>([]);
    const [loadingNameCards, setLoadingNameCards] = useState(false);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [showEditNameCardOption, setShowEditNameCardOption] = useState(false);

    const isEditingNameCard = Boolean(editNameCard) || Boolean(nameCardForm.id);
    const isEditingCard = Boolean(editCard);

    // Load name cards - simplified like supplier pattern
    const loadNameCards = async () => {
        setLoadingNameCards(true);
        setError(null);
        try {
            const response = await axios.get('/api/name-cards/options');
            if (response.data.success && response.data.data) {
                setNameCards(response.data.data);
            } else {
                setError(response.data.message || 'Failed to load name cards');
            }
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            setError(
                err.response?.data?.message || 'Failed to load name cards',
            );
        } finally {
            setLoadingNameCards(false);
        }
    };

    // Handle form changes
    const handleNameCardChange = (
        field: string,
        value: string | File | null,
    ) => {
        setNameCardForm((prev) => ({ ...prev, [field]: value }));
        setError(null);
    };

    const handleCardChange = (field: string, value: string) => {
        setCardForm((prev) => ({ ...prev, [field]: value }));
        setError(null);
    };

    // Handle image upload
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleNameCardChange('image', file);

            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Remove image
    const removeImage = () => {
        handleNameCardChange('image', null);
        setImagePreview('');
        if (isEditingNameCard && nameCardForm.existingImageUrl) {
            setNameCardForm((prev) => ({ ...prev, removeImage: true }));
        }
    };

    // Save name card - supports both create and update (using same approach as card edit)
    const saveNameCard = async () => {
        const name = nameCardForm.name?.trim();
        if (!name) {
            setError(
                t('card.name_card_name_required') ||
                    'Name card name is required',
            );
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('name', name);

            if (nameCardForm.image) {
                formData.append('image', nameCardForm.image);
            }

            if (isEditingNameCard && nameCardForm.removeImage) {
                formData.append('remove_image', '1');
            }

            // Important: For file uploads with updates, use POST + _method=PUT to ensure
            // Laravel properly parses multipart form data on all PHP setups
            const response = isEditingNameCard
                ? await (async () => {
                    const updateForm = new FormData();
                    updateForm.append('name', name);
                    if (nameCardForm.image) {
                        updateForm.append('image', nameCardForm.image);
                    }
                    if (nameCardForm.removeImage) {
                        updateForm.append('remove_image', 'true');
                    }
                    updateForm.append('_method', 'PUT');
                    return axios.post(`/api/name-cards/${nameCardForm.id}`, updateForm, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                    });
                })()
                : await axios.post('/api/name-cards', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });

            if (response.data.success) {
                // Smart cache refresh - same approach as card edit
                const nameCardData = response.data.data;
                if (nameCardData) {
                    if (isEditingNameCard) {
                        // Update existing name card in cache
                        cardCacheService.updateNameCardInCache({
                            ...nameCardData,
                            cards: [], // Will be populated by the parent component
                            cards_count: 0
                        });
                    } else {
                        // Add new name card to cache
                        cardCacheService.addNameCardToCache({
                            ...nameCardData,
                            cards: [],
                            cards_count: 0
                        });
                    }
                }

                // Don't show toast here - parent component will show it (same as card edit)
                const savedNameCard = nameCardData;

                if (isEditingNameCard) {
                    // Update in local state - ensure we update the name card with fresh image URL
                    setNameCards((prev) =>
                        prev.map((nc) =>
                            nc.id === savedNameCard.id ? { ...savedNameCard, image_url: savedNameCard.image_url } : nc,
                        ),
                    );

                    // Update the card form to refresh the name card reference
                    if (cardForm.nameCardId === savedNameCard.id.toString()) {
                        setCardForm((prev) => ({
                            ...prev,
                            nameCardId: savedNameCard.id.toString(),
                        }));
                    }

                    // Pass the updated data back for smart update (same as card edit)
                    handleClose(savedNameCard);
                } else {
                    // Add to list and select it
                    setNameCards((prev) => [savedNameCard, ...prev]);
                    setCardForm((prev) => ({
                        ...prev,
                        nameCardId: savedNameCard.id.toString(),
                    }));

                    // Reset name card form
                    setNameCardForm({
                        id: null,
                        name: '',
                        image: null,
                        existingImageUrl: '',
                        removeImage: false,
                    });
                    setImagePreview('');

                    // Switch to card tab
                    setCurrentTab('card');
                }
            } else {
                const errorMessage =
                    response.data.message ||
                    (isEditingNameCard
                        ? t('card.update_name_card_failed') || 'Failed to update name card'
                        : t('card.create_name_card_failed') || 'Failed to create name card');
                toast({
                    title: isEditingNameCard
                        ? t('common.update_failed') || 'Update Failed'
                        : t('common.creation_failed') || 'Creation Failed',
                    description: errorMessage,
                    type: 'error',
                });
                setError(errorMessage);
            }
        } catch (error: unknown) {
            const err = error as { response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]> } } };
            
            const errorMessage = err.response?.data?.message ||
                (isEditingNameCard
                    ? t('card.update_name_card_failed') || 'Failed to update name card'
                    : t('card.create_name_card_failed') || 'Failed to create name card');
            
            toast({
                title: t('common.operation_failed') || 'Operation Failed',
                description: errorMessage,
                type: 'error',
            });
            setError(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    // Save card - simplified like supplier pattern
    const saveCard = async () => {
        if (!cardForm.nameCardId) {
            setError(
                t('card.select_name_card_required') ||
                    'Please select a name card',
            );
            return;
        }
        if (!cardForm.costPrice || parseFloat(cardForm.costPrice) < 0) {
            setError(
                t('card.valid_cost_price_required') ||
                    'Valid cost price is required',
            );
            return;
        }
        if (!cardForm.sellPrice || parseFloat(cardForm.sellPrice) < 0) {
            setError(
                t('card.valid_sell_price_required') ||
                    'Valid sell price is required',
            );
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const cardData = {
                name_card_id: parseInt(cardForm.nameCardId),
                cost_price: parseFloat(cardForm.costPrice),
                sell_price: parseFloat(cardForm.sellPrice),
                is_active: true,
            };

            const response = isEditingCard && editCard
                ? await axios.put(`/api/cards/${editCard.id}`, cardData)
                : await axios.post('/api/cards', cardData);

            if (response.data.success) {
                // Smart cache refresh
                const cardData = response.data.data || response.data.card;
                if (cardData) {
                    if (isEditingCard) {
                        // Update existing card in cache
                        cardCacheService.updateCardInCache(cardData, parseInt(cardForm.nameCardId));
                    } else {
                        // Add new card to cache
                        cardCacheService.addCardToCache(cardData, parseInt(cardForm.nameCardId));
                    }
                }

                // Don't show toast here - parent component will show it
                const selectedNameCard = nameCards.find(
                    (nc) => nc.id === parseInt(cardForm.nameCardId),
                );

                // Prepare the data to pass back for smart update
                const savedCardData = {
                    ...(response.data.data || response.data.card || cardData),
                    id: response.data.data?.id || response.data.card?.id,
                    name_card: selectedNameCard,
                };

                handleClose(savedCardData);
            } else {
                const errorMessage =
                    response.data.message ||
                    t('card.create_failed') || 'Failed to create card';
                toast({
                    title: t('common.creation_failed') || 'Creation Failed',
                    description: errorMessage,
                    type: 'error',
                });
                setError(errorMessage);
            }
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            const errorMessage =
                err.response?.data?.message ||
                t('card.create_failed') || 'Failed to create card';
            toast({
                title: t('common.operation_failed') || 'Operation Failed',
                description: errorMessage,
                type: 'error',
            });
            setError(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    // Handle close
    const handleClose = (
        savedData?: NameCardWithImage | { id: number; name_card: NameCardWithImage },
    ) => {
        setCurrentTab('name-card');
        setNameCardForm({
            id: null,
            name: '',
            image: null,
            existingImageUrl: '',
            removeImage: false,
        });
        setCardForm({ nameCardId: '', costPrice: '', sellPrice: '' });
        setImagePreview('');
        setError(null);
        setSaving(false);
        setShowEditNameCardOption(false);
        onClose(savedData);
    };

    // Handle submit
    const handleSubmit = () => {
        if (currentTab === 'name-card') {
            saveNameCard();
        } else {
            saveCard();
        }
    };

    // Handle Enter key
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (
            e.key === 'Enter' &&
            !e.shiftKey &&
            !e.ctrlKey &&
            !e.altKey &&
            !saving
        ) {
            e.preventDefault();
            handleSubmit();
        }
    };

    // Load data when modal opens
    useEffect(() => {
        if (isOpen) {
            loadNameCards();
            
            // Initialize edit mode if editing
            if (editNameCard) {
                setNameCardForm({
                    id: editNameCard.id,
                    name: editNameCard.name || '',
                    image: null,
                    existingImageUrl: editNameCard.image_url || '',
                    removeImage: false,
                });
                setCurrentTab('name-card');
                setImagePreview(editNameCard.image_url || '');
            } else if (editCard) {
                setCardForm({
                    nameCardId: editCard.name_card.id.toString(),
                    costPrice: editCard.cost_price.toString(),
                    sellPrice: editCard.sell_price.toString(),
                });
                setCurrentTab('card');
            } else {
                // Reset forms for create mode
                setNameCardForm({
                    id: null,
                    name: '',
                    image: null,
                    existingImageUrl: '',
                    removeImage: false,
                });
                setCardForm({
                    nameCardId: '',
                    costPrice: '',
                    sellPrice: '',
                });
                setCurrentTab('name-card');
            }
        }
    }, [isOpen, editNameCard, editCard]);

    // Load name card for editing
    const loadNameCardForEdit = async (nameCardId: number) => {
        try {
            const response = await axios.get(`/api/name-cards/${nameCardId}`);
            if (response.data.success && response.data.data) {
                const nameCard = response.data.data;
                setNameCardForm({
                    id: nameCard.id,
                    name: nameCard.name,
                    image: null,
                    existingImageUrl: nameCard.image_url || '',
                    removeImage: false,
                });
                if (nameCard.image_url) {
                    setImagePreview(nameCard.image_url);
                }
                setCurrentTab('name-card');
            }
        } catch (error) {
            console.error('Failed to load name card:', error);
            toast({
                title: t('common.operation_failed') || 'Operation Failed',
                description: t('card.failed_load_name_card') || 'Failed to load name card',
                type: 'error',
            });
        }
    };

    const profitMargin = (() => {
        const cost = parseFloat(cardForm.costPrice) || 0;
        const sell = parseFloat(cardForm.sellPrice) || 0;
        if (cost > 0 && sell > 0) {
            return (((sell - cost) / cost) * 100).toFixed(2);
        }
        return '0.00';
    })();

    return (
        <Dialog open={isOpen} onOpenChange={() => handleClose()}>
            <DialogContent
                className="max-h-[90vh] overflow-y-auto sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[60vw] [&>button]:hidden border-pink-200 shadow-[0_4px_8px_0_rgba(0,0,0,0.2),0_2px_4px_0_rgba(0,0,0,0.1)] dark:border-pink-800 dark:shadow-[0_4px_8px_0_rgba(0,0,0,0.4),0_2px_4px_0_rgba(0,0,0,0.3)]"
                style={{
                    zIndex: 9999,
                    maxWidth: '60vw',
                    width: '800px',
                    height: 'auto',
                    minHeight: '550px',
                    maxHeight: '90vh',
                }}
                onKeyDown={handleKeyDown}
            >
                <DialogHeader className="border-b border-pink-200 pb-4 dark:border-pink-800">
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold text-pink-800 dark:text-pink-200">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-pink-600 shadow-lg">
                            <Plus className="h-4 w-4 text-white" />
                        </div>
                        {isEditingNameCard
                            ? t('card.edit_name_card') || 'Edit Name Card'
                            : isEditingCard
                            ? t('card.edit_card') || 'Edit Card'
                            : t('card.add_new_card') || 'Add New Card'}
                    </DialogTitle>
                </DialogHeader>

                {error && (
                    <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                        {error}
                    </div>
                )}

                {/* Tab Navigation */}
                <div className="flex rounded-lg bg-muted p-1">
                    <button
                        type="button"
                        onClick={() => setCurrentTab('name-card')}
                        disabled={saving || isEditingCard}
                        className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors text-center ${
                            currentTab === 'name-card'
                                ? 'bg-background text-foreground shadow-sm'
                                : isEditingCard
                                ? 'text-muted-foreground cursor-not-allowed opacity-50'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                        style={{ minWidth: 0 }}
                    >
                        {t('card.name_card_tab') || 'Name Card'}
                    </button>
                    <button
                        type="button"
                        onClick={() => setCurrentTab('card')}
                        disabled={saving || isEditingNameCard}
                        className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors text-center ${
                            currentTab === 'card'
                                ? 'bg-background text-foreground shadow-sm'
                                : isEditingNameCard
                                ? 'text-muted-foreground cursor-not-allowed opacity-50'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                        style={{ minWidth: 0 }}
                    >
                        {t('card.card_tab') || 'Card'}
                    </button>
                </div>

                {/* Tab Content */}
                <div className="space-y-4">
                    {currentTab === 'name-card' && (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {/* Name Card Name */}
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="nameCardName">
                                    {t('card.name_card_name') ||
                                        'Name Card Name'}{' '}
                                    *
                                </Label>
                                <Input
                                    id="nameCardName"
                                    value={nameCardForm.name}
                                    onChange={(e) =>
                                        handleNameCardChange(
                                            'name',
                                            e.target.value,
                                        )
                                    }
                                    placeholder={
                                        t('card.name_card_name_placeholder') ||
                                        'Enter name card name'
                                    }
                                    disabled={saving}
                                    className="h-12 w-full text-base"
                                />
                            </div>

                            {/* Image Upload */}
                            <div className="space-y-2 md:col-span-2">
                                <Label>
                                    {t('card.image_optional') ||
                                        'Image (Optional)'}
                                </Label>
                                {imagePreview ? (
                                    <div className="rounded-lg border-2 border-dashed border-border p-6">
                                        <div className="flex flex-col items-center space-y-4">
                                            <img
                                                src={imagePreview}
                                                alt={t('add_card_modal.preview_alt')}
                                                className="max-h-48 w-full rounded-md object-contain"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={removeImage}
                                                disabled={saving}
                                            >
                                                <X className="mr-1 h-4 w-4" />
                                                {t('common.remove') || 'Remove'}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-lg border-2 border-dashed border-border p-8 text-center">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            disabled={saving}
                                            className="hidden"
                                            id="imageUpload"
                                            tabIndex={-1}
                                        />
                                        <label
                                            htmlFor="imageUpload"
                                            className="flex cursor-pointer flex-col items-center"
                                        >
                                            <Upload className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
                                            <p className="text-base text-muted-foreground">
                                                {t('card.click_to_upload') ||
                                                    'Click to upload image'}
                                            </p>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {t('card.image_format_info') ||
                                                    'PNG, JPG, GIF up to 10MB'}
                                            </p>
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {currentTab === 'card' && (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {/* Select Name Card */}
                            <div className="space-y-2 md:col-span-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="nameCardSelect">
                                        {t('card.select_name_card') ||
                                            'Select Name Card'}{' '}
                                        *
                                    </Label>
                                    {showEditNameCardOption && cardForm.nameCardId && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => loadNameCardForEdit(parseInt(cardForm.nameCardId))}
                                            disabled={saving}
                                            className="text-xs"
                                        >
                                            {t('card.edit_name_card') || 'Edit Name Card'}
                                        </Button>
                                    )}
                                </div>
                                <Select
                                    value={cardForm.nameCardId}
                                    onValueChange={(value) =>
                                        handleCardChange('nameCardId', value)
                                    }
                                    disabled={saving || loadingNameCards}
                                >
                                    <SelectTrigger className="h-12 w-full text-base">
                                        <SelectValue
                                            placeholder={
                                                loadingNameCards
                                                    ? t('common.loading') ||
                                                      'Loading...'
                                                    : t(
                                                          'card.select_name_card_placeholder',
                                                      ) || 'Select a name card'
                                            }
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {nameCards.length > 0 ? (
                                            nameCards.map((nameCard) => (
                                                <SelectItem
                                                    key={nameCard.id}
                                                    value={nameCard.id.toString()}
                                                >
                                                    {nameCard.name}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <div className="p-3 text-center text-sm text-muted-foreground">
                                                {t(
                                                    'card.no_name_cards_found',
                                                ) || 'No name cards found'}
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Cost Price */}
                            <div className="space-y-2">
                                <Label htmlFor="costPrice">
                                    {t('common.cost_price') || 'Cost Price'} (
                                    {getCurrencySymbol()}) *
                                </Label>
                                <Input
                                    id="costPrice"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={cardForm.costPrice}
                                    onChange={(e) =>
                                        handleCardChange(
                                            'costPrice',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="0"
                                    disabled={saving}
                                    className="h-12 w-full text-base"
                                />
                            </div>

                            {/* Sell Price */}
                            <div className="space-y-2">
                                <Label htmlFor="sellPrice">
                                    {t('common.sell_price') || 'Sell Price'} (
                                    {getCurrencySymbol()}) *
                                </Label>
                                <Input
                                    id="sellPrice"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={cardForm.sellPrice}
                                    onChange={(e) =>
                                        handleCardChange(
                                            'sellPrice',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="0"
                                    disabled={saving}
                                    className="h-12 w-full text-base"
                                />
                            </div>

                            {/* Profit Margin */}
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="profitMargin">
                                    {t('common.profit_margin_auto') ||
                                        'Profit Margin (Auto)'}
                                </Label>
                                <Input
                                    id="profitMargin"
                                    value={`${profitMargin}%`}
                                    readOnly
                                    className="h-12 w-full bg-muted text-base"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="border-t border-pink-200 pt-4 dark:border-pink-800">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleClose()}
                        disabled={saving}
                        className="border-pink-300 bg-pink-50 text-pink-700 hover:border-pink-500 hover:bg-pink-100 hover:text-pink-800 focus:border-pink-500 focus:bg-pink-100 focus:ring-2 focus:ring-pink-200 focus:outline-none dark:border-pink-600 dark:bg-pink-900/20 dark:text-pink-300 dark:hover:border-pink-500 dark:hover:bg-pink-900/30 dark:hover:text-pink-200 dark:focus:border-pink-500 dark:focus:bg-pink-900/30 dark:focus:ring-2 dark:focus:ring-pink-400"
                    >
                        {t('common.cancel') || 'Cancel'}
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={saving}
                        className="bg-gradient-to-r from-pink-500 to-pink-600 text-white hover:from-pink-600 hover:to-pink-700 focus:ring-2 focus:ring-pink-200 focus:outline-none disabled:opacity-50 dark:from-pink-600 dark:to-pink-700 dark:hover:from-pink-700 dark:hover:to-pink-800 dark:focus:ring-2 dark:focus:ring-pink-400"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {currentTab === 'name-card'
                                    ? isEditingNameCard
                                        ? t('card.updating') || 'Updating...'
                                        : t('card.creating') || 'Creating...'
                                    : t('card.creating') || 'Creating...'}
                            </>
                        ) : (
                            <>
                                <Plus className="mr-2 h-4 w-4" />
                                {currentTab === 'name-card'
                                    ? isEditingNameCard
                                        ? t('card.update_name_card') || 'Update Name Card'
                                        : t('card.create_name_card') || 'Create Name Card'
                                    : t('card.create_card') || 'Create Card'}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
