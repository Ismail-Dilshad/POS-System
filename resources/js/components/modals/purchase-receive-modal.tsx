import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useTranslation } from '@/hooks/use-translation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/toast';
import { formatCurrency } from '@/lib/currency';
import {
    purchaseService,
    type Purchase,
    type PurchaseItem,
} from '@/services/business/purchaseService';
import {
    AlertTriangle,
    CheckCircle,
    CreditCard,
    Loader2,
    Package,
    PackageCheck,
    Receipt,
    Scale,
    Truck,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface SupplierPayment {
    supplier_id: number | null;
    supplier_name: string;
    total_amount: number;
    paid_amount: number;
    remaining_amount: number;
    items: PurchaseItem[];
    is_fully_paid: boolean;
}

interface PurchaseReceiveModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    purchase: Purchase | null;
}

export function PurchaseReceiveModal({
    isOpen,
    onClose,
    onSuccess,
    purchase,
}: PurchaseReceiveModalProps) {
    const { t } = useTranslation();
    const { toast } = useToast();

    // Loading and processing states
    const [processing, setProcessing] = useState(false);

    // Payment tracking
    const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>(
        [],
    );
    const [selectAllPaid, setSelectAllPaid] = useState(false);

    // Group items by supplier and calculate totals
    const groupedBySupplier = useMemo(() => {
        if (!purchase?.items) return [];

        const groups: { [key: string]: PurchaseItem[] } = {};

        purchase.items.forEach((item) => {
            // Create a unique key for each supplier combination
            // Handle cases where supplier_id might be null but supplier_name exists
            const supplierId = item.supplier_id || 'null';
            const supplierName = item.supplier_name || t('purchase_receive_modal.no_supplier');
            const key = `${supplierId}-${supplierName}`;

            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(item);
        });

        const result = Object.entries(groups).map(([, items]) => {
            const firstItem = items[0];
            const totalAmount = items.reduce((sum, item) => {
                // Use total_cost if available, otherwise calculate from cost_price * quantity
                const itemTotal =
                    item.total_cost || item.cost_price * item.quantity || 0;
                // Ensure we're adding numbers, not concatenating strings
                const numericTotal = parseFloat(itemTotal.toString()) || 0;
                return sum + numericTotal;
            }, 0);

            return {
                supplier_id: firstItem.supplier_id || null,
                supplier_name: firstItem.supplier_name || t('purchase_receive_modal.no_supplier'),
                total_amount: totalAmount,
                paid_amount: 0, // Explicitly set to 0 (debt)
                remaining_amount: totalAmount,
                items,
                is_fully_paid: false,
            };
        });

        return result;
    }, [purchase, t]);

    // Initialize payment data when modal opens
    useEffect(() => {
        if (isOpen && purchase) {
            // Ensure all payments start at 0
            const initializedPayments = groupedBySupplier.map((payment) => ({
                ...payment,
                paid_amount: 0,
                remaining_amount: payment.total_amount,
                is_fully_paid: false,
            }));

            setSupplierPayments(initializedPayments);
            setSelectAllPaid(false);
        }
    }, [isOpen, purchase, groupedBySupplier]);

    const totalPaidAmount = useMemo(() => {
        return supplierPayments.reduce(
            (sum, payment) => sum + payment.paid_amount,
            0,
        );
    }, [supplierPayments]);

    const totalAmount = useMemo(() => {
        return supplierPayments.reduce(
            (sum, payment) => sum + payment.total_amount,
            0,
        );
    }, [supplierPayments]);

    // Helper function to safely format decimal values for input fields
    const formatDecimalForInput = (
        value: number | string | null | undefined,
    ): string => {
        // Handle null, undefined, or empty values
        if (value === null || value === undefined || value === '') return '';

        // Convert to number and handle edge cases
        const numValue =
            typeof value === 'string' ? parseFloat(value) : Number(value);

        // Check if it's a valid number
        if (isNaN(numValue) || numValue === 0) return '';

        // Ensure the value is properly formatted with max 2 decimal places
        const formatted = Number(numValue.toFixed(2));
        return formatted.toString();
    };

    // Update individual supplier payment with robust validation
    const updateSupplierPayment = (
        index: number,
        inputValue: string | number,
    ) => {
        // If Pay All is active, disable individual payments
        if (selectAllPaid) {
            return;
        }

        setSupplierPayments((prev) => {
            const updated = prev.map((payment, i) => {
                if (i === index) {
                    let newPaidAmount = 0;

                    // Handle different input types with better decimal handling
                    if (typeof inputValue === 'string') {
                        if (
                            inputValue === '' ||
                            inputValue === null ||
                            inputValue === undefined
                        ) {
                            newPaidAmount = 0;
                        } else {
                            // Clean the input value to handle edge cases
                            const cleanValue = inputValue.replace(
                                /[^\d.-]/g,
                                '',
                            );
                            const parsed = parseFloat(cleanValue);
                            newPaidAmount = isNaN(parsed) ? 0 : parsed;
                        }
                    } else {
                        newPaidAmount = inputValue || 0;
                    }

                    // Ensure amount is within valid range
                    newPaidAmount = Math.max(
                        0,
                        Math.min(newPaidAmount, payment.total_amount),
                    );

                    // Round to 2 decimal places
                    newPaidAmount = Math.round(newPaidAmount * 100) / 100;

                    const remainingAmount =
                        Math.round(
                            (payment.total_amount - newPaidAmount) * 100,
                        ) / 100;

                    return {
                        ...payment,
                        paid_amount: newPaidAmount,
                        remaining_amount: Math.max(0, remainingAmount),
                        is_fully_paid: remainingAmount <= 0.01,
                    };
                }
                return payment;
            });

            // Update toggle state based on all payments
            const allFullyPaid = updated.every((p) => p.is_fully_paid);
            const hasIndividualPayments = updated.some(
                (p) => p.paid_amount > 0,
            );

            // If individual payments are made, disable Pay All
            if (hasIndividualPayments && selectAllPaid) {
                setSelectAllPaid(false);
            } else {
                setSelectAllPaid(allFullyPaid);
            }

            return updated;
        });
    };

    // Clear individual payment
    const clearSupplierPayment = (index: number) => {
        if (selectAllPaid) {
            return;
        }
        updateSupplierPayment(index, 0);
    };

    // Pay full amount for individual supplier
    const payFullSupplierAmount = (index: number) => {
        if (selectAllPaid) {
            return;
        }
        const payment = supplierPayments[index];
        if (payment) {
            updateSupplierPayment(index, payment.total_amount);
        }
    };

    // Handle select all paid toggle
    const handleSelectAllPaidChange = (checked: boolean) => {
        setSelectAllPaid(checked);
        if (checked) {
            setSupplierPayments((prev) =>
                prev.map((payment) => ({
                    ...payment,
                    paid_amount: payment.total_amount,
                    remaining_amount: 0,
                    is_fully_paid: true,
                })),
            );
        } else {
            setSupplierPayments((prev) =>
                prev.map((payment) => ({
                    ...payment,
                    paid_amount: 0,
                    remaining_amount: payment.total_amount,
                    is_fully_paid: false,
                })),
            );
        }
    };

    // Process the receive order
    const handleReceiveOrder = async () => {
        if (!purchase || processing) return; // Prevent duplicate calls

        setProcessing(true);

        try {
            // Prepare supplier payment data - only include suppliers with valid data
            const supplierPaymentData = supplierPayments
                .filter(
                    (payment) =>
                        payment.supplier_name && payment.total_amount > 0,
                )
                .map((payment) => ({
                    supplier_id: payment.supplier_id,
                    supplier_name: payment.supplier_name,
                    total_amount: Math.round(payment.total_amount * 100) / 100, // Ensure proper decimal format
                    paid_amount: Math.round(payment.paid_amount * 100) / 100, // Ensure proper decimal format
                }));

            const response = await purchaseService.markAsReceived(
                purchase.id,
                supplierPaymentData,
            );

            if (response.success) {
                const paidSuppliersCount = supplierPayments.filter(
                    (p) => p.paid_amount > 0,
                ).length;
                const debtSuppliersCount = supplierPayments.filter(
                    (p) => p.paid_amount === 0,
                ).length;
                const totalPaid = supplierPayments.reduce(
                    (sum, p) => sum + (p.paid_amount || 0),
                    0,
                );

                let description = `Purchase order "${purchase.invoice_name}" has been received. Inventory updated for ${purchase.items?.length || 0} items.`;

                if (paidSuppliersCount > 0) {
                    description += ` Payments recorded for ${paidSuppliersCount} suppliers (${formatCurrency(totalPaid)}).`;
                }

                if (debtSuppliersCount > 0) {
                    description += ` ${debtSuppliersCount} suppliers marked as debt.`;
                }

                toast({
                    title: t('purchase_receive_modal.order_received_successfully'),
                    description,
                    type: 'success',
                });

                if (onSuccess) {
                    onSuccess();
                }

                handleClose();
            } else {
                toast({
                    title: t('purchase_receive_modal.failed_to_receive_order'),
                    description:
                        response.message ||
                        t('purchase_receive_modal.error_processing_order'),
                    type: 'error',
                });
            }
        } catch (error: unknown) {
            toast({
                title: t('purchase_receive_modal.processing_failed'),
                description:
                    (error as { message?: string }).message ||
                    'An unexpected error occurred.',
                type: 'error',
            });
        } finally {
            setProcessing(false);
        }
    };

    // Handle close
    const handleClose = () => {
        setSupplierPayments([]);
        setSelectAllPaid(false);
        setProcessing(false);
        onClose();
    };

    if (!purchase) return null;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent
                className="flex max-h-[92vh] flex-col overflow-hidden [&>button]:hidden border-0 shadow-2xl bg-gradient-to-b from-white to-slate-50 dark:from-[#1D1F20] dark:to-[#1D1F20]"
                style={{
                    zIndex: 9999,
                    maxWidth: '70vw',
                    width: '1100px',
                }}
                hideClose
            >
                <DialogHeader className="shrink-0 border-b border-slate-200/50 dark:border-slate-700/50 pb-3">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="flex items-center gap-3 text-lg font-semibold text-slate-900 dark:text-slate-50">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
                                <PackageCheck className="h-5 w-5 text-white" />
                            </div>
                            {t('purchase_receive_modal.title')}
                        </DialogTitle>
                    </div>
                </DialogHeader>

                <div className="flex flex-1 flex-col gap-4 overflow-hidden py-3 px-1">
                    {/* Compact Purchase Info */}
                    <div className="grid grid-cols-3 gap-3 bg-white dark:bg-[#1D1F20] rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-slate-400 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-xs text-slate-500 dark:text-slate-400">{t('purchase_receive_modal.invoice_name_label')}</p>
                                <p className="font-semibold text-sm text-slate-900 dark:text-slate-50 truncate">{purchase.invoice_name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-slate-400 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-xs text-slate-500 dark:text-slate-400">{t('purchase_receive_modal.invoice_id_label')}</p>
                                <p className="font-mono font-semibold text-sm text-slate-900 dark:text-slate-50 truncate">{purchase.invoice_id}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <PackageCheck className="h-4 w-4 text-slate-400 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-xs text-slate-500 dark:text-slate-400">{t('purchase_receive_modal.total_items_label')}</p>
                                <p className="font-semibold text-sm text-slate-900 dark:text-slate-50">{purchase.items?.length || 0} {t('purchase_receive_modal.items_label')}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-xs text-slate-500 dark:text-slate-400">{t('purchase_receive_modal.total_amount_label')}</p>
                                <p className="font-bold text-sm text-slate-900 dark:text-slate-50 truncate">{formatCurrency(totalAmount)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-xs text-slate-500 dark:text-slate-400">{t('purchase_receive_modal.amount_paid_label')}</p>
                                <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400 truncate">{formatCurrency(totalPaidAmount)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500 dark:text-amber-400 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-xs text-slate-500 dark:text-slate-400">{t('purchase_receive_modal.remaining_amount_label')}</p>
                                <p className="font-bold text-sm text-amber-600 dark:text-amber-400 truncate">{formatCurrency(totalAmount - totalPaidAmount)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Compact Bulk Actions */}
                    <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-[#1D1F20] dark:to-[#1D1F20] rounded-lg px-4 py-2.5 border border-blue-200 dark:border-blue-800">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('purchase_receive_modal.pay_all_suppliers_label')}</span>
                        <Switch
                            id="select-all-paid"
                            checked={selectAllPaid}
                            onCheckedChange={handleSelectAllPaidChange}
                        />
                    </div>

                    {/* Compact Supplier Payments */}
                    <div className="flex-1 overflow-hidden">
                        <div className="max-h-[450px] space-y-3 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
                            {supplierPayments.map((payment, index) => (
                                <div
                                    key={`${payment.supplier_id}-${index}`}
                                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1D1F20] shadow-sm hover:shadow-md transition-shadow duration-200"
                                >
                                    {/* Compact Supplier Header */}
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-[#1D1F20] dark:to-[#1D1F20]">
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className="shrink-0 p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                                                <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-50 truncate">{payment.supplier_name}</h3>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{payment.items.length} {t('purchase_receive_modal.items_text')} • {formatCurrency(payment.total_amount)}</p>
                                            </div>
                                        </div>
                                        {payment.is_fully_paid ? (
                                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800 shrink-0">
                                                <CheckCircle className="mr-1 h-3 w-3" />
                                                {t('purchase_receive_modal.fully_paid_badge')}
                                            </Badge>
                                        ) : payment.paid_amount > 0 ? (
                                            <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800 shrink-0">
                                                {t('purchase_receive_modal.partial_badge')}
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800 shrink-0">
                                                {t('purchase_receive_modal.debt_badge')}
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Compact Payment Controls */}
                                    <div className="p-4">
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <Label className="text-xs text-slate-600 dark:text-slate-400 mb-1.5 block">{t('purchase_receive_modal.payment_amount_label')}</Label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        max={payment.total_amount}
                                                        step="0.01"
                                                        value={formatDecimalForInput(payment?.paid_amount)}
                                                        onChange={(e) => updateSupplierPayment(index, e.target.value)}
                                                        onBlur={(e) => {
                                                            if (e.target.value && !isNaN(parseFloat(e.target.value))) {
                                                                updateSupplierPayment(index, e.target.value);
                                                            }
                                                        }}
                                                        placeholder="0.00"
                                                        className="h-9 text-sm"
                                                        disabled={selectAllPaid}
                                                    />
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => clearSupplierPayment(index)}
                                                        className="h-9 w-9 p-0"
                                                        disabled={selectAllPaid}
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div>
                                                <Label className="text-xs text-slate-600 dark:text-slate-400 mb-1.5 block">{t('purchase_receive_modal.remaining_amount_label')}</Label>
                                                <div className="h-9 rounded-md bg-amber-50 dark:bg-[#1D1F20]/30 border border-amber-200 dark:border-amber-700 px-3 flex items-center">
                                                    <span className="font-semibold text-sm text-amber-700 dark:text-amber-300">
                                                        {formatCurrency(payment.remaining_amount)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div>
                                                <Label className="text-xs text-slate-600 dark:text-slate-400 mb-1.5 block">{t('purchase_receive_modal.quick_actions_label')}</Label>
                                                <Button
                                                    size="sm"
                                                    onClick={() => payFullSupplierAmount(index)}
                                                    className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                                                    disabled={selectAllPaid}
                                                >
                                                    <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                                                    {t('purchase_receive_modal.pay_full_amount_button')}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Compact Items List */}
                                    <div className="border-t border-slate-200 dark:border-slate-700 p-4 bg-slate-50/50 dark:bg-[#1D1F20]/30">
                                        <details className="group">
                                            <summary className="flex items-center justify-between cursor-pointer list-none">
                                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                                                    <PackageCheck className="h-3.5 w-3.5" />
                                                    {t('purchase_receive_modal.items_to_receive_label')} ({payment.items.length})
                                                </span>
                                                <span className="text-xs text-slate-400 group-open:hidden">Show</span>
                                                <span className="text-xs text-slate-400 hidden group-open:inline">Hide</span>
                                            </summary>
                                            <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                                                {payment.items.map((item, itemIndex) => (
                                                    <div
                                                        key={`${item.id}-${itemIndex}`}
                                                        className="flex items-center justify-between rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-xs"
                                                    >
                                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                            <div className="shrink-0 w-7 h-7 bg-blue-50 dark:bg-blue-900/30 rounded flex items-center justify-center">
                                                                {item.product_type === 'scale_product' ? (
                                                                    <Scale className="h-3.5 w-3.5 text-orange-500" />
                                                                ) : (
                                                                    <Package className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                                                )}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{item.product_name}</p>
                                                                <p className="text-slate-500 dark:text-slate-400">
                                                                    {item.product_type === 'scale_product' ? t('purchase_receive_modal.plu_text') : t('purchase_receive_modal.barcode_text')}: {item.identifier}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right shrink-0 ml-2">
                                                            <p className="font-semibold text-slate-900 dark:text-slate-100">{t('purchase_receive_modal.qty_text')} {item.quantity}</p>
                                                            <p className="text-emerald-600 dark:text-emerald-400 font-semibold">{formatCurrency(item.total_cost)}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </details>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter className="shrink-0 border-t border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-slate-50 to-white dark:from-[#1D1F20] dark:to-[#1D1F20] px-5 py-3">
                    <div className="flex w-full items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                            <span>{t('purchase_receive_modal.footer_warning')}</span>
                        </div>
                        <div className="flex gap-2.5">
                            <Button
                                variant="outline"
                                onClick={handleClose}
                                className="h-9 px-4 text-sm"
                                disabled={processing}
                            >
                                {t('common.cancel')}
                            </Button>
                            <Button
                                onClick={handleReceiveOrder}
                                disabled={processing}
                                className="h-9 px-5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-medium shadow-md hover:shadow-lg transition-all gap-2 text-sm"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        {t('common.loading')}
                                    </>
                                ) : (
                                    <>
                                        <PackageCheck className="h-3.5 w-3.5" />
                                        {totalPaidAmount > 0
                                            ? `${t('purchase_receive_modal.receive_order_button')} (${formatCurrency(totalPaidAmount)})`
                                            : t('purchase_receive_modal.receive_order_all_debt')}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
