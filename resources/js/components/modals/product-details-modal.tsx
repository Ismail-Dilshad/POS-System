import { Badge } from '@/components/ui/badge';
import { ItemThumbnail } from '@/components/layout/item-thumbnail';
import { getItemImageUrl } from '@/lib/item-image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/currency';
import { type InventoryItem } from '@/services/business/inventoryService';
import {
    purchaseService,
    type PurchaseHistoryByProductData,
} from '@/services/business/purchaseService';
import { transactionService } from '@/services/business/transactionService';
import {
    AlertTriangle,
    ArrowDownToLine,
    ArrowUpFromLine,
    BarChart3,
    Calendar,
    CheckCircle,
    CreditCard,
    DollarSign,
    Hash,
    Loader2,
    Package,
    Scale,
    Tag,
    TrendingDown,
    TrendingUp,
    Truck,
    Weight,
    XCircle,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface SalesHistoryData {
    barcode: string;
    name: string;
    total_sold: number;
    last_price: number;
    first_sold: string;
    last_sold: string;
    transactions: Array<{
        id: number;
        transaction_number: string;
        date: string;
        quantity: number;
        price: number;
        total: number;
    }>;
}

interface ProductDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: InventoryItem | null;
}

// Helper function to safely extract string property
const safeString = (
    value: unknown,
    fallback: string | (() => string) = 'Unknown',
): string => {
    if (value === null || value === undefined) {
        return typeof fallback === 'function' ? fallback() : fallback;
    }
    return String(value);
};

// Helper function to safely extract date
const safeDate = (value: unknown): Date | null => {
    if (!value) return null;
    try {
        return new Date(String(value));
    } catch {
        return null;
    }
};

// Icon mapping functions
const getProductTypeIcon = (productType: string): React.JSX.Element => {
    switch (productType) {
        case 'product':
            return <Package className="h-5 w-5" />;
        case 'scale_product':
            return <Scale className="h-5 w-5" />;
        case 'card':
            return <CreditCard className="h-5 w-5" />;
        default:
            return <Package className="h-5 w-5" />;
    }
};

const getProductTypeLabel = (
    productType: string,
    t: (key: string) => string,
): string => {
    switch (productType) {
        case 'product':
            return t('product_details_modal.product_types.normal_product');
        case 'scale_product':
            return t('product_details_modal.product_types.scale_product');
        case 'card':
            return t('product_details_modal.product_types.card');
        default:
            return t('product_details_modal.product_types.product');
    }
};

const getProductTypeColor = (productType: string): string => {
    switch (productType) {
        case 'product':
            return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        case 'scale_product':
            return 'bg-amber-50 text-amber-700 border-amber-200';
        case 'card':
            return 'bg-violet-50 text-violet-700 border-violet-200';
        default:
            return 'bg-gray-50 text-gray-700 border-gray-200';
    }
};

// Accent palette used to beautify the modal per product type
const useAccentScheme = (productType: string) => {
    return useMemo(() => {
        if (productType === 'product') {
            return {
                headerFrom: 'from-emerald-50',
                headerTo: 'to-emerald-100',
                border: 'border-emerald-200',
                ring: 'ring-emerald-200/60',
                title: 'text-emerald-700',
                iconBg: 'bg-emerald-100 text-emerald-700',
                highlight: 'text-emerald-700',
            };
        }
        if (productType === 'scale_product') {
            return {
                headerFrom: 'from-amber-50',
                headerTo: 'to-amber-100',
                border: 'border-amber-200',
                ring: 'ring-amber-200/60',
                title: 'text-amber-700',
                iconBg: 'bg-amber-100 text-amber-700',
                highlight: 'text-amber-700',
            };
        }
        if (productType === 'card') {
            return {
                headerFrom: 'from-violet-50',
                headerTo: 'to-violet-100',
                border: 'border-violet-200',
                ring: 'ring-violet-200/60',
                title: 'text-violet-700',
                iconBg: 'bg-violet-100 text-violet-700',
                highlight: 'text-violet-700',
            };
        }
        return {
            headerFrom: 'from-slate-50',
            headerTo: 'to-slate-100',
            border: 'border-slate-200',
            ring: 'ring-slate-200/60',
            title: 'text-slate-700',
            iconBg: 'bg-slate-100 text-slate-700',
            highlight: 'text-slate-700',
        };
    }, [productType]);
};

