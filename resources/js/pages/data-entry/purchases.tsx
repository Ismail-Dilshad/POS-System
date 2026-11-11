import { AddPurchaseModal } from '@/components/modals/add-purchase-modal';
import { PageHeader } from '@/components/layout/page-header';
import { PurchaseDetailsModal } from '@/components/modals/purchase-details-modal';
import ReturnPurchaseModal from '@/components/modals/return-purchase-modal';
import {
    PurchaseFilter,
    type PurchaseFilterOptions,
} from '@/components/filters/purchase-filter';
import { PurchaseReceiveModal } from '@/components/modals/purchase-receive-modal';
import { StatCard, StatsCards } from '@/components/charts/stats-cards';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { DeleteModal } from '@/components/ui/delete-modal';
import { ExportTransactionsByMonthModal } from '@/components/modals/export-transactions-by-month-modal';
import { useToast } from '@/components/ui/toast';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/lib/currency';
import type { TimestampInput } from '@/lib/datetime';
import { formatDatePart, formatDateTimeDisplay, formatTimePart } from '@/lib/datetime';
import admin from '@/routes/admin';
import { purchaseService, type Purchase } from '@/services/business/purchaseService';
import { type BreadcrumbItem } from '@/types';
import { type Column } from '@/types/table';
import { Head } from '@inertiajs/react';
import {
    Calendar,
    DollarSign,
    Edit,
    Eye,
    FileSpreadsheet,
    FileText,
    Loader2,
    Package,
    PackageCheck,
    Plus,
    RefreshCw,
    RotateCcw,
    ShoppingCart,
    Trash2,
    TrendingUp,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function Purchase() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [refreshing, setRefreshing] = useState(false);
    
    // Modal state persistence constants
    const PURCHASE_MODAL_STORAGE_KEY = 'purchase:admin:modal:open';
    
    // Load modal state from localStorage on component mount
    const [isAddPurchaseModalOpen, setIsAddPurchaseModalOpen] = useState(() => {
        try {
            const saved = localStorage.getItem(PURCHASE_MODAL_STORAGE_KEY);
            return saved ? JSON.parse(saved) : false;
        } catch {
            return false;
        }
    });

    // Modal state persistence utilities
    const saveModalStateToStorage = useCallback((isOpen: boolean) => {
        try {
            localStorage.setItem(PURCHASE_MODAL_STORAGE_KEY, JSON.stringify(isOpen));
        } catch {
            // Error handled silently
        }
    }, [PURCHASE_MODAL_STORAGE_KEY]);

    const clearModalStateFromStorage = useCallback(() => {
        try {
            localStorage.removeItem(PURCHASE_MODAL_STORAGE_KEY);
        } catch {
            // Error handled silently
        }
    }, [PURCHASE_MODAL_STORAGE_KEY]);

    // Save modal state to localStorage whenever it changes
    useEffect(() => {
        saveModalStateToStorage(isAddPurchaseModalOpen);
    }, [isAddPurchaseModalOpen, saveModalStateToStorage]);

    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedPurchaseId, setSelectedPurchaseId] = useState<number | null>(
        null,
    );
    const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(
        null,
    );
    const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
    const [receivingPurchase, setReceivingPurchase] = useState<Purchase | null>(
        null,
    );
    const [loadingReceivePurchase, setLoadingReceivePurchase] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [purchaseToDelete, setPurchaseToDelete] = useState<Purchase | null>(
        null,
    );
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [isExcelMonthModalOpen, setIsExcelMonthModalOpen] = useState(false);

    // Filter state
    const [filters, setFilters] = useState<PurchaseFilterOptions>({});

    // Purchase data from backend (current page only)
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [paginationMeta, setPaginationMeta] = useState<{
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    }>({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        from: 0,
        to: 0,
    });

    // Purchase statistics state (from backend)
    const [purchaseStats, setPurchaseStats] = useState({
        totalPurchases: 0,
        totalValue: 0,
        todayPurchases: 0,
        todayValue: 0,
        totalItemsOrdered: 0,
        todayItemsOrdered: 0,
        thisWeekPurchases: 0,
        thisWeekValue: 0,
        thisMonthPurchases: 0,
        thisMonthValue: 0,
        pendingPurchases: 0,
        completedPurchases: 0,
        averagePurchaseValue: 0,
        uniqueSuppliers: 0,
        productsUpdated: 0,
        lowStockReplenished: 0,
    });

    // Backend pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [loading, setLoading] = useState(false);
    
    const filterDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('navigation.admin') },
        { title: t('navigation.purchase'), href: admin.purchases.url() },
    ];

    const handleAddPurchase = () => {
        setEditingPurchase(null); // Clear editing state for new purchase
        setIsAddPurchaseModalOpen(true);
    };

    const handleReturn = () => {
        setIsReturnModalOpen(true);
    };

    const handleReturnProcessed = () => {
        // Refresh purchases after return is processed
        loadPurchases();
    };

    const loadPurchases = useCallback(
        async () => {
        setLoading(true);
        try {
                // Build search query from invoiceName/invoiceId filters
                const searchQuery = [filters.invoiceName, filters.invoiceId]
                    .filter(Boolean)
                    .join(' ')
                    .trim();
                
                // Send ALL filters to backend for database-level filtering
            const response = await purchaseService.getPurchases(
                    {
                        search: searchQuery || undefined,
                        status: filters.status,
                        multiSupplier: filters.multiSupplier,
                        priceMin: filters.priceMin,
                        priceMax: filters.priceMax,
                        dateFrom: filters.dateFrom,
                        dateTo: filters.dateTo,
                        timeFrom: filters.timeFrom,
                        timeTo: filters.timeTo,
                    },
                    currentPage,
                    pageSize
            );

            if (response.success && response.data) {
                    // Backend returns: { success: true, data: [...], pagination: {...} }
                    const purchasesData = Array.isArray(response.data) ? response.data : [];
                    
                    setPurchases(purchasesData);

                    // Extract pagination metadata from response
                    if ('pagination' in response && response.pagination) {
                        const pagination = response.pagination as typeof paginationMeta;
                        setPaginationMeta(pagination);
                    } else {
                        // Fallback: calculate from items (shouldn't happen with new backend)
                        setPaginationMeta({
                            current_page: currentPage,
                            last_page: Math.ceil(purchasesData.length / pageSize),
                            per_page: pageSize,
                            total: purchasesData.length,
                            from: purchasesData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0,
                            to: purchasesData.length > 0 ? Math.min(currentPage * pageSize, purchasesData.length) : 0,
                        });
                    }
            } else {
                setPurchases([]);
            }
            } catch {
            setPurchases([]);
        } finally {
            setLoading(false);
        }
        },
        [currentPage, pageSize, filters],
    );

    // Load comprehensive statistics from backend (static - not filtered)
    const loadStatistics = useCallback(async () => {
        try {
            // Load statistics without any filters - shows ALL purchases
            const response = await purchaseService.getStatistics({});

            if (response.success && response.data) {
                setPurchaseStats({
                    totalPurchases: (response.data.total_purchases as number) || 0,
                    totalValue: (response.data.total_value as number) || 0,
                    todayPurchases: (response.data.today_purchases as number) || 0,
                    todayValue: (response.data.today_value as number) || 0,
                    totalItemsOrdered: (response.data.total_items_ordered as number) || 0,
                    todayItemsOrdered: (response.data.today_items_ordered as number) || 0,
                    thisWeekPurchases: (response.data.this_week_purchases as number) || 0,
                    thisWeekValue: (response.data.this_week_value as number) || 0,
                    thisMonthPurchases: (response.data.this_month_purchases as number) || 0,
                    thisMonthValue: (response.data.this_month_value as number) || 0,
                    pendingPurchases: (response.data.pending_purchases as number) || 0,
                    completedPurchases: (response.data.completed_purchases as number) || 0,
                    averagePurchaseValue: (response.data.average_purchase_value as number) || 0,
                    uniqueSuppliers: (response.data.unique_suppliers as number) || 0,
                    productsUpdated: (response.data.products_updated as number) || 0,
                    lowStockReplenished: (response.data.low_stock_replenished as number) || 0,
                });
            }
        } catch {
            // Keep existing stats on error
        }
    }, []);

    const handleRefresh = async () => {
        setRefreshing(true);
        setLoading(true);

        try {
                setPurchases([]);
                setCurrentPage(1);
            await Promise.all([loadPurchases(), loadStatistics()]);
        } catch {
            // Error handled silently
        } finally {
            setRefreshing(false);
            setLoading(false);
        }
    };

    // Handle successful purchase creation
    const handlePurchaseSuccess = () => {
        loadPurchases(); // Refresh the list
        clearModalStateFromStorage(); // Clear modal state from localStorage
    };

    const handleFiltersChange = (newFilters: PurchaseFilterOptions) => {
        setFilters(newFilters);
        setCurrentPage(1);
    };

    // Debounced effect for filter changes (300ms delay)
    useEffect(() => {
        if (filterDebounceTimer.current) {
            clearTimeout(filterDebounceTimer.current);
        }

        filterDebounceTimer.current = setTimeout(() => {
            loadPurchases();
        }, 300);

        return () => {
            if (filterDebounceTimer.current) {
                clearTimeout(filterDebounceTimer.current);
            }
        };
    }, [filters, loadPurchases]);

    // Immediate effect for page changes (no debounce)
    useEffect(() => {
        loadPurchases();
    }, [currentPage, loadPurchases]);

    // Load statistics once on mount (static - not filtered)
    useEffect(() => {
        loadStatistics();
    }, [loadStatistics]);

    // Table action handlers
    const handleViewPurchase = (purchase: Purchase) => {
        setSelectedPurchaseId(purchase.id);
        setIsDetailsModalOpen(true);
    };

    const handleEditPurchase = async (purchase: Purchase) => {
        setEditingPurchase(null);
        setLoading(true);
        try {
            const response = await purchaseService.getPurchase(purchase.id);

            if (response.success && response.data) {
                setEditingPurchase(response.data);
                setIsAddPurchaseModalOpen(true);
                return;
            }

            toast({
                type: 'error',
                title: t('purchase.error_messages.load_failed'),
                description:
                    response.message || t('purchase.error_messages.unknown_error'),
            });
        } catch (error) {
            const err = error as { message?: string };
            toast({
                type: 'error',
                title: t('purchase.error_messages.load_failed'),
                description: err.message || t('purchase.error_messages.unknown_error'),
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePurchase = (purchase: Purchase) => {
        setPurchaseToDelete(purchase);
        setIsDeleteModalOpen(true);
    };

    const handleReceivePurchase = async (purchase: Purchase) => {
        setLoadingReceivePurchase(true);
        try {
            // Load full purchase details with items for the receive modal
            const response = await purchaseService.getPurchase(purchase.id);
            if (response.success && response.data) {
                setReceivingPurchase(response.data);
                setIsReceiveModalOpen(true);
            } else {
                // Fallback: use the purchase from list if API fails
        setReceivingPurchase(purchase);
        setIsReceiveModalOpen(true);
            }
        } catch {
            // Fallback: use the purchase from list if API fails
            setReceivingPurchase(purchase);
            setIsReceiveModalOpen(true);
        } finally {
            setLoadingReceivePurchase(false);
        }
    };

    const handleDetailsModalClose = () => {
        setIsDetailsModalOpen(false);
        setSelectedPurchaseId(null);
    };

    const handleDeleteModalClose = () => {
        setPurchaseToDelete(null);
        setIsDeleteModalOpen(false);
    };

    const handleDeleteConfirm = async () => {
        if (!purchaseToDelete) return;

        try {
            setLoading(true);
            const response = await purchaseService.deletePurchase(
                purchaseToDelete.id,
            );

            if (response.success) {
                handleDeleteModalClose();
                loadPurchases(); // Refresh the list
            }
        } catch {
            // Failed to delete purchase
        } finally {
            setLoading(false);
        }
    };

    // All filtering is done at backend level - purchases already filtered and paginated

    const getMonthDateRange = useCallback((ym: string) => {
        const [y, m] = ym.split('-').map(Number);
        const lastDay = new Date(y, m, 0).getDate();
        return {
            dateFrom: `${y}-${String(m).padStart(2, '0')}-01`,
            dateTo: `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
        };
    }, []);

    const handleExportExcelByMonth = useCallback(async (monthStr: string) => {
        const { dateFrom, dateTo } = getMonthDateRange(monthStr);
        try {
            const { createWorkbook, addWorksheet, appendTable, downloadWorkbook } = await import('@/services/utils/excelService');

            const response = await purchaseService.getPurchases(
                { dateFrom, dateTo },
                1,
                1,
                true,
            );

            if (!response.success || !response.data) return;

            const allPurchases = Array.isArray(response.data) ? response.data : [];

            const totalAmount = allPurchases.reduce((sum, p) => sum + Number(p.total_amount || 0), 0);
            const totalItems = allPurchases.reduce((sum, p) => {
                if (p.items && p.items.length > 0) {
                    return sum + p.items.reduce((q, i) => q + Number(i.quantity || 0), 0);
                }
                return sum + Number(p.total_orders || 0);
            }, 0);
            const orderCount = allPurchases.filter((p) => p.status === 'order').length;
            const receivedCount = allPurchases.filter((p) => p.status === 'receive').length;
            const avgAmount = allPurchases.length > 0 ? totalAmount / allPurchases.length : 0;
            const avgItems = allPurchases.length > 0 ? totalItems / allPurchases.length : 0;

            const summaryData = [
                ['SUMMARY'],
                ['Total Purchases (count)', allPurchases.length],
                ['Orders', orderCount],
                ['Received', receivedCount],
                ['Total Amount', totalAmount],
                ['Total Items (quantity)', totalItems],
                ['Average Amount per Purchase', Number(avgAmount.toFixed(2))],
                ['Average Items per Purchase', Number(avgItems.toFixed(2))],
                [],
            ];

            const headers = [
                t('purchase.table_columns.invoice_id'),
                t('purchase.table_columns.purchase_name'),
                t('purchase.table_columns.suppliers'),
                t('purchase.table_columns.status'),
                t('purchase.table_columns.items'),
                t('purchase.table_columns.total_amount'),
                t('purchase.table_columns.created_at'),
            ];
            const dataRows = allPurchases.map<(string | number)[]>((purchase) => {
                const suppliers = purchase.items?.map((item) => item.supplier_name).filter(Boolean) || [];
                const uniqueSuppliers = [...new Set(suppliers)];
                return [
                    purchase.invoice_id || '',
                    purchase.invoice_name || '',
                    uniqueSuppliers.join(', ') || '—',
                    purchase.status === 'order' ? t('purchase.status_labels.order') : t('purchase.status_labels.received'),
                    purchase.total_orders || 0,
                    Number(purchase.total_amount) || 0,
                    formatDateTimeDisplay(purchase.created_at),
                ];
            });

            const sumItems = allPurchases.reduce((s, p) => s + (Number(p.total_orders) || 0), 0);
            const sumAmount = allPurchases.reduce((s, p) => s + (Number(p.total_amount) || 0), 0);
            const totalsRow: (string | number)[] = ['TOTALS', '', '', '', sumItems, sumAmount, ''];

            const workbook = createWorkbook();
            const worksheet = addWorksheet(workbook, 'Purchases');
            appendTable(worksheet, summaryData as unknown as (string | number)[][]);
            appendTable(worksheet, [headers]);
            appendTable(worksheet, dataRows);
            appendTable(worksheet, [totalsRow]);
            worksheet.columns = headers.map(() => ({ width: 22 }));

            await downloadWorkbook(workbook, `purchases_${monthStr}.xlsx`);
        } catch {
            // Error handled silently
        }
    }, [getMonthDateRange, t]);

    // Purchase table columns
    const purchaseColumns: Column<Purchase>[] = [
        {
            key: 'invoice_id',
            header: t('purchase.table_columns.invoice_id'),
            accessor: 'invoice_id',
            sortable: true,
            headerClassName: 'text-blue-700 dark:text-blue-300',
            render: (value) => (
                <span className="font-mono text-sm font-medium">
                    {String(value || '')}
                </span>
            ),
        },
        {
            key: 'invoice_name',
            header: t('purchase.table_columns.purchase_name'),
            accessor: 'invoice_name',
            headerClassName: 'text-indigo-700 dark:text-indigo-300',
        },
        {
            key: 'supplier',
            header: t('purchase.table_columns.suppliers'),
            headerClassName: 'text-green-700 dark:text-green-300',
            render: (_, row) => {
                // Get supplier names from items
                const suppliers =
                    row.items
                        ?.map((item) => item.supplier_name)
                        .filter(Boolean) || [];
                const uniqueSuppliers = [...new Set(suppliers)];

                if (uniqueSuppliers.length === 0) {
                    return (
                        <span className="text-muted-foreground">
                            No Supplier
                        </span>
                    );
                }

                if (uniqueSuppliers.length === 1) {
                    return (
                        <div className="flex items-center gap-1">
                            <span className="font-medium">
                                {uniqueSuppliers[0]}
                            </span>
                        </div>
                    );
                }

                return (
                    <div className="flex items-center gap-2">
                        <span className="font-medium">
                            {uniqueSuppliers[0]}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
                            +{uniqueSuppliers.length - 1} more
                        </span>
                    </div>
                );
            },
        },
        {
            key: 'status',
            header: t('purchase.table_columns.status'),
            accessor: 'status',
            headerClassName: 'text-purple-700 dark:text-purple-300',
            render: (value) => {
                const statusConfig = {
                    order: {
                        label: t('purchase.status_labels.order'),
                        className:
                            'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800',
                    },
                    receive: {
                        label: t('purchase.status_labels.received'),
                        className:
                            'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
                    },
                };
                const config = statusConfig[value as keyof typeof statusConfig];
                return (
                    <Badge variant="outline" className={config.className}>
                        {config.label}
                    </Badge>
                );
            },
        },
        {
            key: 'total_orders',
            header: t('purchase.table_columns.items'),
            accessor: 'total_orders',
            sortable: true,
            headerClassName: 'text-red-700 dark:text-red-300',
            render: (value) => (
                <div className="text-center">
                    <span className="font-medium">{String(value || 0)}</span>
                    <span className="ml-1 text-xs text-muted-foreground">
                        items
                    </span>
                </div>
            ),
        },
        {
            key: 'total_amount',
            header: t('purchase.table_columns.total_amount'),
            accessor: 'total_amount',
            headerClassName: 'text-teal-700 dark:text-teal-300',
            render: (value) => (
                <span className="font-medium">
                    {formatCurrency(Number(value) || 0)}
                </span>
            ),
        },
        {
            key: 'created_at',
            header: t('purchase.table_columns.created_at'),
            accessor: 'created_at',
            sortable: true,
            headerClassName: 'text-emerald-700 dark:text-emerald-300',
            render: (value) => {
                const datePart = formatDatePart(value as TimestampInput, '');
                const timePart = formatTimePart(value as TimestampInput, '');

                if (!datePart && !timePart) {
                    return (
                        <span className="text-sm text-muted-foreground">
                            —
                        </span>
                    );
                }

                return (
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">
                            {datePart || '—'}
                        </span>
                        {timePart ? (
                            <span className="text-xs text-muted-foreground">
                                {timePart}
                            </span>
                        ) : null}
                    </div>
                );
            },
        },
        {
            key: 'actions',
            header: t('purchase.table_columns.actions'),
            headerClassName: 'text-pink-700 dark:text-pink-300',
            render: (_, row) => (
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            handleViewPurchase(row);
                        }}
                        className="h-8 w-8 p-0 border-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
                        title={t('purchase.action_titles.view_details')}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    {row.status === 'order' && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                handleReceivePurchase(row);
                            }}
                            disabled={loadingReceivePurchase}
                            className="h-8 w-8 p-0 border-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:text-orange-400 dark:hover:text-orange-300 dark:hover:bg-orange-900/20"
                            title={t('purchase.action_titles.receive_order')}
                        >
                            {loadingReceivePurchase ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                            <PackageCheck className="h-4 w-4" />
                            )}
                        </Button>
                    )}
                    {row.status === 'order' && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                handleEditPurchase(row);
                            }}
                            className="h-8 w-8 p-0 border-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/20"
                            title={t('purchase.action_titles.edit_purchase_order')}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                    )}
                    {row.status === 'order' && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                handleDeletePurchase(row);
                            }}
                            className="h-8 w-8 p-0 border-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                            title={t('purchase.action_titles.delete_purchase_order')}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('navigation.purchase')} />
            <div className="flex flex-1 flex-col gap-6 rounded-xl p-6">
                <PageHeader
                    title={t('purchase.title')}
                    description={t('purchase.description')}
                >
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRefresh}
                            disabled={refreshing || loading}
                            className="!border-blue-300 !bg-blue-50 !text-blue-700 hover:!border-blue-500 hover:!bg-blue-100 hover:!text-blue-800 focus:!border-blue-500 focus:!bg-blue-100 focus:!ring-2 focus:!ring-blue-200 focus:!outline-none disabled:opacity-50 dark:!border-blue-600 dark:!bg-blue-900/20 dark:!text-blue-300 dark:hover:!border-blue-500 dark:hover:!bg-blue-900/30 dark:hover:!text-blue-200 dark:focus:!border-blue-500 dark:focus:!bg-blue-900/30 dark:focus:!ring-2 dark:focus:!ring-blue-400"
                        >
                            <RefreshCw
                                className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
                            />
                            {refreshing
                                ? t('common.loading')
                                : loading
                                  ? t('common.loading')
                                  : t('purchase.button_text.refresh')}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleReturn}
                            className="gap-2 !border-cyan-300 !bg-cyan-50 !text-cyan-700 hover:!border-cyan-500 hover:!bg-cyan-100 hover:!text-cyan-800 focus:!border-cyan-500 focus:!bg-cyan-100 focus:!ring-2 focus:!ring-cyan-200 focus:!outline-none dark:!border-cyan-600 dark:!bg-cyan-900/20 dark:!text-cyan-300 dark:hover:!border-cyan-500 dark:hover:!bg-cyan-900/30 dark:hover:!text-cyan-200 dark:focus:!border-cyan-500 dark:focus:!bg-cyan-900/30 dark:focus:!ring-2 dark:focus:!ring-cyan-400"
                        >
                            <RotateCcw className="h-4 w-4" />
                            {t('purchase.return')}
                        </Button>
                        <Button
                            onClick={handleAddPurchase}
                            className="gap-2 !border-green-300 !bg-green-50 !text-green-700 hover:!border-green-500 hover:!bg-green-100 hover:!text-green-800 focus:!border-green-500 focus:!bg-green-100 focus:!ring-2 focus:!ring-green-200 focus:!outline-none dark:!border-green-600 dark:!bg-green-900/20 dark:!text-green-300 dark:hover:!border-green-500 dark:hover:!bg-green-900/30 dark:hover:!text-green-200 dark:focus:!border-green-500 dark:focus:!bg-green-900/30 dark:focus:!ring-2 dark:focus:!ring-green-400"
                        >
                            <Plus className="h-4 w-4" />
                            {t('purchase.add_purchase')}
                        </Button>
                    </div>
                </PageHeader>

                {/* Purchase Statistics Cards */}
                <StatsCards>
                    {/* Total Orders */}
                    <StatCard
                        title={t('purchase.statistics_labels.total_orders')}
                        value={purchaseStats.totalPurchases.toString()}
                        description={t('purchase.statistics_labels.total_orders_desc')}
                        icon={ShoppingCart}
                        color="indigo"
                        badge={{
                            text: t('purchase.statistics_labels.all_orders'),
                            variant: 'secondary',
                            color: 'indigo',
                        }}
                    />

                    {/* Total Value */}
                    <StatCard
                        title={t('purchase.statistics_labels.total_value')}
                        value={Number(purchaseStats.totalValue) || 0}
                        description={t('purchase.statistics_labels.total_value_desc')}
                        icon={TrendingUp}
                        color="emerald"
                        isCurrency={true}
                        showInfoButton={true}
                        badge={{
                            text: t('purchase.statistics_labels.total_value'),
                            variant: 'default',
                            color: 'emerald',
                        }}
                    />

                    {/* Total Products */}
                    <StatCard
                        title={t('purchase.statistics_labels.total_products')}
                        value={purchaseStats.totalItemsOrdered}
                        description={t('purchase.statistics_labels.total_products_desc')}
                        icon={Package}
                        color="purple"
                        badge={{
                            text: t('purchase.statistics_labels.all_products'),
                            variant: 'secondary',
                            color: 'purple',
                        }}
                    />

                    {/* Today Orders */}
                    <StatCard
                        title={t('purchase.statistics_labels.today_orders')}
                        value={purchaseStats.todayPurchases.toString()}
                        description={t('purchase.statistics_labels.today_orders_desc')}
                        icon={Calendar}
                        color="amber"
                        badge={{
                            text: t('purchase.statistics_labels.today'),
                            variant: 'default',
                            color: 'amber',
                        }}
                    />

                    {/* Today Value */}
                    <StatCard
                        title={t('purchase.statistics_labels.today_value')}
                        value={Number(purchaseStats.todayValue) || 0}
                        description={t('purchase.statistics_labels.today_value_desc')}
                        icon={DollarSign}
                        color="cyan"
                        isCurrency={true}
                        showInfoButton={true}
                        badge={{
                            text: t('purchase.statistics_labels.today_value'),
                            variant: 'default',
                            color: 'cyan',
                        }}
                    />

                    {/* Today Products */}
                    <StatCard
                        title={t('purchase.statistics_labels.today_products')}
                        value={purchaseStats.todayItemsOrdered}
                        description={t('purchase.statistics_labels.today_products_desc')}
                        icon={FileText}
                        color="pink"
                        badge={{
                            text: t('purchase.statistics_labels.today_products'),
                            variant: 'default',
                            color: 'pink',
                        }}
                    />
                </StatsCards>

                {/* Custom Purchase Filter */}
                <PurchaseFilter
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                />

                {/* Purchase Data Table */}
                <DataTable
                    title={t('purchase.title')}
                    subtitle={`Showing ${purchases.length} of ${paginationMeta.total} purchases`}
                    headerActions={
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsExcelMonthModalOpen(true)}
                            className="h-8 border-blue-300 bg-blue-50 px-3 text-blue-700 hover:border-blue-400 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:border-blue-600 dark:hover:bg-blue-900/30"
                        >
                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                            Excel
                        </Button>
                    }
                    data={purchases}
                    columns={purchaseColumns}
                    loading={loading}
                    emptyMessage={
                        Object.keys(filters).length > 0
                            ? t('purchase.no_matches_found')
                            : t('purchase.empty_message')
                    }
                    pagination={{
                        currentPage: paginationMeta.current_page,
                        totalPages: paginationMeta.last_page,
                        pageSize: paginationMeta.per_page,
                        totalItems: paginationMeta.total,
                        onPageChange: setCurrentPage,
                        showInfo: true,
                    }}
                />

                {/* Add/Edit Purchase Modal */}
                <AddPurchaseModal
                    isOpen={isAddPurchaseModalOpen}
                    onClose={() => {
                        // Close modal and clear editing state
                        setIsAddPurchaseModalOpen(false);
                        setEditingPurchase(null);
                        clearModalStateFromStorage();
                    }}
                    onSuccess={handlePurchaseSuccess}
                    editPurchase={
                        editingPurchase
                            ? {
                                  id: editingPurchase.id,
                                  invoice_name:
                                      editingPurchase.invoice_name || '',
                                  invoice_id: editingPurchase.invoice_id || '',
                                  notes: editingPurchase.notes || '',
                                  items:
                                      editingPurchase.items?.map((item) => ({
                                          product_id: item.product_id || 0,
                                          product_type:
                                              item.product_type || 'product',
                                          product_name: item.product_name || '',
                                          identifier: item.identifier || '',
                                          cost_price: item.cost_price || 0,
                                          sell_price: item.sell_price || 0,
                                          quantity: item.quantity || 0,
                                          supplier_id: item.supplier_id,
                                          supplier_name: item.supplier_name,
                                          total_cost: item.total_cost || 0,
                                          profit_margin:
                                              item.profit_margin || 0,
                                      })) || [],
                              }
                            : undefined
                    }
                />

                {/* Purchase Details Modal */}
                <PurchaseDetailsModal
                    isOpen={isDetailsModalOpen}
                    onClose={handleDetailsModalClose}
                    purchaseId={selectedPurchaseId}
                />

                {/* Purchase Receive Modal */}
                <PurchaseReceiveModal
                    isOpen={isReceiveModalOpen}
                    onClose={() => {
                        setIsReceiveModalOpen(false);
                        setReceivingPurchase(null);
                    }}
                    onSuccess={handlePurchaseSuccess}
                    purchase={receivingPurchase}
                />

                {/* Delete Purchase Modal */}
                <DeleteModal
                    isOpen={isDeleteModalOpen}
                    title={t('purchase.action_titles.delete_purchase_order')}
                    description={
                        purchaseToDelete
                            ? t('purchase.delete_confirmation', {
                                name: purchaseToDelete.invoice_name,
                                id: purchaseToDelete.invoice_id
                            })
                            : ''
                    }
                    confirmButtonText={t('common.delete')}
                    cancelButtonText={t('common.cancel')}
                    onConfirm={handleDeleteConfirm}
                    onClose={handleDeleteModalClose}
                    isLoading={loading}
                />

                {/* Return Purchase Modal */}
                <ReturnPurchaseModal
                    isOpen={isReturnModalOpen}
                    onClose={() => setIsReturnModalOpen(false)}
                    onReturnProcessed={handleReturnProcessed}
                />

                {/* Excel export by month modal */}
                <ExportTransactionsByMonthModal
                    isOpen={isExcelMonthModalOpen}
                    onClose={() => setIsExcelMonthModalOpen(false)}
                    onExport={handleExportExcelByMonth}
                    i18nKey="purchase.export_by_month"
                />
            </div>
        </AppLayout>
    );
}
