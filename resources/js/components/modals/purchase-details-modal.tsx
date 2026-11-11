import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useTranslation } from '@/hooks/use-translation';
import { formatCurrency } from '@/lib/currency';
import { formatDatePart, formatDateTimeDisplay } from '@/lib/datetime';
import { purchaseService, type Purchase } from '@/services/business/purchaseService';
import {
    Calendar,
    CheckCircle2,
    Clock,
    DollarSign,
    FileText,
    Hash,
    Loader2,
    Package,
    Printer,
    Receipt,
    Scale,
    ShoppingBag,
    Truck,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';

interface PurchaseDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    purchaseId: number | null;
}

export function PurchaseDetailsModal({
    isOpen,
    onClose,
    purchaseId,
}: PurchaseDetailsModalProps) {
    const { t } = useTranslation();
    const [purchase, setPurchase] = useState<Purchase | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const printRef = useRef<HTMLDivElement>(null);

    // Load purchase details when modal opens
    useEffect(() => {
        const loadPurchaseDetails = async () => {
            if (!purchaseId) return;

            setLoading(true);
            setError(null);

            try {
                const response = await purchaseService.getPurchase(purchaseId);
                if (response.success && response.data) {
                    setPurchase(response.data);
                } else {
                    setError(
                        response.message || t('purchase_details_modal.failed_to_load_details'),
                    );
                }
            } catch (err: unknown) {
                setError(
                    err instanceof Error
                        ? err.message
                        : t('purchase_details_modal.failed_to_load_details'),
                );
            } finally {
                setLoading(false);
            }
        };

        if (isOpen && purchaseId) {
            loadPurchaseDetails();
        }
    }, [isOpen, purchaseId, t]);

    const handleClose = () => {
        setPurchase(null);
        setError(null);
        onClose();
    };

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Purchase_${purchase?.invoice_id}_${new Date().toISOString().split('T')[0]}`,
        onAfterPrint: () => {},
        pageStyle: `
            @page {
                margin: 0.5in;
                size: A4;
            }
            body {
                font-family: 'KurdishFont', 'Noto Sans Arabic', 'Segoe UI', 'Arial Unicode MS', 'Arial', sans-serif !important;
                font-size: 12pt;
                line-height: 1.4;
                color: #000;
            }
        `,
    });

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent
                className="max-h-[90vh] overflow-y-auto [&>button]:hidden"
                style={{
                    zIndex: 9999,
                    maxWidth: '75vw',
                    width: '1100px',
                }}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5" />
                        {t('purchase_details_modal.title')}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="space-y-3 text-center">
                                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                <p className="text-muted-foreground">
                                    {t('purchase_details_modal.loading_details')}
                                </p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="py-16 text-center">
                            <div className="inline-block rounded-lg border border-destructive/20 bg-destructive/10 p-4">
                                <p className="font-medium text-destructive">
                                    {error}
                                </p>
                            </div>
                        </div>
                    ) : purchase ? (
                        <>
                            {/* Purchase Header Cards */}
                            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                                {/* Basic Info Card */}
                                <Card className="border-border/50 shadow-sm">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="flex items-center gap-2 text-sm">
                                            <Receipt className="h-3.5 w-3.5 text-primary" />
                                            {t('purchase_details_modal.purchase_information')}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-sm">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <Hash className="h-3 w-3" />
                                                {t('purchase_details_modal.invoice_name')}
                                            </div>
                                            <span className="font-medium">
                                                {purchase.invoice_name}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <FileText className="h-3 w-3" />
                                                {t('purchase_details_modal.invoice_id')}
                                            </div>
                                            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                                                {purchase.invoice_id}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <Calendar className="h-3 w-3" />
                                                {t('purchase_details_modal.purchase_date')}
                                            </div>
                                            <span>
                                                {formatDatePart(
                                                    purchase.created_at,
                                                    t('purchase_details_modal.unknown'),
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                {purchase.status === 'order' ? (
                                                    <Clock className="h-3 w-3" />
                                                ) : (
                                                    <CheckCircle2 className="h-3 w-3" />
                                                )}
                                                {t('purchase_details_modal.status')}
                                            </div>
                                            <Badge
                                                variant="secondary"
                                                className={
                                                    purchase.status === 'order'
                                                        ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                                                        : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                }
                                            >
                                                {purchase.status === 'order'
                                                    ? t('purchase_details_modal.order')
                                                    : t('purchase_details_modal.received')}
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Summary Card */}
                                <Card className="border-border/50 shadow-sm">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="flex items-center gap-2 text-sm">
                                            <DollarSign className="h-3.5 w-3.5 text-primary" />
                                            {t('purchase_details_modal.summary')}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-sm">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <Package className="h-3 w-3" />
                                                {t('purchase_details_modal.total_items')}
                                            </div>
                                            <span className="font-semibold">
                                                {purchase.total_orders}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <DollarSign className="h-3 w-3" />
                                                {t('purchase_details_modal.total_amount')}
                                            </div>
                                            <span className="font-semibold text-primary">
                                                {formatCurrency(
                                                    Number(
                                                        purchase.total_amount ||
                                                            0,
                                                    ),
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <Truck className="h-3 w-3" />
                                                {t('purchase_details_modal.suppliers')}
                                            </div>
                                            <span className="font-medium">
                                                {purchase.items
                                                    ? new Set(
                                                          purchase.items
                                                              .map(
                                                                  (i) =>
                                                                      i.supplier_name,
                                                              )
                                                              .filter(Boolean),
                                                      ).size
                                                    : 0}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <Calendar className="h-3 w-3" />
                                                {t('purchase_details_modal.created')}
                                            </div>
                                            <span className="text-xs">
                                                {formatDateTimeDisplay(
                                                    purchase.created_at,
                                                    t('purchase_details_modal.unknown'),
                                                )}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Purchase Items */}
                            <Card className="border-border/50 shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center gap-2 text-sm">
                                        <Package className="h-3.5 w-3.5 text-primary" />
                                        {t('purchase_details_modal.purchase_items')}
                                        <Badge
                                            variant="secondary"
                                            className="ml-auto text-xs"
                                        >
                                            {t('purchase_details_modal.items_count', { count: purchase.items?.length || 0 })}
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-0">
                                    {purchase.items &&
                                    purchase.items.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b border-border/50">
                                                        <th className="px-4 py-2 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                                            {t('purchase_details_modal.table_headers.product')}
                                                        </th>
                                                        <th className="px-4 py-2 text-center text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                                            {t('purchase_details_modal.table_headers.type')}
                                                        </th>
                                                        <th className="px-4 py-2 text-center text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                                            {t('purchase_details_modal.table_headers.identifier')}
                                                        </th>
                                                        <th className="px-4 py-2 text-center text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                                            {t('purchase_details_modal.table_headers.supplier')}
                                                        </th>
                                                        <th className="px-4 py-2 text-center text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                                            {t('purchase_details_modal.table_headers.quantity')}
                                                        </th>
                                                        <th className="px-4 py-2 text-center text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                                            {t('purchase_details_modal.table_headers.cost')}
                                                        </th>
                                                        <th className="px-4 py-2 text-center text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                                            {t('purchase_details_modal.table_headers.sell')}
                                                        </th>
                                                        <th className="px-4 py-2 text-center text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                                            {t('purchase_details_modal.table_headers.total')}
                                                        </th>
                                                        <th className="px-4 py-2 text-center text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                                            {t('purchase_details_modal.table_headers.profit')}
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border/30">
                                                    {purchase.items
                                                        .sort((a, b) => {
                                                            // Sort by supplier name first, then by product name
                                                            const supplierA =
                                                                a.supplier_name ||
                                                                t('purchase_details_modal.no_supplier');
                                                            const supplierB =
                                                                b.supplier_name ||
                                                                t('purchase_details_modal.no_supplier');
                                                            if (
                                                                supplierA !==
                                                                supplierB
                                                            ) {
                                                                return supplierA.localeCompare(
                                                                    supplierB,
                                                                );
                                                            }
                                                            return a.product_name.localeCompare(
                                                                b.product_name,
                                                            );
                                                        })
                                                        .map((item) => (
                                                            <tr
                                                                key={item.id}
                                                                className="transition-colors duration-150 hover:bg-muted/30"
                                                            >
                                                                <td className="px-4 py-3">
                                                                    <div className="text-sm font-medium">
                                                                        {
                                                                            item.product_name
                                                                        }
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={
                                                                            item.product_type ===
                                                                            'scale_product'
                                                                                ? 'border-orange-200 bg-orange-50 text-xs text-orange-700'
                                                                                : 'border-primary-200 bg-primary-50 text-xs text-[#1F3F3F]/70'
                                                                        }
                                                                    >
                                                                        {item.product_type ===
                                                                        'scale_product' ? (
                                                                            <Scale className="mr-1 h-2.5 w-2.5" />
                                                                        ) : (
                                                                            <Package className="mr-1 h-2.5 w-2.5" />
                                                                        )}
                                                                        {item.product_type ===
                                                                        'scale_product'
                                                                            ? t('purchase_details_modal.scale')
                                                                            : t('purchase_details_modal.normal')}
                                                                    </Badge>
                                                                </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                                                                        {
                                                                            item.identifier
                                                                        }
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <div className="flex items-center justify-center gap-1">
                                                                        <Truck className="h-2.5 w-2.5 text-muted-foreground" />
                                                                        <span className="text-xs font-medium">
                                                                            {item.supplier_name ||
                                                                                t('purchase_details_modal.no_supplier')}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <span className="text-sm font-medium">
                                                                        {Number(
                                                                            item.quantity ||
                                                                                0,
                                                                        )}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <span className="text-xs">
                                                                        {formatCurrency(
                                                                            Number(
                                                                                item.cost_price ||
                                                                                    0,
                                                                            ),
                                                                        )}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <span className="text-xs">
                                                                        {formatCurrency(
                                                                            Number(
                                                                                item.sell_price ||
                                                                                    0,
                                                                            ),
                                                                        )}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <span className="text-sm font-semibold">
                                                                        {formatCurrency(
                                                                            Number(
                                                                                item.total_cost ||
                                                                                    0,
                                                                            ),
                                                                        )}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <Badge
                                                                        variant={
                                                                            Number(
                                                                                item.profit_margin,
                                                                            ) >
                                                                            0
                                                                                ? 'default'
                                                                                : 'destructive'
                                                                        }
                                                                        className="text-xs"
                                                                    >
                                                                        {Number(
                                                                            item.profit_margin ||
                                                                                0,
                                                                        ).toFixed(
                                                                            1,
                                                                        )}
                                                                        %
                                                                    </Badge>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="py-12 text-center text-muted-foreground">
                                            <Package className="mx-auto mb-4 h-12 w-12 opacity-50" />
                                            <p>
                                                {t('purchase_details_modal.no_items_found')}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </>
                    ) : null}
                </div>

                {/* Hidden Print Component */}
                <div style={{ display: 'none' }}>
                    <div
                        ref={printRef}
                        className="print-content"
                        style={{ minHeight: '200px' }}
                    >
                        <style>{`
                            @media print {
                                @page {
                                    margin: 0.5in;
                                    size: A4;
                                }
                                body {
                                    font-family: 'KurdishFont', 'Noto Sans Arabic', 'Segoe UI', 'Arial Unicode MS', 'Arial', sans-serif !important;
                                    font-size: 12pt;
                                    line-height: 1.4;
                                    color: #000;
                                }
                                .print-content {
                                    width: 100%;
                                    max-width: none;
                                }
                                .no-print {
                                    display: none !important;
                                }
                                .print-header {
                                    background: linear-gradient(135deg, #3b82f6, #1d4ed8) !important;
                                    color: white !important;
                                    padding: 25px;
                                    text-align: center;
                                    margin-bottom: 25px;
                                    border-radius: 8px;
                                    -webkit-print-color-adjust: exact;
                                    print-color-adjust: exact;
                                }
                                .print-info-box {
                                    background: #f8fafc !important;
                                    border: 1px solid #e2e8f0;
                                    padding: 20px;
                                    margin-bottom: 25px;
                                    border-radius: 8px;
                                    -webkit-print-color-adjust: exact;
                                    print-color-adjust: exact;
                                }
                                .print-summary {
                                    background: #3b82f6 !important;
                                    color: white !important;
                                    padding: 15px 20px;
                                    margin-bottom: 25px;
                                    border-radius: 8px;
                                    -webkit-print-color-adjust: exact;
                                    print-color-adjust: exact;
                                }
                                .print-table {
                                    width: 100%;
                                    border-collapse: collapse;
                                    margin: 20px 0;
                                }
                                .print-table th,
                                .print-table td {
                                    padding: 10px;
                                    border: 1px solid #e2e8f0;
                                    text-align: left;
                                }
                                .print-table th {
                                    background: #f8fafc !important;
                                    font-weight: bold;
                                    -webkit-print-color-adjust: exact;
                                    print-color-adjust: exact;
                                }
                                .print-table tr:nth-child(even) {
                                    background: #f9fafb !important;
                                    -webkit-print-color-adjust: exact;
                                    print-color-adjust: exact;
                                }
                                .print-total {
                                    text-align: right;
                                    margin-top: 20px;
                                    padding-top: 15px;
                                    border-top: 2px solid #3b82f6;
                                    font-size: 16pt;
                                    font-weight: bold;
                                }
                                .status-order {
                                    background: #fbbf24 !important;
                                    color: white !important;
                                    padding: 4px 12px;
                                    border-radius: 12px;
                                    font-size: 10pt;
                                    font-weight: bold;
                                    -webkit-print-color-adjust: exact;
                                    print-color-adjust: exact;
                                }
                                .status-received {
                                    background: #10b981 !important;
                                    color: white !important;
                                    padding: 4px 12px;
                                    border-radius: 12px;
                                    font-size: 10pt;
                                    font-weight: bold;
                                    -webkit-print-color-adjust: exact;
                                    print-color-adjust: exact;
                                }
                            }
                        `}</style>
                        {purchase ? (
                            <div>
                                {/* Header */}
                                <div className="print-header">
                                    <h1
                                        style={{
                                            margin: 0,
                                            fontSize: '24pt',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {t('purchase_details_modal.print_header')}
                                    </h1>
                                    <h2
                                        style={{
                                            margin: '10px 0 0 0',
                                            fontSize: '16pt',
                                            fontWeight: 'normal',
                                        }}
                                    >
                                        {purchase.invoice_name}
                                    </h2>
                                </div>

                                {/* Invoice Details */}
                                <div className="print-info-box">
                                    <h3
                                        style={{
                                            margin: '0 0 15px 0',
                                            fontSize: '14pt',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {t('purchase_details_modal.invoice_details_title')}
                                    </h3>
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginBottom: '10px',
                                        }}
                                    >
                                        <span>{t('purchase_details_modal.invoice_id_label')}</span>
                                        <span style={{ fontWeight: 'bold' }}>
                                            {purchase.invoice_id}
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginBottom: '10px',
                                        }}
                                    >
                                        <span>{t('purchase_details_modal.purchase_date_label')}</span>
                                        <span>
                                            {formatDatePart(
                                                purchase.created_at,
                                                t('purchase_details_modal.unknown'),
                                            )}
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                        }}
                                    >
                                        <span>{t('purchase_details_modal.status_label')}</span>
                                        <span
                                            className={
                                                purchase.status === 'order'
                                                    ? 'status-order'
                                                    : 'status-received'
                                            }
                                        >
                                            {purchase.status === 'order'
                                                ? t('purchase_details_modal.order')
                                                : t('purchase_details_modal.received')}
                                        </span>
                                    </div>
                                </div>

                                {/* Summary */}
                                <div className="print-summary">
                                    <h3
                                        style={{
                                            margin: '0 0 10px 0',
                                            fontSize: '14pt',
                                        }}
                                    >
                                        {t('purchase_details_modal.summary_title')}
                                    </h3>
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                        }}
                                    >
                                        <span>
                                            {t('purchase_details_modal.summary_total_items')}{' '}
                                            <strong>
                                                {purchase.total_orders}
                                            </strong>
                                        </span>
                                        <span>
                                            {t('purchase_details_modal.summary_total_amount')}{' '}
                                            <strong>
                                                {formatCurrency(
                                                    Number(
                                                        purchase.total_amount ||
                                                            0,
                                                    ),
                                                )}
                                            </strong>
                                        </span>
                                    </div>
                                </div>

                                {/* Items Table */}
                                <div>
                                    <h3
                                        style={{
                                            marginBottom: '15px',
                                            fontSize: '14pt',
                                        }}
                                    >
                                        {t('purchase_details_modal.items_title', {
                                            count: purchase.items?.length || 0,
                                        })}
                                    </h3>
                                    <table className="print-table">
                                        <thead>
                                            <tr>
                                                <th>{t('purchase_details_modal.items_table.product_name')}</th>
                                                <th
                                                    style={{
                                                        textAlign: 'center',
                                                    }}
                                                >
                                                    {t('purchase_details_modal.items_table.quantity')}
                                                </th>
                                                <th
                                                    style={{
                                                        textAlign: 'right',
                                                    }}
                                                >
                                                    {t('purchase_details_modal.items_table.cost_price')}
                                                </th>
                                                <th
                                                    style={{
                                                        textAlign: 'right',
                                                    }}
                                                >
                                                    {t('purchase_details_modal.items_table.total_cost')}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {purchase.items?.map((item) => (
                                                <tr key={item.id}>
                                                    <td>{item.product_name}</td>
                                                    <td
                                                        style={{
                                                            textAlign: 'center',
                                                        }}
                                                    >
                                                        {Number(
                                                            item.quantity || 0,
                                                        )}
                                                    </td>
                                                    <td
                                                        style={{
                                                            textAlign: 'right',
                                                        }}
                                                    >
                                                        {formatCurrency(
                                                            Number(
                                                                item.cost_price ||
                                                                    0,
                                                            ),
                                                        )}
                                                    </td>
                                                    <td
                                                        style={{
                                                            textAlign: 'right',
                                                            fontWeight: 'bold',
                                                        }}
                                                    >
                                                        {formatCurrency(
                                                            Number(
                                                                item.total_cost ||
                                                                    0,
                                                            ),
                                                        )}
                                                    </td>
                                                </tr>
                                            )) || (
                                                <tr>
                                                    <td
                                                        colSpan={4}
                                                        style={{
                                                            textAlign: 'center',
                                                            padding: '20px',
                                                        }}
                                                    >
                                                        {t('purchase_details_modal.items_table.no_items')}
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Grand Total */}
                                <div className="print-total">
                                    {t('purchase_details_modal.grand_total_label')}{' '}
                                    {formatCurrency(
                                        Number(purchase.total_amount || 0),
                                    )}
                                </div>

                                {/* Footer */}
                                <div
                                    style={{
                                        textAlign: 'center',
                                        marginTop: '40px',
                                        fontSize: '10pt',
                                        color: '#666',
                                    }}
                                >
                                    {t('purchase_details_modal.generated_on', {
                                        date: new Date().toLocaleString(),
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div
                                style={{ padding: '20px', textAlign: 'center' }}
                            >
                                <p>{t('purchase_details_modal.no_data_for_printing')}</p>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="flex items-center justify-end gap-3">
                    <Button variant="outline" onClick={handleClose}>
                        {t('common.close')}
                    </Button>
                    <Button onClick={handlePrint} disabled={!purchase}>
                        <Printer className="mr-2 h-4 w-4" />
                        {t('common.print')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
