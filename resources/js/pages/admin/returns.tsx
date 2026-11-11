import { PageHeader } from '@/components/layout/page-header';
import { ReturnDetailsModal } from '@/components/modals/return-details-modal';
import {
    ReturnFilter,
    type ReturnFilterOptions,
} from '@/components/filters/return-filter';
import { StatCard } from '@/components/charts/stats-cards';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { ExportTransactionsByMonthModal } from '@/components/modals/export-transactions-by-month-modal';
import { useToast } from '@/components/ui/toast';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency, formatCurrencyStats } from '@/lib/currency';
import type { TimestampInput } from '@/lib/datetime';
import {
    formatDatePart,
    formatDateTimeDisplay,
    formatTimePart,
} from '@/lib/datetime';
import admin from '@/routes/admin';
import {
    returnService,
    type ReturnRecord,
    type ReturnStatistics,
} from '@/services/business/returnService';
import { type BreadcrumbItem } from '@/types';
import { type Column } from '@/types/table';
import { Head } from '@inertiajs/react';
import {
    ArrowLeftRight,
    DollarSign,
    Eye,
    FileSpreadsheet,
    Package,
    Receipt,
    RefreshCw,
    RotateCcw,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function Returns() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [refreshing, setRefreshing] = useState(false);

    // State for return records
    const [loading, setLoading] = useState(false);
    const [returnRecords, setReturnRecords] = useState<ReturnRecord[]>([]);
    const [returnStats, setReturnStats] = useState<ReturnStatistics | null>(
        null,
    );

    // Return detail modal state
    const [selectedReturn, setSelectedReturn] = useState<ReturnRecord | null>(
        null,
    );
    const [showReturnDetails, setShowReturnDetails] = useState(false);
    const [isExcelMonthModalOpen, setIsExcelMonthModalOpen] = useState(false);

    // Filter state
    const [filters, setFilters] = useState<ReturnFilterOptions>({});

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [paginationMeta, setPaginationMeta] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
    });

    const [sorting, setSorting] = useState<{
        sortBy: string | null;
        sortOrder: 'asc' | 'desc';
    }>({
        sortBy: null,
        sortOrder: 'asc',
    });

    const filterDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('navigation.admin') },
        { title: t('navigation.returns'), href: admin.returns.url() },
    ];

    const loadReturnRecords = useCallback(async () => {
            setLoading(true);

        try {
            const response = await returnService.getReturns({
                    page: currentPage,
                per_page: pageSize,
                return_id: filters.returnId,
                    date_from: filters.dateFrom,
                    date_to: filters.dateTo,
                    time_from: filters.timeFrom,
                    time_to: filters.timeTo,
                    return_type: filters.returnType === 'all' ? undefined : (filters.returnType as 'receipt' | 'manual' | undefined),
                amount_min: filters.amountMin,
                amount_max: filters.amountMax,
                sort_by: sorting.sortBy || undefined,
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
                setReturnRecords(records);
            } else {
                setReturnRecords([]);
                setPaginationMeta({
                    current_page: 1,
                    last_page: 1,
                    per_page: pageSize,
                    total: 0,
                });
            }
        } catch {
            setReturnRecords([]);
            setPaginationMeta({
                current_page: 1,
                last_page: 1,
                per_page: pageSize,
                total: 0,
            });
        } finally {
            setLoading(false);
        }
    }, [currentPage, filters, sorting, pageSize]);

    const loadStatistics = useCallback(async () => {
        try {
            const statsResponse = await returnService.getStatistics({});

            if (statsResponse && typeof statsResponse === 'object') {
                setReturnStats(statsResponse);
            } else {
                setReturnStats({
                    total_returns: 0,
                    total_amount: 0,
                    receipt_returns: 0,
                    manual_returns: 0,
                    average_return_value: 0,
                });
            }
        } catch {
            setReturnStats({
                total_returns: 0,
                total_amount: 0,
                receipt_returns: 0,
                manual_returns: 0,
                average_return_value: 0,
            });
        }
    }, []);

    useEffect(() => {
        if (filterDebounceTimer.current) {
            clearTimeout(filterDebounceTimer.current);
        }

        filterDebounceTimer.current = setTimeout(() => {
            loadReturnRecords();
        }, 300);

        return () => {
            if (filterDebounceTimer.current) {
                clearTimeout(filterDebounceTimer.current);
            }
        };
    }, [filters, sorting, loadReturnRecords]);

    useEffect(() => {
        loadReturnRecords();
    }, [currentPage, loadReturnRecords]);

    useEffect(() => {
        loadStatistics();
    }, [loadStatistics]);

    const totalItems = paginationMeta.total;
    const totalPages = paginationMeta.last_page;

    // Handle sorting (same as inventory page)
    const handleSort = (column: string) => {
        setSorting((prev) => ({
            sortBy: column,
            sortOrder:
                prev.sortBy === column && prev.sortOrder === 'asc'
                    ? 'desc'
                    : 'asc',
        }));
    };

    const handleFiltersChange = (newFilters: ReturnFilterOptions) => {
        setFilters(newFilters);
        setCurrentPage(1);
    };

    // Handle row click for return records
    const handleRowClick = (returnRecord: ReturnRecord) => {
        setSelectedReturn(returnRecord);
        setShowReturnDetails(true);
    };

    // Handle closing return details modal
    const handleCloseReturnDetails = () => {
        setShowReturnDetails(false);
        setSelectedReturn(null);
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

            const allReturnsResponse = await returnService.getAllReturns({
                date_from: dateFrom,
                date_to: dateTo,
                sort_by: sorting.sortBy || undefined,
                sort_order: sorting.sortOrder,
                export: true,
            });

            if (!allReturnsResponse.success || !allReturnsResponse.data) return;

            const allFilteredReturns = Array.isArray(allReturnsResponse.data)
                ? allReturnsResponse.data
                : [];

            const totalAmount = allFilteredReturns.reduce(
                (sum, r) => sum + Number(r.total_return_amount || 0),
                0,
            );
            const totalItems = allFilteredReturns.reduce(
                (sum, r) => sum + (Array.isArray(r.items) ? r.items.length : 0),
                0,
            );
            const receiptReturns = allFilteredReturns.filter(
                (r) => r.return_type === 'receipt',
            ).length;
            const manualReturns = allFilteredReturns.filter(
                (r) => r.return_type === 'manual',
            ).length;
            const returnCount = allFilteredReturns.length;
            const avgAmount = returnCount > 0 ? totalAmount / returnCount : 0;
            const avgItemsPerReturn = returnCount > 0 ? totalItems / returnCount : 0;

            const summaryData = [
                ['SUMMARY'],
                ['Total Returns (count)', returnCount],
                ['Receipt Returns', receiptReturns],
                ['Manual Returns', manualReturns],
                ['Total Amount', totalAmount],
                ['Total Items (lines)', totalItems],
                ['Average Amount per Return', Number(avgAmount.toFixed(2))],
                ['Average Items per Return', Number(avgItemsPerReturn.toFixed(2))],
                [],
            ];

            const headers = [
                t('return_page.table.return_number'),
                t('return_page.table.return_type'),
                t('return_page.table.original_transaction'),
                t('return_page.table.return_amount'),
                t('return_page.table.items'),
                t('return_page.table.processed_by'),
                t('return_page.table.return_date'),
            ];
            const dataRows = allFilteredReturns.map<(string | number)[]>((returnRecord) => [
                returnRecord.return_code,
                returnRecord.return_type === 'receipt'
                    ? t('return_page.return_types.receipt_return')
                    : t('return_page.return_types.manual_return'),
                returnRecord.original_transaction_number || t('return_page.table.manual_return'),
                Number(returnRecord.total_return_amount) || 0,
                Array.isArray(returnRecord.items) ? returnRecord.items.length : 0,
                (returnRecord.processed_by as { full_name?: string; name?: string })?.full_name ||
                    (returnRecord.processed_by as { full_name?: string; name?: string })?.name ||
                    t('return_page.unknown'),
                returnRecord.created_at
                    ? formatDateTimeDisplay(returnRecord.created_at, 'N/A')
                    : 'N/A',
            ]);

            const sumAmount = allFilteredReturns.reduce((s, r) => s + (Number(r.total_return_amount) || 0), 0);
            const sumLines = allFilteredReturns.reduce((s, r) => s + (Array.isArray(r.items) ? r.items.length : 0), 0);
            const totalsRow: (string | number)[] = ['TOTALS', '', '', sumAmount, sumLines, '', ''];

            const workbook = createWorkbook();
            const worksheet = addWorksheet(workbook, 'Returns');
            appendTable(worksheet, summaryData as unknown as (string | number)[][]);
            appendTable(worksheet, [headers]);
            appendTable(worksheet, dataRows);
            appendTable(worksheet, [totalsRow]);
            worksheet.columns = headers.map(() => ({ width: 22 }));

            await downloadWorkbook(workbook, `returns_${monthStr}.xlsx`);
        } catch {
            // Error handled silently
        }
    }, [getMonthDateRange, sorting.sortBy, sorting.sortOrder, t]);

    // Return table columns
    const returnColumns: Column<ReturnRecord>[] = [
        {
            key: 'return_code',
            header: t('return_page.table.return_number'),
            accessor: 'return_code',
            sortable: true,
            headerClassName: 'text-blue-700 dark:text-blue-300',
            render: (value) => (
                <span className="font-mono text-sm font-medium text-foreground transition-colors duration-200">
                    {String(value || '')}
                </span>
            ),
        },
        {
            key: 'return_type',
            header: t('return_page.table.return_type'),
            accessor: 'return_type',
            headerClassName: 'text-indigo-700 dark:text-indigo-300',
            render: (value) => {
                const typeConfig = {
                    receipt: {
                        label: t('return_page.return_types.receipt_return'),
                        className:
                            'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 dark:bg-primary/90/20 dark:text-primary/30 dark:border-primary/80 dark:hover:bg-primary/90/30',
                    },
                    manual: {
                        label: t('return_page.return_types.manual_return'),
                        className:
                            'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800 dark:hover:bg-orange-900/30',
                    },
                };
                const config = typeConfig[value as keyof typeof typeConfig];
                return (
                    <Badge
                        variant="outline"
                        className={`${config.className} transition-colors duration-200`}
                    >
                        {config.label}
                    </Badge>
                );
            },
        },
        {
            key: 'original_transaction_number',
            header: t('return_page.table.original_transaction'),
            accessor: 'original_transaction_number',
            headerClassName: 'text-green-700 dark:text-green-300',
            render: (value) =>
                value ? (
                    <span className="font-mono text-sm text-primary transition-colors duration-200 dark:text-primary">
                        {String(value)}
                    </span>
                ) : (
                    <span className="text-sm text-muted-foreground transition-colors duration-200">
                        {t('return_page.table.manual_return')}
                    </span>
                ),
        },
        {
            key: 'total_return_amount',
            header: t('return_page.table.return_amount'),
            accessor: 'total_return_amount',
            sortable: true,
            headerClassName: 'text-purple-700 dark:text-purple-300',
            render: (value) => (
                <span className="font-medium text-green-600 transition-colors duration-200 dark:text-green-400">
                    {formatCurrency(Number(value) || 0)}
                </span>
            ),
        },
        {
            key: 'items_count',
            header: t('return_page.table.items'),
            accessor: 'items_count',
            headerClassName: 'text-red-700 dark:text-red-300',
            render: (itemsCount, row) => {
                const count = typeof itemsCount === 'number' 
                    ? itemsCount 
                    : (Array.isArray(row.items) ? row.items.length : 0);
                return (
                    <div className="text-center">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-700 transition-colors duration-200 dark:bg-gray-800 dark:text-gray-300">
                            {count}
                        </span>
                    </div>
                );
            },
        },
        {
            key: 'processed_by',
            header: t('return_page.table.processed_by'),
            accessor: 'processed_by',
            headerClassName: 'text-teal-700 dark:text-teal-300',
            render: (processedBy) => (
                <span className="text-sm text-foreground transition-colors duration-200">
                    {(processedBy as { full_name?: string; name?: string })
                        ?.full_name ||
                        (processedBy as { full_name?: string; name?: string })
                            ?.name ||
                        t('return_page.unknown')}
                </span>
            ),
        },
        {
            key: 'created_at',
            header: t('return_page.table.return_date'),
            accessor: 'created_at',
            sortable: true,
            headerClassName: 'text-emerald-700 dark:text-emerald-300',
            render: (value) => {
                const datePart = formatDatePart(value as TimestampInput, '');
                const timePart = formatTimePart(value as TimestampInput, '');

                if (!datePart && !timePart) {
                    return (
                        <span className="text-sm text-muted-foreground transition-colors duration-200">
                            —
                        </span>
                    );
                }

                return (
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground transition-colors duration-200">
                            {datePart || '—'}
                        </span>
                        {timePart ? (
                            <span className="text-xs text-muted-foreground transition-colors duration-200">
                                {timePart}
                            </span>
                        ) : null}
                    </div>
                );
            },
        },
        {
            key: 'actions',
            header: t('return_page.table.actions'),
            headerClassName: 'text-pink-700 dark:text-pink-300',
            accessor: () => '',
            render: (_, row) => (
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(row);
                        }}
                        className="h-8 w-8 p-0 border-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
                        title={t('return_page.table.view_details')}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await loadReturnRecords();
            await loadStatistics();

            toast({
                title: t('return_page.data_refreshed'),
                description: t('return_page.data_refreshed_desc'),
                type: 'success',
            });
        } catch {
            toast({
                title: t('return_page.refresh_failed'),
                description: t('return_page.refresh_failed_desc'),
                type: 'error',
            });
        } finally {
            setRefreshing(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('navigation.returns')} />
            <div className="flex flex-1 flex-col gap-6 rounded-xl p-6">
                <PageHeader
                    title={t('returns.title')}
                    description={t('returns.description')}
                >
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="!border-cyan-300 !bg-cyan-50 !text-cyan-700 hover:!border-cyan-500 hover:!bg-cyan-100 dark:!border-cyan-600 dark:!bg-cyan-900/20 dark:!text-cyan-300 dark:hover:!border-cyan-500 dark:hover:!bg-cyan-900/30"
                    >
                        <RefreshCw
                            className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
                        />
                        {refreshing ? t('return_page.refreshing') : t('return_page.refresh')}
                    </Button>
                </PageHeader>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                    {/* Total Returns */}
                    <StatCard
                        title={t('return_page.statistics.total_returns')}
                        value={returnStats?.total_returns?.toString() || '0'}
                        description={t('return_page.statistics.total_returns_desc')}
                        icon={RotateCcw}
                        color="blue"
                        badge={{
                            text: t('return_page.badges.total_returns'),
                            variant: 'secondary',
                            color: 'blue',
                        }}
                    />

                    {/* Receipt Returns */}
                    <StatCard
                        title={t('return_page.statistics.receipt_returns')}
                        value={returnStats?.receipt_returns?.toString() || '0'}
                        description={t('return_page.statistics.receipt_returns_desc')}
                        icon={Receipt}
                        color="orange"
                        badge={{
                            text: t('return_page.badges.receipt'),
                            variant: 'secondary',
                            color: 'orange',
                        }}
                    />

                    {/* Return Value */}
                    <StatCard
                        title={t('return_page.statistics.return_value')}
                        value={(() => {
                            const amount = returnStats?.total_amount || 0;
                            const stats = formatCurrencyStats(amount);
                            return stats.display;
                        })()}
                        description={t('return_page.statistics.return_value_desc')}
                        icon={DollarSign}
                        color="green"
                        badge={{
                            text: (() => {
                                const amount = returnStats?.total_amount || 0;
                                const stats = formatCurrencyStats(amount);
                                return stats.indicator || t('return_page.badges.total');
                            })(),
                            variant: 'secondary',
                            color: 'green',
                        }}
                    />

                    {/* Manual Returns */}
                    <StatCard
                        title={t('return_page.statistics.manual_returns')}
                        value={returnStats?.manual_returns?.toString() || '0'}
                        description={t('return_page.statistics.manual_returns_desc')}
                        icon={ArrowLeftRight}
                        color="purple"
                        badge={{
                            text: t('return_page.badges.manual'),
                            variant: 'default',
                            color: 'purple',
                        }}
                    />

                    {/* Average Return Value */}
                    <StatCard
                        title={t('return_page.statistics.average_return')}
                        value={(() => {
                            const avgValue =
                                returnStats?.average_return_value || 0;
                            const stats = formatCurrencyStats(avgValue);
                            return stats.display;
                        })()}
                        description={t('return_page.statistics.average_return_desc')}
                        icon={Package}
                        color="indigo"
                        badge={{
                            text: (() => {
                                const avgValue =
                                    returnStats?.average_return_value || 0;
                                const stats = formatCurrencyStats(avgValue);
                                return stats.indicator || t('return_page.badges.avg');
                            })(),
                            variant: 'secondary',
                            color: 'indigo',
                        }}
                    />
                </div>

                {/* Return Filter Component */}
                <ReturnFilter
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                />

                {/* Returns Data Table */}
                <DataTable
                    title={t('return_page.table.title')}
                    subtitle={`${t('return_page.table.showing')} ${returnRecords.length} ${t('return_page.table.of')} ${totalItems} ${t('return_page.table.returns')}`}
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
                    data={returnRecords}
                    columns={returnColumns}
                    loading={loading}
                    emptyMessage={
                        Object.keys(filters).length > 0
                            ? t('return_page.empty_states.no_returns_filtered')
                            : t('return_page.empty_states.no_returns_found')
                    }
                    onRowClick={undefined}
                    pagination={{
                        currentPage,
                        totalPages,
                        pageSize,
                        totalItems,
                        onPageChange: setCurrentPage,
                        showInfo: true,
                    }}
                    sorting={{
                        sortBy: sorting.sortBy || undefined,
                        sortOrder: sorting.sortOrder,
                        onSort: handleSort,
                    }}
                    className="bg-background"
                />

                {/* Return Details Modal */}
                {selectedReturn && (
                    <ReturnDetailsModal
                        isOpen={showReturnDetails}
                        onClose={handleCloseReturnDetails}
                        returnRecord={selectedReturn}
                    />
                )}

                {/* Excel export by month modal */}
                <ExportTransactionsByMonthModal
                    isOpen={isExcelMonthModalOpen}
                    onClose={() => setIsExcelMonthModalOpen(false)}
                    onExport={handleExportExcelByMonth}
                    i18nKey="return_page.export_by_month"
                />
            </div>
        </AppLayout>
    );
}
