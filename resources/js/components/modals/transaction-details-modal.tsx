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
import { useToast } from '@/components/ui/toast';
import { formatCurrency } from '@/lib/currency';
import { formatDatePart, formatTimePart } from '@/lib/datetime';
import { receiptService } from '@/services/utils/receiptService';
import {
    transactionService,
    type Transaction,
    type TransactionItem,
} from '@/services/business/transactionService';
import {
    ArrowRightLeft,
    Banknote,
    Calendar,
    Clock,
    CreditCard,
    DollarSign,
    Hash,
    Loader2,
    Package,
    Printer,
    Scale,
    TrendingUp,
    User,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface TransactionDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: Transaction;
}

export function TransactionDetailsModal({
    isOpen,
    onClose,
    transaction,
}: TransactionDetailsModalProps) {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [detailedTransaction, setDetailedTransaction] =
        useState<Transaction | null>(null);
    const [loading, setLoading] = useState(false);
    const [printing, setPrinting] = useState(false);

    // Load detailed transaction data from database when modal opens
    // Always fetch fresh data to ensure accuracy
    useEffect(() => {
        const loadTransactionDetails = async () => {
            if (!transaction.id) {
                toast({
                    title: t('transaction_details_modal.error'),
                    description: t('transaction_details_modal.invalid_transaction_id'),
                });
                return;
            }

            setLoading(true);
            setDetailedTransaction(null); // Clear previous data to ensure fresh load
            
            try {
                const response = await transactionService.getTransaction(
                    transaction.id,
                );
                
                if (response.success && response.data) {
                    // Ensure items are sorted by index for consistent display
                    const sortedData = {
                        ...response.data,
                        items: response.data.items || [],
                    };
                    setDetailedTransaction(sortedData);
                } else {
                    toast({
                        title: t('transaction_details_modal.error'),
                        description:
                            response.message ||
                            t('transaction_details_modal.failed_to_load_details'),
                    });
                }
            } catch (error: unknown) {
                console.error('Failed to load transaction details:', error);
                toast({
                    title: t('transaction_details_modal.error'),
                    description:
                        (error as { message?: string }).message ||
                        t('transaction_details_modal.failed_to_load_details'),
                });
            } finally {
                setLoading(false);
            }
        };

        if (isOpen && transaction?.id) {
            loadTransactionDetails();
        }
    }, [isOpen, transaction?.id, toast, t]);

    // Handle print receipt
    const handlePrintReceipt = useCallback(async () => {
        if (!detailedTransaction) return;

        setPrinting(true);
        try {
            // Create a mock user object for the receipt
            const user = {
                id: 1,
                full_name: 'System User',
                username: 'system',
                role: 'admin',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            await receiptService.printReceipt(detailedTransaction, user);
            
            toast({
                title: t('transaction_details_modal.receipt_printed'),
                description: t('transaction_details_modal.receipt_printed_successfully'),
            });
        } catch (error) {
            console.error('Print receipt failed:', error);
            toast({
                title: t('transaction_details_modal.print_error'),
                description: t('transaction_details_modal.print_receipt_failed'),
            });
        } finally {
            setPrinting(false);
        }
    }, [detailedTransaction, toast, t]);

    // Handle keyboard events (Enter key support)
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (!isOpen) return;

            if (
                event.key === 'Enter' &&
                !event.shiftKey &&
                !event.ctrlKey &&
                !event.altKey
            ) {
                event.preventDefault();
                onClose();
            }

            if (event.key === 'Escape') {
                event.preventDefault();
                onClose();
            }
        },
        [isOpen, onClose],
    );

    // Set up keyboard event listeners
    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => {
                document.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, [isOpen, handleKeyDown]);

    // Always use detailed transaction data from database (fresh data)
    // Only fallback to prop data if detailed data is not yet loaded (shouldn't happen in normal flow)
    const displayTransaction = detailedTransaction || transaction;
    
    // Ensure items array exists and is properly structured
    const transactionItems = displayTransaction?.items || [];

    const getProductTypeIcon = (item: TransactionItem) => {
        if (item.is_scale_product) {
            return <Scale className="h-4 w-4" />;
        }
        if (item.card_id) {
            return <CreditCard className="h-4 w-4" />;
        }
        return <Package className="h-4 w-4" />;
    };

    const getProductTypeLabel = (item: TransactionItem) => {
        if (item.is_scale_product) {
            return t('transaction_details_modal.scale_product');
        }
        if (item.card_id) {
            return t('transaction_details_modal.card');
        }
        return t('transaction_details_modal.product');
    };

    // Helper component for transaction info rows
    const InfoRow = ({
        icon,
        label,
        value,
        valueClassName = 'font-medium',
    }: {
        icon: React.ReactNode;
        label: string;
        value: string;
        valueClassName?: string;
    }) => (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {icon}
                {label}
            </div>
            <span className={`text-sm ${valueClassName}`}>{value}</span>
        </div>
    );

    // Transaction Info Card Component
    const TransactionInfo = () => (
        <Card className="shadow-[0_-2px_8px_0_rgba(0,0,0,0.1),0_2px_8px_0_rgba(0,0,0,0.1)] dark:shadow-[0_-2px_8px_0_rgba(0,0,0,0.3),0_2px_8px_0_rgba(0,0,0,0.3)]">
            <CardHeader className="px-4 py-4 pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <Hash className="h-4 w-4 text-primary" />
                    {t('transaction_details_modal.transaction_information')}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4">
                <InfoRow
                    icon={<Hash className="h-3 w-3" />}
                    label={t('transaction_details_modal.transaction_number')}
                    value={displayTransaction?.transaction_number || t('transaction_details_modal.unknown')}
                    valueClassName="font-mono font-medium text-primary"
                />
                <InfoRow
                    icon={<User className="h-3 w-3" />}
                    label={t('transaction_details_modal.cashier')}
                    value={displayTransaction?.user?.full_name || t('transaction_details_modal.unknown')}
                />
                <InfoRow
                    icon={<Calendar className="h-3 w-3" />}
                    label={t('transaction_details_modal.date')}
                    value={formatDatePart(
                        displayTransaction?.created_at,
                        t('transaction_details_modal.unknown'),
                    )}
                />
                <InfoRow
                    icon={<Clock className="h-3 w-3" />}
                    label={t('transaction_details_modal.time')}
                    value={formatTimePart(
                        displayTransaction?.created_at,
                        t('transaction_details_modal.unknown'),
                    )}
                />
            </CardContent>
        </Card>
    );

    // Payment Summary Card Component
    const PaymentSummary = () => (
        <Card className="shadow-[0_-2px_8px_0_rgba(0,0,0,0.1),0_2px_8px_0_rgba(0,0,0,0.1)] dark:shadow-[0_-2px_8px_0_rgba(0,0,0,0.3),0_2px_8px_0_rgba(0,0,0,0.3)]">
            <CardHeader className="px-4 py-4 pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    {t('transaction_details_modal.payment_summary')}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4">
                <InfoRow
                    icon={<DollarSign className="h-3 w-3" />}
                    label={t('transaction_details_modal.total_amount')}
                    value={formatCurrency(displayTransaction?.total_amount || 0)}
                    valueClassName="font-bold text-green-600 dark:text-green-400"
                />
                {displayTransaction?.discount &&
                    displayTransaction.discount > 0 && (
                        <InfoRow
                            icon={<ArrowRightLeft className="h-3 w-3" />}
                            label={t('transaction_details_modal.discount_applied')}
                            value={`-${formatCurrency(displayTransaction.discount || 0)}`}
                            valueClassName="font-semibold text-red-600 dark:text-red-400"
                        />
                    )}
                <InfoRow
                    icon={<Banknote className="h-3 w-3" />}
                    label={t('transaction_details_modal.amount_paid')}
                    value={formatCurrency(displayTransaction?.amount_paid || 0)}
                    valueClassName="font-semibold text-primary dark:text-primary"
                />
                <InfoRow
                    icon={<ArrowRightLeft className="h-3 w-3" />}
                    label={t('transaction_details_modal.change_given')}
                    value={formatCurrency(displayTransaction?.change_due || 0)}
                    valueClassName="font-semibold text-orange-600 dark:text-orange-400"
                />
                <div className="flex items-center justify-between border-t pt-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Package className="h-3 w-3" />
                        {t('transaction_details_modal.items_count_label')}
                    </div>
                    <Badge variant="secondary">
                        {(displayTransaction.items_count ?? 0)} {t('point_of_sale.items')}
                    </Badge>
                </div>
            </CardContent>
        </Card>
    );

    // Items Table Row Component
    const ItemTableRow = ({
        item,
        index,
    }: {
        item: TransactionItem;
        index: number;
    }) => (
        <tr
            key={`table-${index}`}
            className="border-b border-border/30 transition-colors last:border-b-0 hover:bg-muted/20"
        >
            <td className="px-4 py-3">
                <div>
                    <div className="text-sm font-medium">{item.name || t('transaction_details_modal.unknown_item')}</div>
                    {item.barcode && (
                        <div className="mt-1 font-mono text-xs text-muted-foreground">
                            {item.barcode}
                        </div>
                    )}
                </div>
            </td>
            <td className="px-2 py-3">
                <div className="flex items-center gap-1.5">
                    {getProductTypeIcon(item)}
                    <Badge variant="outline" className="text-xs">
                        {getProductTypeLabel(item)}
                    </Badge>
                </div>
            </td>
            <td className="px-2 py-3 text-right">
                <span className="font-mono text-sm">
                    {formatCurrency(item.price || 0)}
                </span>
            </td>
            <td className="px-2 py-3 text-center">
                <Badge variant="secondary" className="text-xs">
                    {item.is_scale_product
                        ? `${item.weight || 0}g`
                        : `${item.quantity || 1}x`}
                </Badge>
            </td>
            <td className="px-4 py-3 text-right">
                <span className="font-mono font-semibold text-primary">
                    {formatCurrency(item.total || 0)}
                </span>
            </td>
        </tr>
    );

    // Items Mobile Card Component
    const ItemMobileCard = ({
        item,
        index,
    }: {
        item: TransactionItem;
        index: number;
    }) => (
        <div
            key={`mobile-${index}`}
            className="rounded-lg border border-border/30 bg-muted/10 p-3"
        >
            <div className="mb-3 flex items-start justify-between">
                <div className="min-w-0 flex-1 pr-2">
                    <div className="mb-1 line-clamp-2 text-sm font-medium">
                        {item.name || t('transaction_details_modal.unknown_item')}
                    </div>
                    {item.barcode && (
                        <div className="font-mono text-xs text-muted-foreground">
                            {item.barcode}
                        </div>
                    )}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                    {getProductTypeIcon(item)}
                    <Badge
                        variant="outline"
                        className="text-xs whitespace-nowrap"
                    >
                        {getProductTypeLabel(item)}
                    </Badge>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                    <div className="mb-1 text-muted-foreground">
                        {t('transaction_details_modal.table.price')}
                    </div>
                    <div className="font-mono font-medium">
                        {formatCurrency(item.price || 0)}
                    </div>
                </div>
                <div>
                    <div className="mb-1 text-muted-foreground">
                        {t('transaction_details_modal.table.quantity')}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                        {item.is_scale_product
                            ? `${item.weight || 0}g`
                            : `${item.quantity || 1}x`}
                    </Badge>
                </div>
                <div className="text-right">
                    <div className="mb-1 text-muted-foreground">
                        {t('transaction_details_modal.table.total')}
                    </div>
                    <div className="font-mono text-sm font-semibold text-primary">
                        {formatCurrency(item.total || 0)}
                    </div>
                </div>
            </div>
        </div>
    );

    // Transaction Items Card Component
    const TransactionItems = () => (
        <Card className="shadow-[0_-2px_8px_0_rgba(0,0,0,0.1),0_2px_8px_0_rgba(0,0,0,0.1)] dark:shadow-[0_-2px_8px_0_rgba(0,0,0,0.3),0_2px_8px_0_rgba(0,0,0,0.3)]">
            <CardHeader className="px-4 py-4">
                <CardTitle className="flex items-center justify-between text-sm font-medium">
                    <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-primary" />
                        {t('transaction_details_modal.transaction_items')}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                        {transactionItems.length} {t('point_of_sale.items')}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
                {transactionItems && transactionItems.length > 0 ? (
                    <>
                        {/* Desktop/Tablet Table View */}
                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border/50">
                                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                                            {t('transaction_details_modal.table.item')}
                                        </th>
                                        <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">
                                            {t('transaction_details_modal.table.type')}
                                        </th>
                                        <th className="px-2 py-2 text-right text-xs font-medium text-muted-foreground">
                                            {t('transaction_details_modal.table.price')}
                                        </th>
                                        <th className="px-2 py-2 text-center text-xs font-medium text-muted-foreground">
                                            {t('transaction_details_modal.table.quantity')}
                                        </th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">
                                            {t('transaction_details_modal.table.total')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactionItems.map(
                                        (item, index) => (
                                            <ItemTableRow
                                                key={`item-${index}`}
                                                item={item}
                                                index={index}
                                            />
                                        ),
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="space-y-3 px-4 md:hidden">
                            {transactionItems.map((item, index) => (
                                <ItemMobileCard
                                    key={`mobile-item-${index}`}
                                    item={item}
                                    index={index}
                                />
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="px-4 py-8 text-center">
                        <Package className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">
                            {t('transaction_details_modal.no_items')}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );

    // Loading State Component
    const LoadingState = () => (
        <div className="flex items-center justify-center py-12">
            <div className="space-y-3 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                    {t('transaction_details_modal.loading')}
                </p>
            </div>
        </div>
    );

    // Modal Footer Component
    const ModalFooter = () => (
        <div className="shrink-0 border-t bg-muted/20 px-4 py-4">
            <div className="flex justify-between">
                <Button
                    onClick={handlePrintReceipt}
                    disabled={!detailedTransaction || printing}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-2"
                >
                    {printing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Printer className="h-4 w-4" />
                    )}
                    {t('transaction_details_modal.print_receipt')}
                </Button>
                
                <Button
                    onClick={onClose}
                    size="sm"
                    className="w-full sm:w-auto sm:min-w-[100px]"
                >
                    {t('common.close')}
                </Button>
            </div>
        </div>
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="flex max-h-[90vh] flex-col overflow-hidden p-0"
                style={{
                    zIndex: 9999,
                    maxWidth: '60vw',
                    width: '800px',
                }}
            >
                <DialogHeader className="shrink-0 border-b bg-gradient-to-r from-muted/50 to-muted/30 px-4 py-4">
                    <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                        {t('transaction_details_modal.title')}
                    </DialogTitle>
                </DialogHeader>

                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
                    {loading ? (
                        <LoadingState />
                    ) : (
                        <div className="space-y-6">
                            {/* Transaction Overview Cards */}
                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                <TransactionInfo />
                                <PaymentSummary />
                            </div>

                            {/* Transaction Items */}
                            <TransactionItems />
                        </div>
                    )}
                </div>

                <ModalFooter />
            </DialogContent>
        </Dialog>
    );
}
