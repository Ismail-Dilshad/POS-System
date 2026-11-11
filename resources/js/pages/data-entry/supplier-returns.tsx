import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/charts/stats-cards';
import { SupplierReturnDetailsModal } from '@/components/modals/supplier-return-details-modal';
import { DataTable } from '@/components/ui/data-table';
import { ExportTransactionsByMonthModal } from '@/components/modals/export-transactions-by-month-modal';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/lib/currency';
import {
    formatDatePart,
    type TimestampInput,
} from '@/lib/datetime';
import supplierReturnService, {
    type SupplierReturn,
    type SupplierReturnStatistics,
} from '@/services/business/supplierReturnService';
import { type BreadcrumbItem } from '@/types';
import { type Column } from '@/types/table';
import { Head } from '@inertiajs/react';
import {
    RefreshCw,
    RotateCcw,
    DollarSign,
    Package,
    Calendar,
    TrendingUp,
    Search,
    X,
    Eye,
    FileSpreadsheet,
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';

export default function SupplierReturns() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [paginationMeta, setPaginationMeta] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
    });
    const [sorting, setSorting] = useState({
        sortBy: 'created_at',
        sortOrder: 'desc' as 'asc' | 'desc',
    });
    const [statistics, setStatistics] = useState<SupplierReturnStatistics>({
        total_returns: 0,
        total_amount: 0,
        total_items: 0,
        this_month_returns: 0,
        this_month_amount: 0,
        this_month_items: 0,
    });
    const filterDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Filter state
    const [orderId, setOrderId] = useState('');
    const [orderName, setOrderName] = useState('');
    const [minAmount, setMinAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Table data state
    const [returns, setReturns] = useState<SupplierReturn[]>([]);

    // Modal state
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedReturnId, setSelectedReturnId] = useState<number | null>(null);
    const [isExcelMonthModalOpen, setIsExcelMonthModalOpen] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('navigation.admin') },
        { title: t('navigation.supplier_returns'), href: '/admin/supplier-returns' },
    ];

    const loadSupplierReturns = useCallback(async () => {
        setLoading(true);

        try {
            const response = await supplierReturnService.getSupplierReturns({
                page: currentPage,
                per_page: pageSize,
                order_id: orderId,
                order_name: orderName,
                date_from: dateFrom,
                date_to: dateTo,
                min_amount: minAmount,
                max_amount: maxAmount,
                sort_by: sorting.sortBy,
                sort_order: sorting.sortOrder,
            });

            if (response && response.data) {
                setPaginationMeta({
                    current_page: response.current_page || 1,
                    last_page: response.last_page || 1,
                    per_page: response.per_page || pageSize,
                    total: response.total || 0,
                });

                const records = Array.isArray(response.data) ? response.data : [];
                setReturns(records);
            } else {
                setReturns([]);
                setPaginationMeta({
                    current_page: 1,
                    last_page: 1,
                    per_page: pageSize,
                    total: 0,
                });
            }
        } catch {
            setReturns([]);
            setPaginationMeta({
                current_page: 1,
                last_page: 1,
                per_page: pageSize,
                total: 0,
            });
        } finally {
            setLoading(false);
        }
    }, [currentPage, orderId, orderName, minAmount, maxAmount, dateFrom, dateTo, sorting, pageSize]);

    const loadStatistics = useCallback(async () => {
        try {
            const statsResponse = await supplierReturnService.getSupplierReturnStatistics();
            setStatistics(statsResponse);
        } catch {
            setStatistics({
                total_returns: 0,
                total_amount: 0,
                total_items: 0,
                this_month_returns: 0,
                this_month_amount: 0,
                this_month_items: 0,
            });
        }
    }, []);

    useEffect(() => {
        if (filterDebounceTimer.current) {
            clearTimeout(filterDebounceTimer.current);
        }

        filterDebounceTimer.current = setTimeout(() => {
            loadSupplierReturns();
        }, 300);

        return () => {
            if (filterDebounceTimer.current) {
                clearTimeout(filterDebounceTimer.current);
            }
        };
    }, [orderId, orderName, minAmount, maxAmount, dateFrom, dateTo, sorting, loadSupplierReturns]);

    useEffect(() => {
        loadSupplierReturns();
    }, [currentPage, loadSupplierReturns]);

    useEffect(() => {
        loadStatistics();
    }, [loadStatistics]);

    const handleRefresh = () => {
        loadSupplierReturns();
        loadStatistics();
    };

    // Filter handlers
    const handleOrderIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setOrderId(e.target.value);
        setCurrentPage(1); // Reset to first page when filter changes
    };

    const handleOrderNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setOrderName(e.target.value);
        setCurrentPage(1);
    };


    const handleMinAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9.]/g, '');
        setMinAmount(value);
        setCurrentPage(1);
    };

    const handleMaxAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9.]/g, '');
        setMaxAmount(value);
        setCurrentPage(1);
    };

    const handleDateFromChange = (date: string) => {
        setDateFrom(date);
        setCurrentPage(1);
    };

    const handleDateToChange = (date: string) => {
        setDateTo(date);
        setCurrentPage(1);
    };

    const clearAllFilters = () => {
        setOrderId('');
        setOrderName('');
        setMinAmount('');
        setMaxAmount('');
        setDateFrom('');
        setDateTo('');
        setCurrentPage(1);
    };

    const handleSort = (key: string) => {
        setSorting(prev => ({
            sortBy: key,
            sortOrder: prev.sortBy === key && prev.sortOrder === 'asc' ? 'desc' : 'asc',
        }));
        setCurrentPage(1);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const totalItems = paginationMeta.total;
    const totalPages = paginationMeta.last_page;

    const handleRowClick = () => {
        // Row click disabled - only view button opens modal
    };

    const handleCloseDetailsModal = () => {
        setDetailsModalOpen(false);
        setSelectedReturnId(null);
    };

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

            const allReturnsResponse = await supplierReturnService.getAllSupplierReturns({
                date_from: dateFrom,
                date_to: dateTo,
                sort_by: sorting.sortBy,
                sort_order: sorting.sortOrder,
                export: true,
            });

            if (!allReturnsResponse.success || !allReturnsResponse.data) return;

            const allFilteredReturns: SupplierReturn[] = Array.isArray(allReturnsResponse.data)
                ? allReturnsResponse.data
                : [];

            const returnCount = allFilteredReturns.length;
            const totalAmount = allFilteredReturns.reduce((s, r) => s + (Number(r.total_amount) || 0), 0);
            const totalItems = allFilteredReturns.reduce((s, r) => s + (Number(r.items_count) || 0), 0);
            const avgAmount = returnCount > 0 ? totalAmount / returnCount : 0;
            const avgItemsPerReturn = returnCount > 0 ? totalItems / returnCount : 0;

            const summaryData = [
                ['SUMMARY'],
                ['Total Returns (count)', returnCount],
                ['Total Amount', totalAmount],
                ['Total Items', totalItems],
                ['Average Amount per Return', Number(avgAmount.toFixed(2))],
                ['Average Items per Return', Number(avgItemsPerReturn.toFixed(2))],
                [],
            ];

            const headers = [
                t('supplier_returns.return_id'),
                t('supplier_returns.original_order_id'),
                t('supplier_returns.original_order_name'),
                t('supplier_returns.total_amount'),
                t('supplier_returns.items'),
                t('supplier_returns.reason'),
                t('supplier_returns.processed_by'),
                t('supplier_returns.date'),
            ];
            const dataRows = allFilteredReturns.map<(string | number)[]>((row) => [
                row.id,
                row.original_order_id,
                row.original_order_name,
                Number(row.total_amount) || 0,
                Number(row.items_count) || 0,
                row.return_reason,
                row.user?.full_name || '-',
                formatDatePart(row.created_at, 'N/A'),
            ]);

            const sumAmount = allFilteredReturns.reduce((s, r) => s + (Number(r.total_amount) || 0), 0);
            const sumItems = allFilteredReturns.reduce((s, r) => s + (Number(r.items_count) || 0), 0);
            const totalsRow: (string | number)[] = ['TOTALS', '', '', sumAmount, sumItems, '', '', ''];

            const workbook = createWorkbook();
            const worksheet = addWorksheet(workbook, 'Supplier Returns');
            appendTable(worksheet, summaryData as unknown as (string | number)[][]);
            appendTable(worksheet, [headers]);
            appendTable(worksheet, dataRows);
            appendTable(worksheet, [totalsRow]);
            worksheet.columns = headers.map(() => ({ width: 22 }));

            await downloadWorkbook(workbook, `supplier-returns_${monthStr}.xlsx`);
        } catch {
            // Error handled silently
        }
    }, [getMonthDateRange, sorting.sortBy, sorting.sortOrder, t]);

    // Table columns definition
    const columns: Column<Record<string, unknown>>[] = [
        {
            key: 'id',
            header: t('supplier_returns.return_id'),
            accessor: 'id',
            sortable: true,
            headerClassName: 'text-blue-700 dark:text-blue-300',
        },
        {
            key: 'original_order_id',
            header: t('supplier_returns.original_order_id'),
            accessor: 'original_order_id',
            sortable: true,
            headerClassName: 'text-indigo-700 dark:text-indigo-300',
        },
        {
            key: 'original_order_name',
            header: t('supplier_returns.original_order_name'),
            accessor: 'original_order_name',
            sortable: true,
            headerClassName: 'text-green-700 dark:text-green-300',
        },
        {
            key: 'total_amount',
            header: t('supplier_returns.total_amount'),
            accessor: 'total_amount',
            sortable: true,
            headerClassName: 'text-purple-700 dark:text-purple-300',
            render: (value) => formatCurrency(Number(value) || 0),
        },
        {
            key: 'items_count',
            header: t('supplier_returns.items'),
            accessor: 'items_count',
            sortable: true,
            headerClassName: 'text-red-700 dark:text-red-300',
        },
        {
            key: 'return_reason',
            header: t('supplier_returns.reason'),
            accessor: 'return_reason',
            sortable: true,
            headerClassName: 'text-teal-700 dark:text-teal-300',
        },
        {
            key: 'user',
            header: t('supplier_returns.processed_by'),
            accessor: 'user',
            sortable: false,
            headerClassName: 'text-emerald-700 dark:text-emerald-300',
            render: (value) => {
                const user = value as { full_name?: string } | undefined;
                return user?.full_name || '-';
            },
        },
        {
            key: 'created_at',
            header: t('supplier_returns.date'),
            accessor: 'created_at',
            sortable: true,
            headerClassName: 'text-cyan-700 dark:text-cyan-300',
            render: (value) => formatDatePart(value as TimestampInput, 'N/A'),
        },
        {
            key: 'actions',
            header: t('supplier_returns.actions'),
            accessor: 'actions',
            sortable: false,
            headerClassName: 'text-pink-700 dark:text-pink-300',
            render: (_, row) => (
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            const returnId = row.id as number;
                            setSelectedReturnId(returnId);
                            setDetailsModalOpen(true);
                        }}
                        className="h-8 w-8 p-0 border-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('supplier_returns.title')} />
            <div className="flex flex-1 flex-col gap-6 rounded-xl p-6">
                <PageHeader
                    title={t('supplier_returns.title')}
                    description={t('supplier_returns.description')}
                >
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={loading}
                        className="!border-red-300 !bg-red-50 !text-red-700 hover:!border-red-500 hover:!bg-red-100 dark:!border-red-600 dark:!bg-red-900/20 dark:!text-red-300 dark:hover:!border-red-500 dark:hover:!bg-red-900/30"
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        {t('supplier_returns.refresh')}
                    </Button>
                </PageHeader>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                    {/* Total Returns */}
                    <StatCard
                        title={t('supplier_returns.total_returns')}
                        value={statistics.total_returns.toString()}
                        description={t('supplier_returns.total_returns_desc')}
                        icon={RotateCcw}
                        color="blue"
                        badge={{
                            text: t('supplier_returns.total_count'),
                            variant: 'secondary',
                            color: 'blue',
                        }}
                    />

                    {/* Total Amount */}
                    <StatCard
                        title={t('supplier_returns.total_amount')}
                        value={statistics.total_amount.toString()}
                        description={t('supplier_returns.total_amount_desc')}
                        icon={DollarSign}
                        color="green"
                        isCurrency={true}
                        badge={{
                            text: t('supplier_returns.total_value'),
                            variant: 'default',
                            color: 'green',
                        }}
                    />

                    {/* Total Items */}
                    <StatCard
                        title={t('supplier_returns.total_items')}
                        value={statistics.total_items.toString()}
                        description={t('supplier_returns.total_items_desc')}
                        icon={Package}
                        color="orange"
                        badge={{
                            text: t('supplier_returns.total_count'),
                            variant: 'secondary',
                            color: 'orange',
                        }}
                    />

                    {/* This Month Returns */}
                    <StatCard
                        title={t('supplier_returns.this_month_returns')}
                        value={statistics.this_month_returns.toString()}
                        description={t('supplier_returns.this_month_returns_desc')}
                        icon={Calendar}
                        color="purple"
                        badge={{
                            text: t('supplier_returns.this_month_count'),
                            variant: 'secondary',
                            color: 'purple',
                        }}
                    />

                    {/* This Month Amount */}
                    <StatCard
                        title={t('supplier_returns.this_month_amount')}
                        value={statistics.this_month_amount.toString()}
                        description={t('supplier_returns.this_month_amount_desc')}
                        icon={TrendingUp}
                        color="indigo"
                        isCurrency={true}
                        badge={{
                            text: t('supplier_returns.this_month_value'),
                            variant: 'default',
                            color: 'indigo',
                        }}
                    />

                    {/* This Month Items */}
                    <StatCard
                        title={t('supplier_returns.this_month_items')}
                        value={statistics.this_month_items.toString()}
                        description={t('supplier_returns.this_month_items_desc')}
                        icon={Package}
                        color="teal"
                        badge={{
                            text: t('supplier_returns.this_month_count'),
                            variant: 'secondary',
                            color: 'teal',
                        }}
                    />
                </div>

                {/* Filter Component */}
                <div className="w-full flex-shrink-0 rounded-md bg-card text-card-foreground shadow-[0_-2px_8px_0_rgba(0,0,0,0.1),0_2px_8px_0_rgba(0,0,0,0.1)] dark:shadow-[0_-2px_8px_0_rgba(0,0,0,0.3),0_2px_8px_0_rgba(0,0,0,0.3)]">
                    <div className="p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-foreground">
                                {t('supplier_returns.filters_title')}
                            </h3>
                            {(orderId || orderName || minAmount || maxAmount || dateFrom || dateTo) && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearAllFilters}
                                    className="text-red-600 hover:bg-red-100 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                                >
                                    <X className="mr-1 h-4 w-4" />
                                    {t('supplier_returns.clear_all_filters')}
                                </Button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {/* Order ID Filter */}
                            <div className="space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-blue-50/50 dark:hover:bg-blue-950/10">
                                <Label className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                    {t('supplier_returns.filter_order_id')}
                                </Label>
                                <div className="relative">
                                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-blue-600 dark:text-blue-400" />
                                    <Input
                                        placeholder={t('supplier_returns.filter_order_id_placeholder')}
                                        value={orderId}
                                        onChange={handleOrderIdChange}
                                        className="border-blue-200 pl-10 hover:border-blue-300 hover:bg-blue-50 focus:border-blue-400 focus:bg-blue-50 focus:ring-2 focus:ring-blue-200 focus:outline-none dark:border-blue-800 dark:hover:border-blue-700 dark:hover:bg-blue-950/20 dark:focus:border-blue-600 dark:focus:bg-blue-950/20 dark:focus:ring-2 dark:focus:ring-blue-800"
                                    />
                                    {orderId && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setOrderId('')}
                                            className="absolute top-1/2 right-2 h-6 w-6 -translate-y-1/2 p-0 text-red-600 hover:bg-red-100 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Order Name Filter */}
                            <div className="space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-green-50/50 dark:hover:bg-green-950/10">
                                <Label className="text-sm font-medium text-green-700 dark:text-green-300">
                                    {t('supplier_returns.filter_order_name')}
                                </Label>
                                <div className="relative">
                                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-green-600 dark:text-green-400" />
                                    <Input
                                        placeholder={t('supplier_returns.filter_order_name_placeholder')}
                                        value={orderName}
                                        onChange={handleOrderNameChange}
                                        className="border-green-200 pl-10 hover:border-green-300 hover:bg-green-50 focus:border-green-400 focus:bg-green-50 focus:ring-2 focus:ring-green-200 focus:outline-none dark:border-green-800 dark:hover:border-green-700 dark:hover:bg-green-950/20 dark:focus:border-green-600 dark:focus:bg-green-950/20 dark:focus:ring-2 dark:focus:ring-green-800"
                                    />
                                    {orderName && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setOrderName('')}
                                            className="absolute top-1/2 right-2 h-6 w-6 -translate-y-1/2 p-0 text-red-600 hover:bg-red-100 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                            </div>


                            {/* Date Range Filter */}
                            <div className="space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-purple-50/50 dark:hover:bg-purple-950/10">
                                <Label className="text-sm font-medium text-purple-700 dark:text-purple-300">
                                    {t('supplier_returns.filter_date_range')}
                                </Label>
                                <div className="flex items-center gap-2">
                                    <DatePicker
                                        value={dateFrom}
                                        onChange={handleDateFromChange}
                                        placeholder={t('supplier_returns.filter_from_date_placeholder')}
                                        className="flex-1 border-purple-200 hover:border-purple-300 hover:bg-purple-50 focus:border-purple-400 focus:bg-purple-50 focus:ring-2 focus:ring-purple-200 focus:outline-none dark:border-purple-800 dark:hover:border-purple-700 dark:hover:bg-purple-950/20 dark:focus:border-purple-600 dark:focus:bg-purple-950/20 dark:focus:ring-2 dark:focus:ring-purple-800"
                                    />
                                    <span className="text-sm text-muted-foreground">-</span>
                                    <DatePicker
                                        value={dateTo}
                                        onChange={handleDateToChange}
                                        placeholder={t('supplier_returns.filter_to_date_placeholder')}
                                        className="flex-1 border-purple-200 hover:border-purple-300 hover:bg-purple-50 focus:border-purple-400 focus:bg-purple-50 focus:ring-2 focus:ring-purple-200 focus:outline-none dark:border-purple-800 dark:hover:border-purple-700 dark:hover:bg-purple-950/20 dark:focus:border-purple-600 dark:focus:bg-purple-950/20 dark:focus:ring-2 dark:focus:ring-purple-800"
                                    />
                                </div>
                            </div>

                            {/* Amount Range Filter */}
                            <div className="space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-orange-50/50 dark:hover:bg-orange-950/10">
                                <Label className="text-sm font-medium text-orange-700 dark:text-orange-300">
                                    {t('supplier_returns.filter_amount_range')}
                                </Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        placeholder={t('supplier_returns.filter_min_amount')}
                                        value={minAmount}
                                        onChange={handleMinAmountChange}
                                        className="flex-1 border-orange-200 hover:border-orange-300 hover:bg-orange-50 focus:border-orange-400 focus:bg-orange-50 focus:ring-2 focus:ring-orange-200 focus:outline-none dark:border-orange-800 dark:hover:border-orange-700 dark:hover:bg-orange-950/20 dark:focus:border-orange-600 dark:focus:bg-orange-950/20 dark:focus:ring-2 dark:focus:ring-orange-800"
                                        type="text"
                                    />
                                    <span className="text-sm text-muted-foreground">-</span>
                                    <Input
                                        placeholder={t('supplier_returns.filter_max_amount')}
                                        value={maxAmount}
                                        onChange={handleMaxAmountChange}
                                        className="flex-1 border-orange-200 hover:border-orange-300 hover:bg-orange-50 focus:border-orange-400 focus:bg-orange-50 focus:ring-2 focus:ring-orange-200 focus:outline-none dark:border-orange-800 dark:hover:border-orange-700 dark:hover:bg-orange-950/20 dark:focus:border-orange-600 dark:focus:bg-orange-950/20 dark:focus:ring-2 dark:focus:ring-orange-800"
                                        type="text"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <DataTable
                    title={t('supplier_returns.returns_table_title')}
                    subtitle={`${t('supplier_returns.showing')} ${returns.length} ${t('supplier_returns.of')} ${paginationMeta.total} ${t('supplier_returns.returns')}`}
                    data={returns as unknown as Record<string, unknown>[]}
                    columns={columns}
                    loading={loading}
                    emptyMessage={t('supplier_returns.no_returns_found')}
                    onRowClick={handleRowClick}
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
                    pagination={{
                        currentPage,
                        totalPages,
                        pageSize,
                        totalItems,
                        onPageChange: handlePageChange,
                        showInfo: true,
                    }}
                    sorting={{
                        sortBy: sorting.sortBy || undefined,
                        sortOrder: sorting.sortOrder,
                        onSort: handleSort,
                    }}
                    className="bg-background"
                />

                {/* Supplier Return Details Modal */}
                <SupplierReturnDetailsModal
                    isOpen={detailsModalOpen}
                    onClose={handleCloseDetailsModal}
                    returnId={selectedReturnId}
                />

                {/* Excel export by month modal */}
                <ExportTransactionsByMonthModal
                    isOpen={isExcelMonthModalOpen}
                    onClose={() => setIsExcelMonthModalOpen(false)}
                    onExport={handleExportExcelByMonth}
                    i18nKey="supplier_returns.export_by_month"
                />
            </div>
        </AppLayout>
    );
}
