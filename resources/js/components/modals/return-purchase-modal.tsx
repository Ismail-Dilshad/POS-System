import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { useTranslation } from '@/hooks/use-translation';
import { formatCurrency } from '@/lib/currency';
import {
    purchaseService,
    type Purchase,
    type PurchaseItem,
} from '@/services/business/purchaseService';
import {
    AlertCircle,
    ArrowLeft,
    Calendar,
    CheckCircle2,
    DollarSign,
    FileText,
    Hash,
    Loader2,
    Minus,
    Package,
    Plus,
    RotateCcw,
    Search,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface ReturnPurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onReturnProcessed?: () => void;
}

interface ReturnItem extends PurchaseItem {
    return_quantity: number;
    return_total: number;
}

type ReturnStep = 'search' | 'items-selection' | 'confirmation';

interface StepInfo {
    title: string;
    description: string;
}

function ReturnPurchaseModal({
    isOpen,
    onClose,
    onReturnProcessed,
}: ReturnPurchaseModalProps) {
    const { t } = useTranslation();
    const { toast } = useToast();

    // Step management
    const [currentStep, setCurrentStep] = useState<ReturnStep>('search');

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchLoading, setSearchLoading] = useState(false);
    const [foundPurchases, setFoundPurchases] = useState<Purchase[]>([]);
    const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(
        null,
    );

    // Return state
    const [returnReason, setReturnReason] = useState('');
    const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
    const [processing, setProcessing] = useState(false);

    // Step configuration
    const stepConfig = useMemo<Record<ReturnStep, StepInfo>>(
        () => ({
            search: {
                title: t('return_purchase.steps.search_title'),
                description: t('return_purchase.steps.search_description'),
            },
            'items-selection': {
                title: t('return_purchase.steps.select_items_title'),
                description: t('return_purchase.steps.select_items_description'),
            },
            confirmation: {
                title: t('return_purchase.steps.confirm_title'),
                description: t('return_purchase.steps.confirm_description'),
            },
        }),
        [t],
    );

    // Memoized calculations
    const returnTotal = useMemo(() => {
        return returnItems.reduce((sum, item) => sum + item.return_total, 0);
    }, [returnItems]);

    const selectedItemsCount = useMemo(() => {
        return returnItems.filter((item) => item.return_quantity > 0).length;
    }, [returnItems]);

    // Reset modal state when opened/closed
    useEffect(() => {
        if (isOpen) {
            resetModal();
        }
    }, [isOpen]);

    // Navigation logic
    const canGoBack = currentStep !== 'search';
    const canContinue = useCallback(() => {
        switch (currentStep) {
            case 'search':
                return false;
            case 'items-selection':
                return selectedItemsCount > 0 && returnReason.trim().length > 0;
            case 'confirmation':
                return false;
            default:
                return false;
        }
    }, [currentStep, selectedItemsCount, returnReason]);

    const handleBack = useCallback(() => {
        switch (currentStep) {
            case 'items-selection':
                setCurrentStep('search');
                setSelectedPurchase(null);
                setReturnItems([]);
                setReturnReason('');
                break;
            case 'confirmation':
                setCurrentStep('items-selection');
                break;
            default:
                setCurrentStep('search');
        }
    }, [currentStep]);

    const resetModal = () => {
        setCurrentStep('search');
        setSearchQuery('');
        setFoundPurchases([]);
        setSelectedPurchase(null);
        setReturnItems([]);
        setReturnReason('');
        setSearchLoading(false);
        setProcessing(false);
    };

    // Search for received purchases
    const searchPurchases = useCallback(async () => {
        if (!searchQuery.trim()) {
            toast({
                title: t('return_purchase.messages.search_required'),
                description: t(
                    'return_purchase.messages.search_required_desc',
                ),
                type: 'error',
            });
            return;
        }

        setSearchLoading(true);
        try {
            // Search for received orders only
            // The backend now properly groups OR conditions, so status filter works correctly
            const response = await purchaseService.getPurchases(
                {
                    search: searchQuery.trim(), // invoiceName - will search both name and ID
                    status: 'receive', // status - only received orders
                },
                1,
                100,
                false
            );

            if (response.success && response.data) {
                if (response.data.length === 0) {
                    toast({
                        title: t('return_purchase.messages.no_orders_found'),
                        description: t(
                            'return_purchase.messages.no_received_orders_found',
                        ),
                        type: 'error',
                    });
                    setFoundPurchases([]);
                } else {
                    setFoundPurchases(response.data);
                }
            } else {
                toast({
                    title: t('return_purchase.messages.search_failed'),
                    description:
                        response.message ||
                        t('return_purchase.messages.search_failed_desc'),
                    type: 'error',
                });
                setFoundPurchases([]);
            }
        } catch (error) {
            console.error('Search error:', error);
            toast({
                title: t('return_purchase.messages.search_error'),
                description: t('return_purchase.messages.search_error_desc'),
                type: 'error',
            });
            setFoundPurchases([]);
        } finally {
            setSearchLoading(false);
        }
    }, [searchQuery, toast, t]);

    // Select a purchase and load its items
    const handleSelectPurchase = useCallback(
        async (purchase: Purchase) => {
            setSearchLoading(true);
            try {
                // Fetch full purchase details including items
                const response = await purchaseService.getPurchase(purchase.id);

                if (response.success && response.data) {
                    setSelectedPurchase(response.data);

                    // Initialize return items
                    const items: ReturnItem[] =
                        response.data.items?.map((item) => ({
                            ...item,
                            return_quantity: 0,
                            return_total: 0,
                        })) || [];

                    setReturnItems(items);
                    setCurrentStep('items-selection');
                } else {
                    toast({
                        title: t('return_purchase.messages.load_failed'),
                        description:
                            response.message ||
                            t('return_purchase.messages.load_failed_desc'),
                        type: 'error',
                    });
                }
            } catch (error) {
                console.error('Load purchase error:', error);
                toast({
                    title: t('return_purchase.messages.error'),
                    description: t('return_purchase.messages.load_error_desc'),
                    type: 'error',
                });
            } finally {
                setSearchLoading(false);
            }
        },
        [toast, t],
    );

    // Update return quantity for items
    const updateReturnQuantity = (itemId: number, quantity: number) => {
        setReturnItems((prev) =>
            prev.map((item) => {
                if (item.id === itemId) {
                    const maxQuantity = item.quantity;
                    const validQuantity = Math.max(
                        0,
                        Math.min(quantity, maxQuantity),
                    );
                    return {
                        ...item,
                        return_quantity: validQuantity,
                        return_total: validQuantity * item.cost_price,
                    };
                }
                return item;
            }),
        );
    };

    // Clear all returns
    const handleClearAllReturns = () => {
        setReturnItems((prev) =>
            prev.map((item) => ({
                ...item,
                return_quantity: 0,
                return_total: 0,
            })),
        );
    };

    // Process return
    const processReturn = async () => {
        if (!selectedPurchase || !returnReason.trim()) {
            toast({
                title: t('return_purchase.messages.reason_required'),
                description: t(
                    'return_purchase.messages.reason_required_desc',
                ),
                type: 'error',
            });
            return;
        }

        const itemsToReturn = returnItems.filter(
            (item) => item.return_quantity > 0,
        );
        if (itemsToReturn.length === 0) {
            toast({
                title: t('return_purchase.messages.no_items_selected'),
                description: t(
                    'return_purchase.messages.no_items_selected_desc',
                ),
                type: 'error',
            });
            return;
        }

        setProcessing(true);
        try {
            const response = await fetch('/api/supplier-returns/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    purchase_id: selectedPurchase.id,
                    return_reason: returnReason.trim(),
                    return_items: itemsToReturn.map((item) => ({
                        item_id: item.id,
                        return_quantity: item.return_quantity,
                    })),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Return processing failed');
            }

            const result = await response.json();

            toast({
                title: t('return_purchase.messages.return_success'),
                description: `${t('return_purchase.messages.return_processed')} ${formatCurrency(result.data.total_amount)}`,
                type: 'success',
            });

            onReturnProcessed?.();
            onClose();
        } catch (error) {
            console.error('Return processing error:', error);
            toast({
                title: t('return_purchase.messages.return_error'),
                description:
                    error instanceof Error
                        ? error.message
                        : t('return_purchase.messages.return_error_desc'),
                type: 'error',
            });
        } finally {
            setProcessing(false);
        }
    };

    // Handle keyboard events
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (!isOpen) return;

            if (event.key === 'Escape') {
                event.preventDefault();
                onClose();
            } else if (event.key === 'Enter' && !event.shiftKey) {
                if (currentStep === 'search' && searchQuery.trim()) {
                    event.preventDefault();
                    searchPurchases();
                }
            }
        },
        [isOpen, onClose, currentStep, searchQuery, searchPurchases],
    );

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, handleKeyDown]);

    // Sub-components
    const PurchaseDetailsCard = ({
        purchase,
    }: {
        purchase: Purchase;
    }) => (
        <Card className="border-cyan-200 dark:border-cyan-700">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm text-cyan-800 dark:text-cyan-200">
                    <FileText className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                    {t('return_purchase.purchase_details')}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex items-center gap-2">
                        <Hash className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">
                            {t('return_purchase.invoice_id')}:
                        </span>
                        <span className="font-mono font-medium">
                            {purchase.invoice_id}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">
                            {t('return_purchase.purchase_date')}:
                        </span>
                        <span>
                            {new Date(
                                purchase.created_at,
                            ).toLocaleDateString()}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">
                            {t('return_purchase.total_amount')}:
                        </span>
                        <span className="font-semibold">
                            {formatCurrency(purchase.total_amount)}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Package className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">
                            {t('return_purchase.items_count')}:
                        </span>
                        <span>{purchase.total_orders}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    const ReturnItemRow = ({
        item,
        onUpdateQuantity,
    }: {
        item: ReturnItem;
        onUpdateQuantity: (id: number, quantity: number) => void;
    }) => (
        <div
            className={`flex min-h-0 flex-col items-start gap-3 border-b border-cyan-200 p-3 transition-all duration-200 last:border-b-0 sm:flex-row sm:items-center sm:p-4 dark:border-cyan-700 ${
                item.return_quantity > 0
                    ? 'border-l-4 border-l-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                    : 'hover:bg-cyan-50/30 dark:hover:bg-cyan-900/10'
            }`}
        >
            <div className="w-full min-w-0 flex-1 sm:w-auto">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                    <div className="text-sm font-medium leading-tight">
                        {item.product_name}
                    </div>
                    {item.return_quantity > 0 && (
                        <Badge
                            variant="default"
                            className="w-fit bg-cyan-500 text-xs text-white dark:bg-cyan-600"
                        >
                            {t('return_purchase.returning')}{' '}
                            {item.return_quantity}
                        </Badge>
                    )}
                </div>
                <div className="mt-1 break-all font-mono text-xs text-muted-foreground">
                    {item.identifier}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                    {formatCurrency(item.cost_price)} {t('return_purchase.each')}{' '}
                    • {item.quantity} {t('return_purchase.received')}
                </div>
            </div>
            <div className="flex w-full flex-shrink-0 items-center justify-between gap-2 sm:w-auto sm:justify-end">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            onUpdateQuantity(item.id, item.return_quantity - 1)
                        }
                        disabled={item.return_quantity <= 0}
                        className="h-8 w-8 flex-shrink-0 p-0 border-cyan-300 bg-cyan-50 text-cyan-700 hover:border-cyan-500 hover:bg-cyan-100 dark:border-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-300 dark:hover:border-cyan-500 dark:hover:bg-cyan-900/30"
                    >
                        <Minus className="h-3 w-3" />
                    </Button>
                    <div className="min-w-[4rem] flex-shrink-0 text-center">
                        <Input
                            type="number"
                            min="0"
                            max={item.quantity}
                            value={item.return_quantity}
                            onChange={(e) => {
                                const newQuantity =
                                    parseFloat(e.target.value) || 0;
                                onUpdateQuantity(item.id, newQuantity);
                            }}
                            className={`h-8 text-center text-sm font-medium ${
                                item.return_quantity > 0
                                    ? 'border-cyan-500 bg-cyan-50 text-cyan-700 dark:border-cyan-400 dark:bg-cyan-900/20 dark:text-cyan-300'
                                    : 'border-cyan-300 bg-cyan-50/50 dark:border-cyan-600 dark:bg-cyan-900/10'
                            }`}
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            onUpdateQuantity(item.id, item.return_quantity + 1)
                        }
                        disabled={item.return_quantity >= item.quantity}
                        className="h-8 w-8 flex-shrink-0 p-0 border-cyan-300 bg-cyan-50 text-cyan-700 hover:border-cyan-500 hover:bg-cyan-100 dark:border-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-300 dark:hover:border-cyan-500 dark:hover:bg-cyan-900/30"
                    >
                        <Plus className="h-3 w-3" />
                    </Button>
                </div>
            </div>
        </div>
    );

    const ReturnSummaryCard = ({
        title,
        itemsCount,
        total,
    }: {
        title: string;
        itemsCount: number;
        total: number;
    }) => (
        <Card
            className={`${itemsCount > 0 ? 'border-cyan-300 bg-cyan-50 dark:border-cyan-600 dark:bg-cyan-900/20' : 'border-cyan-200 bg-cyan-50/30 dark:border-cyan-700 dark:bg-cyan-900/10'} transition-all duration-200`}
        >
            <CardContent className="pt-4">
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <div className="text-lg font-medium">{title}</div>
                        <div className="text-sm text-muted-foreground">
                            {itemsCount > 0
                                ? `${itemsCount} ${t('return_purchase.items_selected')}`
                                : t('return_purchase.no_items_selected')}
                        </div>
                    </div>
                    <div className="w-full text-right sm:w-auto">
                        <div
                            className={`text-2xl font-bold ${itemsCount > 0 ? 'text-cyan-600 dark:text-cyan-400' : 'text-muted-foreground'}`}
                        >
                            {formatCurrency(total)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {itemsCount > 0
                                ? t('return_purchase.return_amount')
                                : t('return_purchase.no_return')}
                        </div>
                    </div>
                </div>
                {itemsCount > 0 && (
                    <div className="mt-3 rounded-lg border border-cyan-200 bg-cyan-50 p-3 dark:border-cyan-800 dark:bg-cyan-900/20">
                        <div className="flex items-center gap-2 text-sm text-cyan-800 dark:text-cyan-200">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="font-medium">
                                {t('return_purchase.ready_to_process')}
                            </span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );

    // Render search step
    const renderSearch = () => (
        <div className="space-y-6">
            <div className="space-y-4">
                <div>
                    <Label htmlFor="searchQuery" className="text-sm font-medium text-cyan-700 dark:text-cyan-300">
                        {t('return_purchase.search_invoice')}
                    </Label>
                    <div className="mt-2 flex gap-2">
                        <Input
                            id="searchQuery"
                            type="text"
                            placeholder={t(
                                'return_purchase.search_placeholder',
                            )}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) =>
                                e.key === 'Enter' && searchPurchases()
                            }
                            className="flex-1 border-cyan-300 bg-cyan-50 hover:border-cyan-500 hover:bg-cyan-100 focus:border-cyan-500 focus:bg-cyan-100 focus:ring-2 focus:ring-cyan-200 dark:border-cyan-600 dark:bg-cyan-900/20 dark:hover:border-cyan-500 dark:hover:bg-cyan-900/30 dark:focus:border-cyan-500 dark:focus:bg-cyan-900/30 dark:focus:ring-2 dark:focus:ring-cyan-400"
                        />
                        <Button
                            onClick={searchPurchases}
                            disabled={searchLoading || !searchQuery.trim()}
                            className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg hover:from-cyan-600 hover:to-cyan-700"
                        >
                            {searchLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Search className="h-4 w-4 text-white" />
                            )}
                        </Button>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {t('return_purchase.search_hint')}
                    </p>
                </div>
            </div>

            {foundPurchases.length > 0 && (
                <Card className="border-cyan-300 bg-cyan-50 dark:border-cyan-600 dark:bg-cyan-900/20">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm text-cyan-800 dark:text-cyan-200">
                            <FileText className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                            {t('return_purchase.found_purchases')}
                            <Badge variant="outline" className="ml-auto">
                                {foundPurchases.length}{' '}
                                {t('return_purchase.found')}
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            {t('return_purchase.select_purchase_desc')}
                        </p>
                        <div className="max-h-60 space-y-2 overflow-y-auto">
                            {foundPurchases.map((purchase) => (
                                <Card
                                    key={purchase.id}
                                    className="cursor-pointer border-2 border-cyan-200 transition-all hover:shadow-sm hover:border-cyan-500 dark:border-cyan-700 dark:hover:border-cyan-500"
                                    onClick={() => handleSelectPurchase(purchase)}
                                >
                                    <CardContent className="p-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-sm font-medium">
                                                        {purchase.invoice_id}
                                                    </span>
                                                    <Badge
                                                        variant="outline"
                                                        className="border-cyan-200 bg-cyan-50 text-xs text-cyan-700 dark:border-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-300"
                                                    >
                                                        {t(
                                                            'return_purchase.received',
                                                        )}
                                                    </Badge>
                                                </div>
                                                <div className="mt-1 text-xs text-muted-foreground">
                                                    {purchase.invoice_name} •{' '}
                                                    {new Date(
                                                        purchase.created_at,
                                                    ).toLocaleDateString()}{' '}
                                                    •{' '}
                                                    {formatCurrency(
                                                        purchase.total_amount,
                                                    )}
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="ml-2"
                                            >
                                                {t('return_purchase.select')}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );

    // Render items selection step
    const renderItemsSelection = () => (
        <div className="space-y-6">
            {selectedPurchase && (
                <PurchaseDetailsCard purchase={selectedPurchase} />
            )}

            {/* Return Actions */}
            <div className="flex gap-2">
                <Button
                    onClick={handleClearAllReturns}
                    variant="outline"
                    size="sm"
                    className="border-cyan-300 bg-cyan-50 text-cyan-700 hover:border-cyan-500 hover:bg-cyan-100 dark:border-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-300 dark:hover:border-cyan-500 dark:hover:bg-cyan-900/30"
                >
                    <AlertCircle className="mr-2 h-4 w-4" />
                    {t('return_purchase.clear_all')}
                </Button>
            </div>

            {/* Items List */}
            <Card className="border-border/50">
                <CardHeader className="pb-3">
                    <CardTitle className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center">
                        <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                            {t('return_purchase.select_items_to_return')}
                        </div>
                        <Badge variant="secondary" className="w-fit sm:ml-auto bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300">
                            {selectedItemsCount} {t('return_purchase.of')}{' '}
                            {returnItems.length} {t('return_purchase.selected')}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="border-t">
                        {returnItems.map((item) => (
                            <ReturnItemRow
                                key={item.id}
                                item={item}
                                onUpdateQuantity={updateReturnQuantity}
                            />
                        ))}
                        {returnItems.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground">
                                {t('return_purchase.no_items_available')}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Return Reason */}
            <div className="space-y-2">
                <Label htmlFor="return-reason" className="text-sm font-medium text-cyan-700 dark:text-cyan-300">
                    {t('return_purchase.return_reason')} *
                </Label>
                <Textarea
                    id="return-reason"
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    placeholder={t('return_purchase.return_reason_placeholder')}
                    rows={3}
                    className="resize-none border-cyan-300 bg-cyan-50 hover:border-cyan-500 hover:bg-cyan-100 focus:border-cyan-500 focus:bg-cyan-100 focus:ring-2 focus:ring-cyan-200 dark:border-cyan-600 dark:bg-cyan-900/20 dark:hover:border-cyan-500 dark:hover:bg-cyan-900/30 dark:focus:border-cyan-500 dark:focus:bg-cyan-900/30 dark:focus:ring-2 dark:focus:ring-cyan-400"
                />
            </div>

            {/* Return Summary */}
            <ReturnSummaryCard
                title={t('return_purchase.return_summary')}
                itemsCount={selectedItemsCount}
                total={returnTotal}
            />
        </div>
    );

    // Render confirmation step
    const renderConfirmation = () => (
        <div className="space-y-6">
            <div className="text-center">
                <AlertCircle className="mx-auto mb-4 h-12 w-12 text-cyan-500" />
                <h3 className="text-lg font-medium text-foreground">
                    {t('return_purchase.confirm_return')}
                </h3>
                <p className="text-muted-foreground">
                    {t('return_purchase.confirm_return_desc')}
                </p>
            </div>

            <Card className="border-cyan-200 dark:border-cyan-700">
                <CardHeader>
                    <CardTitle className="text-cyan-800 dark:text-cyan-200">
                        {t('return_purchase.return_details')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-medium">
                                    {t('return_purchase.invoice_id')}:
                                </span>
                                <span className="ml-2">
                                    {selectedPurchase?.invoice_id}
                                </span>
                            </div>
                            <div>
                                <span className="font-medium">
                                    {t('return_purchase.return_reason')}:
                                </span>
                                <span className="ml-2">{returnReason}</span>
                            </div>
                            <div>
                                <span className="font-medium">
                                    {t('return_purchase.total_return_amount')}:
                                </span>
                                <span className="ml-2 font-bold text-cyan-600 dark:text-cyan-400">
                                    {formatCurrency(returnTotal)}
                                </span>
                            </div>
                        </div>

                        <div>
                            <h4 className="mb-2 font-medium">
                                {t('return_purchase.items_to_return')}
                            </h4>
                            <div className="space-y-2">
                                {returnItems
                                    .filter((item) => item.return_quantity > 0)
                                    .map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between rounded bg-cyan-50 p-2 dark:bg-cyan-900/20"
                                        >
                                            <div>
                                                <span className="font-medium">
                                                    {item.product_name}
                                                </span>
                                                <span className="ml-2 text-sm text-muted-foreground">
                                                    ({item.return_quantity}{' '}
                                                    {t('return_purchase.qty')})
                                                </span>
                                            </div>
                                            <span className="font-medium">
                                                {formatCurrency(
                                                    item.return_total,
                                                )}
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    // Get step content
    const getStepContent = () => {
        switch (currentStep) {
            case 'search':
                return renderSearch();
            case 'items-selection':
                return renderItemsSelection();
            case 'confirmation':
                return renderConfirmation();
            default:
                return null;
        }
    };

    const stepInfo = stepConfig[currentStep] || {
        title: t('return_purchase.process_return'),
        description: t('return_purchase.process_return_desc'),
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="flex max-h-[90vh] flex-col overflow-hidden p-0 border-cyan-200 shadow-[0_4px_8px_0_rgba(0,0,0,0.2),0_2px_4px_0_rgba(0,0,0,0.1)] dark:border-cyan-800 dark:shadow-[0_4px_8px_0_rgba(0,0,0,0.4),0_2px_4px_0_rgba(0,0,0,0.3)]"
                style={{
                    zIndex: 9999,
                    maxWidth: '60vw',
                    width: '800px',
                }}
                hideClose
            >
                <DialogHeader className="shrink-0 border-b border-cyan-200 bg-gradient-to-r from-cyan-50 to-cyan-100 px-4 py-4 dark:border-cyan-800 dark:from-cyan-900/20 dark:to-cyan-900/30">
                    <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-cyan-800 dark:text-cyan-200">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-lg">
                            <RotateCcw className="h-4 w-4 text-white" />
                        </div>
                        {stepInfo.title}
                    </DialogTitle>
                </DialogHeader>

                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
                    {getStepContent()}
                </div>

                <div className="shrink-0 border-t border-cyan-200 bg-cyan-50/30 px-4 py-4 dark:border-cyan-800 dark:bg-cyan-900/10">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row">
                        <div className="order-2 flex gap-2 sm:order-1">
                            {canGoBack && (
                                <Button
                                    variant="outline"
                                    onClick={handleBack}
                                    className="flex-1 border-cyan-300 bg-cyan-50 text-cyan-700 hover:border-cyan-500 hover:bg-cyan-100 hover:text-cyan-800 focus:border-cyan-500 focus:bg-cyan-100 focus:ring-2 focus:ring-cyan-200 focus:outline-none dark:border-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-300 dark:hover:border-cyan-500 dark:hover:bg-cyan-900/30 dark:hover:text-cyan-200 dark:focus:border-cyan-500 dark:focus:bg-cyan-900/30 dark:focus:ring-2 dark:focus:ring-cyan-400 sm:flex-none"
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    {t('return_purchase.back')}
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                onClick={onClose}
                                className="flex-1 border-cyan-300 bg-cyan-50 text-cyan-700 hover:border-cyan-500 hover:bg-cyan-100 hover:text-cyan-800 focus:border-cyan-500 focus:bg-cyan-100 focus:ring-2 focus:ring-cyan-200 focus:outline-none dark:border-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-300 dark:hover:border-cyan-500 dark:hover:bg-cyan-900/30 dark:hover:text-cyan-200 dark:focus:border-cyan-500 dark:focus:bg-cyan-900/30 dark:focus:ring-2 dark:focus:ring-cyan-400 sm:flex-none"
                            >
                                {t('return_purchase.cancel')}
                            </Button>
                        </div>

                        <div className="order-1 sm:order-2">
                            {currentStep === 'items-selection' && (
                                <Button
                                    onClick={() => setCurrentStep('confirmation')}
                                    disabled={!canContinue()}
                                    className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg hover:from-cyan-600 hover:to-cyan-700 focus:ring-2 focus:ring-cyan-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed dark:from-cyan-600 dark:to-cyan-700 dark:hover:from-cyan-700 dark:hover:to-cyan-800 dark:focus:ring-2 dark:focus:ring-cyan-400 sm:min-w-[140px]"
                                    size="lg"
                                >
                                    {t('return_purchase.continue')}
                                </Button>
                            )}
                            {currentStep === 'confirmation' && (
                                <Button
                                    onClick={processReturn}
                                    disabled={processing}
                                    className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg hover:from-cyan-600 hover:to-cyan-700 focus:ring-2 focus:ring-cyan-200 focus:outline-none disabled:opacity-50 dark:from-cyan-600 dark:to-cyan-700 dark:hover:from-cyan-700 dark:hover:to-cyan-800 dark:focus:ring-2 dark:focus:ring-cyan-400 sm:min-w-[140px]"
                                    size="lg"
                                >
                                    {processing ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <RotateCcw className="mr-2 h-4 w-4" />
                                    )}
                                    <span className="hidden sm:inline">
                                        {processing
                                            ? t('return_purchase.processing')
                                            : `${t('return_purchase.process_return')} (${formatCurrency(returnTotal)})`}
                                    </span>
                                    <span className="sm:hidden">
                                        {processing
                                            ? t('return_purchase.processing')
                                            : t('return_purchase.process_return')}
                                    </span>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default ReturnPurchaseModal;
