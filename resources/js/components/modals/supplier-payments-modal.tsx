import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    SearchableSelect,
    type SearchableSelectOption,
} from '@/components/ui/searchable-select';
import { useToast } from '@/components/ui/toast';
import { useTranslation } from '@/hooks/use-translation';
import { formatCurrency } from '@/lib/currency';
import { supplierService, type Supplier } from '@/services/business/supplierService';
import { type Column } from '@/types/table';
import {
    AlertTriangle,
    Building2,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    CreditCard,
    DollarSign,
    Loader2,
    Receipt,
    RefreshCw,
    Search,
    XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface SupplierPayment {
    id: number | string;
    purchase_id: number;
    supplier_id: number;
    supplier_name: string;
    total_amount: number;
    paid_amount: number;
    remaining_amount: number;
    payment_status: 'debt' | 'partial' | 'paid';
    payment_date: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    invoice_id?: string;
    invoice_name?: string;
    purchase_invoice_id?: string;
    purchase_invoice_name?: string;
    purchase_invoice_number?: string;
    purchase_created_at?: string;
    purchase_updated_at?: string;
    purchase_received_at?: string;
    purchase?: {
        id: number;
        invoice_name: string;
        invoice_id: string;
        purchase_created_at: string;
        purchase_updated_at?: string;
        purchase_received_at?: string;
        status: string;
    };
}

interface SupplierPaymentsModalProps {
    isOpen: boolean;
    onClose: () => void;
    supplier: Supplier | null;
}

export function SupplierPaymentsModal({
    isOpen,
    onClose,
    supplier,
}: SupplierPaymentsModalProps) {
    const { toast } = useToast();
    const { t } = useTranslation();

    // Loading state
    const [loading, setLoading] = useState(false);
    const [payments, setPayments] = useState<SupplierPayment[]>([]);
    const [summary, setSummary] = useState({
        total_purchases: 0,
        total_amount: 0,
        total_paid: 0,
        total_remaining: 0,
        paid_purchases: 0,
        partial_purchases: 0,
        debt_purchases: 0,
    });

    // Pagination and filtering
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] =
        useState<SearchableSelectOption | null>(null);
    const itemsPerPage = 5;

    // Status filter options
    const statusOptions: SearchableSelectOption[] = [
        { id: 'paid', name: t('supplier_payments_modal.status_labels.paid') },
        { id: 'partial', name: t('supplier_payments_modal.status_labels.partial') },
        { id: 'debt', name: t('supplier_payments_modal.status_labels.debt') },
    ];

    // Payment processing state
    const [processingPayment, setProcessingPayment] = useState<string | null>(
        null,
    );

    // Load supplier payments
    const loadSupplierPayments = useCallback(async () => {
        if (!supplier) return;

        setLoading(true);
        try {
            const response = await supplierService.getSupplierPayments(
                supplier.id,
            );

            if (response.success && response.data) {
                setPayments(
                    (response.data.payments as unknown as SupplierPayment[]) ||
                        [],
                );
                setSummary(
                    response.data.summary || {
                        total_purchases: 0,
                        total_amount: 0,
                        total_paid: 0,
                        total_remaining: 0,
                        paid_purchases: 0,
                        partial_purchases: 0,
                        debt_purchases: 0,
                    },
                );
            }
        } catch {
            toast({
                title: t('supplier_payments_modal.error_messages.add_payment_failed'),
                description: 'Unable to fetch supplier payment data.',
                type: 'error',
            });
        } finally {
            setLoading(false);
        }
    }, [supplier, toast, t]);

    // Load data when modal opens
    useEffect(() => {
        if (isOpen && supplier) {
            loadSupplierPayments();
        }
    }, [isOpen, supplier, loadSupplierPayments]);

    // Reset pagination when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    // Filtered and paginated data
    const filteredPayments = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        return payments.filter((payment) => {
            const invoiceName =
                payment.purchase?.invoice_name ||
                payment.invoice_name ||
                payment.purchase_invoice_name ||
                payment.purchase_invoice_number ||
                '';
            const invoiceId =
                payment.purchase?.invoice_id ||
                payment.invoice_id ||
                payment.purchase_invoice_id ||
                payment.purchase_invoice_number ||
                payment.purchase_id?.toString() ||
                '';

            const matchesSearch =
                !normalizedSearch ||
                invoiceName.toLowerCase().includes(normalizedSearch) ||
                invoiceId.toLowerCase().includes(normalizedSearch);

            const matchesStatus =
                !statusFilter || payment.payment_status === statusFilter.id;

            return matchesSearch && matchesStatus;
        });
    }, [payments, searchTerm, statusFilter]);

    const paginatedPayments = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredPayments.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredPayments, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);

    // Table columns
    const columns: Column<SupplierPayment>[] = [
        {
            key: 'purchase_info',
            header: t('supplier_payments_modal.table_columns.purchase_id'),
            render: (_, payment) => {
                const invoiceName =
                    payment.purchase?.invoice_name ||
                    payment.invoice_name ||
                    payment.purchase_invoice_name ||
                    payment.purchase_invoice_number ||
                    t('supplier_payments_modal.purchase_prefix', { id: payment.purchase_id });
                const invoiceId =
                    payment.purchase?.invoice_id ||
                    payment.invoice_id ||
                    payment.purchase_invoice_id ||
                    payment.purchase_invoice_number ||
                    payment.purchase_id?.toString() ||
                    '—';
                const purchaseDateSource =
                    payment.purchase?.purchase_received_at ||
                    payment.purchase_received_at ||
                    payment.purchase?.purchase_updated_at ||
                    payment.purchase_updated_at ||
                    payment.purchase?.purchase_created_at ||
                    payment.purchase_created_at ||
                    payment.payment_date ||
                    payment.created_at;
                const purchaseDate = purchaseDateSource
                    ? new Date(purchaseDateSource)
                    : null;
                const hasValidDate =
                    purchaseDate !== null &&
                    !Number.isNaN(purchaseDate.getTime());

                return (
                    <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">
                                {invoiceName}
                            </span>
                            {invoiceId && invoiceId.trim() !== '' && (
                                <Badge
                                    variant="outline"
                                    className="font-mono text-[11px] uppercase tracking-wide"
                                >
                                    {invoiceId}
                                </Badge>
                            )}
                        </div>
                        {hasValidDate && (
                            <div className="flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
                                <span>
                                    {purchaseDate?.toLocaleDateString()}
                                </span>
                                <span className="text-muted-foreground/60">
                                    •
                                </span>
                                <span>
                                    {purchaseDate?.toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </span>
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            key: 'amounts',
            header: t('supplier_payments_modal.table_columns.total_amount'),
            render: (_, payment) => (
                <div className="space-y-1">
                    <div className="text-sm">
                        <span className="text-muted-foreground">
                            {t('supplier_payments_modal.total_amount', {
                                defaultValue: 'Total Amount',
                            })}
                            {': '}
                        </span>
                        <span className="font-medium">
                            {formatCurrency(payment.total_amount)}
                        </span>
                    </div>
                    <div className="text-sm">
                        <span className="text-muted-foreground">
                            {t('supplier_payments_modal.paid_amount', {
                                defaultValue: 'Paid Amount',
                            })}
                            {': '}
                        </span>
                        <span className="font-medium text-green-600">
                            {formatCurrency(payment.paid_amount)}
                        </span>
                    </div>
                    <div className="text-sm">
                        <span className="text-muted-foreground">
                            {t('supplier_payments_modal.remaining_amount', {
                                defaultValue: 'Remaining Amount',
                            })}
                            {': '}
                        </span>
                        <span className="font-medium text-orange-600">
                            {formatCurrency(payment.remaining_amount)}
                        </span>
                    </div>
                </div>
            ),
        },
        {
            key: 'status',
            header: t('supplier_payments_modal.table_columns.status'),
            render: (_, payment) => (
                <div className="space-y-2">
                    {getPaymentStatusBadge(payment.payment_status)}
                    <div className="h-1.5 w-full rounded-full bg-gray-200">
                        <div
                            className="h-1.5 rounded-full bg-green-600 transition-all duration-300"
                            style={{
                                width: `${(payment.paid_amount / payment.total_amount) * 100}%`,
                            }}
                        ></div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {t('supplier_payments_modal.percent_paid', {
                            percent: (
                                (payment.paid_amount / payment.total_amount) *
                                100
                            ).toFixed(1),
                        })}
                    </div>
                </div>
            ),
        },
        {
            key: 'payment_date',
            header: t('supplier_payments_modal.table_columns.payment_date'),
            render: (_, payment) => (
                <div className="text-sm">
                    {payment.payment_date ? (
                        <div>
                            <div className="font-medium">
                                {new Date(
                                    payment.payment_date,
                                ).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {new Date(
                                    payment.payment_date,
                                ).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </div>
                        </div>
                    ) : (
                        <span className="text-xs text-muted-foreground">
                            {t('supplier_payments_modal.not_paid')}
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: 'actions',
            header: t('supplier_payments_modal.table_columns.notes'),
            render: (_, payment) => (
                <div className="flex items-center gap-2">
                    {(payment.payment_status === 'debt' ||
                        payment.payment_status === 'partial') && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 border-green-200 bg-green-50 px-2 text-xs text-green-700 hover:bg-green-100"
                            onClick={() => handlePayment(payment)}
                            disabled={processingPayment === `${payment.id}`}
                        >
                            {processingPayment === `${payment.id}` ? (
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                                <DollarSign className="mr-1 h-3 w-3" />
                            )}
                            {processingPayment === `${payment.id}`
                                ? t('supplier_payments_modal.buttons.paying')
                                : t('supplier_payments_modal.buttons.add_payment')}
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    // Handle direct payment (pay full remaining amount)
    const handlePayment = async (payment: SupplierPayment) => {
        const paymentId = `${payment.id}`;

        setProcessingPayment(paymentId);
        try {
            // Determine if this is a virtual payment (needs creation) or existing payment (needs update)
            const isVirtualPayment =
                typeof payment.id === 'string' &&
                payment.id.startsWith('virtual_');

            // Calculate the new total paid amount (existing paid + remaining)
            // Convert to numbers to avoid string concatenation
            const newTotalPaidAmount = Number(payment.paid_amount) + Number(payment.remaining_amount);

            let response;
            if (isVirtualPayment) {
                // Create new payment record - needs all fields
                const createData = {
                    paid_amount: newTotalPaidAmount,
                    supplier_id: payment.supplier_id,
                    supplier_name: payment.supplier_name,
                    purchase_id: payment.purchase_id,
                    total_amount: payment.total_amount,
                };

                response = await fetch('/api/supplier-payments', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN':
                            document
                                .querySelector('meta[name="csrf-token"]')
                                ?.getAttribute('content') || '',
                    },
                    body: JSON.stringify(createData),
                });
            } else {
                // Update existing payment record - only needs paid_amount
                const updateData = {
                    paid_amount: newTotalPaidAmount,
                };

                response = await fetch(`/api/supplier-payments/${payment.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN':
                            document
                                .querySelector('meta[name="csrf-token"]')
                                ?.getAttribute('content') || '',
                    },
                    body: JSON.stringify(updateData),
                });
            }

            const result = await response.json();

            if (result.success) {
                toast({
                    title: t('supplier_payments_modal.success_messages.payment_added'),
                    description: `Full payment of ${formatCurrency(payment.remaining_amount)} has been processed for ${payment.supplier_name}`,
                    type: 'success',
                });
                loadSupplierPayments(); // Refresh the payments list
            } else {
                toast({
                    title: t('supplier_payments_modal.error_messages.add_payment_failed'),
                    description: result.message || 'Failed to process payment.',
                    type: 'error',
                });
            }
        } catch {
            toast({
                title: t('supplier_payments_modal.error_messages.add_payment_failed'),
                description: 'An error occurred while processing the payment.',
                type: 'error',
            });
        } finally {
            setProcessingPayment(null);
        }
    };

    // Handle close
    const handleClose = () => {
        setPayments([]);
        setSummary({
            total_purchases: 0,
            total_amount: 0,
            total_paid: 0,
            total_remaining: 0,
            paid_purchases: 0,
            partial_purchases: 0,
            debt_purchases: 0,
        });
        setCurrentPage(1);
        setSearchTerm('');
        setStatusFilter(null);
        onClose();
    };

    if (!supplier) return null;

    const getPaymentStatusBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return (
                    <Badge
                        variant="default"
                        className="border-green-200 bg-green-100 text-green-800"
                    >
                        <CheckCircle className="mr-1 h-3 w-3" />
                        {t('supplier_payments_modal.status_labels.paid')}
                    </Badge>
                );
            case 'partial':
                return (
                    <Badge
                        variant="outline"
                        className="border-yellow-200 bg-yellow-100 text-yellow-800"
                    >
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        {t('supplier_payments_modal.status_labels.partial')}
                    </Badge>
                );
            case 'debt':
                return (
                    <Badge
                        variant="outline"
                        className="border-red-200 bg-red-100 text-red-800"
                    >
                        <XCircle className="mr-1 h-3 w-3" />
                        {t('supplier_payments_modal.status_labels.debt')}
                    </Badge>
                );
            default:
                return (
                    <Badge variant="outline">
                        {t('supplier_payments_modal.status_labels.unknown')}
                    </Badge>
                );
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent
                className="flex max-h-[90vh] flex-col overflow-hidden [&>button]:hidden"
                style={{
                    zIndex: 9999,
                    maxWidth: '85vw',
                    width: '1100px',
                }}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-green-600" />
                        {t('supplier_payments_modal.title')}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-1 flex-col gap-4 overflow-hidden">
                    {/* Supplier Info Header - Enhanced */}
                    <div className="rounded-lg border border-border/50 bg-gradient-to-br from-muted/30 via-muted/20 to-transparent p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                    <Building2 className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground">
                                        {supplier.name}
                                    </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {t('supplier_payments_modal.labels.code')}: {supplier.supplier_code}
                                            </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-medium text-foreground">
                                    {supplier.phone || t('supplier_payments_modal.na')}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {supplier.email || t('supplier_payments_modal.no_email')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Payment Summary - Enhanced */}
                    <div className="rounded-lg border border-green-200/50 bg-gradient-to-br from-green-50 via-emerald-50 to-green-50/30 p-4 shadow-sm dark:from-green-950/20 dark:via-emerald-950/20 dark:to-green-950/10">
                        <div className="grid grid-cols-4 gap-4">
                            <div className="flex flex-col items-center justify-center rounded-md bg-white/50 p-3 shadow-sm dark:bg-gray-900/20">
                                <div className="mb-1 text-xs font-medium text-muted-foreground">
                                    {t('supplier_payments_modal.total_orders')}
                                </div>
                                <div className="text-2xl font-bold text-primary">
                                    {summary.total_purchases}
                                </div>
                            </div>
                            <div className="flex flex-col items-center justify-center rounded-md bg-white/50 p-3 shadow-sm dark:bg-gray-900/20">
                                <div className="mb-1 text-xs font-medium text-muted-foreground">
                                    {t('supplier_payments_modal.total_amount')}
                                </div>
                                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                    {formatCurrency(summary.total_amount)}
                                </div>
                            </div>
                            <div className="flex flex-col items-center justify-center rounded-md bg-white/50 p-3 shadow-sm dark:bg-gray-900/20">
                                <div className="mb-1 text-xs font-medium text-muted-foreground">
                                    {t('supplier_payments_modal.paid_amount')}
                                </div>
                                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                    {formatCurrency(summary.total_paid)}
                                </div>
                            </div>
                            <div className="flex flex-col items-center justify-center rounded-md bg-white/50 p-3 shadow-sm dark:bg-gray-900/20">
                                <div className="mb-1 text-xs font-medium text-muted-foreground">
                                    {t('supplier_payments_modal.remaining_amount')}
                                </div>
                                <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                                    {formatCurrency(summary.total_remaining)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search and Filter Controls */}
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                            <Input
                                placeholder={t('supplier_payments_modal.search_placeholder')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="h-9 pl-10 text-sm shadow-[0_0_0_1px_rgba(0,0,0,0.1)] hover:shadow-[0_0_0_1px_rgba(16,53,62,0.3)] focus:shadow-[0_0_0_1px_rgba(16,53,62,0.5)] dark:shadow-[0_0_0_1px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_0_0_1px_rgba(16,53,62,0.5)] dark:focus:shadow-[0_0_0_1px_rgba(16,53,62,0.7)]"
                            />
                        </div>
                        <div className="w-48">
                            <SearchableSelect
                                placeholder={t('supplier_payments_modal.filter_placeholder')}
                                options={statusOptions}
                                value={statusFilter}
                                onSelect={setStatusFilter}
                                clearable={true}
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={loadSupplierPayments}
                            disabled={loading}
                            className="h-9 px-3 text-sm"
                        >
                            <RefreshCw
                                className={`mr-1 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                            />
                            {t('supplier_payments_modal.buttons.refresh')}
                        </Button>
                        {filteredPayments.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                                {filteredPayments.length}{' '}
                                {filteredPayments.length === 1
                                    ? t('supplier_payments_modal.record')
                                    : t('supplier_payments_modal.records')}
                            </Badge>
                        )}
                    </div>

                    {/* Payment Table */}
                    <div className="flex-1 overflow-hidden">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="mr-2 h-6 w-6 animate-spin text-muted-foreground" />
                                <span className="text-muted-foreground">
                                    {t('supplier_payments_modal.loading')}
                                </span>
                            </div>
                        ) : filteredPayments.length === 0 ? (
                            <div className="py-12 text-center">
                                <Receipt className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                <p className="text-muted-foreground">
                                    {payments.length === 0
                                        ? t('supplier_payments_modal.empty_states.no_payments')
                                        : t('supplier_payments_modal.empty_states.no_match')}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {payments.length === 0
                                        ? t('supplier_payments_modal.empty_states.will_appear')
                                        : t('supplier_payments_modal.empty_states.try_adjusting')}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <DataTable
                                    columns={columns}
                                    data={paginatedPayments}
                                    className="text-sm"
                                />

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between px-1">
                                        <div className="text-sm text-muted-foreground">
                                            {t('ui_components.data_table.showing_of', {
                                                from: Math.min((currentPage - 1) * itemsPerPage + 1, filteredPayments.length),
                                                to: Math.min(currentPage * itemsPerPage, filteredPayments.length),
                                                total: filteredPayments.length,
                                            })}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                                disabled={currentPage === 1}
                                                className="h-8 w-8 p-0"
                                                aria-label={t('supplier_payments_modal.previous_page')}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <div className="flex items-center gap-1">
                                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                                    <Button
                                                        key={page}
                                                        variant={currentPage === page ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => setCurrentPage(page)}
                                                        className="h-8 w-8 p-0 text-xs"
                                                        aria-current={page === currentPage ? 'page' : undefined}
                                                    >
                                                        {page}
                                                    </Button>
                                                ))}
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                                disabled={currentPage === totalPages}
                                                className="h-8 w-8 p-0"
                                                aria-label={t('supplier_payments_modal.next_page')}
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="border-t pt-4">
                    <Button variant="outline" onClick={handleClose}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
