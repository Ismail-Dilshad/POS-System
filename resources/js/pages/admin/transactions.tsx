import { PageHeader } from '@/components/layout/page-header';
import ReturnModal from '@/components/modals/return-modal';
import { TransactionDetailsModal } from '@/components/modals/transaction-details-modal';
import {
    TransactionsFilterComponent,
    type transactionsFilterOptions,
} from '@/components/filters/transactions-filter-component';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExportTransactionsByMonthModal } from '@/components/modals/export-transactions-by-month-modal';
import { DataTable } from '@/components/ui/data-table';
import { StatCard, StatsCards } from '@/components/charts/stats-cards';
import { useTranslation } from '@/hooks/use-translation';
import { robustDeepRefresh } from '@/utils/deep-refresh';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/lib/currency';
import {
    formatDatePart,
    formatDateTimeDisplay,
    formatTimePart,
    type TimestampInput,
} from '@/lib/datetime';
import {
    transactionService,
    type Transaction,
} from '@/services/business/transactionService';
import { type BreadcrumbItem } from '@/types';
import { type Column } from '@/types/table';
import { Head } from '@inertiajs/react';
import {
    Eye,
    FileSpreadsheet,
    RefreshCw,
    RotateCcw,
    DollarSign,
    ShoppingCart,
    Package,
    TrendingUp,
    Calendar,
    Activity,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';


// TypeScript interface for transaction display
interface TransactionDisplay extends Transaction {
    cashier_name: string;
    status_display: string;
    product_types: {
        product: number;
        scale_product: number;
        card: number;
    };
}

export default function Transactions() {
    const { t } = useTranslation();

    const [loading, setLoading] = useState(false);
    const [transactions, setTransactions] = useState<TransactionDisplay[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Statistics state
    const [statistics, setStatistics] = useState<{
        totalAmount: number;
        totalSales: number;
        totalItems: number;
        todayAmount: number;
        todaySales: number;
        todayItems: number;
    }>({
        totalAmount: 0,
        totalSales: 0,
        totalItems: 0,
        todayAmount: 0,
        todaySales: 0,
        todayItems: 0,
    });

    // Pagination metadata state
    const [paginationMeta, setPaginationMeta] = useState<{
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    }>({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
    });

    // Modal state
    const [selectedTransaction, setSelectedTransaction] =
        useState<TransactionDisplay | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

    // Excel export by month modal
    const [isExcelMonthModalOpen, setIsExcelMonthModalOpen] = useState(false);

    // Filter state
    const [filters, setFilters] = useState<transactionsFilterOptions>({});

    // Sorting state
    const [sorting, setSorting] = useState<{
        sortBy: string;
        sortOrder: 'asc' | 'desc';
    }>({
        sortBy: 'created_at',
        sortOrder: 'desc',
    });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const filterDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    /** Get first and last day of month (YYYY-MM) as YYYY-MM-DD for API */
    const getMonthDateRange = useCallback((ym: string) => {
        const [y, m] = ym.split('-').map(Number);
        const lastDay = new Date(y, m, 0).getDate();
        return {
            dateFrom: `${y}-${String(m).padStart(2, '0')}-01`,
            dateTo: `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
        };
    }, []);

    // Load transactions from API with comprehensive backend filtering
    const loadTransactions = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await transactionService.getTransactions({
                page: currentPage,
                perPage: pageSize,
                search: filters.orderId,
                cashierFullName: filters.cashierFullName,
                dateFrom: filters.dateFrom,
                dateTo: filters.dateTo,
                timeFrom: filters.timeFrom,
                timeTo: filters.timeTo,
                priceMin: filters.priceMin,
                priceMax: filters.priceMax,
                sortBy: sorting.sortBy,
                sortOrder: sorting.sortOrder,
            });

            if (response.success && response.data) {
                setPaginationMeta({
                    current_page: response.data.current_page,
                    last_page: response.data.last_page,
                    per_page: response.data.per_page,
                    total: response.data.total,
                });

                const transactionDisplays: TransactionDisplay[] =
                    response.data.data.map((transaction) => {
                        const productTypes = {
                            product: 0,
                            scale_product: 0,
                            card: 0,
                        };

                        transaction.items?.forEach((item) => {
                            if (item.product_id) {
                                productTypes.product += item.quantity || 1;
                            } else if (item.scale_product_id) {
                                productTypes.scale_product += 1;
                            } else if (item.card_id) {
                                productTypes.card += item.quantity || 1;
                            }
                        });

                        return {
                            ...transaction,
                            cashier_name:
                                transaction.user?.full_name || t('transactions.unknown'),
                            status_display:
                                transaction.status.charAt(0).toUpperCase() +
                                transaction.status.slice(1),
                            product_types: productTypes,
                        };
                    });

                setTransactions(transactionDisplays);
            } else {
                setError(response.message || t('transactions.failed_to_load'));
                setTransactions([]);
            }
        } catch {
            setError(t('transactions.failed_to_load'));
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    }, [currentPage, filters, sorting, t]);

    const loadStatistics = useCallback(async () => {
        try {
            // Get all-time statistics
            const allTimeResponse = await transactionService.getTransactionStatistics();

            if (allTimeResponse.success && allTimeResponse.data) {
                const allTimeStats = allTimeResponse.data;

                // Calculate today's date in user's local timezone (YYYY-MM-DD format)
                const now = new Date();
                const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                
                // Get today's date string in YYYY-MM-DD format using user's timezone
                // Use en-CA locale which gives YYYY-MM-DD format
                let todayDateStr = now.toLocaleDateString('en-CA', { timeZone: userTimezone });
                
                // Verify date format is correct (should be YYYY-MM-DD)
                if (!/^\d{4}-\d{2}-\d{2}$/.test(todayDateStr)) {
                    // Fallback: format using Intl.DateTimeFormat with timezone
                    const formatter = new Intl.DateTimeFormat('en-CA', {
                        timeZone: userTimezone,
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                    });
                    const parts = formatter.formatToParts(now);
                    const year = parts.find(p => p.type === 'year')?.value || '';
                    const month = parts.find(p => p.type === 'month')?.value || '';
                    const day = parts.find(p => p.type === 'day')?.value || '';
                    todayDateStr = `${year}-${month}-${day}`;
                        }
                
                // Fetch today's statistics using the report method which properly handles timezone
                const todayResponse = await transactionService.getTransactionStatisticsReport({
                    dateFrom: todayDateStr,
                    dateTo: todayDateStr,
                });

                const todayStats = todayResponse.success && todayResponse.data
                    ? todayResponse.data
                    : {
                          total_sales: 0,
                          total_transactions: 0,
                          total_items_sold: 0,
                      };

                setStatistics({
                    totalAmount: allTimeStats.total_sales || 0,
                    totalSales: allTimeStats.total_transactions || 0,
                    totalItems: allTimeStats.total_items_sold || 0,
                    todayAmount: todayStats.total_sales || 0,
                    todaySales: todayStats.total_transactions || 0,
                    todayItems: todayStats.total_items_sold || 0,
                });
            }
        } catch {
            setStatistics({
                totalAmount: 0,
                totalSales: 0,
                totalItems: 0,
                todayAmount: 0,
                todaySales: 0,
                todayItems: 0,
            });
        }
    }, []);


    // Debounced effect for filter changes (300ms delay)
    useEffect(() => {
        if (filterDebounceTimer.current) {
            clearTimeout(filterDebounceTimer.current);
        }

        filterDebounceTimer.current = setTimeout(() => {
        loadTransactions();
        }, 300);

        return () => {
            if (filterDebounceTimer.current) {
                clearTimeout(filterDebounceTimer.current);
            }
        };
    }, [filters, sorting, loadTransactions]);

    // Immediate effect for page changes (no debounce)
    useEffect(() => {
        loadTransactions();
    }, [currentPage, loadTransactions]);

    // Load statistics once on mount and refresh every 30 seconds for today's stats
    useEffect(() => {
        loadStatistics();
        
        // Refresh statistics every 30 seconds to show latest today's transactions
        const intervalId = setInterval(() => {
            loadStatistics();
        }, 30000);
        
        return () => clearInterval(intervalId);
    }, [loadStatistics]);

    // Excel export by month: fetch that month only, then build and download Excel
    const handleExportExcelByMonth = useCallback(async (monthStr: string) => {
        const { dateFrom, dateTo } = getMonthDateRange(monthStr);
        try {
            const { createWorkbook, addWorksheet, appendTable, downloadWorkbook } = await import('@/services/utils/excelService');

            const allTransactionsResponse = await transactionService.getAllTransactions({
                dateFrom,
                dateTo,
                sortBy: sorting.sortBy,
                sortOrder: sorting.sortOrder,
                export: true,
            });

            if (!allTransactionsResponse.success || !allTransactionsResponse.data) {
                return;
            }

            const allFilteredTransactions = Array.isArray(allTransactionsResponse.data)
                ? allTransactionsResponse.data
                : [];

            const totalSales = allFilteredTransactions.reduce(
                (sum, t) => sum + Number(t.total_amount || 0),
                0,
            );
            const totalPaid = allFilteredTransactions.reduce(
                (sum, t) => sum + Number(t.amount_paid || 0),
                0,
            );
            const totalDiscount = allFilteredTransactions.reduce(
                (sum, t) => sum + Number(t.discount || 0),
                0,
            );
            const totalItems = allFilteredTransactions.reduce(
                (sum, t) => sum + Number(t.items_count || 0),
                0,
            );
            const txCount = allFilteredTransactions.length;
            const avgSale = txCount > 0 ? totalSales / txCount : 0;
            const avgItemsPerTx = txCount > 0 ? totalItems / txCount : 0;

            const summaryData = [
                ['SUMMARY'],
                ['Total Transactions (count)', txCount],
                ['Total Sales', totalSales],
                ['Total Paid', totalPaid],
                ['Total Discount', totalDiscount],
                ['Total Items (quantity)', totalItems],
                ['Average Sale per Transaction', Number(avgSale.toFixed(2))],
                ['Average Items per Transaction', Number(avgItemsPerTx.toFixed(2))],
                [],
            ];

            const headers = [
                t('transactions.export.transaction_number'),
                t('transactions.export.total_amount'),
                t('transactions.export.amount_paid'),
                t('transactions.export.discount'),
                t('transactions.export.product_types'),
                t('transactions.export.cashier'),
                t('transactions.export.items_count'),
                t('transactions.export.status'),
                t('transactions.export.created_at'),
                t('transactions.export.updated_at'),
            ];
            const dataRows = allFilteredTransactions.map<(string | number)[]>((transaction) => {
                const productTypes = { product: 0, scale_product: 0, card: 0 };
                if (transaction.items) {
                    transaction.items.forEach((item) => {
                        if (item.is_scale_product) productTypes.scale_product++;
                        else if (item.card_id) productTypes.card++;
                        else productTypes.product++;
                    });
                }
                return [
                    transaction.transaction_number,
                    Number(transaction.total_amount) || 0,
                    Number(transaction.amount_paid) || 0,
                    Number(transaction.discount) || 0,
                    `${t('transactions.export.products')}: ${productTypes.product}, ${t('transactions.export.scale')}: ${productTypes.scale_product}, ${t('transactions.export.cards')}: ${productTypes.card}`,
                    transaction.user?.full_name || 'Unknown',
                    transaction.items_count,
                    transaction.status === 'completed' ? 'Completed' : transaction.status,
                    formatDateTimeDisplay(transaction.created_at),
                    formatDateTimeDisplay(transaction.updated_at),
                ];
            });

            const sumTotalAmount = allFilteredTransactions.reduce((s, t) => s + (Number(t.total_amount) || 0), 0);
            const sumAmountPaid = allFilteredTransactions.reduce((s, t) => s + (Number(t.amount_paid) || 0), 0);
            const sumDiscount = allFilteredTransactions.reduce((s, t) => s + (Number(t.discount) || 0), 0);
            const sumItemsCount = allFilteredTransactions.reduce((s, t) => s + (Number(t.items_count) || 0), 0);
            const totalsRow: (string | number)[] = ['TOTALS', sumTotalAmount, sumAmountPaid, sumDiscount, '', '', sumItemsCount, '', '', ''];

            const workbook = await createWorkbook();
            const worksheet = addWorksheet(workbook, 'Transactions');
            appendTable(worksheet, summaryData as unknown as (string | number)[][]);
            appendTable(worksheet, [headers]);
            appendTable(worksheet, dataRows);
            appendTable(worksheet, [totalsRow]);
            worksheet.columns = headers.map(() => ({ width: 22 }));

            await downloadWorkbook(workbook, `transactions_${monthStr}.xlsx`);
        } catch {
            // Error handled silently
        }
    }, [getMonthDateRange, sorting.sortBy, sorting.sortOrder, t]);

    const handleRefresh = async () => {
        try {
            // Robust deep refresh - equivalent to Ctrl+Shift+R
            await robustDeepRefresh({
                showLoading: true,
                loadingMessage: 'Refreshing transactions...',
                clearCaches: true
            });
        } catch {
            loadTransactions();
        }
    };

    const handleFiltersChange = (newFilters: transactionsFilterOptions) => {
        setFilters(newFilters);
        setCurrentPage(1);
    };

    const handleSort = (columnKey: string) => {
        setSorting((prevSorting) => {
            // If clicking the same column, toggle sort order
            if (prevSorting.sortBy === columnKey) {
                return {
                    sortBy: columnKey,
                    sortOrder: prevSorting.sortOrder === 'asc' ? 'desc' : 'asc',
                };
            }
            // If clicking a different column, set it as ascending
            return {
                sortBy: columnKey,
                sortOrder: 'asc',
            };
        });
    };


    // All filtering and sorting is done at backend level
    // Frontend just displays the data
    const totalItems = paginationMeta.total;
    const totalPages = paginationMeta.last_page;

    // Transactions table columns
    const transactionsColumns: Column<TransactionDisplay>[] = [
        {
            key: 'transaction_number',
            header: 'Receipt #',
            accessor: 'transaction_number',
            sortable: true,
            headerClassName: 'text-blue-700 dark:text-blue-300',
            render: (value) => (
                <span className="font-mono text-sm font-medium">
                    {String(value || '')}
                </span>
            ),
        },
        {
            key: 'total_amount',
            header: t('transactions.table_columns.total'),
            accessor: 'total_amount',
            sortable: true,
            headerClassName: 'text-indigo-700 dark:text-indigo-300',
            render: (value) => (
                <span className="font-medium text-green-600 dark:text-green-400">
                    {formatCurrency(Number(value) || 0)}
                </span>
            ),
        },
        {
            key: 'amount_paid',
            header: t('transactions.table_columns.paid'),
            accessor: 'amount_paid',
            sortable: false,
            headerClassName: 'text-green-700 dark:text-green-300',
            render: (value) => (
                <span className="font-medium text-[#1F3F3F]/60 dark:text-[#1F3F3F]/40">
                    {formatCurrency(Number(value) || 0)}
                </span>
            ),
        },
        {
            key: 'discount',
            header: t('transactions.table_columns.discount'),
            accessor: 'discount',
            sortable: false,
            headerClassName: 'text-purple-700 dark:text-purple-300',
            render: (value) => (
                <span className="font-medium text-green-600 dark:text-green-400">
                    {formatCurrency(Number(value) || 0)}
                </span>
            ),
        },
        {
            key: 'product_types',
            header: t('transactions.table_columns.items'),
            accessor: 'product_types',
            headerClassName: 'text-red-700 dark:text-red-300',
            render: (value) => {
                const productTypes = value as {
                    product: number;
                    scale_product: number;
                    card: number;
                };
                return (
                    <div className="flex flex-col gap-1">
                        {productTypes.product > 0 && (
                            <div className="flex items-center gap-1">
                                <Badge
                                    variant="outline"
                                    className="border-sky-200 bg-sky-100 text-xs text-sky-800 hover:bg-sky-200 dark:border-sky-400/40 dark:bg-sky-500/20 dark:text-sky-100 dark:hover:bg-sky-500/30"
                                >
                                    Normal: {productTypes.product}
                                </Badge>
                            </div>
                        )}
                        {productTypes.scale_product > 0 && (
                            <div className="flex items-center gap-1">
                                <Badge
                                    variant="outline"
                                    className="border-emerald-200 bg-emerald-100 text-xs text-emerald-800 hover:bg-emerald-200 dark:border-emerald-400/40 dark:bg-emerald-500/20 dark:text-emerald-100 dark:hover:bg-emerald-500/30"
                                >
                                    Scale: {productTypes.scale_product}
                                </Badge>
                            </div>
                        )}
                        {productTypes.card > 0 && (
                            <div className="flex items-center gap-1">
                                <Badge
                                    variant="outline"
                                    className="border-violet-200 bg-violet-100 text-xs text-violet-800 hover:bg-violet-200 dark:border-violet-400/40 dark:bg-violet-500/20 dark:text-violet-100 dark:hover:bg-violet-500/30"
                                >
                                    Card: {productTypes.card}
                                </Badge>
                            </div>
                        )}
                        {productTypes.product === 0 &&
                            productTypes.scale_product === 0 &&
                            productTypes.card === 0 && (
                                <span className="text-xs text-muted-foreground">
                                    No items
                                </span>
                            )}
                    </div>
                );
            },
        },
        {
            key: 'user_name',
            header: t('transactions.table_columns.cashier'),
            accessor: 'user',
            sortable: false,
            headerClassName: 'text-teal-700 dark:text-teal-300',
            render: (value, row) => (
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {row.user?.full_name || row.cashier_name || t('transactions.unknown')}
                </span>
            ),
        },
        {
            key: 'created_at',
            header: t('transactions.table_columns.time'),
            accessor: 'created_at',
            sortable: true,
            headerClassName: 'text-emerald-700 dark:text-emerald-300',
            render: (value) => {
                const date = formatDatePart(value as TimestampInput, '');
                const time = formatTimePart(value as TimestampInput, '');

                if (!date && !time) {
                    return (
                        <span className="text-sm text-muted-foreground">
                            N/A
                        </span>
                    );
                }

                return (
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">
                            {date || 'N/A'}
                        </span>
                        {time ? (
                            <span className="text-xs text-muted-foreground">
                                {time}
                            </span>
                        ) : null}
                    </div>
                );
            },
        },
        {
            key: 'actions',
            header: t('transactions.table_columns.view'),
            headerClassName: 'text-pink-700 dark:text-pink-300',
            render: (_, row) => (
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setSelectedTransaction(row);
                            setIsModalOpen(true);
                        }}
                        className="h-8 w-8 p-0 border-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
                        title={t('transactions.view_transaction_details')}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('navigation.admin'),
        },
        {
            title: t('navigation.transactions'),
            href: '/admin/transactions',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('navigation.transactions')} />
            <div className="flex flex-1 flex-col gap-6 rounded-xl p-6">
                <PageHeader
                    title={t('transactions.title')}
                    description={t('transactions.description')}
                >
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        className="!border-lime-300 !bg-lime-50 !text-lime-700 hover:!border-lime-500 hover:!bg-lime-100 dark:!border-lime-600 dark:!bg-lime-900/20 dark:!text-lime-300 dark:hover:!border-lime-500 dark:hover:!bg-lime-900/30"
                    >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        {t('transactions.buttons.refresh')}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsReturnModalOpen(true)}
                        className="!border-cyan-300 !bg-cyan-50 !text-cyan-700 hover:!border-cyan-500 hover:!bg-cyan-100 dark:!border-cyan-600 dark:!bg-cyan-900/20 dark:!text-cyan-300 dark:hover:!border-cyan-500 dark:hover:!bg-cyan-900/30"
                    >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        {t('transactions.buttons.return')}
                    </Button>
                </PageHeader>

                {/* Statistics Cards */}
                <StatsCards className="grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    <StatCard
                        title={t('transactions.statistics_labels.total_amount')}
                        value={statistics.totalAmount}
                        description={t('transactions.statistics_labels.total_amount_desc')}
                        icon={DollarSign}
                        color="green"
                        isCurrency={true}
                    />
                    <StatCard
                        title={t('transactions.statistics_labels.total_sales')}
                        value={statistics.totalSales}
                        description={t('transactions.statistics_labels.total_sales_desc')}
                        icon={ShoppingCart}
                        color="blue"
                    />
                    <StatCard
                        title={t('transactions.statistics_labels.total_items')}
                        value={statistics.totalItems}
                        description={t('transactions.statistics_labels.total_items_desc')}
                        icon={Package}
                        color="purple"
                    />
                    <StatCard
                        title={t('transactions.statistics_labels.today_amount')}
                        value={statistics.todayAmount}
                        description={t('transactions.statistics_labels.today_amount_desc')}
                        icon={TrendingUp}
                        color="emerald"
                        isCurrency={true}
                        showInfoButton={true}
                        badge={{
                            text: t('transactions.statistics_labels.today'),
                            variant: 'default',
                            color: 'emerald',
                        }}
                    />
                    <StatCard
                        title={t('transactions.statistics_labels.today_sales')}
                        value={statistics.todaySales}
                        description={t('transactions.statistics_labels.today_sales_desc')}
                        icon={Activity}
                        color="orange"
                        badge={{
                            text: t('transactions.statistics_labels.today_sales'),
                            variant: 'default',
                            color: 'orange',
                        }}
                    />
                    <StatCard
                        title={t('transactions.statistics_labels.today_items')}
                        value={statistics.todayItems}
                        description={t('transactions.statistics_labels.today_items_desc')}
                        icon={Calendar}
                        color="cyan"
                        badge={{
                            text: t('transactions.statistics_labels.today_items'),
                            variant: 'default',
                            color: 'cyan',
                        }}
                    />
                </StatsCards>

                {/* Error Display */}
                {error && (
                    <div className="rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-red-800 dark:text-red-200">
                                {error}
                            </p>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setError(null)}
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                            >
                                ×
                            </Button>
                        </div>
                    </div>
                )}


                {/* Transactions Filter Component */}
                <TransactionsFilterComponent
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                />

                {/* Transactions Data Table */}
                <DataTable
                    title={t('transactions.title')}
                    subtitle={`Showing ${transactions.length} of ${totalItems} transactions`}
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
                    data={transactions}
                    columns={transactionsColumns}
                    loading={loading}
                    emptyMessage={
                        Object.keys(filters).length > 0
                            ? t('transactions.no_matches_found')
                            : t('transactions.empty_message')
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
                    className="bg-background"
                />
            </div>

            {/* Transaction Details Modal */}
            {selectedTransaction && (
                <TransactionDetailsModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedTransaction(null);
                    }}
                    transaction={selectedTransaction}
                />
            )}

            {/* Return Modal */}
            <ReturnModal
                isOpen={isReturnModalOpen}
                onClose={() => setIsReturnModalOpen(false)}
                onReturnProcessed={(result) => {
                    if (result?.transaction_deleted && result?.original_transaction_id) {
                        setTransactions((prev) => 
                            prev.filter((t) => t.id !== result.original_transaction_id)
                        );
                        setPaginationMeta((prev) => ({
                            ...prev,
                            total: Math.max(0, prev.total - 1),
                        }));
                    }
                    loadTransactions();
                    loadStatistics();
                }}
            />

            {/* Excel export by month modal */}
            <ExportTransactionsByMonthModal
                isOpen={isExcelMonthModalOpen}
                onClose={() => setIsExcelMonthModalOpen(false)}
                onExport={handleExportExcelByMonth}
            />
        </AppLayout>
    );
}
