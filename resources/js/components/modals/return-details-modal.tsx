import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { useTranslation } from '@/hooks/use-translation';
import { formatCurrency } from '@/lib/currency';
import { formatDatePart, formatTimePart } from '@/lib/datetime';
import { returnService, type ReturnRecord } from '@/services/business/returnService';
import {
    AlertCircle,
    ArrowRightLeft,
    Building2,
    Calendar,
    CheckCircle,
    Clock,
    DollarSign,
    Hash,
    Loader2,
    Package,
    Receipt,
    RotateCcw,
    Tag,
    TrendingUp,
    User,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface ReturnDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    returnRecord: ReturnRecord;
}

interface ReturnItem {
    product_name: string;
    product_barcode: string;
    product_category?: string;
    product_supplier?: string;
    original_price: number;
    return_quantity: number;
    stock_adjusted: boolean;
    return_total: number;
}

export function ReturnDetailsModal({
    isOpen,
    onClose,
    returnRecord,
}: ReturnDetailsModalProps) {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [detailedReturn, setDetailedReturn] = useState<ReturnRecord | null>(
        null,
    );
    const [loading, setLoading] = useState(false);

    // Load detailed return data
    // Load details when modal opens
    useEffect(() => {
        const loadReturnDetails = async () => {
            if (!returnRecord.id) return;

            setLoading(true);
            try {
                const response = await returnService.getReturn(returnRecord.id);
                setDetailedReturn(response);
            } catch (error: unknown) {
                toast({
                    title: t('return_details_modal.error'),
                    description:
                        error instanceof Error
                            ? error.message
                            : t('return_details_modal.failed_to_load_details'),
                    type: 'error',
                });
            } finally {
                setLoading(false);
            }
        };

        if (isOpen && returnRecord) {
            loadReturnDetails();
        }
    }, [isOpen, returnRecord, toast, t]);

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

    // Use detailed return data if available, otherwise use prop data
    const displayReturn = detailedReturn || returnRecord;

    const getReturnTypeColor = (type: string) => {
        switch (type) {
            case 'receipt':
                return 'bg-primary/10 text-primary border-primary/20 dark:bg-primary/90/20 dark:text-primary/30 dark:border-primary/80';
            case 'manual':
                return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800';
        }
    };

    const getReturnTypeIcon = (type: string) => {
        switch (type) {
            case 'receipt':
                return <Receipt className="h-4 w-4" />;
            case 'manual':
                return <ArrowRightLeft className="h-4 w-4" />;
            default:
                return <RotateCcw className="h-4 w-4" />;
        }
    };

    const getReturnTypeLabel = (type: string) => {
        switch (type) {
            case 'receipt':
                return t('return_page.return_types.receipt_return');
            case 'manual':
                return t('return_page.return_types.manual_return');
            default:
                return t('return_page.return_types.manual_return');
        }
    };

    // Helper component for return info rows
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

    // Return Info Card Component
    const ReturnInfo = () => (
        <Card className="border-border/50 shadow-sm">
            <CardHeader className="px-4 py-4 pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <Hash className="h-4 w-4 text-primary" />
                    {t('return_details_modal.return_information')}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4">
                <InfoRow
                    icon={<RotateCcw className="h-3 w-3" />}
                    label={t('return_details_modal.return_number_label')}
                    value={displayReturn.return_code}
                    valueClassName="font-mono font-medium text-primary"
                />
                <InfoRow
                    icon={getReturnTypeIcon(displayReturn.return_type)}
                    label={t('return_details_modal.return_type')}
                    value={getReturnTypeLabel(displayReturn.return_type)}
                />
                {displayReturn.original_transaction_number && (
                    <InfoRow
                        icon={<Receipt className="h-3 w-3" />}
                        label={t('return_details_modal.original_transaction')}
                        value={displayReturn.original_transaction_number}
                        valueClassName="font-mono font-medium text-primary dark:text-primary"
                    />
                )}
                <InfoRow
                    icon={<User className="h-3 w-3" />}
                    label={t('return_details_modal.processed_by')}
                    value={displayReturn.processed_by?.name || t('return_details_modal.unknown')}
                />
                <InfoRow
                    icon={<Calendar className="h-3 w-3" />}
                    label={t('return_details_modal.return_date')}
                    value={formatDatePart(
                        displayReturn.created_at,
                        t('return_details_modal.unknown'),
                    )}
                />
                <InfoRow
                    icon={<Clock className="h-3 w-3" />}
                    label={t('return_details_modal.return_time')}
                    value={formatTimePart(
                        displayReturn.created_at,
                        t('return_details_modal.unknown'),
                    )}
                />
            </CardContent>
        </Card>
    );

    // Return Summary Card Component
    const ReturnSummary = () => (
        <Card className="border-border/50 shadow-sm">
            <CardHeader className="px-4 py-4 pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    {t('return_details_modal.return_summary')}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4">
                <InfoRow
                    icon={<DollarSign className="h-3 w-3" />}
                    label={t('return_details_modal.total_return_amount')}
                    value={formatCurrency(displayReturn.total_return_amount)}
                    valueClassName="font-bold text-green-600 dark:text-green-400"
                />
                <div className="flex items-center justify-between border-t pt-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Package className="h-3 w-3" />
                        {t('return_details_modal.items_returned')}
                    </div>
                    <Badge variant="secondary">
                        {displayReturn.items?.length || 0} {t('return_page.items_count')}
                    </Badge>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge
                            variant="outline"
                            className={getReturnTypeColor(
                                displayReturn.return_type,
                            )}
                        >
                            {getReturnTypeIcon(displayReturn.return_type)}
                            <span className="ml-1">
                                {getReturnTypeLabel(displayReturn.return_type)}
                            </span>
                        </Badge>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    // Return Items Table Row Component
    const ReturnItemTableRow = ({
        item,
        index,
    }: {
        item: ReturnItem;
        index: number;
    }) => (
        <tr
            key={`table-${index}`}
            className="border-b border-border/30 transition-colors last:border-b-0 hover:bg-muted/20"
        >
            <td className="px-4 py-3">
                <div>
                    <div className="text-sm font-medium">
                        {item.product_name}
                    </div>
                    <div className="mt-1 font-mono text-xs text-muted-foreground">
                        {item.product_barcode}
                    </div>
                    {item.product_category && (
                        <div className="mt-1 flex items-center gap-1">
                            <Tag className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                                {item.product_category}
                            </span>
                        </div>
                    )}
                </div>
            </td>
            <td className="px-2 py-3">
                {item.product_supplier && (
                    <div className="flex items-center gap-1.5">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                            {item.product_supplier}
                        </span>
                    </div>
                )}
            </td>
            <td className="px-2 py-3 text-right">
                <span className="font-mono text-sm">
                    {formatCurrency(item.original_price)}
                </span>
            </td>
            <td className="px-2 py-3 text-center">
                <Badge variant="secondary" className="text-xs">
                    {item.return_quantity}x
                </Badge>
            </td>
            <td className="px-2 py-3 text-center">
                <div className="flex items-center justify-center">
                    {item.stock_adjusted ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                    )}
                </div>
            </td>
            <td className="px-4 py-3 text-right">
                <span className="font-mono font-semibold text-primary">
                    {formatCurrency(item.return_total)}
                </span>
            </td>
        </tr>
    );

    // Return Items Mobile Card Component
    const ReturnItemMobileCard = ({
        item,
        index,
    }: {
        item: ReturnItem;
        index: number;
    }) => (
        <div
            key={`mobile-${index}`}
            className="rounded-lg border border-border/30 bg-muted/10 p-3"
        >
            <div className="mb-3 flex items-start justify-between">
                <div className="min-w-0 flex-1 pr-2">
                    <div className="mb-1 line-clamp-2 text-sm font-medium">
                        {item.product_name}
                    </div>
                    <div className="mb-1 font-mono text-xs text-muted-foreground">
                        {item.product_barcode}
                    </div>
                    {item.product_category && (
                        <div className="mb-1 flex items-center gap-1">
                            <Tag className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                                {item.product_category}
                            </span>
                        </div>
                    )}
                    {item.product_supplier && (
                        <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                                {item.product_supplier}
                            </span>
                        </div>
                    )}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                    {item.stock_adjusted ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                    )}
                </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                    <div className="mb-1 text-muted-foreground">
                        {t('return_details_modal.original_price')}
                    </div>
                    <div className="font-mono font-medium">
                        {formatCurrency(item.original_price)}
                    </div>
                </div>
                <div>
                    <div className="mb-1 text-muted-foreground">{t('return_details_modal.quantity')}</div>
                    <Badge variant="secondary" className="text-xs">
                        {item.return_quantity}x
                    </Badge>
                </div>
                <div className="text-right">
                    <div className="mb-1 text-muted-foreground">
                        {t('return_details_modal.return_total')}
                    </div>
                    <div className="font-mono text-sm font-semibold text-primary">
                        {formatCurrency(item.return_total)}
                    </div>
                </div>
            </div>
        </div>
    );

    // Return Items Card Component
    const ReturnItems = () => (
        <Card className="border-border/50 shadow-sm">
            <CardHeader className="px-4 py-4">
                <CardTitle className="flex items-center justify-between text-sm font-medium">
                    <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-primary" />
                        {t('return_details_modal.returned_items')}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                        {displayReturn.items?.length || 0} {t('return_page.items_count')}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
                {displayReturn.items && displayReturn.items.length > 0 ? (
                    <>
                        {/* Desktop/Tablet Table View */}
                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border/50">
                                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                                            {t('return_details_modal.product')}
                                        </th>
                                        <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">
                                            {t('return_details_modal.supplier')}
                                        </th>
                                        <th className="px-2 py-2 text-right text-xs font-medium text-muted-foreground">
                                            {t('return_details_modal.original_price')}
                                        </th>
                                        <th className="px-2 py-2 text-center text-xs font-medium text-muted-foreground">
                                            {t('return_details_modal.quantity')}
                                        </th>
                                        <th className="px-2 py-2 text-center text-xs font-medium text-muted-foreground">
                                            {t('return_details_modal.stock_adjusted')}
                                        </th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">
                                            {t('return_details_modal.return_total')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayReturn.items.map((item, index) => (
                                        <ReturnItemTableRow
                                            key={`table-${index}`}
                                            item={item}
                                            index={index}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="space-y-3 px-4 md:hidden">
                            {displayReturn.items.map((item, index) => (
                                <ReturnItemMobileCard
                                    key={`mobile-${index}`}
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
                            {t('return_details_modal.no_items_found')}
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
                    {t('return_details_modal.loading_details')}
                </p>
            </div>
        </div>
    );

    // Modal Footer Component
    const ModalFooter = () => (
        <div className="shrink-0 border-t bg-muted/20 px-4 py-4">
            <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row sm:gap-4">
                <Button
                    onClick={onClose}
                    size="sm"
                    className="w-full sm:w-auto sm:min-w-[100px]"
                >
                    {t('return_details_modal.close')}
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
                        <RotateCcw className="h-5 w-5 text-primary" />
                        {t('return_details_modal.title')}
                    </DialogTitle>
                </DialogHeader>

                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
                    {loading ? (
                        <LoadingState />
                    ) : (
                        <div className="space-y-6">
                            {/* Return Overview Cards */}
                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                <ReturnInfo />
                                <ReturnSummary />
                            </div>

                            {/* Return Items */}
                            <ReturnItems />
                        </div>
                    )}
                </div>

                <ModalFooter />
            </DialogContent>
        </Dialog>
    );
}
