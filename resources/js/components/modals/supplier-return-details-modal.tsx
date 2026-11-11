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
import {
    AlertCircle,
    Calendar,
    Clock,
    DollarSign,
    FileText,
    Hash,
    Loader2,
    Package,
    RotateCcw,
    Tag,
    TrendingUp,
    User,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface SupplierReturnDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    returnId: number | null;
}

interface SupplierReturnItem {
    id: number;
    product_name: string;
    identifier: string;
    product_type: 'product' | 'scale_product';
    cost_price: number;
    sell_price: number;
    return_quantity: number;
    return_amount: number;
}

interface SupplierReturn {
    id: number;
    original_order_id: string;
    original_order_name: string;
    return_reason: string;
    total_amount: number;
    items_count: number;
    created_at: string;
    user?: {
        id: number;
        name: string;
        username: string;
    };
    items?: SupplierReturnItem[];
}

export function SupplierReturnDetailsModal({
    isOpen,
    onClose,
    returnId,
}: SupplierReturnDetailsModalProps) {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [detailedReturn, setDetailedReturn] = useState<SupplierReturn | null>(null);
    const [loading, setLoading] = useState(false);

    // Load detailed return data
    useEffect(() => {
        const loadReturnDetails = async () => {
            if (!returnId) return;

            setLoading(true);
            try {
                const response = await fetch(`/api/supplier-returns/${returnId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch supplier return details');
                }

                const result = await response.json();

                if (result.success) {
                    setDetailedReturn(result.data);
                } else {
                    throw new Error(result.message || 'Failed to load details');
                }
            } catch (error: unknown) {
                toast({
                    title: t('supplier_return_details.error'),
                    description:
                        error instanceof Error
                            ? error.message
                            : t('supplier_return_details.failed_to_load'),
                    type: 'error',
                });
            } finally {
                setLoading(false);
            }
        };

        if (isOpen && returnId) {
            loadReturnDetails();
        }
    }, [isOpen, returnId, toast, t]);

    // Handle keyboard events
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (!isOpen) return;

            if (event.key === 'Enter' || event.key === 'Escape') {
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
        <Card className="shadow-[0_-2px_8px_0_rgba(0,0,0,0.1),0_2px_8px_0_rgba(0,0,0,0.1)] dark:shadow-[0_-2px_8px_0_rgba(0,0,0,0.3),0_2px_8px_0_rgba(0,0,0,0.3)]">
            <CardHeader className="px-4 py-4 pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <Hash className="h-4 w-4 text-primary" />
                    {t('supplier_return_details.return_information')}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4">
                <InfoRow
                    icon={<RotateCcw className="h-3 w-3" />}
                    label={t('supplier_return_details.return_id')}
                    value={`#${detailedReturn?.id}`}
                    valueClassName="font-mono font-medium text-primary"
                />
                <InfoRow
                    icon={<FileText className="h-3 w-3" />}
                    label={t('supplier_return_details.order_id')}
                    value={detailedReturn?.original_order_id || '-'}
                    valueClassName="font-mono font-medium"
                />
                <InfoRow
                    icon={<Package className="h-3 w-3" />}
                    label={t('supplier_return_details.order_name')}
                    value={detailedReturn?.original_order_name || '-'}
                />
                <InfoRow
                    icon={<User className="h-3 w-3" />}
                    label={t('supplier_return_details.processed_by')}
                    value={detailedReturn?.user?.name || '-'}
                />
                <InfoRow
                    icon={<Calendar className="h-3 w-3" />}
                    label={t('supplier_return_details.return_date')}
                    value={
                        detailedReturn?.created_at
                                                        ? formatDatePart(
                                                                    detailedReturn.created_at,
                                                                    t('supplier_return_details_modal.unknown'),
                                                            )
                            : '-'
                    }
                />
                <InfoRow
                    icon={<Clock className="h-3 w-3" />}
                    label={t('supplier_return_details.return_time')}
                    value={
                        detailedReturn?.created_at
                                                        ? formatTimePart(
                                                                    detailedReturn.created_at,
                                                                    t('supplier_return_details_modal.unknown'),
                                                            )
                            : '-'
                    }
                />
            </CardContent>
        </Card>
    );

    // Return Summary Card Component
    const ReturnSummary = () => (
        <Card className="shadow-[0_-2px_8px_0_rgba(0,0,0,0.1),0_2px_8px_0_rgba(0,0,0,0.1)] dark:shadow-[0_-2px_8px_0_rgba(0,0,0,0.3),0_2px_8px_0_rgba(0,0,0,0.3)]">
            <CardHeader className="px-4 py-4 pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    {t('supplier_return_details.return_summary')}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4">
                <InfoRow
                    icon={<DollarSign className="h-3 w-3" />}
                    label={t('supplier_return_details.total_amount')}
                    value={formatCurrency(detailedReturn?.total_amount || 0)}
                    valueClassName="font-bold text-green-600 dark:text-green-400"
                />
                <div className="flex items-center justify-between border-t pt-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Package className="h-3 w-3" />
                        {t('supplier_return_details.items_count')}
                    </div>
                    <Badge variant="secondary">
                        {detailedReturn?.items?.length || 0} {t('supplier_returns.items')}
                    </Badge>
                </div>
            </CardContent>
        </Card>
    );

    // Return Reason Card Component
    const ReturnReason = () => (
        <Card className="shadow-[0_-2px_8px_0_rgba(0,0,0,0.1),0_2px_8px_0_rgba(0,0,0,0.1)] dark:shadow-[0_-2px_8px_0_rgba(0,0,0,0.3),0_2px_8px_0_rgba(0,0,0,0.3)]">
            <CardHeader className="px-4 py-4 pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <AlertCircle className="h-4 w-4 text-primary" />
                    {t('supplier_return_details.return_reason')}
                </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
                <p className="text-sm text-muted-foreground">
                    {detailedReturn?.return_reason || '-'}
                </p>
            </CardContent>
        </Card>
    );

    // Return Items Table Row Component
    const ReturnItemTableRow = ({
        item,
        index,
    }: {
        item: SupplierReturnItem;
        index: number;
    }) => (
        <tr
            key={`table-${index}`}
            className="border-b border-border/30 transition-colors last:border-b-0 hover:bg-muted/20"
        >
            <td className="px-4 py-3">
                <div>
                    <div className="text-sm font-medium">{item.product_name}</div>
                    <div className="mt-1 font-mono text-xs text-muted-foreground">
                        {item.identifier}
                    </div>
                    <div className="mt-1 flex items-center gap-1">
                        <Tag className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground capitalize">
                            {item.product_type === 'scale_product' ? 'Scale Product' : 'Product'}
                        </span>
                    </div>
                </div>
            </td>
            <td className="px-2 py-3 text-right">
                <span className="font-mono text-sm">
                    {formatCurrency(item.cost_price)}
                </span>
            </td>
            <td className="px-2 py-3 text-right">
                <span className="font-mono text-sm">
                    {formatCurrency(item.sell_price)}
                </span>
            </td>
            <td className="px-2 py-3 text-center">
                <Badge variant="secondary" className="text-xs">
                    {item.return_quantity}
                </Badge>
            </td>
            <td className="px-4 py-3 text-right">
                <span className="font-mono font-semibold text-primary">
                    {formatCurrency(item.return_amount)}
                </span>
            </td>
        </tr>
    );

    // Return Items Mobile Card Component
    const ReturnItemMobileCard = ({
        item,
        index,
    }: {
        item: SupplierReturnItem;
        index: number;
    }) => (
        <div
            key={`mobile-${index}`}
            className="rounded-lg border border-border/30 bg-muted/10 p-3"
        >
            <div className="mb-3">
                <div className="mb-1 line-clamp-2 text-sm font-medium">
                    {item.product_name}
                </div>
                <div className="mb-1 font-mono text-xs text-muted-foreground">
                    {item.identifier}
                </div>
                <div className="flex items-center gap-1">
                    <Tag className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground capitalize">
                        {item.product_type === 'scale_product' ? 'Scale Product' : 'Product'}
                    </span>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                    <div className="mb-1 text-muted-foreground">
                        {t('supplier_return_details.cost_price')}
                    </div>
                    <div className="font-mono font-medium">
                        {formatCurrency(item.cost_price)}
                    </div>
                </div>
                <div>
                    <div className="mb-1 text-muted-foreground">
                        {t('supplier_return_details.sell_price')}
                    </div>
                    <div className="font-mono font-medium">
                        {formatCurrency(item.sell_price)}
                    </div>
                </div>
                <div>
                    <div className="mb-1 text-muted-foreground">
                        {t('supplier_return_details.quantity')}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                        {item.return_quantity}
                    </Badge>
                </div>
                <div className="text-right">
                    <div className="mb-1 text-muted-foreground">
                        {t('supplier_return_details.amount')}
                    </div>
                    <div className="font-mono text-sm font-semibold text-primary">
                        {formatCurrency(item.return_amount)}
                    </div>
                </div>
            </div>
        </div>
    );

    // Return Items Card Component
    const ReturnItems = () => (
        <Card className="shadow-[0_-2px_8px_0_rgba(0,0,0,0.1),0_2px_8px_0_rgba(0,0,0,0.1)] dark:shadow-[0_-2px_8px_0_rgba(0,0,0,0.3),0_2px_8px_0_rgba(0,0,0,0.3)]">
            <CardHeader className="px-4 py-4">
                <CardTitle className="flex items-center justify-between text-sm font-medium">
                    <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-primary" />
                        {t('supplier_return_details.returned_items')}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                        {detailedReturn?.items?.length || 0} {t('supplier_returns.items')}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
                {detailedReturn?.items && detailedReturn.items.length > 0 ? (
                    <>
                        {/* Desktop/Tablet Table View */}
                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border/50">
                                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                                            {t('supplier_return_details.product')}
                                        </th>
                                        <th className="px-2 py-2 text-right text-xs font-medium text-muted-foreground">
                                            {t('supplier_return_details.cost_price')}
                                        </th>
                                        <th className="px-2 py-2 text-right text-xs font-medium text-muted-foreground">
                                            {t('supplier_return_details.sell_price')}
                                        </th>
                                        <th className="px-2 py-2 text-center text-xs font-medium text-muted-foreground">
                                            {t('supplier_return_details.quantity')}
                                        </th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">
                                            {t('supplier_return_details.amount')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detailedReturn.items.map((item, index) => (
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
                            {detailedReturn.items.map((item, index) => (
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
                            {t('supplier_return_details.no_items')}
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
                    Loading return details...
                </p>
            </div>
        </div>
    );

    // Modal Footer Component
    const ModalFooter = () => (
        <div className="shrink-0 border-t bg-muted/20 px-4 py-4">
            <div className="flex justify-end">
                <Button
                    onClick={onClose}
                    size="sm"
                    className="w-full sm:w-auto sm:min-w-[100px]"
                >
                    {t('supplier_return_details.close')}
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
                        {t('supplier_return_details.title')}
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

                            {/* Return Reason */}
                            <ReturnReason />

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
