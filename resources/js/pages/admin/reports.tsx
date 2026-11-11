import { PageHeader } from '@/components/layout/page-header';
import { ReportsFilter, type ReportFilter } from '@/components/filters/reports-filter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { StatCard, StatsCards } from '@/components/charts/stats-cards';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/lib/currency';
import type { TimestampInput } from '@/lib/datetime';
import { extractDateTimeParts, formatDateTimeDisplay } from '@/lib/datetime';
import admin from '@/routes/admin';
import { transactionService } from '@/services/business/transactionService';
import { purchaseService } from '@/services/business/purchaseService';
import { type BreadcrumbItem } from '@/types';
import { type Column } from '@/types/table';
import { Head } from '@inertiajs/react';
import { FileSpreadsheet, RefreshCw, DollarSign, ShoppingCart, Package, TrendingUp, Activity } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';

interface TransactionReportRow {
    id: number;
    transaction_id: number;
    transaction_number: string;
    cashier_name: string;
    product_name: string;
    product_type: string;
    identifier: string;
    identifier_type: string;
    category?: string;
    supplier?: string;
    quantity: number;
    cost_price: number;
    sell_price: number;
    line_total: number;
    profit_margin: number;
    profit_amount: number;
    created_at: string;
}

interface PurchaseReportRow {
    id: string;
    purchase_id: number;
    invoice_id: string;
    invoice_name: string;
    status: string;
    supplier_name?: string;
    product_name: string;
    product_type: string;
    identifier: string;
    category?: string;
    quantity: number;
    cost_price: number;
    sell_price: number;
    total_cost: number;
    profit_margin: number;
    created_at: string;
    updated_at: string;
}

const defaultReportFilters: ReportFilter = {
    productType: 'all',
    barcode: '',
    cashier: '',
    category: '',
    supplier: '',
    priceFrom: '',
    priceTo: '',
    startDate: null,
    endDate: null,
    startTime: '',
    endTime: '',
};