const getStatusIcon = (status: string): React.JSX.Element => {
    switch (status) {
        case 'active':
            return <CheckCircle className="h-4 w-4 text-green-600" />;
        case 'low_stock':
            return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
        case 'out_of_stock':
            return <XCircle className="h-4 w-4 text-red-600" />;
        case 'inactive':
            return <XCircle className="h-4 w-4 text-gray-600" />;
        default:
            return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
};

const getStatusColor = (status: string): string => {
    switch (status) {
        case 'active':
            return 'bg-green-50 text-green-700 border-green-200';
        case 'low_stock':
            return 'bg-yellow-50 text-yellow-700 border-yellow-200';
        case 'out_of_stock':
            return 'bg-red-50 text-red-700 border-red-200';
        case 'inactive':
            return 'bg-gray-50 text-gray-700 border-gray-200';
        default:
            return 'bg-green-50 text-green-700 border-green-200';
    }
};

const getStatusLabel = (status: string, t: (key: string) => string): string => {
    switch (status) {
        case 'active':
            return t('product_details_modal.status.active');
        case 'low_stock':
            return t('product_details_modal.status.low_stock');
        case 'out_of_stock':
            return t('product_details_modal.status.out_of_stock');
        case 'inactive':
            return t('product_details_modal.status.inactive');
        default:
            return t('product_details_modal.status.active');
    }
};

// Info row component for consistent styling (compact)
interface InfoRowProps {
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
    className?: string;
}

const InfoRow: React.FC<InfoRowProps> = ({
    icon,
    label,
    value,
    className = '',
}) => (
    <div className={`flex items-center justify-between gap-2 py-0.5 text-sm ${className}`}>
        <div className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
            {icon}
            <span className="truncate">{label}</span>
        </div>
        <div className="shrink-0 text-right">{value}</div>
    </div>
);

export function ProductDetailsModal({
    isOpen,
    onClose,
    item,
}: ProductDetailsModalProps) {
    const { t } = useTranslation();
    const [loading] = useState(false);
    const [salesHistory, setSalesHistory] = useState<SalesHistoryData | null>(null);
    const [salesLoading, setSalesLoading] = useState(false);
    const [salesError, setSalesError] = useState<string | null>(null);
    const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistoryByProductData | null>(null);
    const [purchaseLoading, setPurchaseLoading] = useState(false);
    const [purchaseError, setPurchaseError] = useState<string | null>(null);

    const fetchSalesHistory = useCallback(async (identifier: string) => {
        setSalesLoading(true);
        setSalesError(null);
        setSalesHistory(null);
        try {
            const response = await transactionService.searchTransactionHistory(identifier);
            if (response.success && response.data) {
                setSalesHistory(response.data);
            } else {
                setSalesError(response.message || null);
            }
        } catch {
            setSalesError(t('product_details_modal.tracking.load_error_out'));
        } finally {
            setSalesLoading(false);
        }
    }, [t]);

    const fetchPurchaseHistory = useCallback(
        async (productId: number, productType: 'product' | 'scale_product') => {
            setPurchaseLoading(true);
            setPurchaseError(null);
            setPurchaseHistory(null);
            try {
                const response = await purchaseService.getPurchaseHistoryByProduct(
                    productId,
                    productType,
                );
                if (response.success && response.data) {
                    setPurchaseHistory(response.data);
                } else {
                    setPurchaseError(response.message || null);
                }
            } catch {
                setPurchaseError(t('product_details_modal.tracking.load_error_in'));
            } finally {
                setPurchaseLoading(false);
            }
        },
        [t],
    );

    useEffect(() => {
        if (!isOpen) {
            setSalesHistory(null);
            setSalesError(null);
            setPurchaseHistory(null);
            setPurchaseError(null);
            return;
        }
        if (item?.identifier?.trim()) {
            fetchSalesHistory(item.identifier.trim());
        }
        const isProductOrScale =
            item?.product_type === 'product' || item?.product_type === 'scale_product';
        if (isProductOrScale && item?.id) {
            fetchPurchaseHistory(item.id, item.product_type as 'product' | 'scale_product');
        }
    }, [isOpen, item?.id, item?.identifier, item?.product_type, fetchSalesHistory, fetchPurchaseHistory]);

    // Extract safe string values before conditional return
    const productType = useMemo(
        () => safeString(item?.product_type, ''),
        [item],
    );
    const status = useMemo(() => safeString(item?.status, ''), [item]);
    const identifierType = useMemo(
        () => safeString(item?.identifier_type),
        [item],
    );
    const identifier = useMemo(() => safeString(item?.identifier), [item]);

    // Memoize icons
    const statusIcon = useMemo(() => getStatusIcon(status), [status]);
    const productTypeIcon = useMemo(
        () => getProductTypeIcon(productType),
        [productType],
    );

    const accent = useAccentScheme(productType);

    // Extract secondary barcode safely
    const secondaryBarcode = useMemo(() => {
        if (
            item?.original_data &&
            'secondary_barcode' in item.original_data &&
            item.original_data.secondary_barcode
        ) {
            return safeString(item.original_data.secondary_barcode);
        }
        return t('product_details_modal.fallback_unknown');
    }, [item, t]);

    // Extract expire date safely
    const expireDate = useMemo(() => {
        if (item?.original_data && 'expire_date' in item.original_data) {
            return safeDate(item.original_data.expire_date);
        }
        return null;
    }, [item]);

    // Calculate expire status
    const expireStatus = useMemo(() => {
        if (!expireDate) return null;
        const today = new Date();
        const diffTime = expireDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return {
                label: t('product_details_modal.expire_status.expired'),
                variant: 'destructive' as const,
                className: 'text-xs',
            };
        } else if (diffDays <= 30) {
            return {
                label: t('product_details_modal.expire_status.expiring_soon'),
                variant: 'secondary' as const,
                className:
                    'text-xs bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:text-orange-300 dark:border-orange-800',
            };
        } else {
            return {
                label: t('product_details_modal.expire_status.valid'),
                variant: 'outline' as const,
                className:
                    'text-xs text-green-600 border-green-200 dark:text-green-400 dark:border-green-800',
            };
        }
    }, [expireDate, t]);

    if (!item) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="max-h-[90vh] overflow-hidden flex flex-col border-border bg-background [&>button]:hidden shadow-sm"
                style={{
                    zIndex: 9999,
                    maxWidth: 'min(92vw, 1000px)',
                    width: '1000px',
                }}
            >
                <DialogHeader className="shrink-0 border-b border-border bg-transparent px-3 py-2.5">
                    <DialogTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                        <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded ${accent.iconBg}`}>
                            {productTypeIcon}
                        </span>
                        {t('product_details_modal.title')}
                    </DialogTitle>
                </DialogHeader>

                <div className="min-h-0 flex-1 overflow-hidden flex flex-col">
                    {loading ? (
                        <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-2.5 max-h-[calc(90vh-7rem)]">
                            <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
                                {/* Basic Info Card */}
                                <Card className="border-border bg-card shadow-none">
                                    <CardHeader className="px-2.5 py-2">
                                        <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            <span className={`inline-flex h-5 w-5 items-center justify-center rounded ${accent.iconBg}`}>
                                                <Package className="h-3 w-3" />
                                            </span>
                                            {t('product_details_modal.product_info.section_title')}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-1.5 px-2.5 pb-2.5 text-sm">
                                        <div className="flex justify-center pb-3">
                                            <ItemThumbnail url={getItemImageUrl(item)} name={item.name} className="size-32 sm:size-40" />
                                        </div>
                                        <InfoRow
                                            icon={<Tag className="h-4 w-4 shrink-0" />}
                                            label={t(
                                                'product_details_modal.product_info.product_name',
                                            )}
                                            value={
                                                <span className="text-right font-medium">
                                                    {item.name}
                                                </span>
                                            }
                                        />

                                        <InfoRow
                                            icon={productTypeIcon}
                                            label={t(
                                                'product_details_modal.product_info.product_type',
                                            )}
                                            value={
                                                <Badge
                                                    variant="outline"
                                                    className={`text-xs ${getProductTypeColor(productType)}`}
                                                >
                                                    {getProductTypeLabel(
                                                        productType,
                                                        t,
                                                    )}
                                                </Badge>
                                            }
                                        />

                                        <InfoRow
                                            icon={statusIcon}
                                            label={t(
                                                'product_details_modal.product_info.status',
                                            )}
                                            value={
                                                <Badge
                                                    variant="outline"
                                                    className={`text-xs ${getStatusColor(status)}`}
                                                >
                                                    {getStatusLabel(status, t)}
                                                </Badge>
                                            }
                                        />

                                        <InfoRow
                                            icon={<Hash className="h-3 w-3" />}
                                            label={identifierType}
                                            value={
                                                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                                                    {identifier}
                                                </span>
                                            }
                                        />

                                        <InfoRow
                                            icon={<Hash className="h-3 w-3" />}
                                            label={t(
                                                'product_details_modal.product_info.secondary_barcode',
                                            )}
                                            value={
                                                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                                                    {secondaryBarcode}
                                                </span>
                                            }
                                        />

                                        {item.category && (
                                            <InfoRow
                                                icon={<span className={`inline-flex h-5 w-5 items-center justify-center rounded ${accent.iconBg}`}><Tag className="h-3 w-3" /></span>}
                                                label={t(
                                                    'product_details_modal.product_info.category',
                                                )}
                                                value={
                                                    <span className={`font-medium ${accent.highlight}`}>
                                                        {typeof item.category === 'string'
                                                            ? item.category
                                                            : (item.category as { name?: string })?.name ||
                                                              t('product_details_modal.fallback_unknown')}
                                                    </span>
                                                }
                                            />
                                        )}

                                        {item.supplier && (
                                            <InfoRow
                                                icon={
                                                    <Truck className="h-3 w-3" />
                                                }
                                                label={t(
                                                    'product_details_modal.product_info.supplier',
                                                )}
                                                value={
                                                    <span className="font-medium">
                                                        {typeof item.supplier ===
                                                        'string'
                                                            ? item.supplier
                                                            : (
                                                                  item.supplier as {
                                                                      name?: string;
                                                                  }
                                                              )?.name ||
                                                              t(
                                                                  'product_details_modal.fallback_unknown',
                                                              )}
                                                    </span>
                                                }
                                            />
                                        )}

                                        {expireDate && (
                                            <InfoRow
                                                icon={
                                                    <Calendar className="h-3 w-3" />
                                                }
                                                label={t(
                                                    'product_details_modal.product_info.expire_date',
                                                )}
                                                value={
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-medium">
                                                            {expireDate.toLocaleDateString()}
                                                        </span>
                                                        {expireStatus && (
                                                            <Badge
                                                                variant={
                                                                    expireStatus.variant
                                                                }
                                                                className={
                                                                    expireStatus.className
                                                                }
                                                            >
                                                                {
                                                                    expireStatus.label
                                                                }
                                                            </Badge>
                                                        )}
                                                    </div>
                                                }
                                            />
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Pricing & Stock Card */}
                                <Card className="border-border bg-card shadow-none">
                                    <CardHeader className="px-2.5 py-2">
                                        <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            <span className={`inline-flex h-5 w-5 items-center justify-center rounded ${accent.iconBg}`}>
                                                <DollarSign className="h-3 w-3" />
                                            </span>
                                            {t('product_details_modal.pricing_stock.section_title')}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-1.5 px-2.5 pb-2.5 text-sm">
                                        {item.stock !== undefined && (
                                            <InfoRow
                                                icon={
                                                    <Package className="h-3 w-3" />
                                                }
                                                label={t(
                                                    'product_details_modal.pricing_stock.current_stock',
                                                )}
                                                value={
                                                    <span className="font-semibold">
                                                        {item.stock}
                                                    </span>
                                                }
                                            />
                                        )}

                                        {item.min_stock !== undefined && (
                                            <InfoRow
                                                icon={
                                                    <AlertTriangle className="h-3 w-3" />
                                                }
                                                label={t(
                                                    'product_details_modal.pricing_stock.min_stock',
                                                )}
                                                value={
                                                    <span className="font-medium">
                                                        {item.min_stock}
                                                    </span>
                                                }
                                            />
                                        )}

                                        {item.per_carton && item.per_carton > 0 && (
                                            <InfoRow
                                                icon={<Package className="h-3 w-3" />}
                                                label={t('product_details_modal.pricing_stock.per_carton')}
                                                value={<span className="font-medium">{Number(item.per_carton)}</span>}
                                            />
                                        )}

                                        <InfoRow
                                            icon={<span className={`inline-flex h-5 w-5 items-center justify-center rounded ${accent.iconBg}`}><DollarSign className="h-3 w-3" /></span>}
                                            label={t(
                                                'product_details_modal.pricing_stock.cost_price',
                                            )}
                                            value={
                                                <span className="font-semibold">
                                                    {formatCurrency(
                                                        item.cost_price || 0,
                                                    )}
                                                </span>
                                            }
                                        />

                                        <InfoRow
                                            icon={<span className={`inline-flex h-5 w-5 items-center justify-center rounded ${accent.iconBg}`}><DollarSign className="h-3 w-3" /></span>}
                                            label={t(
                                                'product_details_modal.pricing_stock.sell_price',
                                            )}
                                            value={
                                                <span className={`font-semibold ${accent.title}`}>
                                                    {formatCurrency(
                                                        item.sell_price || 0,
                                                    )}
                                                </span>
                                            }
                                        />

                                        <InfoRow
                                            icon={
                                                <BarChart3 className="h-3 w-3" />
                                            }
                                            label={t(
                                                'product_details_modal.pricing_stock.profit_margin',
                                            )}
                                            value={
                                                <div className="flex items-center gap-1">
                                                    <span className="font-semibold">
                                                        {(
                                                            item.profit_margin ||
                                                            0
                                                        ).toFixed(1)}
                                                        %
                                                    </span>
                                                    {(item.profit_margin || 0) >
                                                    0 ? (
                                                        <TrendingUp className="h-3 w-3 text-green-600" />
                                                    ) : (
                                                        <TrendingDown className="h-3 w-3 text-red-600" />
                                                    )}
                                                </div>
                                            }
                                        />

                                        <InfoRow
                                            icon={<span className={`inline-flex h-5 w-5 items-center justify-center rounded ${accent.iconBg}`}><DollarSign className="h-3 w-3" /></span>}
                                            label={t(
                                                'product_details_modal.pricing_stock.profit_amount',
                                            )}
                                            value={
                                                <span className="font-semibold text-green-600">
                                                    {formatCurrency(
                                                        item.profit_amount || 0,
                                                    )}
                                                </span>
                                            }
                                        />
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Scale Product Details */}
                            {item.product_type === 'scale_product' &&
                                item.original_data &&
                                'scale_id' in item.original_data && (
                                    <Card className="border-border bg-card shadow-none">
                                        <CardHeader className="px-2.5 py-2">
                                            <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                <span className={`inline-flex h-5 w-5 items-center justify-center rounded ${accent.iconBg}`}>
                                                    <Scale className="h-3 w-3" />
                                                </span>
                                                {t('product_details_modal.scale_details.section_title')}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-1.5 px-2.5 pb-2.5 text-sm">
                                            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                                                <InfoRow
                                                    icon={
                                                        <Hash className="h-3 w-3" />
                                                    }
                                                    label={t(
                                                        'product_details_modal.scale_details.scale_id',
                                                    )}
                                                    value={
                                                        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                                                            {safeString(
                                                                'scale_id' in
                                                                    item.original_data
                                                                    ? item
                                                                          .original_data
                                                                          .scale_id
                                                                    : '',
                                                                () =>
                                                                    t(
                                                                        'product_details_modal.fallback_unknown',
                                                                    ),
                                                            )}
                                                        </span>
                                                    }
                                                />
                                                <InfoRow
                                                    icon={
                                                        <Hash className="h-3 w-3" />
                                                    }
                                                    label={t(
                                                        'product_details_modal.scale_details.plu',
                                                    )}
                                                    value={
                                                        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                                                            {safeString(
                                                                'plu' in
                                                                    item.original_data
                                                                    ? item
                                                                          .original_data
                                                                          .plu
                                                                    : '',
                                                                () =>
                                                                    t(
                                                                        'product_details_modal.fallback_unknown',
                                                                    ),
                                                            )}
                                                        </span>
                                                    }
                                                />
                                                <InfoRow
                                                    icon={
                                                        <Weight className="h-3 w-3" />
                                                    }
                                                    label={t(
                                                        'product_details_modal.scale_details.unit_type',
                                                    )}
                                                    value={
                                                        <span className="font-medium">
                                                            {safeString(
                                                                'unit_type' in
                                                                    item.original_data
                                                                    ? item
                                                                          .original_data
                                                                          .unit_type
                                                                    : '',
                                                                () =>
                                                                    t(
                                                                        'product_details_modal.fallback_unknown',
                                                                    ),
                                                            )}
                                                        </span>
                                                    }
                                                />
                                                <InfoRow
                                                    icon={
                                                        <Package className="h-3 w-3" />
                                                    }
                                                    label={t(
                                                        'product_details_modal.scale_details.scale_stock',
                                                    )}
                                                    value={
                                                        <span className="font-semibold">
                                                            {safeString(
                                                                'stock' in
                                                                    item.original_data
                                                                    ? item
                                                                          .original_data
                                                                          .stock
                                                                    : '0',
                                                            )}{' '}
                                                            {safeString(
                                                                'unit_type' in
                                                                    item.original_data
                                                                    ? item
                                                                          .original_data
                                                                          .unit_type
                                                                    : '',
                                                                () =>
                                                                    t(
                                                                        'product_details_modal.fallback_unknown',
                                                                    ),
                                                            )}
                                                        </span>
                                                    }
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                            {/* Card Details */}
                            {item.product_type === 'card' &&
                                item.original_data &&
                                'card_type' in item.original_data && (
                                    <Card className="border-border bg-card shadow-none">
                                        <CardHeader className="px-2.5 py-2">
                                            <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                <span className={`inline-flex h-5 w-5 items-center justify-center rounded ${accent.iconBg}`}>
                                                    <CreditCard className="h-3 w-3" />
                                                </span>
                                                {t('product_details_modal.card_details.section_title')}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-1.5 px-2.5 pb-2.5 text-sm">
                                            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                                                <InfoRow
                                                    icon={
                                                        <CreditCard className="h-3 w-3" />
                                                    }
                                                    label={t(
                                                        'product_details_modal.card_details.card_type',
                                                    )}
                                                    value={
                                                        <span className="font-medium">
                                                            {safeString(
                                                                'card_type' in
                                                                    item.original_data
                                                                    ? item
                                                                          .original_data
                                                                          .card_type
                                                                    : '',
                                                                () =>
                                                                    t(
                                                                        'product_details_modal.fallback_unknown',
                                                                    ),
                                                            )}
                                                        </span>
                                                    }
                                                />
                                                <InfoRow
                                                    icon={
                                                        <Hash className="h-3 w-3" />
                                                    }
                                                    label={t(
                                                        'product_details_modal.card_details.card_id',
                                                    )}
                                                    value={
                                                        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                                                            {safeString(
                                                                'card_id' in
                                                                    item.original_data
                                                                    ? item
                                                                          .original_data
                                                                          .card_id
                                                                    : '',
                                                                () =>
                                                                    t(
                                                                        'product_details_modal.fallback_unknown',
                                                                    ),
                                                            )}
                                                        </span>
                                                    }
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                            {/* Item tracking */}
                            <Card className="border-border bg-card shadow-none">
                                <CardHeader className="px-2.5 py-2">
                                    <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        <span className={`inline-flex h-5 w-5 items-center justify-center rounded ${accent.iconBg}`}>
                                            <BarChart3 className="h-3 w-3" />
                                        </span>
                                        {t('product_details_modal.tracking.section_title')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2.5 px-2.5 pb-2.5">
                                    <div className={`grid grid-cols-1 gap-2.5 ${item?.product_type === 'card' ? '' : 'md:grid-cols-2'}`}>
                                        {/* Going in (only for product / scale_product) */}
                                        {item?.product_type !== 'card' && (
                                            <div className="rounded border border-green-200/70 bg-green-50/40 p-2.5 dark:border-green-800/30 dark:bg-green-950/15">
                                                <div className="mb-1.5 flex items-center gap-2 text-green-700 dark:text-green-300">
                                                    <ArrowDownToLine className="h-3.5 w-3.5" />
                                                    <span className="text-xs font-semibold">{t('product_details_modal.tracking.going_in')}</span>
                                                </div>
                                                {purchaseLoading ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                                                ) : purchaseError || !purchaseHistory ? (
                                                    <p className="text-sm text-muted-foreground">{t('product_details_modal.tracking.total_in')}: 0</p>
                                                ) : (
                                                    <div className="space-y-1 text-xs">
                                                        <div className="flex justify-between"><span className="text-muted-foreground">{t('product_details_modal.tracking.total_in')}</span><span className="font-semibold tabular-nums">{purchaseHistory.total_quantity_in}</span></div>
                                                        <div className="flex justify-between"><span className="text-muted-foreground">{t('product_details_modal.tracking.in_this_month')}</span><span className="tabular-nums">{purchaseHistory.quantity_this_month}</span></div>
                                                        <div className="flex justify-between"><span className="text-muted-foreground">{t('product_details_modal.tracking.last_received')}</span><span>{purchaseHistory.last_purchase_date ? new Date(purchaseHistory.last_purchase_date).toLocaleDateString() : '—'}</span></div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {/* Going out */}
                                        <div className="rounded border border-blue-200/70 bg-blue-50/40 p-2.5 dark:border-blue-800/30 dark:bg-blue-950/15">
                                            <div className="mb-1.5 flex items-center gap-2 text-blue-700 dark:text-blue-300">
                                                <ArrowUpFromLine className="h-3.5 w-3.5" />
                                                <span className="text-xs font-semibold">{t('product_details_modal.tracking.going_out')}</span>
                                            </div>
                                            {salesLoading ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                                            ) : salesError || !salesHistory ? (
                                                <p className="text-sm text-muted-foreground">{t('product_details_modal.tracking.total_out')}: 0</p>
                                            ) : salesHistory.total_sold === 0 ? (
                                                <p className="text-xs font-medium text-amber-700 dark:text-amber-300">{t('product_details_modal.tracking.not_sold_yet')}</p>
                                            ) : (
                                                <div className="space-y-1 text-xs">
                                                    <div className="flex justify-between"><span className="text-muted-foreground">{t('product_details_modal.tracking.total_out')}</span><span className="font-semibold tabular-nums">{salesHistory.total_sold}</span></div>
                                                    <div className="flex justify-between"><span className="text-muted-foreground">{t('product_details_modal.tracking.out_this_month')}</span><span className="tabular-nums">{salesHistory.transactions ? (() => { const now = new Date(); const m = now.getMonth(), y = now.getFullYear(); return salesHistory.transactions.filter((tx) => { const d = tx.date ? new Date(tx.date) : null; return d && d.getMonth() === m && d.getFullYear() === y; }).reduce((s, tx) => s + (tx.quantity ?? 0), 0); })() : 0}</span></div>
                                                    <div className="flex justify-between"><span className="text-muted-foreground">{t('product_details_modal.tracking.last_sold')}</span><span>{salesHistory.last_sold ? new Date(salesHistory.last_sold).toLocaleDateString() : '—'}</span></div>
                                                    <div className="flex justify-between"><span className="text-muted-foreground">{t('product_details_modal.tracking.last_price')}</span><span>{formatCurrency(salesHistory.last_price)}</span></div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {/* Net flow one line */}
                                    {purchaseHistory && salesHistory && item?.product_type !== 'card' && !purchaseLoading && !salesLoading && (() => {
                                        const goingIn = purchaseHistory.total_quantity_in;
                                        const goingOut = salesHistory.total_sold;
                                        const netFlow = goingIn - goingOut;
                                        const messageKey = goingOut > goingIn ? 'product_details_modal.tracking.net_flow_buy_more' : goingIn > goingOut ? 'product_details_modal.tracking.net_flow_buy_less' : 'product_details_modal.tracking.net_flow_balanced';
                                        const messageVariant = goingOut > goingIn ? 'amber' : goingIn > goingOut ? 'green' : 'slate';
                                        return (
                                            <div className={`rounded border px-2.5 py-1.5 text-xs ${messageVariant === 'amber' ? 'border-amber-200/70 bg-amber-50/50 dark:border-amber-800/30 dark:bg-amber-950/15' : messageVariant === 'green' ? 'border-green-200/70 bg-green-50/50 dark:border-green-800/30 dark:bg-green-950/15' : 'border-border bg-muted/20'}`}>
                                                <span className="font-medium text-foreground">{t('product_details_modal.tracking.net_flow')}: </span>
                                                <span className="tabular-nums font-semibold">{goingIn} − {goingOut} = {netFlow}</span>
                                                <span className={`ml-1.5 ${messageVariant === 'amber' ? 'text-amber-700 dark:text-amber-300' : messageVariant === 'green' ? 'text-green-700 dark:text-green-300' : 'text-muted-foreground'}`}>— {t(messageKey)}</span>
                                            </div>
                                        );
                                    })()}
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>

                <DialogFooter className="shrink-0 border-t border-border px-3 py-2">
                    <Button variant="outline" size="sm" className="text-xs" onClick={onClose}>
                        {t('product_details_modal.close_button')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
