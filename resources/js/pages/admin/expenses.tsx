import { ExpenseModal } from '@/components/modals/expense-modal';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/charts/stats-cards';
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
import {
    expenseService,
    type Expense,
    type ExpenseStatistics,
} from '@/services/business/expenseService';
import { type BreadcrumbItem } from '@/types';
import { type Column } from '@/types/table';
import { Head } from '@inertiajs/react';
import {
    DollarSign,
    Edit,
    FileSpreadsheet,
    Package,
    Plus,
    RefreshCw,
    Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ExpensesFilterComponent, type expensesFilterOptions } from '@/components/filters/expenses-filter-component';

// Using Expense type from expenseService

export default function Expenses() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [sorting, setSorting] = useState({
        sortBy: 'created_at',
        sortOrder: 'desc' as 'asc' | 'desc',
    });
    const [filters, setFilters] = useState<expensesFilterOptions>({});
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(
        null,
    );
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [, setTotalAmount] = useState(0);
    const [isExcelMonthModalOpen, setIsExcelMonthModalOpen] = useState(false);
    const [statistics, setStatistics] = useState<ExpenseStatistics>({
        total_expenses: 0,
        total_amount: 0,
        average_amount: 0,
        this_month_amount: 0,
        today_expenses: 0,
        today_amount: 0,
    });
    const pageSize = 10;

    // Function to calculate total amount from expenses array
    const calculateTotalAmount = (expensesList: Expense[]): number => {
        return expensesList.reduce((sum: number, expense: Expense) => {
            const price =
                typeof expense.price === 'number'
                    ? expense.price
                    : parseFloat(expense.price) || 0;
            return sum + price;
        }, 0);
    };

    // Function to load expense statistics using data-based calculation (same logic as purchase page)
    const loadStatistics = useCallback(async () => {
        try {
            // Get all-time statistics from API
            const allTimeResponse = await expenseService.getStatistics();
            
            if (allTimeResponse.success && allTimeResponse.data) {
                const allTimeStats = allTimeResponse.data;

                // Get all expenses to calculate today's stats from data (like purchase page)
                const allExpensesResponse = await expenseService.getExpenses({
                    per_page: 10000, // Get all expenses to calculate stats
                    page: 1,
                });

                let todayExpenses = 0;
                let todayAmount = 0;

                if (allExpensesResponse.success && allExpensesResponse.data) {
                    // Calculate today's statistics with proper 24-hour period (midnight to midnight) - same logic as purchase page
                    const now = new Date();
                    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
                    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
                    
                    // Filter expenses by created_at for today (same logic as purchase page)
                    const todayExpensesList = allExpensesResponse.data.filter(
                        (expense: Expense) => {
                            if (!expense.created_at) return false;
                            const expenseDate = new Date(expense.created_at);
                            return expenseDate >= todayStart && expenseDate < todayEnd;
                        }
                    );

                    // Calculate today's statistics from filtered data
                    todayExpenses = todayExpensesList.length;

                    todayAmount = todayExpensesList.reduce((sum: number, expense: Expense) => {
                        const amount = Number(expense.price) || 0;
                        return sum + amount;
                    }, 0);
                }

                setStatistics({
                    total_expenses: allTimeStats.total_expenses || 0,
                    total_amount: allTimeStats.total_amount || 0,
                    average_amount: allTimeStats.average_amount || 0,
                    this_month_amount: allTimeStats.this_month_amount || 0,
                    today_expenses: todayExpenses,
                    today_amount: todayAmount,
                });
            }
        } catch {
            // Silent error handling
        }
    }, []);

    // Load expenses from API
    const loadExpenses = useCallback(
        async (showToast = false) => {
            setLoading(true);
            try {
                const response = await expenseService.getExpenses({
                    per_page: pageSize,
                    page: currentPage,
                    sort_by: sorting.sortBy,
                    sort_order: sorting.sortOrder,
                    search: filters.description,
                    min_price: filters.priceMin,
                    max_price: filters.priceMax,
                    date_from: filters.dateFrom,
                    date_to: filters.dateTo,
                    time_from: filters.timeFrom,
                    time_to: filters.timeTo,
                });

                if (response.success) {
                    setExpenses(response.data);
                    setTotalPages(response.pagination.last_page);
                    setTotalItems(response.pagination.total);

                    // Calculate total amount from current expenses (robust calculation)
                    const total = calculateTotalAmount(response.data);
                    setTotalAmount(total);
                } else {
                    if (showToast) {
                        toast({
                            title: t('expenses.error_messages.failed_to_load'),
                            description: t('expenses.error_messages.failed_to_load_desc'),
                            type: 'error',
                        });
                    }
                }
            } catch {
                if (showToast) {
                    toast({
                        title: t('expenses.error_messages.error_loading'),
                        description: t('expenses.error_messages.error_loading_desc'),
                        type: 'error',
                    });
                }
            } finally {
                setLoading(false);
            }
        },
        [
            pageSize,
            currentPage,
            sorting.sortBy,
            sorting.sortOrder,
            filters,
            toast,
            t,
        ],
    );

    useEffect(() => {
        loadExpenses();
        loadStatistics();
    }, [
        currentPage,
        sorting,
        filters,
        loadExpenses,
        loadStatistics,
    ]);

    // Recalculate total amount whenever expenses change
    useEffect(() => {
        const total = calculateTotalAmount(expenses);
        setTotalAmount(total);
    }, [expenses]);

    const handleRefresh = () => {
        loadExpenses(true);
        loadStatistics();
    };

    const handleFiltersChange = (newFilters: expensesFilterOptions) => {
        setFilters(newFilters);
        setCurrentPage(1);
    };

    const handleSort = (key: string) => {
        const newSortOrder =
            sorting.sortBy === key && sorting.sortOrder === 'asc'
                ? 'desc'
                : 'asc';
        setSorting({ sortBy: key, sortOrder: newSortOrder });
        setCurrentPage(1);

        toast({
            title: t('expenses.success_messages.sorting_applied'),
            description: t('expenses.success_messages.sorting_applied_desc', { key, order: newSortOrder }),
            type: 'info',
        });
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

            const response = await expenseService.getAllExpenses({
                date_from: dateFrom,
                date_to: dateTo,
                sort_by: sorting.sortBy,
                sort_order: sorting.sortOrder,
            });

            if (!response.success || !response.data) return;

            const allExpenses = response.data;
            const totalAmount = allExpenses.reduce((sum, e) => sum + (Number(e.price) || 0), 0);
            const avgAmount = allExpenses.length > 0 ? totalAmount / allExpenses.length : 0;

            const summaryData = [
                ['SUMMARY'],
                ['Total Expenses (count)', allExpenses.length],
                ['Total Amount', totalAmount],
                ['Average Amount', Number(avgAmount.toFixed(2))],
                [],
            ];

            const headers = [
                t('expenses.table_columns.description'),
                t('expenses.table_columns.amount'),
                t('expenses.table_columns.created'),
                t('expenses.table_columns.updated'),
            ];
            const dataRows = allExpenses.map<(string | number)[]>((expense) => [
                expense.description,
                Number(expense.price) || 0,
                formatDateTimeDisplay(expense.created_at),
                formatDateTimeDisplay(expense.updated_at),
            ]);

            const sumAmount = allExpenses.reduce((s, e) => s + (Number(e.price) || 0), 0);
            const totalsRow: (string | number)[] = ['TOTALS', sumAmount, '', ''];

            const workbook = createWorkbook();
            const worksheet = addWorksheet(workbook, 'Expenses');
            appendTable(worksheet, summaryData as unknown as (string | number)[][]);
            appendTable(worksheet, [headers]);
            appendTable(worksheet, dataRows);
            appendTable(worksheet, [totalsRow]);
            worksheet.columns = headers.map(() => ({ width: 22 }));

            await downloadWorkbook(workbook, `expenses_${monthStr}.xlsx`);
        } catch {
            toast({
                title: t('expenses.error_messages.download_failed'),
                description: t('expenses.error_messages.download_failed_desc'),
                type: 'error',
            });
        }
    }, [getMonthDateRange, sorting.sortBy, sorting.sortOrder, t, toast]);

    const handleRowClick = () => {};

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('navigation.admin') },
        { title: t('navigation.expenses'), href: '/admin/expenses' },
    ];

    const handleAddExpense = async (data: {
        price: string;
        description: string;
    }) => {
        try {
            const response = await expenseService.createExpense({
                price: parseFloat(data.price),
                description: data.description,
            });

            if (response.success) {
                // Reload expenses and statistics to get the updated data
                await loadExpenses();
                await loadStatistics();

                toast({
                    title: t('expenses.success_messages.expense_added'),
                    description: t('expenses.success_messages.expense_added_desc', { description: data.description }),
                    type: 'success',
                });
            } else {
                toast({
                    title: t('expenses.error_messages.failed_to_add'),
                    description: response.message || t('expenses.error_messages.failed_to_add_desc'),
                    type: 'error',
                });
            }
        } catch {
            toast({
                title: t('expenses.error_messages.error_adding'),
                description: t('expenses.error_messages.error_adding_desc'),
                type: 'error',
            });
        }
    };

    const handleEditExpense = async (data: {
        price: string;
        description: string;
    }) => {
        if (!editingExpense) return;

        try {
            const response = await expenseService.updateExpense(
                editingExpense.id,
                {
                    price: parseFloat(data.price),
                    description: data.description,
                },
            );

            if (response.success) {
                // Reload expenses and statistics to get the updated data
                await loadExpenses();
                await loadStatistics();
                setEditingExpense(null);

                toast({
                    title: t('expenses.success_messages.expense_updated'),
                    description: t('expenses.success_messages.expense_updated_desc', { description: data.description }),
                    type: 'success',
                });
            } else {
                toast({
                    title: t('expenses.error_messages.failed_to_update'),
                    description: response.message || t('expenses.error_messages.failed_to_update_desc'),
                    type: 'error',
                });
            }
        } catch {
            toast({
                title: t('expenses.error_messages.error_updating'),
                description: t('expenses.error_messages.error_updating_desc'),
                type: 'error',
            });
        }
    };

    const handleDeleteExpense = (expense: Expense) => {
        setExpenseToDelete(expense);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteExpense = async () => {
        if (!expenseToDelete) return;

        try {
            const response = await expenseService.deleteExpense(
                expenseToDelete.id,
            );

            if (response.success) {
                // Reload expenses and statistics to get the updated data
                await loadExpenses();
                await loadStatistics();
                setIsDeleteModalOpen(false);
                setExpenseToDelete(null);

                toast({
                    title: t('expenses.success_messages.expense_deleted'),
                    description: t('expenses.success_messages.expense_deleted_desc', { description: expenseToDelete.description }),
                    type: 'success',
                });
            } else {
                toast({
                    title: t('expenses.error_messages.failed_to_delete'),
                    description: response.message || t('expenses.error_messages.failed_to_delete_desc'),
                    type: 'error',
                });
            }
        } catch {
            toast({
                title: t('expenses.error_messages.error_deleting'),
                description: t('expenses.error_messages.error_deleting_desc'),
                type: 'error',
            });
        }
    };

    const cancelDeleteExpense = () => {
        setIsDeleteModalOpen(false);
        setExpenseToDelete(null);
    };

    const openEditModal = (expense: Expense) => {
        setEditingExpense(expense);
        setIsModalOpen(true);

        toast({
            title: t('expenses.success_messages.edit_mode'),
            description: t('expenses.success_messages.edit_mode_desc', { description: expense.description }),
            type: 'info',
        });
    };

    const closeEditModal = () => {
        setEditingExpense(null);
        setIsModalOpen(false);
    };

    const handleAddExpenseClick = () => {
        setIsModalOpen(true);
    };

    // Table columns for expenses
    const expenseColumns: Column<Expense>[] = [
        {
            key: 'description',
            header: t('expenses.table_columns.description'),
            accessor: 'description',
            sortable: true,
            className: 'w-1/3',
            headerClassName: 'text-blue-700 dark:text-blue-300',
        },
        {
            key: 'price',
            header: t('expenses.table_columns.amount'),
            accessor: 'price',
            sortable: true,
            className: 'w-1/6',
            headerClassName: 'text-indigo-700 dark:text-indigo-300',
            render: (value) => formatCurrency(Number(value) || 0),
        },
        {
            key: 'created_at',
            header: t('expenses.table_columns.created'),
            accessor: 'created_at',
            sortable: true,
            className: 'w-1/6',
            headerClassName: 'text-green-700 dark:text-green-300',
            render: (value) => {
                const date = formatDatePart(value as TimestampInput, '');
                const time = formatTimePart(value as TimestampInput, '');

                if (!date && !time) {
                    return <span className="text-sm text-muted-foreground">—</span>;
                }

                return (
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">
                            {date || '—'}
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
            key: 'updated_at',
            header: t('expenses.table_columns.updated'),
            accessor: 'updated_at',
            sortable: true,
            className: 'w-1/6',
            headerClassName: 'text-purple-700 dark:text-purple-300',
            render: (value) => {
                const date = formatDatePart(value as TimestampInput, '');
                const time = formatTimePart(value as TimestampInput, '');

                if (!date && !time) {
                    return <span className="text-sm text-muted-foreground">—</span>;
                }

                return (
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">
                            {date || '—'}
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
            header: t('expenses.table_columns.actions'),
            className: 'w-1/6',
            headerClassName: 'text-pink-700 dark:text-pink-300',
            render: (_, row) => (
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(row)}
                        className="h-8 w-8 p-0 border-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/20"
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteExpense(row)}
                        className="h-8 w-8 p-0 border-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    // Using API pagination - no need for client-side calculations

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('navigation.expenses')} />
            <div className="flex flex-1 flex-col gap-6 rounded-xl p-6">
                <PageHeader
                    title={t('expenses.title')}
                    description={t('expenses.description')}
                >
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        className="!border-yellow-300 !bg-yellow-50 !text-yellow-700 hover:!border-yellow-500 hover:!bg-yellow-100 dark:!border-yellow-600 dark:!bg-yellow-900/20 dark:!text-yellow-300 dark:hover:!border-yellow-500 dark:hover:!bg-yellow-900/30"
                    >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        {t('expenses.refresh')}
                    </Button>
                    <Button onClick={handleAddExpenseClick} className="!border-purple-300 !bg-purple-50 !text-purple-700 hover:!border-purple-500 hover:!bg-purple-100 dark:!border-purple-600 dark:!bg-purple-900/20 dark:!text-purple-300 dark:hover:!border-purple-500 dark:hover:!bg-purple-900/30">
                        <Plus className="mr-2 h-4 w-4" />
                        {t('expenses.add_expenses')}
                    </Button>
                </PageHeader>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                    {/* Total Expenses Count */}
                    <StatCard
                        title={t('expenses.total_expenses')}
                        value={statistics.total_expenses.toString()}
                        description={t('expenses.total_expenses_desc')}
                        icon={Package}
                        color="blue"
                        badge={{
                            text: t('expenses.total_count'),
                            variant: 'secondary',
                            color: 'blue',
                        }}
                    />

                    {/* Total Amount */}
                    <StatCard
                        title={t('expenses.total_amount')}
                        value={statistics.total_amount.toString()}
                        description={t('expenses.total_amount_desc')}
                        icon={DollarSign}
                        color="green"
                        isCurrency={true}
                        showInfoButton={true}
                        badge={{
                            text: t('expenses.total_value'),
                            variant: 'default',
                            color: 'green',
                        }}
                    />

                    {/* Today's Expenses Count */}
                    <StatCard
                        title={t('expenses.today_expenses')}
                        value={statistics.today_expenses.toString()}
                        description={t('expenses.today_expenses_desc')}
                        icon={Package}
                        color="orange"
                        badge={{
                            text: t('expenses.today_count'),
                            variant: 'secondary',
                            color: 'orange',
                        }}
                    />

                    {/* Today's Amount */}
                    <StatCard
                        title={t('expenses.today_amount')}
                        value={statistics.today_amount.toString()}
                        description={t('expenses.today_amount_desc')}
                        icon={DollarSign}
                        color="purple"
                        isCurrency={true}
                        showInfoButton={true}
                        badge={{
                            text: t('expenses.today_value'),
                            variant: 'default',
                            color: 'purple',
                        }}
                    />
                </div>

                {/* Filter Component */}
                <ExpensesFilterComponent
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                />

                {/* Expenses Data Table */}
                <DataTable
                    title={t('expenses.expense_items')}
                    subtitle={`${t('expenses.showing')} ${expenses.length} ${t('expenses.of')} ${totalItems} ${t('expenses.items')}`}
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
                    data={expenses}
                    columns={expenseColumns}
                    loading={loading}
                    emptyMessage={t('expenses.no_expenses_found')}
                    onRowClick={handleRowClick}
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

            <ExpenseModal
                isOpen={isModalOpen}
                onClose={closeEditModal}
                onSubmit={editingExpense ? handleEditExpense : handleAddExpense}
                editExpense={editingExpense || undefined}
            />

            <DeleteModal
                isOpen={isDeleteModalOpen}
                onClose={cancelDeleteExpense}
                onConfirm={confirmDeleteExpense}
                title={t('expenses.delete_modal.title')}
                description={t('expenses.delete_modal.description', { description: expenseToDelete?.description || t('expenses.delete_modal.this_expense') })}
            />

            <ExportTransactionsByMonthModal
                isOpen={isExcelMonthModalOpen}
                onClose={() => setIsExcelMonthModalOpen(false)}
                onExport={handleExportExcelByMonth}
                i18nKey="expenses.export_by_month"
            />
        </AppLayout>
    );
}
