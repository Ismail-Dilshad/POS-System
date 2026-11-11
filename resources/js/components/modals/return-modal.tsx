import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useTranslation } from '@/hooks/use-translation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { formatCurrency } from '@/lib/currency';
import { formatDatePart } from '@/lib/datetime';
import { returnService, type ReturnData } from '@/services/business/returnService';
import {
    transactionService,
    type Transaction,
    type TransactionItem,
} from '@/services/business/transactionService';
import { usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Clock,
    CreditCard,
    DollarSign,
    Hash,
    Info,
    Loader2,
    Minus,
    Package,
    Plus,
    Receipt,
    RotateCcw,
    Search,
    User,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface ReturnModalProps {
    isOpen: boolean;
    onClose: () => void;
    onReturnProcessed?: (result?: { transaction_deleted?: boolean; original_transaction_id?: number }) => void;
}

interface ReturnItem {
    id: string;
    name: string;
    barcode: string;
    original_quantity: number;
    return_quantity: number;
    price: number;
    total: number;
    product_id?: number;
}

interface ManualReturnItem {
    id: string;
    name: string;
    barcode: string;
    price: number;
    quantity: number;
    total: number;
    max_available: number; // Maximum quantity available from transaction history
    product_id?: number;
}

type ReturnStep =
    | 'method'
    | 'receipt-search'
    | 'receipt-items'
    | 'manual-items';

type ReturnMethod = 'receipt' | 'manual' | null;

interface StepInfo {
    title: string;
    description: string;
}

function ReturnModal({ isOpen, onClose, onReturnProcessed }: ReturnModalProps) {
    const { t } = useTranslation();
    const { toast } = useToast();
    const page = usePage();
    const { auth } = page.props as { auth: { user: { id: number } } };

    // Step management
    const [currentStep, setCurrentStep] = useState<ReturnStep>('method');
    const [returnMethod, setReturnMethod] = useState<ReturnMethod>(null);

    // Found transactions state for barcode search
    const [foundTransactions, setFoundTransactions] = useState<Transaction[]>(
        [],
    );
    const [showTransactionSelection, setShowTransactionSelection] =
        useState(false);

    // Receipt-based return state
    const [receiptId, setReceiptId] = useState('');
    const [searchLoading, setSearchLoading] = useState(false);
    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);

    // Manual return state
    const [barcodeSearch, setBarcodeSearch] = useState('');
    const [barcodesList, setBarcodesList] = useState<string[]>([]);
    const [searchingTransactions, setSearchingTransactions] = useState(false);
    const [manualReturnItems, setManualReturnItems] = useState<
        ManualReturnItem[]
    >([]);
    const [searchResults, setSearchResults] = useState<
        Array<{
            product_id: number;
            product_name: string;
            product_barcode: string;
            category_name: string;
            supplier_name: string;
            sell_price: number;
            total_sold: number;
            total_returned: number;
            max_available: number;
            transaction_history: Array<{
                transaction_number: string;
                transaction_date: string;
                quantity: number;
                total: number;
            }>;
        }>
    >([]);

    // Processing state
    const [processing, setProcessing] = useState(false);

    // Validation functions
    const validateReturnData = useCallback(
        (
            data: ReturnData,
        ): { isValid: boolean; errors: Record<string, string> } => {
            const errors: Record<string, string> = {};

            // Validate items array
            if (!data.items || data.items.length === 0) {
                errors.items = t('return_modal.validation.at_least_one_item_required');
                return { isValid: false, errors };
            }

            // Validate each item
            data.items.forEach((item, index) => {
                const itemKey = `item_${index}`;

                // Validate return quantity
                if (!item.return_quantity || item.return_quantity <= 0) {
                    errors[`${itemKey}_quantity`] =
                        'Return quantity must be greater than 0';
                }

                // Validate original price
                if (!item.original_price || item.original_price <= 0) {
                    errors[`${itemKey}_price`] =
                        'Original price must be greater than 0';
                }

                // Validate return total
                if (!item.return_total || item.return_total <= 0) {
                    errors[`${itemKey}_total`] =
                        'Return total must be greater than 0';
                }

                // Validate product ID
                if (!item.product_id) {
                    errors[`${itemKey}_product`] = t('return_modal.validation.product_id_required');
                }
            });

            // Check for duplicate returns (same product, same quantity within 24 hours)
            data.items.reduce(
                (acc, item) => {
                    const key = `${item.product_id}_${item.return_quantity}`;
                    if (acc[key]) {
                        errors.duplicate =
                            t('return_modal.validation.duplicate_return_detected');
                    }
                    acc[key] = true;
                    return acc;
                },
                {} as Record<string, boolean>,
            );

            return { isValid: Object.keys(errors).length === 0, errors };
        },
        [t],
    );

    const validateReceiptId = useCallback(
        (receiptId: string): string | null => {
            if (!receiptId.trim()) {
                return t('return_modal.validation.receipt_id_or_barcode_required');
            }

            // Check format (allow both transaction numbers and barcodes)
            if (!/^[A-Za-z0-9]{3,50}$/.test(receiptId.trim())) {
                return 'Must be 3-50 alphanumeric characters (transaction number or barcode)';
            }

            return null;
        },
        [t],
    );

    const validateBarcode = useCallback((barcode: string): string | null => {
        if (!barcode.trim()) {
            return t('return_modal.validation.barcode_required');
        }

        // Check format (should be alphanumeric, 3-50 characters)
        if (!/^[A-Za-z0-9]{3,50}$/.test(barcode.trim())) {
            return 'Barcode must be 3-50 alphanumeric characters';
        }

        return null;
    }, [t]);

    const sanitizeInput = useCallback((input: string): string => {
        return input.trim().replace(/[<>]/g, ''); // Basic XSS prevention
    }, []);

    // Debounced search for performance optimization

    // Memoized calculations for performance
    const returnTotal = useMemo(() => {
        return returnMethod === 'receipt'
            ? returnItems.reduce((sum, item) => sum + item.total, 0)
            : manualReturnItems.reduce((sum, item) => sum + item.total, 0);
    }, [returnMethod, returnItems, manualReturnItems]);

    const selectedItemsCount = useMemo(() => {
        return returnMethod === 'receipt'
            ? returnItems.filter((item) => item.return_quantity > 0).length
            : manualReturnItems.length;
    }, [returnMethod, returnItems, manualReturnItems]);

    // Step configuration
    const stepConfig = useMemo<Record<ReturnStep, StepInfo>>(
        () => ({
            method: {
                title: t('return_modal.steps.return_method'),
                description: t('return_modal.steps.return_method_desc'),
            },
            'receipt-search': {
                title: t('return_modal.steps.find_transaction'),
                description: t('return_modal.steps.find_transaction_desc'),
            },
            'receipt-items': {
                title: t('return_modal.steps.select_items'),
                description: t('return_modal.steps.select_items_desc'),
            },
            'manual-items': {
                title: t('return_modal.steps.manual_return'),
                description: t('return_modal.steps.manual_return_desc'),
            },
        }),
        [t],
    );

    // Reset modal state when opened/closed
    useEffect(() => {
        if (isOpen) {
            resetModal();
        }
    }, [isOpen]);

    // Navigation logic
    const canGoBack = currentStep !== 'method';
    const canContinue = useCallback(() => {
        switch (currentStep) {
            case 'method':
                return returnMethod !== null;
            case 'receipt-search':
                return false;
            case 'receipt-items':
                return selectedItemsCount > 0;
            case 'manual-items':
                return manualReturnItems.length > 0;
            default:
                return false;
        }
    }, [
        currentStep,
        returnMethod,
        selectedItemsCount,
        manualReturnItems.length,
    ]);

    const handleContinue = useCallback(() => {
        if (currentStep === 'method') {
            if (returnMethod === 'receipt') {
                setCurrentStep('receipt-search');
            } else if (returnMethod === 'manual') {
                setCurrentStep('manual-items');
            }
        }
    }, [currentStep, returnMethod]);

    const handleBack = useCallback(() => {
        switch (currentStep) {
            case 'receipt-search':
                setCurrentStep('method');
                setReturnMethod(null);
                break;
            case 'receipt-items':
                setCurrentStep('receipt-search');
                setTransaction(null);
                setReturnItems([]);
                break;
            case 'manual-items':
                setCurrentStep('method');
                setReturnMethod(null);
                setManualReturnItems([]);
                setSearchResults([]);
                setBarcodesList([]);
                break;
            default:
                setCurrentStep('method');
        }
    }, [currentStep]);

    const resetModal = () => {
        setCurrentStep('method');
        setReturnMethod(null);
        setReceiptId('');
        setTransaction(null);
        setReturnItems([]);
        setBarcodeSearch('');
        setBarcodesList([]);
        setSearchResults([]);
        setManualReturnItems([]);
        setSearchLoading(false);
        setSearchingTransactions(false);
        setProcessing(false);
    };

    // Helper function to process found transaction
    const processFoundTransaction = useCallback((txn: Transaction) => {
        setTransaction(txn);

        // Initialize return items from transaction items (include scale products)
        const items: ReturnItem[] =
            txn.items
                ?.filter((item: TransactionItem) => {
                    // Include regular products and scale products, exclude cards
                    return (
                        (item.product_id || item.scale_product_id) &&
                        !item.card_id
                    );
                })
                .map((item: TransactionItem, index: number) => ({
                    id:
                        item.product_id?.toString() ||
                        item.scale_product_id?.toString() ||
                        `item-${index}`,
                    name: item.name,
                    barcode: item.barcode,
                    original_quantity: item.quantity || 1,
                    return_quantity: 0,
                    price: item.price,
                    total: 0,
                    product_id: item.product_id || item.scale_product_id,
                })) || [];

        setReturnItems(items);
        setCurrentStep('receipt-items');
    }, []);

    // Search by barcode to find transactions containing that product
    const searchByBarcode = useCallback(
        async (barcode: string) => {
            try {
                const historyResponse =
                    await transactionService.searchTransactionHistory(barcode);
                if (
                    historyResponse.success &&
                    historyResponse.data?.transactions &&
                    historyResponse.data.transactions.length > 0
                ) {
                    // Found transactions with this barcode - sort by most recent first
                    const transactions = historyResponse.data.transactions.sort(
                        (a, b) =>
                            new Date(b.date).getTime() -
                            new Date(a.date).getTime(),
                    );

                    if (transactions.length === 1) {
                        // Only one transaction found, get full transaction details
                        const txnResponse =
                            await transactionService.getByTransactionNumber(
                                transactions[0].transaction_number,
                            );
                        if (txnResponse.success && txnResponse.data) {
                            processFoundTransaction(txnResponse.data);
                            return;
                        }
                    }

                    // Multiple transactions found, show selection with most recent first
                    setFoundTransactions(
                        transactions.map(
                            (t) =>
                                ({
                                    id: t.id,
                                    transaction_number: t.transaction_number,
                                    created_at: t.date,
                                    total_amount: t.total,
                                    items: [
                                        {
                                            name:
                                                historyResponse.data?.name ||
                                                '',
                                            barcode: barcode,
                                            quantity: t.quantity,
                                            price: t.price,
                                            total: t.total,
                                            product_id: undefined,
                                            is_scale_product: false,
                                        },
                                    ],
                                }) as Transaction,
                        ),
                    );
                    setShowTransactionSelection(true);
                } else {
                    toast({
                        title: t('return_modal.messages.not_found'),
                        description:
                            t('return_modal.messages.no_transaction_found'),
                        type: 'error',
                    });
                }
            } catch {
                toast({
                    title: t('return_modal.messages.search_failed'),
                    description: t('return_modal.messages.search_failed_desc'),
                    type: 'error',
                });
            }
        },
        [toast, processFoundTransaction, t],
    );

    // Search transaction by receipt ID
    const searchTransaction = useCallback(async () => {
        // Validate receipt ID/barcode
        const receiptError = validateReceiptId(receiptId);
        if (receiptError) {
            toast({
                title: t('return_modal.messages.invalid_input'),
                description: receiptError,
                type: 'error',
            });
            return;
        }

        const sanitizedReceiptId = sanitizeInput(receiptId);
        if (!sanitizedReceiptId) {
            toast({
                title: t('return_modal.messages.error'),
                description:
                    t('return_modal.messages.please_enter_valid_transaction'),
                type: 'error',
            });
            return;
        }

        setSearchLoading(true);
        try {
            // First, try to search by transaction number
            const response = await transactionService.getByTransactionNumber(
                receiptId.trim(),
            );
            if (response.success && response.data) {
                const txn = response.data;

                // Check if transaction is eligible for return
                if (txn.status !== 'completed') {
                    toast({
                        title: t('return_modal.messages.invalid_transaction'),
                        description:
                            t('return_modal.messages.only_completed_transactions'),
                        type: 'error',
                    });
                    return;
                }

                // Check if transaction is too old (30 days)
                const transactionDate = new Date(txn.created_at);
                const daysDiff = Math.floor(
                    (Date.now() - transactionDate.getTime()) /
                        (1000 * 60 * 60 * 24),
                );
                if (daysDiff > 30) {
                    toast({
                        title: t('return_modal.messages.return_period_expired'),
                        description:
                            'Returns are only allowed within 30 days of purchase',
                        type: 'error',
                    });
                    return;
                }

                // Process the found transaction
                processFoundTransaction(txn);
            } else {
                // Not found by transaction number, try searching by barcode
                await searchByBarcode(receiptId.trim());
            }
        } catch (error) {
            // If transaction search fails, try barcode search
            try {
                await searchByBarcode(receiptId.trim());
            } catch {
                const errorMessage =
                    error instanceof Error &&
                    'response' in error &&
                    error.response
                        ? (error.response as { data?: { message?: string } })
                              .data?.message || t('return_modal.messages.failed_to_search')
                        : t('return_modal.messages.failed_to_search_for_transaction');
                toast({
                    title: t('return_modal.messages.search_failed'),
                    description: errorMessage,
                    type: 'error',
                });
            }
        } finally {
            setSearchLoading(false);
        }
    }, [
        receiptId,
        toast,
        validateReceiptId,
        sanitizeInput,
        processFoundTransaction,
        searchByBarcode,
        t,
    ]);

    // Select a specific transaction from the found list
    const selectTransaction = useCallback(
        async (transactionNumber: string) => {
            try {
                const txnResponse =
                    await transactionService.getByTransactionNumber(
                        transactionNumber,
                    );
                if (txnResponse.success && txnResponse.data) {
                    processFoundTransaction(txnResponse.data);
                    setShowTransactionSelection(false);
                    setFoundTransactions([]);
                }
            } catch {
                toast({
                    title: t('return_modal.messages.error'),
                    description: t('return_modal.messages.failed_to_load_transaction_details'),
                    type: 'error',
                });
            }
        },
        [processFoundTransaction, toast, t],
    );

    // Update return quantity for receipt items
    const updateReturnQuantity = (itemId: string, quantity: number) => {
        setReturnItems((prev) =>
            prev.map((item) => {
                if (item.id === itemId) {
                    const maxQuantity = item.original_quantity;
                    const validQuantity = Math.max(
                        0,
                        Math.min(quantity, maxQuantity),
                    );
                    return {
                        ...item,
                        return_quantity: validQuantity,
                        total: validQuantity * item.price,
                    };
                }
                return item;
            }),
        );
    };

    // Parse multiple barcodes from input (supports space, comma, or newline separated)
    const parseMultipleBarcodes = useCallback((input: string): string[] => {
        return input
            .split(/[\s,\n]+/)
            .map((barcode) => barcode.trim())
            .filter((barcode) => barcode.length > 0);
    }, []);

    // Add barcode to search list
    const addBarcodeToList = useCallback(() => {
        if (!barcodeSearch.trim()) return;

        const newBarcodes = parseMultipleBarcodes(barcodeSearch);
        const uniqueBarcodes = [...new Set([...barcodesList, ...newBarcodes])];

        setBarcodesList(uniqueBarcodes);
        setBarcodeSearch('');
    }, [barcodeSearch, barcodesList, parseMultipleBarcodes]);

    // Remove barcode from list
    const removeBarcodeFromList = (barcode: string) => {
        setBarcodesList((prev) => prev.filter((b) => b !== barcode));
    };

    // Search transaction history for single barcode with recent transaction priority
    const searchSingleBarcode = useCallback(async (barcode: string) => {
        try {
            const results = await returnService.searchTransactionHistory([
                barcode,
            ]);
            if (results.length > 0) {
                const result = results[0];
                // Sort transaction history by most recent first for return priority
                if (
                    result.transaction_history &&
                    result.transaction_history.length > 0
                ) {
                    result.transaction_history.sort(
                        (a, b) =>
                            new Date(b.transaction_date).getTime() -
                            new Date(a.transaction_date).getTime(),
                    );
                }
                return result;
            }
            return null;
        } catch {
            return null;
        }
    }, []);

    // Search transaction history for products by barcode(s)
    const searchTransactionHistory = useCallback(async () => {
        // If there's input in the search box, add it first
        if (barcodeSearch.trim()) {
            // Validate barcode before adding
            const barcodeError = validateBarcode(barcodeSearch);
            if (barcodeError) {
                toast({
                    title: t('return_modal.messages.invalid_barcode'),
                    description: barcodeError,
                    type: 'error',
                });
                return;
            }
            addBarcodeToList();
        }

        if (barcodesList.length === 0 && !barcodeSearch.trim()) {
            toast({
                title: t('return_modal.messages.no_barcodes'),
                description: 'Please enter at least one barcode to search.',
                type: 'error',
            });
            return;
        }

        setSearchingTransactions(true);
        setSearchResults([]);

        try {
            const barcodesToSearch = barcodeSearch.trim()
                ? [...barcodesList, ...parseMultipleBarcodes(barcodeSearch)]
                : barcodesList;

            const results = [];
            let foundCount = 0;
            let errorCount = 0;

            for (const barcode of barcodesToSearch) {
                const result = await searchSingleBarcode(barcode);
                if (result) {
                    results.push(result);
                    foundCount++;
                } else {
                    errorCount++;
                }
            }

            setSearchResults(results);

            if (foundCount > 0) {
                toast({
                    title: t('return_modal.messages.search_complete'),
                    description: `Found ${foundCount} products with transaction history${errorCount > 0 ? `, ${errorCount} not found` : ''}`,
                    type: 'success',
                });
            } else {
                toast({
                    title: t('return_modal.messages.no_results'),
                    description: t('return_modal.messages.no_history_found'),
                    type: 'error',
                });
            }

            // Clear search input after processing
            setBarcodeSearch('');
        } catch {
            toast({
                title: t('return_modal.messages.search_failed'),
                description: t('return_modal.messages.search_history_failed'),
                type: 'error',
            });
        } finally {
            setSearchingTransactions(false);
        }
    }, [
        barcodeSearch,
        barcodesList,
        validateBarcode,
        addBarcodeToList,
        parseMultipleBarcodes,
        searchSingleBarcode,
        toast,
        t,
    ]);

    // Add product from search results to return
    const addResultItemToReturn = (
        resultItem: (typeof searchResults)[0],
        quantity: number,
    ) => {
        if (!resultItem || quantity <= 0) return;

        // Check if this barcode already exists in return items
        const existingIndex = manualReturnItems.findIndex(
            (item) => item.barcode === resultItem.product_barcode,
        );

        if (existingIndex >= 0) {
            // Update existing item quantity (check max available)
            const existingItem = manualReturnItems[existingIndex];
            const newQuantity = existingItem.quantity + quantity;

            if (newQuantity > existingItem.max_available) {
                toast({
                    title: t('return_modal.messages.quantity_limit_exceeded'),
                    description: `Cannot return ${newQuantity} items. Only ${existingItem.max_available} available from transaction history.`,
                    type: 'error',
                });
                return;
            }

            setManualReturnItems((prev) =>
                prev.map((item, index) => {
                    if (index === existingIndex) {
                        return {
                            ...item,
                            quantity: newQuantity,
                            total: item.price * newQuantity,
                        };
                    }
                    return item;
                }),
            );
        } else {
            // Add new item
            const newItem: ManualReturnItem = {
                id: `manual-${Date.now()}-${resultItem.product_barcode}`,
                name: resultItem.product_name,
                barcode: resultItem.product_barcode,
                price: resultItem.sell_price,
                quantity: quantity,
                total: resultItem.sell_price * quantity,
                max_available: resultItem.max_available,
                product_id: resultItem.product_id,
            };

            setManualReturnItems((prev) => [...prev, newItem]);
        }

        toast({
            title: t('return_modal.messages.item_added_to_return'),
            description: `${resultItem.product_name} (Qty: ${quantity}) - ${formatCurrency(resultItem.sell_price * quantity)}`,
            type: 'success',
        });
    };

    // Update manual item quantity
    const updateManualItemQuantity = (index: number, quantity: number) => {
        setManualReturnItems((prev) =>
            prev.map((item, i) => {
                if (i === index) {
                    const validQuantity = Math.max(
                        1,
                        Math.min(quantity, item.max_available),
                    );
                    return {
                        ...item,
                        quantity: validQuantity,
                        total: validQuantity * item.price,
                    };
                }
                return item;
            }),
        );
    };

    // Remove manual item
    const removeManualItem = (index: number) => {
        setManualReturnItems((prev) => prev.filter((_, i) => i !== index));
    };

    // Handle keyboard events
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (!isOpen) return;

            if (event.key === 'Escape') {
                event.preventDefault();
                onClose();
            } else if (event.key === 'Enter') {
                // Handle Enter key based on current step
                if (currentStep === 'method' && canContinue()) {
                    event.preventDefault();
                    handleContinue();
                } else if (
                    currentStep === 'receipt-search' &&
                    receiptId.trim()
                ) {
                    event.preventDefault();
                    searchTransaction();
                } else if (
                    currentStep === 'manual-items' &&
                    barcodeSearch.trim()
                ) {
                    event.preventDefault();
                    searchTransactionHistory();
                }
            }
        },
        [
            isOpen,
            onClose,
            currentStep,
            canContinue,
            handleContinue,
            receiptId,
            searchTransaction,
            barcodeSearch,
            searchTransactionHistory,
        ],
    );

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, handleKeyDown]);

    // Sub-components for better organization
    const TransactionDetailsCard = ({
        transaction,
    }: {
        transaction: Transaction;
    }) => (
        <Card className="border-border/50">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                    <Receipt className="h-4 w-4 text-cyan-700 dark:text-cyan-300" />
                    {t('return_modal.transaction_details.title')}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex items-center gap-2">
                        <Hash className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">
                            {t('return_modal.transaction_details.labels.receipt')}
                        </span>
                        <span className="font-mono font-medium break-all">
                            {transaction.transaction_number}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">
                            {t('return_modal.transaction_details.labels.date')}
                        </span>
                        <span>
                            {formatDatePart(
                                transaction.created_at,
                                t('return_modal.unknown'),
                            )}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">
                            {t('return_modal.transaction_details.labels.cashier')}
                        </span>
                        <span className="truncate">
                            {transaction.user?.full_name || t('return_modal.unknown')}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">
                            {t('return_modal.transaction_details.labels.total')}
                        </span>
                        <span className="font-semibold">
                            {formatCurrency(transaction.total_amount)}
                        </span>
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
        onUpdateQuantity: (id: string, quantity: number) => void;
    }) => (
        <div
            className={`flex min-h-0 flex-col items-start gap-3 border-b border-border/30 p-3 transition-all duration-200 last:border-b-0 sm:flex-row sm:items-center sm:p-4 ${
                item.return_quantity > 0
                    ? 'border-l-4 border-l-cyan-700 dark:border-l-cyan-300 bg-cyan-50 dark:bg-cyan-300/20'
                    : 'hover:bg-muted/30'
            }`}
        >
            <div className="w-full min-w-0 flex-1 sm:w-auto">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                    <div className="text-sm leading-tight font-medium">
                        {item.name}
                    </div>
                    {item.return_quantity > 0 && (
                        <Badge
                            variant="default"
                            className="w-fit bg-cyan-300 dark:bg-cyan-300 text-xs text-black"
                        >
                            {t('return_purchase.returning')} {item.return_quantity}
                        </Badge>
                    )}
                </div>
                <div className="mt-1 font-mono text-xs break-all text-muted-foreground">
                    {item.barcode}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                    {formatCurrency(item.price)} each • {item.original_quantity}{' '}
                    purchased
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
                        className="h-8 w-8 flex-shrink-0 p-0"
                    >
                        <Minus className="h-3 w-3" />
                    </Button>
                    <div className="min-w-[4rem] flex-shrink-0 text-center">
                        <Input
                            type="number"
                            min="0"
                            max={item.original_quantity}
                            value={item.return_quantity}
                            onChange={(e) => {
                                const newQuantity =
                                    parseInt(e.target.value) || 0;
                                onUpdateQuantity(item.id, newQuantity);
                            }}
                            className={`h-8 text-center text-sm font-medium ${
                                item.return_quantity > 0
                                    ? 'border-cyan-700 dark:border-cyan-300 text-cyan-700 dark:text-cyan-300'
                                    : ''
                            }`}
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            onUpdateQuantity(item.id, item.return_quantity + 1)
                        }
                        disabled={
                            item.return_quantity >= item.original_quantity
                        }
                        className="h-8 w-8 flex-shrink-0 p-0"
                    >
                        <Plus className="h-3 w-3" />
                    </Button>
                </div>
            </div>
        </div>
    );

    const ManualItemRow = ({
        item,
        index,
        onUpdateQuantity,
        onRemove,
    }: {
        item: ManualReturnItem;
        index: number;
        onUpdateQuantity: (index: number, quantity: number) => void;
        onRemove: (index: number) => void;
    }) => (
        <div className="flex min-h-0 flex-col items-start gap-3 border-b border-border/30 p-3 last:border-b-0 sm:flex-row sm:items-center sm:p-4">
            <div className="w-full min-w-0 flex-1 sm:w-auto">
                <div className="flex items-center gap-2">
                    <div className="text-sm leading-tight font-medium">
                        {item.name}
                    </div>
                    {item.quantity >= item.max_available && (
                        <Badge
                            variant="outline"
                            className="border-amber-300 bg-amber-50 text-xs text-amber-700"
                        >
                            Max Reached
                        </Badge>
                    )}
                </div>
                <div className="mt-1 font-mono text-xs break-all text-muted-foreground">
                    {item.barcode}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                    {formatCurrency(item.price)} each • Available:{' '}
                    {item.max_available}
                </div>
            </div>

            <div className="flex w-full flex-shrink-0 items-center justify-between gap-2 sm:w-auto">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            onUpdateQuantity(index, item.quantity - 1)
                        }
                        disabled={item.quantity <= 1}
                        className="h-8 w-8 flex-shrink-0 p-0"
                    >
                        <Minus className="h-3 w-3" />
                    </Button>
                    <div className="min-w-[4rem] flex-shrink-0 text-center">
                        <Input
                            type="number"
                            min="1"
                            max={item.max_available}
                            value={item.quantity}
                            onChange={(e) => {
                                const newQuantity =
                                    parseInt(e.target.value) || 1;
                                onUpdateQuantity(index, newQuantity);
                            }}
                            className="h-8 text-center text-sm font-medium"
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            onUpdateQuantity(index, item.quantity + 1)
                        }
                        disabled={item.quantity >= item.max_available}
                        className="h-8 w-8 flex-shrink-0 p-0"
                    >
                        <Plus className="h-3 w-3" />
                    </Button>
                </div>

                <div className="min-w-[4rem] flex-shrink-0 text-right">
                    <div className="text-sm leading-tight font-medium">
                        {formatCurrency(item.total || 0)}
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(index)}
                    className="h-8 w-8 flex-shrink-0 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                    <X className="h-3 w-3" />
                </Button>
            </div>
        </div>
    );

    const ReturnSummaryCard = ({
        title,
        itemsCount,
        total,
        type = 'refund',
    }: {
        title: string;
        itemsCount: number;
        total: number;
        type?: 'refund' | 'credit';
    }) => (
        <Card
            className={`${itemsCount > 0 ? 'border-cyan-300 bg-cyan-50 dark:border-cyan-300 dark:bg-cyan-300/20' : 'border-border/50 bg-muted/20'} transition-all duration-200`}
        >
            <CardContent className="pt-4">
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <div className="text-lg font-medium">{title}</div>
                        <div className="text-sm text-muted-foreground">
                            {itemsCount > 0
                                ? `${itemsCount} item(s) selected for return`
                                : t('return_modal.no_items_selected')}
                        </div>
                    </div>
                    <div className="w-full text-right sm:w-auto">
                        <div
                            className={`text-2xl font-bold ${itemsCount > 0 ? 'text-cyan-700 dark:text-cyan-300' : 'text-muted-foreground'}`}
                        >
                            {formatCurrency(total)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {itemsCount > 0
                                ? type === 'refund'
                                    ? t('return_modal.refund_amount')
                                    : t('return_modal.return_amount')
                                : t('return_modal.no_refund')}
                        </div>
                    </div>
                </div>
                {itemsCount > 0 && (
                    <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
                        <div className="flex items-center gap-2 text-sm text-green-800 dark:text-green-200">
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

    // Process return - actual backend implementation
    const processReturn = async () => {
        if (returnMethod === 'receipt') {
            const itemsToReturn = returnItems.filter(
                (item) => item.return_quantity > 0,
            );

            if (itemsToReturn.length === 0) {
                toast({
                    title: t('return_modal.messages.no_items_selected'),
                    description: t('return_modal.messages.please_select_at_least_one_item'),
                    type: 'error',
                });
                return;
            }

            // Validate return data before processing
            const returnData: ReturnData = {
                return_type: 'receipt',
                original_transaction_id: transaction?.id,
                original_transaction_number: transaction?.transaction_number,
                items: itemsToReturn.map((item) => ({
                    product_id: item.product_id,
                    return_quantity: item.return_quantity,
                    return_total: item.return_quantity * item.price,
                    original_price: item.price,
                })),
                processed_by_user_id: auth?.user?.id || 1,
                adjust_inventory: true,
            };

            const validation = validateReturnData(returnData);
            if (!validation.isValid) {
                toast({
                    title: 'Validation Failed',
                    description:
                        'Please fix the validation errors before proceeding',
                    type: 'error',
                });
                return;
            }

            setProcessing(true);
            try {
                // Get current user ID from auth context
                const currentUserId = auth?.user?.id || 1; // Use auth context, fallback to 1

                const returnData: ReturnData = {
                    return_type: 'receipt',
                    original_transaction_id: transaction?.id,
                    original_transaction_number:
                        transaction?.transaction_number,
                    items: itemsToReturn.map((item) => ({
                        product_id: item.product_id,
                        return_quantity: item.return_quantity,
                        return_total: item.return_quantity * item.price,
                        original_price: item.price,
                    })),
                    processed_by_user_id: currentUserId,
                    adjust_inventory: true, // Automatically adjust inventory for receipt returns
                };

                const result = await returnService.createReturn(returnData);

                let description = `Return ${result.data.return_code} processed for ${formatCurrency(result.data.total_return_amount)}`;
                if (result.transaction_deleted) {
                    description +=
                        '\n\nOriginal transaction has been removed as all items were returned.';
                }

                toast({
                    title: 'Return Processed Successfully',
                    description: description,
                    type: 'success',
                });

                onReturnProcessed?.({
                    transaction_deleted: result.transaction_deleted || false,
                    original_transaction_id: returnData.original_transaction_id,
                });
                onClose();
            } catch (error) {
                // Enhanced error handling with specific error identification
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : 'Failed to process return. Please try again.';

                // Check for specific error types and provide helpful messages
                if (
                    errorMessage.includes('Cannot return') &&
                    errorMessage.includes('units')
                ) {
                    // Quantity validation error - extract product name and quantity info
                    toast({
                        title: 'Return Quantity Error',
                        description: errorMessage,
                        type: 'error',
                    });
                } else if (
                    errorMessage.includes('network') ||
                    errorMessage.includes('timeout')
                ) {
                    toast({
                        title: 'Network Error',
                        description:
                            'Network connection issue. Please check your connection and try again.',
                        type: 'error',
                    });
                } else if (
                    errorMessage.includes('validation') ||
                    errorMessage.includes('422')
                ) {
                    toast({
                        title: 'Validation Error',
                        description:
                            'Please verify the return quantities and product information.',
                        type: 'error',
                    });
                } else if (
                    errorMessage.includes('404') ||
                    errorMessage.includes('not found')
                ) {
                    toast({
                        title: 'Transaction Not Found',
                        description:
                            'The transaction could not be found. Please verify the receipt number.',
                        type: 'error',
                    });
                } else if (
                    errorMessage.includes('expired') ||
                    errorMessage.includes('30 days')
                ) {
                    toast({
                        title: t('return_modal.messages.return_period_expired'),
                        description:
                            'Returns are only allowed within 30 days of purchase.',
                        type: 'error',
                    });
                } else {
                    toast({
                        title: 'Return Failed',
                        description: errorMessage,
                        type: 'error',
                    });
                }
            } finally {
                setProcessing(false);
            }
        } else if (returnMethod === 'manual') {
            if (manualReturnItems.length === 0) {
                toast({
                    title: 'No Items Added',
                    description: 'Please add items to return',
                    type: 'error',
                });
                return;
            }

            // Validate manual return data before processing
            const returnData: ReturnData = {
                return_type: 'manual',
                items: manualReturnItems.map((item) => ({
                    product_id: item.product_id || 0,
                    return_quantity: item.quantity,
                    return_total: item.quantity * item.price,
                    original_price: item.price,
                })),
                processed_by_user_id: auth?.user?.id || 1,
                adjust_inventory: true,
            };

            const validation = validateReturnData(returnData);
            if (!validation.isValid) {
                toast({
                    title: 'Validation Failed',
                    description:
                        'Please fix the validation errors before proceeding',
                    type: 'error',
                });
                return;
            }

            setProcessing(true);
            try {
                // Get current user ID from auth context
                const currentUserId = auth?.user?.id || 1; // Use auth context, fallback to 1

                const returnData: ReturnData = {
                    return_type: 'manual',
                    items: manualReturnItems.map((item) => ({
                        product_id: item.product_id || 0,
                        return_quantity: item.quantity,
                        return_total: item.quantity * item.price,
                        original_price: item.price,
                    })),
                    processed_by_user_id: currentUserId,
                    adjust_inventory: true, // Automatically adjust inventory for manual returns
                };

                const result = await returnService.createReturn(returnData);

                let description = `Return ${result.data.return_code} processed for ${formatCurrency(result.data.total_return_amount)}`;
                if (result.transaction_deleted) {
                    description +=
                        '\n\nOriginal transaction has been removed as all items were returned.';
                }

                toast({
                    title: 'Manual Return Processed Successfully',
                    description: description,
                    type: 'success',
                });

                onReturnProcessed?.();
                onClose();
            } catch (error) {
                // Enhanced error handling with specific error identification
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : 'Failed to process return. Please try again.';

                // Check for specific error types and provide helpful messages
                if (
                    errorMessage.includes('Cannot return') &&
                    errorMessage.includes('units')
                ) {
                    // Quantity validation error - extract product name and quantity info
                    toast({
                        title: 'Return Quantity Error',
                        description: errorMessage,
                        type: 'error',
                    });
                } else if (
                    errorMessage.includes('network') ||
                    errorMessage.includes('timeout')
                ) {
                    toast({
                        title: 'Network Error',
                        description:
                            'Network connection issue. Please check your connection and try again.',
                        type: 'error',
                    });
                } else if (
                    errorMessage.includes('validation') ||
                    errorMessage.includes('422')
                ) {
                    toast({
                        title: 'Validation Error',
                        description:
                            'Please verify the return quantities and product information.',
                        type: 'error',
                    });
                } else if (
                    errorMessage.includes('404') ||
                    errorMessage.includes('not found')
                ) {
                    toast({
                        title: 'Product Not Found',
                        description:
                            'One or more products could not be found in transaction history.',
                        type: 'error',
                    });
                } else if (
                    errorMessage.includes('insufficient transaction history')
                ) {
                    toast({
                        title: 'Insufficient Transaction History',
                        description:
                            'Not enough transaction history found to process this return.',
                        type: 'error',
                    });
                } else {
                    toast({
                        title: 'Manual Return Failed',
                        description: errorMessage,
                        type: 'error',
                    });
                }
            } finally {
                setProcessing(false);
            }
        }
    };

    // Render method selection step
    const renderMethodSelection = () => (
        <div className="space-y-6">
            <div className="mb-6 text-center">
                <RotateCcw className="mx-auto mb-3 h-12 w-12 text-cyan-700 dark:text-cyan-300" />
                <h3 className="mb-2 text-lg font-semibold">
                    {t('return_modal.method_selection.prompt')}
                </h3>
            </div>

            <div className="grid gap-4">
                <Card
                    className={`cursor-pointer border-2 transition-all hover:shadow-md ${
                        returnMethod === 'receipt'
                            ? 'border-cyan-300 bg-cyan-50 dark:border-cyan-300 dark:bg-cyan-300/20'
                            : 'border-border hover:border-cyan-300 dark:hover:border-cyan-300'
                    }`}
                    onClick={() => setReturnMethod('receipt')}
                >
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-3 text-base text-cyan-700 dark:text-cyan-300">
                            <Receipt className="h-5 w-5 text-cyan-700 dark:text-cyan-300" />
                            {t('return_modal.method_selection.receipt.title')}
                            <Badge
                                variant={
                                    returnMethod === 'receipt'
                                        ? 'default'
                                        : 'secondary'
                                }
                                className="ml-auto border-cyan-300 bg-cyan-50 text-cyan-700 dark:border-cyan-300 dark:bg-cyan-300/20 dark:text-cyan-300"
                            >
                                {t('return_modal.method_selection.recommended_badge')}
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <p className="mb-3 text-sm text-muted-foreground">
                            {t('return_modal.method_selection.receipt.description')}
                        </p>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                                <span>
                                    {t('return_modal.method_selection.receipt.benefits.fast')}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                                <span>
                                    {t('return_modal.method_selection.receipt.benefits.validation')}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                                <span>
                                    {t('return_modal.method_selection.receipt.benefits.original_payment')}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className={`cursor-pointer border-2 transition-all hover:shadow-md ${
                        returnMethod === 'manual'
                            ? 'border-cyan-300 bg-cyan-50 dark:border-cyan-300 dark:bg-cyan-300/20'
                            : 'border-border hover:border-cyan-300 dark:hover:border-cyan-300'
                    }`}
                    onClick={() => setReturnMethod('manual')}
                >
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-3 text-base text-cyan-700 dark:text-cyan-300">
                            <Package className="h-5 w-5 text-cyan-700 dark:text-cyan-300" />
                            {t('return_modal.method_selection.manual.title')}
                            <Badge
                                variant="outline"
                                className="ml-auto border-cyan-300 text-cyan-700 dark:border-cyan-300 dark:text-cyan-300"
                            >
                                {t('return_modal.method_selection.manual.badge')}
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <p className="mb-3 text-sm text-muted-foreground">
                            {t('return_modal.method_selection.manual.description')}
                        </p>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                                <span>
                                    {t('return_modal.method_selection.manual.benefits.history')}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <CreditCard className="h-3 w-3 text-cyan-700 dark:text-cyan-300" />
                                <span>
                                    {t('return_modal.method_selection.manual.benefits.processing')}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Info className="h-3 w-3 text-cyan-700 dark:text-cyan-300" />
                                <span>
                                    {t('return_modal.method_selection.manual.benefits.no_receipt')}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );

    // Render receipt search step
    const renderReceiptSearch = () => (
        <div className="space-y-6">
            <div className="space-y-4">
                <div>
                    <div className="mt-2 flex gap-2">
                        <Input
                            id="receiptId"
                            type="text"
                            placeholder={t("return_modal.messages.receipt_search.placeholder")}
                            value={receiptId}
                            onChange={(e) => setReceiptId(e.target.value)}
                            onKeyDown={(e) =>
                                e.key === 'Enter' && searchTransaction()
                            }
                            className="flex-1"
                        />
                        <Button
                            onClick={searchTransaction}
                            disabled={searchLoading || !receiptId.trim()}
                            className="border-cyan-300 bg-cyan-50 text-cyan-700 hover:border-cyan-500 hover:bg-cyan-100 dark:border-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-300 dark:hover:border-cyan-500 dark:hover:bg-cyan-900/30"
                        >
                            {searchLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Search className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Transaction Selection when multiple found */}
            {showTransactionSelection && foundTransactions.length > 0 && (
                <Card className="border-cyan-300 bg-cyan-50 dark:border-cyan-600 dark:bg-cyan-900/20">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                            <Receipt className="h-4 w-4 text-cyan-700 dark:text-cyan-300" />
                            Select Transaction
                            <Badge variant="outline" className="ml-auto">
                                {foundTransactions.length} found
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Multiple transactions found with this barcode.
                            Select the transaction you want to return items
                            from:
                        </p>
                        <div className="max-h-60 space-y-2 overflow-y-auto">
                            {foundTransactions.map((txn, index) => (
                                <Card
                                    key={txn.id}
                                    className={`cursor-pointer border-2 transition-all hover:shadow-sm ${
                                        index === 0
                                            ? 'border-cyan-300 bg-cyan-50 dark:border-cyan-300 dark:bg-cyan-300/20'
                                            : 'border-border hover:border-cyan-700 dark:border-cyan-300/50'
                                    }`}
                                    onClick={() =>
                                        selectTransaction(
                                            txn.transaction_number,
                                        )
                                    }
                                >
                                    <CardContent className="p-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-sm font-medium">
                                                        {txn.transaction_number}
                                                    </span>
                                                    {index === 0 && (
                                                        <Badge
                                                            variant="outline"
                                                            className="border-cyan-300 bg-cyan-50 text-xs text-cyan-700 dark:border-cyan-300 dark:bg-cyan-300/20 dark:text-cyan-300"
                                                        >
                                                            Most Recent
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="mt-1 text-xs text-muted-foreground">
                                                    {formatDatePart(
                                                        txn.created_at,
                                                        t('return_modal.unknown'),
                                                    )}{' '}
                                                    •{' '}
                                                    {formatCurrency(
                                                        txn.total_amount,
                                                    )}
                                                </div>
                                                {txn.items?.map(
                                                    (item, itemIndex) => (
                                                        <div
                                                            key={itemIndex}
                                                            className="text-xs text-muted-foreground"
                                                        >
                                                            {item.name} • Qty:{' '}
                                                            {item.quantity} •{' '}
                                                            {formatCurrency(
                                                                item.total,
                                                            )}
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="ml-2"
                                            >
                                                Select
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setShowTransactionSelection(false);
                                setFoundTransactions([]);
                            }}
                            className="w-full"
                        >
                            Cancel Selection
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );

    // Render receipt items selection
    const renderReceiptItems = () => (
        <div className="space-y-6">
            {transaction && (
                <TransactionDetailsCard transaction={transaction} />
            )}

            <Card className="border-border/50">
                <CardHeader className="pb-3">
                    <CardTitle className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center">
                        <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-cyan-700 dark:text-cyan-300" />
                            {t('return_purchase.select_items_to_return')}
                        </div>
                        <Badge variant="secondary" className="w-fit sm:ml-auto">
                            {selectedItemsCount} of {returnItems.length}{' '}
                            {t('common.selected')}
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

            <ReturnSummaryCard
                title={t('return_modal.return_summary')}
                itemsCount={selectedItemsCount}
                total={returnTotal}
                type="refund"
            />
        </div>
    );

    // Render manual items selection
    const renderManualItems = () => (
        <div className="space-y-6">
            {/* Multi-Barcode Search */}
            <Card className="border-border/50">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm">
                        <Search className="h-4 w-4 text-cyan-700 dark:text-cyan-300" />
                        Multi-Barcode Search
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Search Input */}
                    <div>
                        <Label
                            htmlFor="barcodeSearch"
                            className="text-sm font-medium"
                        >
                            Enter Barcode(s) - Multiple supported
                        </Label>
                        <div className="mt-2 flex gap-2">
                            <Textarea
                                id="barcodeSearch"
                                placeholder="Enter barcodes separated by spaces, commas, or new lines..."
                                value={barcodeSearch}
                                onChange={(e) =>
                                    setBarcodeSearch(e.target.value)
                                }
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        if (e.ctrlKey || e.metaKey) {
                                            searchTransactionHistory();
                                        } else {
                                            addBarcodeToList();
                                        }
                                    }
                                }}
                                className="min-h-[60px] flex-1 resize-none"
                                rows={2}
                            />
                            <div className="flex flex-col gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={addBarcodeToList}
                                    disabled={!barcodeSearch.trim()}
                                    className="whitespace-nowrap"
                                >
                                    <Plus className="mr-1 h-3 w-3" />
                                    Add
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={searchTransactionHistory}
                                    disabled={
                                        searchingTransactions ||
                                        (barcodesList.length === 0 &&
                                            !barcodeSearch.trim())
                                    }
                                    className="!border-cyan-300 !bg-cyan-50 !text-cyan-700 hover:!border-cyan-500 hover:!bg-cyan-100 dark:!border-cyan-300 dark:!bg-cyan-300/20 dark:!text-cyan-700 dark:hover:!border-cyan-300 dark:hover:!bg-cyan-300/30"
                                >
                                    {searchingTransactions ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                        <Search className="h-3 w-3" />
                                    )}
                                </Button>
                            </div>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                            Press Enter to add to list • Ctrl+Enter to search •
                            Supports multiple formats
                        </div>
                    </div>

                    {/* Barcode List */}
                    {barcodesList.length > 0 && (
                        <div>
                            <Label className="text-sm font-medium">
                                Barcodes to Search ({barcodesList.length})
                            </Label>
                            <div className="mt-2 flex max-h-24 flex-wrap gap-2 overflow-y-auto rounded-lg border bg-muted/20 p-3">
                                {barcodesList.map((barcode, index) => (
                                    <Badge
                                        key={index}
                                        variant="secondary"
                                        className="flex items-center gap-1 font-mono text-xs"
                                    >
                                        {barcode}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                removeBarcodeFromList(barcode)
                                            }
                                            className="h-4 h-auto w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                        >
                                            <X className="h-2 w-2" />
                                        </Button>
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <div>
                            <Label className="text-sm font-medium text-cyan-700 dark:text-cyan-300">
                                Found Products ({searchResults.length})
                            </Label>
                            <div className="mt-2 max-h-80 space-y-3 overflow-y-auto">
                                {searchResults.map((result, index) => (
                                    <Card
                                        key={index}
                                        className="border-cyan-300 bg-cyan-50 dark:border-cyan-600 dark:bg-cyan-900/20"
                                    >
                                        <CardContent className="p-4">
                                            {/* Product Info */}
                                            <div className="mb-3 flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="text-sm font-medium">
                                                        {result.product_name}
                                                    </div>
                                                    <div className="font-mono text-xs text-muted-foreground">
                                                        {result.product_barcode}
                                                    </div>
                                                </div>
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs"
                                                >
                                                    {result.total_sold} sold
                                                </Badge>
                                            </div>

                                            {/* Stats Grid */}
                                            <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
                                                <div>
                                                    <span className="text-muted-foreground">
                                                        Last Price:
                                                    </span>
                                                    <div className="font-medium">
                                                        {formatCurrency(
                                                            result.sell_price,
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">
                                                        Transactions:
                                                    </span>
                                                    <div className="font-medium">
                                                        {
                                                            result
                                                                .transaction_history
                                                                .length
                                                        }
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Recent Transaction History */}
                                            {result.transaction_history.length >
                                                0 && (
                                                <div className="mb-3">
                                                    <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                                                        <Clock className="h-3 w-3" />
                                                        Recent Sales (Return
                                                        Priority Order):
                                                    </div>
                                                    <div className="max-h-20 space-y-1 overflow-y-auto">
                                                        {result.transaction_history
                                                            .slice(0, 3)
                                                            .map(
                                                                (
                                                                    txn,
                                                                    txnIndex,
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            txnIndex
                                                                        }
                                                                        className={`flex items-center justify-between rounded px-2 py-1 text-xs ${
                                                                            txnIndex ===
                                                                            0
                                                                                ? 'border border-cyan-300 bg-cyan-50 dark:border-cyan-300 dark:bg-cyan-300/20'
                                                                                : 'bg-muted/30'
                                                                        }`}
                                                                    >
                                                                        <div className="flex items-center gap-1">
                                                                            {txnIndex ===
                                                                                0 && (
                                                                                <Badge
                                                                                    variant="outline"
                                                                                    className="border-cyan-300 bg-cyan-50 px-1 py-0 text-[10px] text-cyan-700 dark:border-cyan-300 dark:bg-cyan-300/20 dark:text-cyan-300"
                                                                                >
                                                                                    First
                                                                                </Badge>
                                                                            )}
                                                                            <span className="font-mono text-[10px]">
                                                                                {
                                                                                    txn.transaction_number
                                                                                }
                                                                            </span>
                                                                            <span className="text-muted-foreground">
                                                                                {formatDatePart(
                                                                                    txn.transaction_date,
                                                                                    t('return_modal.unknown'),
                                                                                )}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center gap-1">
                                                                            <span className="font-medium">
                                                                                {
                                                                                    txn.quantity
                                                                                }

                                                                                x
                                                                            </span>
                                                                            <span className="text-green-600 dark:text-green-400">
                                                                                {formatCurrency(
                                                                                    txn.total,
                                                                                )}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                ),
                                                            )}
                                                        {result
                                                            .transaction_history
                                                            .length > 3 && (
                                                            <div className="text-center text-xs text-muted-foreground">
                                                                +
                                                                {result
                                                                    .transaction_history
                                                                    .length -
                                                                    3}{' '}
                                                                more
                                                                transactions
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Add to Return */}
                                            <div className="flex items-center gap-2 rounded border border-green-200 bg-green-50 p-2 dark:border-green-800 dark:bg-green-900/20">
                                                <Label className="text-xs font-medium text-green-800 dark:text-green-200">
                                                    Qty:
                                                </Label>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    max={result.max_available}
                                                    defaultValue="1"
                                                    className="h-7 w-16 text-xs"
                                                    id={`qty-${index}`}
                                                />
                                                <Button
                                                    size="sm"
                                                    onClick={() => {
                                                        const input =
                                                            document.getElementById(
                                                                `qty-${index}`,
                                                            ) as HTMLInputElement;
                                                        const qty = Math.min(
                                                            parseInt(
                                                                input?.value ||
                                                                    '1',
                                                            ),
                                                            result.max_available,
                                                        );
                                                        if (
                                                            qty > 0 &&
                                                            qty <=
                                                                result.max_available
                                                        ) {
                                                            addResultItemToReturn(
                                                                result,
                                                                qty,
                                                            );
                                                            // Reset input to 1
                                                            input.value = '1';
                                                        } else {
                                                            toast({
                                                                title: 'Invalid Quantity',
                                                                description: `Maximum available quantity is ${result.max_available}`,
                                                                type: 'error',
                                                            });
                                                        }
                                                    }}
                                                    className="h-7 bg-green-600 px-2 text-xs text-white hover:bg-green-700"
                                                >
                                                    <Plus className="mr-1 h-3 w-3" />
                                                    Add
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
            {/* Manual Return Items List */}
            {manualReturnItems.length > 0 && (
                <Card className="border-cyan-300 bg-cyan-50 dark:border-cyan-300 dark:bg-cyan-300/20">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center">
                            <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-cyan-700 dark:text-cyan-300" />
                                Items for Manual Return
                            </div>
                            <Badge
                                variant="secondary"
                                className="w-fit sm:ml-auto"
                            >
                                {manualReturnItems.length} item(s)
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="border-t">
                            {manualReturnItems.map((item, index) => (
                                <ManualItemRow
                                    key={`${item.barcode}-${index}`}
                                    item={item}
                                    index={index}
                                    onUpdateQuantity={updateManualItemQuantity}
                                    onRemove={removeManualItem}
                                />
                            ))}
                            {manualReturnItems.length === 0 && (
                                <div className="p-8 text-center text-muted-foreground">
                                    No items added yet
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Return Summary */}
            {manualReturnItems.length > 0 && (
                <div className="space-y-4">
                    <ReturnSummaryCard
                        title={t('return_modal.manual_return_summary')}
                        itemsCount={manualReturnItems.length}
                        total={returnTotal}
                        type="credit"
                    />
                </div>
            )}
        </div>
    );

    // Get step content based on current step
    const getStepContent = () => {
        switch (currentStep) {
            case 'method':
                return renderMethodSelection();
            case 'receipt-search':
                return renderReceiptSearch();
            case 'receipt-items':
                return renderReceiptItems();
            case 'manual-items':
                return renderManualItems();
            default:
                return null;
        }
    };

    // Get step info from configuration
    const getStepInfo = (): StepInfo => {
        return (
            stepConfig[currentStep] || {
                title: 'Process Return',
                description: 'Review and confirm the return',
            }
        );
    };

    const stepInfo = getStepInfo();

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="flex max-h-[90vh] flex-col overflow-hidden p-0 border-cyan-200 shadow-[0_4px_8px_0_rgba(0,0,0,0.2),0_2px_4px_0_rgba(0,0,0,0.1)] dark:border-cyan-800 dark:shadow-[0_4px_8px_0_rgba(0,0,0,0.4),0_2px_4px_0_rgba(0,0,0,0.3)]"
                style={{
                    zIndex: 9999,
                    maxWidth: '60vw',
                    width: '800px',
                }}
            >
                <DialogHeader className="shrink-0 border-b border-cyan-200 bg-gradient-to-r from-cyan-50 to-cyan-100 px-4 py-4 dark:border-cyan-800 dark:from-cyan-900/20 dark:to-cyan-900/30">
                    <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-cyan-800 dark:text-cyan-200">
                        <RotateCcw className="h-5 w-5 text-cyan-800 dark:text-cyan-200" />
                        {stepInfo.title}
                    </DialogTitle>
                </DialogHeader>

                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
                    {getStepContent()}
                </div>

                <div className="shrink-0 border-t bg-muted/20 px-4 py-4">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row">
                        <div className="order-2 flex gap-2 sm:order-1">
                            {canGoBack && (
                                <Button
                                    variant="outline"
                                    onClick={handleBack}
                                    className="flex-1 sm:flex-none"
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    {t('common.back')}
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                onClick={onClose}
                                className="flex-1 sm:flex-none"
                            >
                                {t('common.cancel')}
                            </Button>
                        </div>

                        <div className="order-1 sm:order-2">
                            {currentStep === 'receipt-items' ||
                            currentStep === 'manual-items' ? (
                                <Button
                                    onClick={processReturn}
                                    disabled={!canContinue() || processing}
                                    className={`w-full sm:min-w-[140px] ${
                                        canContinue()
                                            ? '!border-cyan-300 !bg-cyan-50 !text-cyan-700 hover:!border-cyan-500 hover:!bg-cyan-100 dark:!border-cyan-300 dark:!bg-cyan-300/20 dark:!text-cyan-300 dark:hover:!border-cyan-500 dark:hover:!bg-cyan-300/30'
                                            : 'cursor-not-allowed bg-gray-300 text-gray-500'
                                    }`}
                                    size="lg"
                                >
                                    {processing ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <RotateCcw className="mr-2 h-4 w-4" />
                                    )}
                                    <span className="hidden sm:inline">
                                        {processing
                                            ? t('common.process')
                                            : `${t('common.confirm')} ${selectedItemsCount > 0 ? `(${formatCurrency(returnTotal)})` : ''}`}
                                    </span>
                                    <span className="sm:hidden">
                                        {processing
                                            ? t('common.process')
                                            : t('common.confirm')}
                                    </span>
                                </Button>
                            ) : currentStep === 'method' ? (
                                <Button
                                    onClick={handleContinue}
                                    disabled={!canContinue()}
                                    className="w-full !border-cyan-300 !bg-cyan-50 !text-cyan-700 hover:!border-cyan-500 hover:!bg-cyan-100 dark:!border-cyan-300 dark:!bg-cyan-300/20 dark:!text-cyan-300 dark:hover:!border-cyan-500 dark:hover:!bg-cyan-300/30 sm:w-auto"
                                >
                                    {t('common.continue')}
                                </Button>
                            ) : null}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default ReturnModal;