export default function Reports() {
    const { t } = useTranslation();
    const PAGE_SIZE = 10;

    const [mode, setMode] = useState<'all' | 'transaction' | 'purchase'>('all');
    const [loading, setLoading] = useState(false);
    const [transactionData, setTransactionData] = useState<TransactionReportRow[]>([]);
    const [purchaseData, setPurchaseData] = useState<PurchaseReportRow[]>([]);
    const [transactionPage, setTransactionPage] = useState(1);
    const [purchasePage, setPurchasePage] = useState(1);
    const [transactionMeta, setTransactionMeta] = useState({
        current_page: 1,
        last_page: 1,
        per_page: PAGE_SIZE,
        total: 0,
    });
    const [purchaseMeta, setPurchaseMeta] = useState({
        current_page: 1,
        last_page: 1,
        per_page: PAGE_SIZE,
        total: 0,
    });
    const [transactionStats, setTransactionStats] = useState<{
        total_sales: number;
        total_transactions: number;
        average_transaction_value: number;
        total_items_sold: number;
        total_quantity: number;
        total_profit: number;
    }>({
        total_sales: 0,
        total_transactions: 0,
        average_transaction_value: 0,
        total_items_sold: 0,
        total_quantity: 0,
        total_profit: 0,
    });
    const [purchaseStats, setPurchaseStats] = useState<{
        total_purchases: number;
        total_items: number;
        total_quantity: number;
        total_amount: number;
    }>({
        total_purchases: 0,
        total_items: 0,
        total_quantity: 0,
        total_amount: 0,
    });
    const [error, setError] = useState<string | null>(null);

    const [filters, setFilters] = useState<ReportFilter>({
        ...defaultReportFilters,
    });

    const [sorting, setSorting] = useState<{
        sortBy: string;
        sortOrder: 'asc' | 'desc';
    }>({
        sortBy: 'created_at',
        sortOrder: 'desc',
    });

    const filterDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const normalizeDate = (value: Date | string | null) => {
        if (!value) {
            return undefined;
        }

        if (value instanceof Date) {
            return value.toISOString().slice(0, 10);
        }

        return value;
    };

    const loadTransactionReport = useCallback(async (page: number) => {
        if (mode !== 'transaction') {
            return;
        }

        setLoading(true);
        setError(null);

        try {
        const priceFrom = filters.priceFrom === '' ? undefined : Number(filters.priceFrom);
        const priceTo = filters.priceTo === '' ? undefined : Number(filters.priceTo);

            const response = await transactionService.getTransactionReport({
            page,
                perPage: PAGE_SIZE,
            productType: filters.productType,
            barcode: filters.barcode?.trim() || undefined,
            cashier: filters.cashier || undefined,
            category: filters.category || undefined,
            supplier: filters.supplier || undefined,
            priceFrom,
            priceTo,
            dateFrom: normalizeDate(filters.startDate),
            dateTo: normalizeDate(filters.endDate),
            timeFrom: filters.startTime || undefined,
            timeTo: filters.endTime || undefined,
                sort_by: sorting.sortBy,
                sort_order: sorting.sortOrder,
            });

            if (response.success && response.data) {
                setTransactionData(response.data.data || []);
                setTransactionMeta({
                    current_page: response.data.current_page || 1,
                    last_page: response.data.last_page || 1,
                    per_page: response.data.per_page || PAGE_SIZE,
                    total: response.data.total || 0,
                });
            } else {
                setTransactionData([]);
                setTransactionMeta({
                    current_page: 1,
                    last_page: 1,
                    per_page: PAGE_SIZE,
                    total: 0,
                });
                setError(response.message || t('reports.error_messages.failed_to_load'));
                    }
        } catch {
            setTransactionData([]);
            setTransactionMeta({
                current_page: 1,
                last_page: 1,
                per_page: PAGE_SIZE,
                total: 0,
            });
            setError(t('reports.error_messages.failed_to_load'));
        } finally {
            setLoading(false);
        }
    }, [mode, filters, sorting, t]);

    const loadPurchaseReport = useCallback(async (page: number) => {
        if (mode !== 'purchase') {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const priceFrom = filters.priceFrom === '' ? undefined : Number(filters.priceFrom);
            const priceTo = filters.priceTo === '' ? undefined : Number(filters.priceTo);

            const response = await purchaseService.getPurchaseReport({
                page,
                per_page: PAGE_SIZE,
                barcode: filters.barcode?.trim() || undefined,
                product_type: filters.productType === 'all' ? undefined : (filters.productType as 'normal' | 'scale' | undefined),
                supplier: filters.supplier || undefined,
                price_from: priceFrom,
                price_to: priceTo,
                date_from: normalizeDate(filters.startDate),
                date_to: normalizeDate(filters.endDate),
                time_from: filters.startTime || undefined,
                time_to: filters.endTime || undefined,
                sort_by: sorting.sortBy,
                sort_order: sorting.sortOrder,
            });

            if (response.success && response.data) {
                setPurchaseData(response.data.data || []);
                setPurchaseMeta({
                    current_page: response.data.current_page || 1,
                    last_page: response.data.last_page || 1,
                    per_page: response.data.per_page || PAGE_SIZE,
                    total: response.data.total || 0,
                });
            } else {
                setPurchaseData([]);
                setPurchaseMeta({
                    current_page: 1,
                    last_page: 1,
                    per_page: PAGE_SIZE,
                    total: 0,
                });
                setError(response.message || t('reports.error_messages.failed_to_load'));
            }
        } catch {
            setPurchaseData([]);
            setPurchaseMeta({
                current_page: 1,
                last_page: 1,
                per_page: PAGE_SIZE,
                total: 0,
            });
            setError(t('reports.error_messages.failed_to_load'));
        } finally {
            setLoading(false);
        }
    }, [mode, filters, sorting, t]);

    const loadTransactionStatistics = useCallback(async () => {
        if (mode !== 'transaction') {
            return;
        }

        try {
            const priceFrom = filters.priceFrom === '' ? undefined : Number(filters.priceFrom);
            const priceTo = filters.priceTo === '' ? undefined : Number(filters.priceTo);

            const response = await transactionService.getTransactionReportStatistics({
                productType: filters.productType,
                barcode: filters.barcode?.trim() || undefined,
                cashier: filters.cashier || undefined,
                category: filters.category || undefined,
                supplier: filters.supplier || undefined,
                priceFrom,
                priceTo,
                dateFrom: normalizeDate(filters.startDate),
                dateTo: normalizeDate(filters.endDate),
                timeFrom: filters.startTime || undefined,
                timeTo: filters.endTime || undefined,
            });

            if (response.success && response.data) {
                setTransactionStats({
                    total_sales: Number(response.data.total_sales ?? 0),
                    total_transactions: Number(response.data.total_transactions ?? 0),
                    average_transaction_value: Number(response.data.average_transaction_value ?? 0),
                    total_items_sold: Number(response.data.total_items_sold ?? 0),
                    total_quantity: Number(response.data.total_quantity ?? 0),
                    total_profit: Number(response.data.total_profit ?? 0),
                });
            }
        } catch {
            // Error handled silently
        }
    }, [mode, filters]);

    const loadPurchaseStatistics = useCallback(async () => {
        if (mode !== 'purchase') {
                        return;
                    }

        try {
            const priceFrom = filters.priceFrom === '' ? undefined : Number(filters.priceFrom);
            const priceTo = filters.priceTo === '' ? undefined : Number(filters.priceTo);

            const response = await purchaseService.getPurchaseReportStatistics({
                barcode: filters.barcode?.trim() || undefined,
                product_type: filters.productType === 'all' ? undefined : (filters.productType as 'normal' | 'scale' | undefined),
                category: filters.category || undefined,
                supplier: filters.supplier || undefined,
                price_from: priceFrom,
                price_to: priceTo,
                date_from: normalizeDate(filters.startDate),
                date_to: normalizeDate(filters.endDate),
                time_from: filters.startTime || undefined,
                time_to: filters.endTime || undefined,
                            });

            if (response.success && response.data) {
                setPurchaseStats({
                    total_purchases: Number(response.data.total_purchases ?? 0),
                    total_items: Number(response.data.total_items ?? 0),
                    total_quantity: Number(response.data.total_quantity ?? 0),
                    total_amount: Number(response.data.total_amount ?? 0),
                });
            }
        } catch {
            // Error handled silently
        }
    }, [mode, filters]);

    // Load data when mode changes
    useEffect(() => {
        if (mode === 'transaction') {
            setTransactionPage(1);
            loadTransactionReport(1);
            loadTransactionStatistics();
        } else if (mode === 'purchase') {
            setPurchasePage(1);
            loadPurchaseReport(1);
            loadPurchaseStatistics();
        } else {
            setTransactionData([]);
            setPurchaseData([]);
            setError(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode]);

    // Debounced filter changes
    useEffect(() => {
        if (mode === 'all') {
            return;
        }

        if (filterDebounceTimer.current) {
            clearTimeout(filterDebounceTimer.current);
        }

        filterDebounceTimer.current = setTimeout(() => {
        if (mode === 'transaction') {
            setTransactionPage(1);
                loadTransactionReport(1);
                loadTransactionStatistics();
            } else if (mode === 'purchase') {
                setPurchasePage(1);
                loadPurchaseReport(1);
                loadPurchaseStatistics();
            }
        }, 500);

        return () => {
            if (filterDebounceTimer.current) {
                clearTimeout(filterDebounceTimer.current);
            }
        };
    }, [filters, mode, loadTransactionReport, loadPurchaseReport, loadTransactionStatistics, loadPurchaseStatistics]);

    // Page changes (immediate, no debounce)
    useEffect(() => {
        if (mode === 'transaction' && transactionPage > 0) {
            loadTransactionReport(transactionPage);
        }
    }, [transactionPage, mode, loadTransactionReport]);

    useEffect(() => {
        if (mode === 'purchase') {
            loadPurchaseReport(purchasePage);
        }
    }, [purchasePage, mode, loadPurchaseReport]);

    // Sorting changes (immediate, no debounce)
    useEffect(() => {
        if (mode === 'transaction') {
            setTransactionPage(1);
            loadTransactionReport(1);
        } else if (mode === 'purchase') {
            setPurchasePage(1);
            loadPurchaseReport(1);
        }
    }, [sorting, mode, loadTransactionReport, loadPurchaseReport]);

    const handleDownloadExcel = async () => {
        try {
            let excelData: Array<Record<string, unknown>> = [];
            let summaryData: (string | number)[][] = [];

            if (mode === 'transaction') {
                const response = await transactionService.getAllTransactionReport({
                    productType: filters.productType,
                    barcode: filters.barcode?.trim() || undefined,
                    cashier: filters.cashier || undefined,
                    category: filters.category || undefined,
                    supplier: filters.supplier || undefined,
                    priceFrom: filters.priceFrom === '' ? undefined : Number(filters.priceFrom),
                    priceTo: filters.priceTo === '' ? undefined : Number(filters.priceTo),
                    dateFrom: normalizeDate(filters.startDate),
                    dateTo: normalizeDate(filters.endDate),
                    timeFrom: filters.startTime || undefined,
                    timeTo: filters.endTime || undefined,
                });

                if (response.success && response.data) {
                    excelData = response.data.map((row) => ({
                        [t('reports.table_columns.product_name')]: row.product_name,
                        [t('reports.table_columns.product_type')]: row.product_type === 'scale_product'
                              ? t('reports.product_types.scale_product')
                            : row.product_type === 'card'
                                ? t('reports.product_types.card')
                                : t('reports.product_types.product'),
                        [t('reports.table_columns.identifier')]: row.identifier || '-',
                        [t('reports.table_columns.cashier')]: row.cashier_name,
                        [t('reports.table_columns.transaction_number')]: row.transaction_number,
                        [t('reports.table_columns.category')]: row.category || 'N/A',
                        [t('reports.table_columns.supplier')]: row.supplier || 'N/A',
                        [t('reports.table_columns.quantity')]: Number(row.quantity) || 0,
                        [t('reports.table_columns.cost_price')]: Number(row.cost_price) || 0,
                        [t('reports.table_columns.sell_price')]: Number(row.sell_price) || 0,
                        [t('reports.table_columns.sale_date')]: formatDateTimeDisplay(row.created_at),
                    }));

                    const txCount = transactionStats.total_transactions || 0;
                    const avgSales = txCount > 0 ? (transactionStats.total_sales || 0) / txCount : 0;
                    summaryData = [
                        ['SUMMARY'],
                        [t('reports.summary.total_amount'), transactionStats.total_sales],
                        [t('reports.summary.total_profit'), transactionStats.total_profit],
                        [t('reports.summary.total_items'), transactionStats.total_items_sold],
                        [t('reports.summary.total_quantity'), transactionStats.total_quantity],
                        [t('reports.summary.total_records'), transactionStats.total_transactions],
                        ['Average sales per record', Number(avgSales.toFixed(2))],
                        [],
                    ];
                }
            } else if (mode === 'purchase') {
                const response = await purchaseService.getAllPurchaseReport({
                    barcode: filters.barcode?.trim() || undefined,
                    product_type: filters.productType === 'all' ? undefined : (filters.productType as 'normal' | 'scale' | undefined),
                    supplier: filters.supplier || undefined,
                    price_from: filters.priceFrom === '' ? undefined : Number(filters.priceFrom),
                    price_to: filters.priceTo === '' ? undefined : Number(filters.priceTo),
                    date_from: normalizeDate(filters.startDate),
                    date_to: normalizeDate(filters.endDate),
                    time_from: filters.startTime || undefined,
                    time_to: filters.endTime || undefined,
                });

                if (response.success && response.data) {
                    excelData = response.data.map((row) => ({
                        [t('reports.purchase_columns.invoice_id')]: row.invoice_id,
                        [t('reports.purchase_columns.invoice_name')]: row.invoice_name,
                        [t('reports.purchase_columns.supplier')]: row.supplier_name || t('reports.purchase_columns.no_supplier'),
                        [t('reports.purchase_columns.product_name')]: row.product_name,
                        [t('reports.purchase_columns.product_type')]: row.product_type === 'scale_product'
                              ? t('reports.product_types.scale_product')
                              : t('reports.product_types.product'),
                        [t('reports.table_columns.category')]: row.category || 'N/A',
                        [t('reports.purchase_columns.identifier')]: row.identifier,
                        [t('reports.purchase_columns.quantity')]: Number(row.quantity) || 0,
                        [t('reports.purchase_columns.cost_price')]: Number(row.cost_price) || 0,
                        [t('reports.purchase_columns.sell_price')]: Number(row.sell_price) || 0,
                        [t('reports.purchase_columns.total_cost')]: Number(row.total_cost) || 0,
                        [t('reports.purchase_columns.status')]: row.status === 'receive'
                              ? t('reports.purchase_columns.status_receive')
                              : t('reports.purchase_columns.status_order'),
                        [t('reports.purchase_columns.purchase_date')]: formatDateTimeDisplay(row.created_at),
                  }));

                    const purchaseCount = purchaseStats.total_purchases || 0;
                    const avgAmount = purchaseCount > 0 ? (purchaseStats.total_amount || 0) / purchaseCount : 0;
                    summaryData = [
                        ['SUMMARY'],
                        [t('reports.summary.total_amount'), purchaseStats.total_amount],
                        [t('reports.summary.total_items'), purchaseStats.total_items],
                        [t('reports.summary.total_quantity'), purchaseStats.total_quantity],
                        [t('reports.summary.total_records'), purchaseStats.total_purchases],
                        ['Average amount per record', Number(avgAmount.toFixed(2))],
                        [],
                    ];
                }
            }

        if (excelData.length === 0) {
            return;
        }

            const headers = Object.keys(excelData[0] || {});
            const totalsRow: (string | number)[] = headers.map((header, colIndex) => {
                if (colIndex === 0) return 'TOTALS';
                const values = excelData.map((row) => (row as Record<string, unknown>)[header]);
                if (values.every((v) => typeof v === 'number')) {
                    return (values as number[]).reduce((a, b) => a + b, 0);
                }
                return '';
            });

            const { createWorkbook, addWorksheet, appendTable, downloadWorkbook } = await import('@/services/utils/excelService');
        const workbook = await createWorkbook();
        const worksheet = addWorksheet(workbook, mode === 'transaction' ? 'Transactions' : 'Purchases');
            appendTable(worksheet, summaryData);
        appendTable(worksheet, [headers]);
        appendTable(worksheet, excelData.map((row) => Object.values(row)) as unknown as (string | number)[][]);
        appendTable(worksheet, [totalsRow]);

        worksheet.columns = [
            { width: 24 },
            { width: 20 },
            { width: 20 },
            { width: 20 },
            { width: 20 },
            { width: 20 },
            { width: 26 },
            { width: 18 },
        ];

        await downloadWorkbook(
            workbook,
            `${mode === 'transaction' ? 'transactions' : 'purchases'}_${new Date().toISOString().split('T')[0]}.xlsx`
        );
        } catch {
            // Error handled silently
        }
    };

    const handleRefresh = () => {
        if (mode === 'transaction') {
            loadTransactionReport(transactionPage);
            loadTransactionStatistics();
        } else if (mode === 'purchase') {
            loadPurchaseReport(purchasePage);
            loadPurchaseStatistics();
        }
    };

    const handleFilterChange = (newFilters: ReportFilter) => {
        setFilters(newFilters);
    };

    const handleModeChange = (newMode: 'all' | 'transaction' | 'purchase') => {
        setMode(newMode);
        setSorting({
            sortBy: 'created_at',
            sortOrder: 'desc',
        });
        setFilters({ ...defaultReportFilters });
        setError(null);
        if (newMode === 'transaction') {
            setTransactionPage(1);
        } else if (newMode === 'purchase') {
            setPurchasePage(1);
        }
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

    const hasActiveFilters = useCallback(() => {
        return (
            (filters.productType && filters.productType !== 'all') ||
            (filters.barcode && filters.barcode.trim() !== '') ||
            (filters.cashier && filters.cashier !== '') ||
            (filters.category && filters.category !== '') ||
            (filters.supplier && filters.supplier !== '') ||
            filters.priceFrom ||
            filters.priceTo ||
            filters.startDate ||
            filters.endDate ||
            filters.startTime ||
            filters.endTime
        );
    }, [filters]);

    const transactionSummary = useMemo(
        () => ({
            totalAmount: transactionStats.total_sales ?? 0,
            totalItems: transactionStats.total_items_sold ?? 0,
            totalQuantity: transactionStats.total_quantity ?? 0,
            totalRecords: transactionStats.total_transactions ?? 0,
            totalProfit: transactionStats.total_profit ?? 0,
        }),
        [transactionStats],
    );

    const purchaseSummary = useMemo(
        () => ({
            totalAmount: purchaseStats.total_amount ?? 0,
            totalItems: purchaseStats.total_items ?? 0,
            totalQuantity: purchaseStats.total_quantity ?? 0,
            totalRecords: purchaseStats.total_purchases ?? 0,
        }),
        [purchaseStats],
    );

    const transactionPaginationInfo = useMemo(
        () => ({
            currentPage: transactionMeta.current_page || 1,
            totalPages: Math.max(1, transactionMeta.last_page || 1),
            pageSize: transactionMeta.per_page || PAGE_SIZE,
            totalItems: transactionMeta.total || 0,
        }),
        [transactionMeta],
    );

    const purchasePaginationInfo = useMemo(
        () => ({
            currentPage: purchaseMeta.current_page || 1,
            totalPages: Math.max(1, purchaseMeta.last_page || 1),
            pageSize: purchaseMeta.per_page || PAGE_SIZE,
            totalItems: purchaseMeta.total || 0,
        }),
        [purchaseMeta],
    );

    const handleTransactionPageChange = useCallback((page: number) => {
        setTransactionPage(page);
    }, []);

    const handlePurchasePageChange = useCallback((page: number) => {
        setPurchasePage(page);
    }, []);

    // Transaction table columns
    const transactionColumns: Column<TransactionReportRow>[] = [
        {
            key: 'product_name',
            header: t('reports.table_columns.product_name'),
            accessor: 'product_name',
            sortable: true,
            headerClassName: 'text-blue-700 dark:text-blue-300 text-xs',
            render: (value) => <span className="text-xs">{String(value || 'N/A')}</span>,
        },
        {
            key: 'product_type',
            header: t('reports.table_columns.product_type'),
            accessor: 'product_type',
            sortable: true,
            headerClassName: 'text-indigo-700 dark:text-indigo-300 text-xs',
            render: (value, row) => {
                const productType = (row.product_type as 'product' | 'scale_product' | 'card') || 'product';
                const typeConfig = {
                    product: {
                        label: t('reports.product_types.product'),
                        className: 'border-sky-200 bg-sky-100 text-sky-800 hover:bg-sky-200 dark:border-sky-400/40 dark:bg-sky-500/20 dark:text-sky-100 dark:hover:bg-sky-500/30',
                    },
                    scale_product: {
                        label: t('reports.product_types.scale_product'),
                        className: 'border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:border-emerald-400/40 dark:bg-emerald-500/20 dark:text-emerald-100 dark:hover:bg-emerald-500/30',
                    },
                    card: {
                        label: t('reports.product_types.card'),
                        className: 'border-violet-200 bg-violet-100 text-violet-800 hover:bg-violet-200 dark:border-violet-400/40 dark:bg-violet-500/20 dark:text-violet-100 dark:hover:bg-violet-500/30',
                    },
                };
                const config = typeConfig[productType] ?? typeConfig.product;
                return (
                    <Badge variant="outline" className={`${config.className} text-xs`}>
                        {config.label}
                    </Badge>
                );
            },
        },
        {
            key: 'identifier',
            header: t('reports.table_columns.identifier'),
            accessor: 'identifier',
            sortable: true,
            headerClassName: 'text-green-700 dark:text-green-300 text-xs',
            render: (value, row) => {
                const identifier = row.identifier && row.identifier.trim().length > 0 ? row.identifier : '-';
                const identifierType = row.identifier_type ?? 'barcode';
                return (
                    <div className="flex flex-col">
                        <span className="font-mono text-xs">{identifier}</span>
                        <span className="text-xs text-muted-foreground">{identifierType}</span>
                    </div>
                );
            },
        },
        {
            key: 'cashier_name',
            header: t('reports.table_columns.cashier'),
            accessor: 'cashier_name',
            sortable: true,
            headerClassName: 'text-purple-700 dark:text-purple-300 text-xs',
        },
        {
            key: 'transaction_number',
            header: t('reports.table_columns.transaction_number'),
            accessor: 'transaction_number',
            sortable: true,
            headerClassName: 'text-red-700 dark:text-red-300 text-xs',
        },
        {
            key: 'category',
            header: t('reports.table_columns.category'),
            accessor: 'category',
            sortable: true,
            headerClassName: 'text-teal-700 dark:text-teal-300 text-xs',
            render: (value) => <span className="text-xs">{String(value || 'N/A')}</span>,
        },
        {
            key: 'supplier',
            header: t('reports.table_columns.supplier'),
            accessor: 'supplier',
            sortable: true,
            headerClassName: 'text-emerald-700 dark:text-emerald-300 text-xs',
            render: (value) => <span className="text-xs">{String(value || 'N/A')}</span>,
        },
        {
            key: 'quantity',
            header: t('reports.table_columns.quantity'),
            accessor: 'quantity',
            sortable: true,
            headerClassName: 'text-cyan-700 dark:text-cyan-300 text-xs',
            render: (value) => <span className="text-xs">{Number(value ?? 0)}</span>,
        },
        {
            key: 'cost_price',
            header: t('reports.table_columns.cost_price'),
            accessor: 'cost_price',
            sortable: true,
            headerClassName: 'text-yellow-700 dark:text-yellow-300 text-xs',
            render: (value) => (
                <span className="text-xs">{value ? formatCurrency(value as number) : 'N/A'}</span>
            ),
        },
        {
            key: 'sell_price',
            header: t('reports.table_columns.sell_price'),
            accessor: 'sell_price',
            sortable: true,
            headerClassName: 'text-orange-700 dark:text-orange-300 text-xs',
            render: (value) => (
                <span className="text-xs">{value ? formatCurrency(value as number) : 'N/A'}</span>
            ),
        },
        {
            key: 'line_total',
            header: t('reports.table_columns.line_total_pxq'),
            accessor: 'line_total',
            sortable: true,
            headerClassName: 'text-red-700 dark:text-red-300 text-xs',
            render: (value) => <span className="text-xs">{formatCurrency(value as number)}</span>,
        },
        {
            key: 'created_at',
            header: t('reports.table_columns.sale_date'),
            accessor: 'created_at',
            sortable: true,
            headerClassName: 'text-pink-700 dark:text-pink-300 text-xs',
            render: (value) => {
                const { date, time } = extractDateTimeParts(value as TimestampInput);

                if (!date && !time) {
                    return (
                        <span className="text-xs text-muted-foreground">
                            N/A
                        </span>
                    );
                }

                return (
                    <div className="flex flex-col">
                        <span className="text-xs font-medium">{date ?? 'N/A'}</span>
                        {time ? (
                            <span className="text-xs text-muted-foreground">{time}</span>
                        ) : null}
                    </div>
                );
            },
        },
    ];

    const purchaseColumns: Column<PurchaseReportRow>[] = [
        {
            key: 'invoice_id',
            header: t('reports.purchase_columns.invoice_id'),
            accessor: 'invoice_id',
            sortable: true,
            headerClassName: 'text-blue-700 dark:text-blue-300 text-xs',
        },
        {
            key: 'invoice_name',
            header: t('reports.purchase_columns.invoice_name'),
            accessor: 'invoice_name',
            sortable: true,
            headerClassName: 'text-indigo-700 dark:text-indigo-300',
        },
        {
            key: 'supplier_name',
            header: t('reports.purchase_columns.supplier'),
            accessor: 'supplier_name',
            sortable: true,
            headerClassName: 'text-emerald-700 dark:text-emerald-300 text-xs',
            render: (value) => (
                <span className="text-xs">
                    {typeof value === 'string' && value.trim().length > 0
                    ? value
                        : t('reports.purchase_columns.no_supplier')}
                </span>
            ),
        },
        {
            key: 'product_name',
            header: t('reports.purchase_columns.product_name'),
            accessor: 'product_name',
            sortable: true,
            headerClassName: 'text-purple-700 dark:text-purple-300 text-xs',
            render: (value) => <span className="text-xs">{String(value)}</span>,
        },
        {
            key: 'category',
            header: t('reports.table_columns.category'),
            accessor: (row: PurchaseReportRow) => row.category || 'N/A',
            sortable: true,
            headerClassName: 'text-teal-700 dark:text-teal-300 text-xs',
            render: (value) => <span className="text-xs">{String(value || 'N/A')}</span>,
        },
        {
            key: 'product_type',
            header: t('reports.purchase_columns.product_type'),
            accessor: 'product_type',
            sortable: true,
            headerClassName: 'text-teal-700 dark:text-teal-300 text-xs',
            render: (value) => {
                const typeConfig = {
                    product: {
                        label: t('reports.product_types.product'),
                        className: 'border-sky-200 bg-sky-100 text-sky-800 hover:bg-sky-200 dark:border-sky-400/40 dark:bg-sky-500/20 dark:text-sky-100 dark:hover:bg-sky-500/30',
                    },
                    scale_product: {
                        label: t('reports.product_types.scale_product'),
                        className: 'border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:border-emerald-400/40 dark:bg-emerald-500/20 dark:text-emerald-100 dark:hover:bg-emerald-500/30',
                    },
                } as const;
                const config = value ? typeConfig[value as keyof typeof typeConfig] || typeConfig.product : typeConfig.product;
                return (
                    <Badge variant="outline" className={`${config.className} text-xs`}>
                        {config.label}
                    </Badge>
                );
            },
        },
        {
            key: 'identifier',
            header: t('reports.purchase_columns.identifier'),
            accessor: 'identifier',
            sortable: true,
            headerClassName: 'text-green-700 dark:text-green-300',
            render: (value) => {
                const normalizedValue = typeof value === 'number' ? String(value) : typeof value === 'string' ? value : '';
                const identifier = normalizedValue.trim();
                if (!identifier) {
                    return <span className="text-xs font-medium text-muted-foreground">—</span>;
                }
                return (
                    <Badge
                        variant="outline"
                        className="border-rose-200 bg-rose-100/70 text-rose-700 hover:bg-rose-100 dark:border-rose-400/40 dark:bg-rose-500/20 dark:text-rose-100 dark:hover:bg-rose-500/30"
                    >
                        <span className="font-mono text-xs">{identifier}</span>
                    </Badge>
                );
            },
        },
        {
            key: 'quantity',
            header: t('reports.purchase_columns.quantity'),
            accessor: 'quantity',
            sortable: true,
            headerClassName: 'text-cyan-700 dark:text-cyan-300 text-xs',
            render: (value) => <span className="text-xs">{String(value)}</span>,
        },
        {
            key: 'cost_price',
            header: t('reports.purchase_columns.cost_price'),
            accessor: 'cost_price',
            sortable: true,
            headerClassName: 'text-orange-700 dark:text-orange-300 text-xs',
            render: (value) => <span className="text-xs">{formatCurrency(value as number)}</span>,
        },
        {
            key: 'sell_price',
            header: t('reports.purchase_columns.sell_price'),
            accessor: 'sell_price',
            sortable: true,
            headerClassName: 'text-pink-700 dark:text-pink-300 text-xs',
            render: (value) => <span className="text-xs">{formatCurrency(value as number)}</span>,
        },
        {
            key: 'total_cost',
            header: t('reports.purchase_columns.total_cost'),
            accessor: 'total_cost',
            sortable: true,
            headerClassName: 'text-red-700 dark:text-red-300 text-xs',
            render: (value) => <span className="text-xs">{formatCurrency(value as number)}</span>,
        },
        {
            key: 'created_at',
            header: t('reports.purchase_columns.purchase_date'),
            accessor: 'created_at',
            sortable: true,
            headerClassName: 'text-blue-800 dark:text-blue-200 text-xs',
            render: (value) => {
                const { date, time } = extractDateTimeParts(value as TimestampInput);

                if (!date && !time) {
                    return (
                        <span className="text-xs text-muted-foreground">
                            N/A
                        </span>
                    );
                }

                return (
                    <div className="flex flex-col">
                        <span className="text-xs font-medium">{date ?? 'N/A'}</span>
                        {time ? (
                            <span className="text-xs text-muted-foreground">{time}</span>
                        ) : null}
                    </div>
                );
            },
        },
        {
            key: 'status',
            header: t('reports.purchase_columns.status'),
            accessor: 'status',
            sortable: true,
            headerClassName: 'text-lime-700 dark:text-lime-300 text-xs',
            render: (value) => {
                const statusConfig = {
                    order: {
                        label: t('reports.purchase_columns.status_order'),
                        className: 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800 dark:hover:bg-amber-900/30',
                    },
                    receive: {
                        label: t('reports.purchase_columns.status_receive'),
                        className: 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800 dark:hover:bg-emerald-900/30',
                    },
                } as const;
                const config = value ? statusConfig[value as keyof typeof statusConfig] : statusConfig.order;
                return (
                    <Badge variant="outline" className={`${config.className} text-xs`}>
                        {config.label}
                    </Badge>
                );
            },
        },
    ];

    const isTransactionMode = mode === 'transaction';
    const isPurchaseMode = mode === 'purchase';

    const filteredCount = isTransactionMode
        ? transactionMeta.total
        : isPurchaseMode
        ? purchaseMeta.total
        : 0;

    const totalCount = isTransactionMode
        ? transactionStats.total_transactions
        : isPurchaseMode
        ? purchaseStats.total_purchases
        : 0;

    type SummaryCardColor =
        | 'blue'
        | 'green'
        | 'orange'
        | 'red'
        | 'purple'
        | 'indigo'
        | 'pink'
        | 'teal'
        | 'yellow'
        | 'cyan'
        | 'emerald'
        | 'amber';

    interface SummaryCardConfig {
        key: string;
        title: string;
        value: number;
        description: string;
        icon: typeof DollarSign;
        color: SummaryCardColor;
        isCurrency?: boolean;
    }

    const isProductOnly = Boolean(filters.barcode?.trim());

    const summaryCards = useMemo<SummaryCardConfig[]>(() => {
        const amountDesc = isProductOnly ? t('reports.summary.total_amount_desc_product') : t('reports.summary.total_amount_desc');
        const profitDesc = isProductOnly ? t('reports.summary.total_profit_desc_product') : t('reports.summary.total_profit_desc');
        const itemsDesc = isProductOnly ? t('reports.summary.total_items_desc_product') : t('reports.summary.total_items_desc');
        const quantityDesc = isProductOnly ? t('reports.summary.total_quantity_desc_product') : t('reports.summary.total_quantity_desc');
        const recordsDesc = isProductOnly ? t('reports.summary.total_records_desc_product') : t('reports.summary.total_records_desc');

        if (isTransactionMode) {
            return [
                {
                    key: 'totalAmount',
                    title: t('reports.summary.total_amount'),
                    value: transactionSummary.totalAmount ?? 0,
                    description: amountDesc,
                    icon: DollarSign,
                    color: 'green',
                    isCurrency: true,
                },
                {
                    key: 'totalProfit',
                    title: t('reports.summary.total_profit'),
                    value: transactionSummary.totalProfit ?? 0,
                    description: profitDesc,
                    icon: TrendingUp,
                    color: 'amber',
                    isCurrency: true,
                },
                {
                    key: 'totalItems',
                    title: t('reports.summary.total_items'),
                    value: transactionSummary.totalItems ?? 0,
                    description: itemsDesc,
                    icon: Package,
                    color: 'purple',
                },
                {
                    key: 'totalQuantity',
                    title: t('reports.summary.total_quantity'),
                    value: transactionSummary.totalQuantity ?? 0,
                    description: quantityDesc,
                    icon: Activity,
                    color: 'blue',
                },
                {
                    key: 'totalRecords',
                    title: t('reports.summary.total_records'),
                    value: transactionSummary.totalRecords ?? 0,
                    description: recordsDesc,
                    icon: ShoppingCart,
                    color: 'emerald',
                },
            ];
        }

        if (isPurchaseMode) {
            return [
                {
                    key: 'totalAmount',
                    title: t('reports.summary.total_amount'),
                    value: purchaseSummary.totalAmount ?? 0,
                    description: amountDesc,
                    icon: DollarSign,
                    color: 'green',
                    isCurrency: true,
                },
                {
                    key: 'totalItems',
                    title: t('reports.summary.total_items'),
                    value: purchaseSummary.totalItems ?? 0,
                    description: itemsDesc,
                    icon: Package,
                    color: 'purple',
                },
                {
                    key: 'totalQuantity',
                    title: t('reports.summary.total_quantity'),
                    value: purchaseSummary.totalQuantity ?? 0,
                    description: quantityDesc,
                    icon: Activity,
                    color: 'blue',
                },
                {
                    key: 'totalRecords',
                    title: t('reports.summary.total_records'),
                    value: purchaseSummary.totalRecords ?? 0,
                    description: recordsDesc,
                    icon: ShoppingCart,
                    color: 'emerald',
                },
            ];
        }

        return [];
    }, [isTransactionMode, isPurchaseMode, isProductOnly, t, transactionSummary, purchaseSummary]);

    const summaryTitle =
        mode === 'transaction'
            ? t('reports.summary.transactions_title')
            : mode === 'purchase'
            ? t('reports.summary.purchases_title')
            : t('reports.summary.all_reports_title');

    const isSummaryVisible = mode === 'transaction' || mode === 'purchase';

    const summaryDescription =
        mode === 'transaction'
            ? t('reports.transaction_subtitle', {
                  filtered: filteredCount,
                  total: totalCount,
              })
            : mode === 'purchase'
            ? t('reports.purchase_subtitle', {
                  filtered: filteredCount,
                  total: totalCount,
              })
            : t('reports.select_mode_instruction');

    const tableTitle =
        mode === 'transaction'
            ? t('reports.transaction_reports')
            : mode === 'purchase'
            ? t('reports.purchase_reports')
            : t('reports.all_reports');

    const tableSubtitle = hasActiveFilters()
        ? mode === 'transaction'
            ? t('reports.transaction_subtitle', {
                  filtered: filteredCount,
                  total: totalCount,
              })
            : t('reports.purchase_subtitle', {
                  filtered: filteredCount,
                  total: totalCount,
              })
        : t('reports.apply_filters_desc');

    const tableEmptyMessage = hasActiveFilters()
        ? mode === 'transaction'
            ? t('reports.no_transactions_filtered')
            : t('reports.no_purchases_filtered')
        : t('reports.apply_filters_instruction');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('navigation.admin') },
        { title: t('navigation.reports'), href: admin.reports.url() },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('navigation.reports')} />
            <div className="flex flex-1 flex-col gap-6 rounded-xl p-6">
                <PageHeader
                    title={t('reports.title')}
                    description={t('reports.description')}
                >
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={loading}
                        className="!border-blue-300 !bg-blue-50 !text-blue-700 hover:!border-blue-500 hover:!bg-blue-100 dark:!border-blue-600 dark:!bg-blue-900/20 dark:!text-blue-300 dark:hover:!border-blue-500 dark:hover:!bg-blue-900/30"
                    >
                        <RefreshCw
                            className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                        />
                        {loading ? t('reports.refreshing') : t('reports.refresh')}
                    </Button>
                </PageHeader>

                {error && (
                    <div className="rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
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

                <ReportsFilter
                    key={mode}
                    mode={mode}
                    onModeChange={handleModeChange}
                    onFilterChange={handleFilterChange}
                    loading={loading}
                />

                {isSummaryVisible && (
                    <section className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-6 shadow-sm backdrop-blur-sm dark:border-emerald-900/40 dark:bg-emerald-950/40">
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <h2 className="text-lg font-semibold text-emerald-900 dark:text-emerald-200">
                                        {summaryTitle}
                                    </h2>
                                    {isProductOnly && (
                                        <p className="text-sm font-medium text-cyan-700 dark:text-cyan-300 mt-0.5">
                                            {t('reports.summary.product_only_label')}
                                        </p>
                                    )}
                                    <p className="text-sm text-emerald-800/70 dark:text-emerald-200/70">
                                        {summaryDescription}
                                    </p>
                                </div>
                                <Badge className="bg-emerald-600 text-emerald-50 shadow-sm dark:bg-emerald-500">
                                    {t('reports.summary.filtered_badge', {
                                        filtered: filteredCount,
                                        total: totalCount,
                                    })}
                                </Badge>
                            </div>
                            <StatsCards className="grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                                {summaryCards.map(({ key, ...card }) => (
                                    <StatCard key={key} {...card} loading={loading} />
                                ))}
                            </StatsCards>
                        </div>
                    </section>
                )}

                {mode === 'transaction' ? (
                    <DataTable<TransactionReportRow>
                        title={tableTitle}
                        subtitle={tableSubtitle}
                        headerActions={
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDownloadExcel}
                                className="h-8 border-blue-300 bg-blue-50 px-3 text-blue-700 hover:border-blue-400 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:border-blue-600 dark:hover:bg-blue-900/30"
                            >
                                <FileSpreadsheet className="mr-2 h-4 w-4" />
                                Excel
                            </Button>
                        }
                        data={transactionData}
                        columns={transactionColumns}
                        loading={loading}
                        emptyMessage={tableEmptyMessage}
                        pagination={{
                            currentPage: transactionPaginationInfo.currentPage,
                            totalPages: transactionPaginationInfo.totalPages,
                            pageSize: transactionPaginationInfo.pageSize,
                            totalItems: transactionPaginationInfo.totalItems,
                            onPageChange: handleTransactionPageChange,
                            showInfo: true,
                        }}
                        sorting={{
                            sortBy: sorting.sortBy,
                            sortOrder: sorting.sortOrder,
                            onSort: handleSort,
                        }}
                        className="bg-background"
                    />
                ) : (
                    <DataTable<PurchaseReportRow>
                        title={tableTitle}
                        subtitle={tableSubtitle}
                        headerActions={
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDownloadExcel}
                                className="h-8 border-blue-300 bg-blue-50 px-3 text-blue-700 hover:border-blue-400 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:border-blue-600 dark:hover:bg-blue-900/30"
                            >
                                <FileSpreadsheet className="mr-2 h-4 w-4" />
                                Excel
                            </Button>
                        }
                        data={purchaseData}
                        columns={purchaseColumns}
                        loading={loading}
                        emptyMessage={tableEmptyMessage}
                        pagination={{
                            currentPage: purchasePaginationInfo.currentPage,
                            totalPages: purchasePaginationInfo.totalPages,
                            pageSize: purchasePaginationInfo.pageSize,
                            totalItems: purchasePaginationInfo.totalItems,
                            onPageChange: handlePurchasePageChange,
                            showInfo: true,
                        }}
                        sorting={{
                            sortBy: sorting.sortBy,
                            sortOrder: sorting.sortOrder,
                            onSort: handleSort,
                        }}
                        className="bg-background"
                    />
                )}
            </div>
        </AppLayout>
    );
}
