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
import { useToast } from '@/components/ui/toast';
import { useTranslation } from '@/hooks/use-translation';
import { robustDeepRefresh } from '@/utils/deep-refresh';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/lib/currency';
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
    Package,
    PackageCheck,
    Plus,
    RefreshCw,
    RotateCcw,
    ShoppingCart,
    Trash2,
    TrendingUp,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

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
            // Silently fail if localStorage is unavailable
        }
    }, [PURCHASE_MODAL_STORAGE_KEY]);

    const clearModalStateFromStorage = useCallback(() => {
        try {
            localStorage.removeItem(PURCHASE_MODAL_STORAGE_KEY);
        } catch {
            // Silently fail if localStorage is unavailable
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
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [purchaseToDelete, setPurchaseToDelete] = useState<Purchase | null>(
        null,
    );
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

    // Filter state
    const [filters, setFilters] = useState<PurchaseFilterOptions>({});

    // Purchase data from backend
    const [purchases, setPurchases] = useState<Purchase[]>([]);

    // Purchase statistics state
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
        topSupplierPurchases: 0,
        uniqueSuppliers: 0,
        productsUpdated: 0,
        lowStockReplenished: 0,
    });

    // Pagination and sorting state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [loading, setLoading] = useState(false);
    const [sorting, setSorting] = useState<{
        sortBy: string;
        sortOrder: 'asc' | 'desc';
    }>({
        sortBy: 'created_at',
        sortOrder: 'desc',
    });

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

    const loadPurchases = useCallback(async () => {
        setLoading(true);
        try {
            const response = await purchaseService.getPurchases(
                {
                    search: filters.invoiceName || filters.invoiceId || undefined,
                    status: filters.status || undefined,
                    multiSupplier: filters.multiSupplier || undefined,
                    timeFrom: filters.timeFrom || undefined,
                    timeTo: filters.timeTo || undefined,
                },
                1,
                100,
                false
            );

            if (response.success && response.data) {
                let filteredPurchases = response.data;

                // Apply client-side multi-supplier filter
                if (filters.multiSupplier && filters.multiSupplier !== 'all') {
                    filteredPurchases = response.data.filter((purchase) => {
                        if (!purchase.items || purchase.items.length === 0)
                            return false;

                        const uniqueSuppliers = new Set(
                            purchase.items
                                .map((item) => item.supplier_name)
                                .filter(Boolean),
                        ).size;

                        if (filters.multiSupplier === 'single') {
                            return uniqueSuppliers === 1;
                        } else if (filters.multiSupplier === 'multiple') {
                            return uniqueSuppliers > 1;
                        }

                        return true;
                    });
                }

                setPurchases(filteredPurchases);

                // Calculate purchase statistics
                const totalPurchases = response.data.length;
                const totalValue = response.data.reduce((sum, p) => {
                    const amount = Number(p.total_amount) || 0;
                    return sum + amount;
                }, 0);
                // Calculate today's statistics with proper 24-hour period (midnight to midnight)
                const now = new Date();
                const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
                const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
                
                const todayPurchases = response.data.filter(
                    (p) => {
                        if (!p.created_at) return false;
                        const purchaseDate = new Date(p.created_at);
                        return purchaseDate >= todayStart && purchaseDate < todayEnd;
                    }
                ).length;
                
                const todayValue = response.data
                    .filter(
                        (p) => {
                            if (!p.created_at) return false;
                            const purchaseDate = new Date(p.created_at);
                            return purchaseDate >= todayStart && purchaseDate < todayEnd;
                        }
                    )
                    .reduce((sum, p) => {
                        const amount = Number(p.total_amount) || 0;
                        return sum + amount;
                    }, 0);

                const totalProductsOrdered = response.data.reduce((sum, p) => {
                    if (p.items && p.items.length > 0) {
                        // Count unique products, not quantities
                        return sum + p.items.length;
                    }
                    // Fallback: if no items data, assume 1 product per purchase
                    return sum + 1;
                }, 0);

                // Calculate today's products ordered with proper 24-hour period
                const todayProductsOrdered = response.data
                    .filter(
                        (p) => {
                            if (!p.created_at) return false;
                            const purchaseDate = new Date(p.created_at);
                            return purchaseDate >= todayStart && purchaseDate < todayEnd;
                        }
                    )
                    .reduce((sum, p) => {
                        if (p.items && p.items.length > 0) {
                            // Count unique products, not quantities
                            return sum + p.items.length;
                        }
                        // Fallback: if no items data, assume 1 product per purchase
                        return sum + 1;
                    }, 0);

                const pendingPurchases = response.data.filter(
                    (p) => p.status === 'order',
                ).length;
                const uniqueSuppliers = new Set(
                    response.data.flatMap(
                        (p) =>
                            p.items
                                ?.map((item) => item.supplier_name)
                                .filter(Boolean) || [],
                    ),
                ).size;

                setPurchaseStats((prev) => ({
                    ...prev,
                    totalPurchases,
                    totalValue,
                    todayPurchases,
                    todayValue,
                    totalItemsOrdered: totalProductsOrdered,
                    todayItemsOrdered: todayProductsOrdered,
                    pendingPurchases,
                    uniqueSuppliers,
                }));
            } else {
                // Handle API error response
                console.error(
                    'Failed to load purchases:',
                    response.message || t('purchase.error_messages.unknown_error'),
                );
                setPurchases([]);
            }
        } catch (error) {
            console.error('Failed to load purchases:', error);
            setPurchases([]);
            // You could add toast notification here if needed
        } finally {
            setLoading(false);
        }
    }, [
        filters.invoiceName,
        filters.status,
        filters.invoiceId,
        filters.multiSupplier,
        filters.timeFrom,
        filters.timeTo,
        t,
    ]);

    const handleRefresh = async () => {
        setRefreshing(true);
        setLoading(true);

        try {
            // Robust deep refresh - equivalent to Ctrl+Shift+R
            await robustDeepRefresh({
                showLoading: true,
                loadingMessage: 'Refreshing purchases...',
                clearCaches: true
            });
        } catch (error) {
            console.error('Deep refresh failed:', error);
            
            // Fallback to data refresh
            try {
                // Clear current data first
                setPurchases([]);
                setPurchaseStats({
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
                    topSupplierPurchases: 0,
                    uniqueSuppliers: 0,
                    productsUpdated: 0,
                    lowStockReplenished: 0,
                });

                // Reset pagination
                setCurrentPage(1);

                // Reload data with current filters
                await loadPurchases();
            } catch (fallbackError) {
                console.error('Failed to refresh purchases:', fallbackError);
            }
        } finally {
            setRefreshing(false);
            setLoading(false);
        }
    };

    // Load data on component mount and filter changes
    useEffect(() => {
        loadPurchases();
    }, [loadPurchases]);

    // Handle successful purchase creation
    const handlePurchaseSuccess = () => {
        loadPurchases(); // Refresh the list
        clearModalStateFromStorage(); // Clear modal state from localStorage
    };

    const handleFiltersChange = (newFilters: PurchaseFilterOptions) => {
        setFilters(newFilters);
        setCurrentPage(1); // Reset to first page when filters change
    };

    const handleSort = (columnKey: string) => {
        setSorting((prevSorting) => {
            if (prevSorting.sortBy === columnKey) {
                return {
                    sortBy: columnKey,
                    sortOrder: prevSorting.sortOrder === 'asc' ? 'desc' : 'asc',
                };
            }
            return {
                sortBy: columnKey,
                sortOrder: 'asc',
            };
        });
    };

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

    const handleReceivePurchase = (purchase: Purchase) => {
        setReceivingPurchase(purchase);
        setIsReceiveModalOpen(true);
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

    const filteredPurchases = purchases
        .filter((purchase) => {

            if (filters.priceMin) {
                const minPrice = parseFloat(filters.priceMin);
                if (purchase.total_amount < minPrice) return false;
            }

            if (filters.priceMax) {
                const maxPrice = parseFloat(filters.priceMax);
                if (purchase.total_amount > maxPrice) return false;
            }

            if (filters.dateFrom) {
                const purchaseDate = new Date(purchase.created_at);
                const fromDate = new Date(filters.dateFrom);
                if (purchaseDate < fromDate) return false;
            }

            if (filters.dateTo) {
                const purchaseDate = new Date(purchase.created_at);
                const toDate = new Date(filters.dateTo);
                if (purchaseDate > toDate) return false;
            }

            return true;
        })
        .sort((a, b) => {
            const aValue = a[sorting.sortBy as keyof Purchase];
            const bValue = b[sorting.sortBy as keyof Purchase];

            if (aValue === undefined || bValue === undefined) return 0;

            if (sorting.sortOrder === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
        });

    // Pagination
    const totalItems = filteredPurchases.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedPurchases = filteredPurchases.slice(
        startIndex,
        startIndex + pageSize,
    );

    // Unified export handler for both CSV and Excel
    const handleExport = async (format: 'xlsx' | 'csv') => {
        try {
            // Fetch ALL purchases matching current filters
            const response = await purchaseService.getPurchases(
                {
                    search: filters.invoiceName || filters.invoiceId || undefined,
                    status: filters.status || undefined,
                    multiSupplier: filters.multiSupplier || undefined,
                    timeFrom: filters.timeFrom || undefined,
                    timeTo: filters.timeTo || undefined,
                },
                1,
                10000,
                true // export mode to get all purchases
            );

            if (!response.success || !response.data) return;

            // Apply client-side multi-supplier filter
            const purchases = response.data.filter((purchase) => {
                if (filters.multiSupplier && filters.multiSupplier !== 'all') {
                    if (!purchase.items || purchase.items.length === 0) return false;
                    const uniqueSuppliers = new Set(
                        purchase.items.map((item) => item.supplier_name).filter(Boolean)
                    ).size;
                    if (filters.multiSupplier === 'single') return uniqueSuppliers === 1;
                    if (filters.multiSupplier === 'multiple') return uniqueSuppliers > 1;
                }
                return true;
            });

            if (purchases.length === 0) return;

            const { exportData } = await import('@/services/utils/excelService');

            // Calculate summary
            const totalAmount = purchases.reduce((sum, p) => sum + Number(p.total_amount || 0), 0);
            const totalItems = purchases.reduce((sum, p) => {
                if (p.items && p.items.length > 0) {
                    return sum + p.items.reduce((q, i) => q + Number(i.quantity || 0), 0);
                }
                return sum + Number(p.total_orders || 0);
            }, 0);
            const orderCount = purchases.filter((p) => p.status === 'order').length;
            const receivedCount = purchases.filter((p) => p.status === 'receive').length;
            const avgAmount = purchases.length > 0 ? totalAmount / purchases.length : 0;
            const avgItems = purchases.length > 0 ? totalItems / purchases.length : 0;

            await exportData(purchases, {
                sheetName: 'Purchases',
                filename: 'purchases_export',
                headers: ['Invoice ID', 'Invoice Name', 'Suppliers', 'Status', 'Total Items', 'Total Amount', 'Created At'],
                rowMapper: (purchase) => {
                    const suppliers = purchase.items?.map((item) => item.supplier_name).filter(Boolean) || [];
                    const uniqueSuppliers = [...new Set(suppliers)];
                    return [
                        purchase.invoice_id || '',
                        purchase.invoice_name || '',
                        uniqueSuppliers.join(', ') || 'No Supplier',
                        purchase.status === 'order' ? 'Order' : 'Received',
                        purchase.total_orders || 0,
                        Number(purchase.total_amount) || 0,
                        new Date(purchase.created_at).toLocaleString(),
                    ];
                },
                summaryRows: [
                    ['SUMMARY'],
                    ['Total Purchases (count)', purchases.length],
                    ['Orders', orderCount],
                    ['Received', receivedCount],
                    ['Total Amount', totalAmount],
                    ['Total Items (quantity)', totalItems],
                    ['Average Amount per Purchase', Number(avgAmount.toFixed(2))],
                    ['Average Items per Purchase', Number(avgItems.toFixed(2))],
                    [],
                ],
                columnWidths: [25, 20, 25, 12, 12, 16, 20],
            }, format);
        } catch (error) {
            console.error('Error generating export:', error);
        }
    };

    const handleExcelExport = () => handleExport('xlsx');

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
            sortable: true,
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
            sortable: true,
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
                const date = new Date(String(value));

                if (Number.isNaN(date.getTime())) {
                    return (
                        <span className="text-sm text-muted-foreground">
                            —
                        </span>
                    );
                }

                return (
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">
                            {date.toLocaleDateString()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {date.toLocaleTimeString()}
                        </span>
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
                            className="h-8 w-8 p-0 border-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:text-orange-400 dark:hover:text-orange-300 dark:hover:bg-orange-900/20"
                            title={t('purchase.action_titles.receive_order')}
                        >
                            <PackageCheck className="h-4 w-4" />
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
                    subtitle={`Showing ${filteredPurchases.length} of ${purchases.length} purchases`}
                    headerActions={
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExcelExport}
                            className="h-8 border-blue-300 bg-blue-50 px-3 text-blue-700 hover:border-blue-400 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:border-blue-600 dark:hover:bg-blue-900/30"
                        >
                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                            Excel
                        </Button>
                    }
                    data={paginatedPurchases}
                    columns={purchaseColumns}
                    loading={loading}
                    emptyMessage={
                        Object.keys(filters).length > 0
                            ? t('purchase.no_matches_found')
                            : t('purchase.empty_message')
                    }
                    pagination={{
                        currentPage,
                        totalPages,
                        pageSize,
                        totalItems,
                        onPageChange: setCurrentPage,
                        showInfo: true,
                    }}
                    sorting={{
                        sortBy: sorting.sortBy,
                        sortOrder: sorting.sortOrder,
                        onSort: handleSort,
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
            </div>
        </AppLayout>
    );
}
