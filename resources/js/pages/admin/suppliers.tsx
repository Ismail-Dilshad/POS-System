import { SCALE_PRODUCTS_ENABLED } from '@/config/features';
import { ImportSuppliersModal } from '@/components/modals/import-suppliers-modal';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/charts/stats-cards';
import {
    SupplierFilter,
    type SupplierFilterOptions,
} from '@/components/filters/supplier-filter';
import { SupplierModal } from '@/components/modals/supplier-modal';
import { SupplierPaymentsModal } from '@/components/modals/supplier-payments-modal';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { DeleteModal } from '@/components/ui/delete-modal';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/lib/currency';
import admin from '@/routes/admin';
import { supplierService, type Supplier } from '@/services/business/supplierService';
import { type BreadcrumbItem, type Column } from '@/types';
import { Head } from '@inertiajs/react';
import {
    AlertTriangle,
    Building2,
    CheckCircle,
    CreditCard,
    Download,
    Edit,
    FileSpreadsheet,
    Plus,
    RefreshCw,
    Trash2,
    Upload,
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Suppliers() {
    const { t } = useTranslation();
    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(
        null,
    );
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(
        null,
    );
    const [isPaymentsModalOpen, setIsPaymentsModalOpen] = useState(false);
    const [selectedSupplierForPayments, setSelectedSupplierForPayments] =
        useState<Supplier | null>(null);
    const [deleteWarning, setDeleteWarning] = useState<string | null>(null);
    const [isDeleteDisabled, setIsDeleteDisabled] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [filters, setFilters] = useState<SupplierFilterOptions>({});
    const [loading, setLoading] = useState(false);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [currentPage, setCurrentPage] = useState(1);

    // Sorting state
    const [sorting, setSorting] = useState<{
        sortBy: string;
        sortOrder: 'asc' | 'desc';
    }>({
        sortBy: 'name',
        sortOrder: 'asc',
    });

    // Reset current page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    // Load suppliers from API
    const loadSuppliers = async () => {
        setLoading(true);
        try {
            const response = await supplierService.getSuppliers();
            if (response.success && response.data) {
                setSuppliers(response.data);
            }
        } catch {
            // Failed to load suppliers
        } finally {
            setLoading(false);
        }
    };

    // Load suppliers on component mount
    useEffect(() => {
        loadSuppliers();
    }, []);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('navigation.admin'),
        },
        {
            title: t('navigation.suppliers'),
            href: admin.suppliers.url(),
        },
    ];

    const handleAddSupplier = () => {
        setEditingSupplier(null);
        setIsSupplierModalOpen(true);
    };

    const handleEditSupplier = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setIsSupplierModalOpen(true);
    };

    const handleDeleteSupplier = async (supplier: Supplier) => {
        setSupplierToDelete(supplier);
        setDeleteWarning(null);
        setIsDeleteDisabled(false);

        // Check if supplier is in use
        try {
            const response = await supplierService.checkSupplierUsage(
                supplier.id,
            );
            if (response.success && response.data) {
                if (!response.data.can_delete) {
                    const totalCount = response.data.total_usage;
                    const productCount = response.data.products_count;
                    const scaleProductCount =
                        response.data.scale_products_count;

                    let warningMessage = t('suppliers.delete_modal.warning', {
                        count: totalCount,
                        plural: totalCount > 1 ? 's' : ''
                    });
                    if (SCALE_PRODUCTS_ENABLED && productCount > 0 && scaleProductCount > 0) {
                        warningMessage += t('suppliers.delete_modal.warning_both', {
                            productCount,
                            productPlural: productCount > 1 ? 's' : '',
                            scaleProductCount,
                            scaleProductPlural: scaleProductCount > 1 ? 's' : ''
                        });
                    } else if (SCALE_PRODUCTS_ENABLED && productCount > 0) {
                        warningMessage += t('suppliers.delete_modal.warning_products', {
                            productCount,
                            productPlural: productCount > 1 ? 's' : ''
                        });
                    } else if (SCALE_PRODUCTS_ENABLED && scaleProductCount > 0) {
                        warningMessage += t('suppliers.delete_modal.warning_scale_products', {
                            scaleProductCount,
                            scaleProductPlural: scaleProductCount > 1 ? 's' : ''
                        });
                    }

                    setDeleteWarning(warningMessage);
                    setIsDeleteDisabled(true);
                }
            }
        } catch {
            setDeleteWarning(
                t('suppliers.delete_modal.usage_check_failed'),
            );
            setIsDeleteDisabled(true);
        }

        setIsDeleteModalOpen(true);
    };

    const handleDeleteModalClose = () => {
        setSupplierToDelete(null);
        setIsDeleteModalOpen(false);
    };

    const handleViewPayments = (supplier: Supplier) => {
        setSelectedSupplierForPayments(supplier);
        setIsPaymentsModalOpen(true);
    };

    const handlePaymentsModalClose = () => {
        setSelectedSupplierForPayments(null);
        setIsPaymentsModalOpen(false);
    };

    // Delete function
    const handleDeleteConfirm = async () => {
        if (!supplierToDelete) return;

        try {
            const response = await supplierService.deleteSupplier(
                supplierToDelete.id,
            );
            if (response.success) {
                handleDeleteModalClose();
                loadSuppliers();
            }
        } catch {
            // Failed to delete supplier
        }
    };

    const handleSupplierSuccess = () => {
        loadSuppliers(); // Refresh suppliers list
    };

    const handleCloseSupplierModal = () => {
        setEditingSupplier(null);
        setIsSupplierModalOpen(false);
    };

    // Handle refresh
    const handleRefresh = () => {
        loadSuppliers();
    };

    // Handle sorting
    const handleSort = (column: string) => {
        setSorting((prev) => ({
            sortBy: column,
            sortOrder:
                prev.sortBy === column && prev.sortOrder === 'asc'
                    ? 'desc'
                    : 'asc',
        }));
    };

    // Excel download functionality
    const handleDownloadExcel = async () => {
        if (filteredAndSortedSuppliers.length === 0) {
            return;
        }

        try {
            const { createWorkbook, addWorksheet, appendTable, downloadWorkbook } = await import('@/services/utils/excelService');
            // Calculate summary statistics
            const totalSuppliers = filteredAndSortedSuppliers.length;
            const totalAmount = filteredAndSortedSuppliers.reduce(
                (sum, s) => sum + (Number(s.total_amount) || 0),
                0,
            );
            const totalPaid = filteredAndSortedSuppliers.reduce(
                (sum, s) => sum + (Number(s.total_paid) || 0),
                0,
            );
            const remainAmount = filteredAndSortedSuppliers.reduce(
                (sum, s) => sum + (Number(s.remain_amount) || 0),
                0,
            );
            const avgAmount = totalSuppliers > 0 ? totalAmount / totalSuppliers : 0;
            const avgPaid = totalSuppliers > 0 ? totalPaid / totalSuppliers : 0;
            const avgRemain = totalSuppliers > 0 ? remainAmount / totalSuppliers : 0;

            const summaryData = [
                ['SUMMARY'],
                ['Total Suppliers (count)', totalSuppliers],
                ['Total Amount', totalAmount],
                ['Total Paid', totalPaid],
                ['Remaining Amount', remainAmount],
                ['Average Amount per Supplier', Number(avgAmount.toFixed(2))],
                ['Average Paid per Supplier', Number(avgPaid.toFixed(2))],
                ['Average Remain per Supplier', Number(avgRemain.toFixed(2))],
                [],
            ];

            // Create Excel data
            const excelData = filteredAndSortedSuppliers.map((supplier) => ({
                [t('suppliers.csv_headers.supplier_name')]: supplier.name || '',
                [t('suppliers.csv_headers.supplier_code')]:
                    supplier.supplier_code || '',
                [t('suppliers.csv_headers.phone')]: supplier.phone || '',
                [t('suppliers.csv_headers.email')]: supplier.email || 'N/A',
                [t('suppliers.csv_headers.business_name')]:
                    supplier.business_name || 'N/A',
                [t('suppliers.csv_headers.business_address')]:
                    supplier.business_address || 'N/A',
                [t('suppliers.csv_headers.business_phone')]:
                    supplier.business_phone || 'N/A',
                [t('suppliers.csv_headers.business_email')]:
                    supplier.business_email || 'N/A',
                'Total Amount': Number(supplier.total_amount) || 0,
                'Total Paid': Number(supplier.total_paid) || 0,
                'Remain Amount': Number(supplier.remain_amount) || 0,
                [t('suppliers.csv_headers.created_at')]:
                    supplier.created_at || '',
                [t('suppliers.csv_headers.updated_at')]:
                    supplier.updated_at || '',
            }));

            const headers = Object.keys(excelData[0] || {});
            const totalsRow: (string | number)[] = headers.map((h) => {
                if (h === 'Total Amount') return totalAmount;
                if (h === 'Total Paid') return totalPaid;
                if (h === 'Remain Amount') return remainAmount;
                return '';
            });
            if (headers[0]) totalsRow[0] = 'TOTALS';

            const workbook = await createWorkbook();
            const worksheet = addWorksheet(workbook, 'Suppliers');
            appendTable(worksheet, summaryData as unknown as (string | number)[][]);
            appendTable(worksheet, [headers]);
            appendTable(
                worksheet,
                excelData.map((row) => headers.map((h) => (row as Record<string, unknown>)[h] as string | number)) as unknown as (string | number)[][]
            );
            appendTable(worksheet, [totalsRow]);

            // Set column widths
            worksheet.columns = headers.map(() => ({ width: 20 }));

            // Create workbook and download
            await downloadWorkbook(
                workbook,
                `suppliers_${new Date().toISOString().split('T')[0]}.xlsx`,
            );
        } catch (error) {
            console.error('Error generating Excel file:', error);
        }
    };

    // Handle import
    const handleImport = () => {
        setIsImportModalOpen(true);
    };

    const handleExport = () => {
        handleDownloadExcel();
    };

    const handleRowClick = () => {
        // You can navigate to supplier detail or open a modal
    };

    // Filter and sort suppliers
    const filteredAndSortedSuppliers = suppliers
        .filter((supplier) => {
            // Search filter (name and code)
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                const matchesName = supplier.name
                    .toLowerCase()
                    .includes(searchTerm);
                const matchesCode = supplier.supplier_code
                    .toLowerCase()
                    .includes(searchTerm);

                if (!matchesName && !matchesCode) return false;
            }

            // Phone filter
            if (filters.phone) {
                const phoneTerm = filters.phone.toLowerCase();
                const matchesPhone = supplier.phone
                    ?.toLowerCase()
                    .includes(phoneTerm);

                if (!matchesPhone) return false;
            }

            // Price range filters
            if (filters.priceMin) {
                const minPrice = parseFloat(filters.priceMin);
                const totalAmount = Number(supplier.total_amount) || 0;
                if (totalAmount < minPrice) return false;
            }

            if (filters.priceMax) {
                const maxPrice = parseFloat(filters.priceMax);
                const totalAmount = Number(supplier.total_amount) || 0;
                if (totalAmount > maxPrice) return false;
            }

            return true;
        })
        .sort((a, b) => {
            const { sortBy, sortOrder } = sorting;

            let aValue: unknown = a[sortBy as keyof Supplier];
            let bValue: unknown = b[sortBy as keyof Supplier];

            // Handle null/undefined values
            if (aValue == null) aValue = '';
            if (bValue == null) bValue = '';

            // Convert to string for comparison if needed
            if (typeof aValue === 'string') aValue = aValue.toLowerCase();
            if (typeof bValue === 'string') bValue = bValue.toLowerCase();

            if (String(aValue) < String(bValue)) {
                return sortOrder === 'asc' ? -1 : 1;
            }
            if (String(aValue) > String(bValue)) {
                return sortOrder === 'asc' ? 1 : -1;
            }
            return 0;
        });

    // Keep compatible variable names
    const filteredSuppliers = filteredAndSortedSuppliers;

    // Paginate the data
    const pageSize = 10;
    const totalPages = Math.ceil(filteredSuppliers.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedSuppliers = filteredSuppliers.slice(startIndex, endIndex);

    // Data table columns
    const columns: Column<Supplier>[] = [
        {
            key: 'supplier_code',
            header: t('suppliers.table_columns.code'),
            accessor: 'supplier_code',
            sortable: true,
            headerClassName: 'text-blue-700 dark:text-blue-300',
            render: (value) => (
                <span className="font-mono text-sm font-medium text-slate-600 dark:text-slate-400">
                    {String(value || 'N/A')}
                </span>
            ),
        },
        {
            key: 'name',
            header: t('suppliers.table_columns.name'),
            accessor: 'name',
            sortable: true,
            headerClassName: 'text-indigo-700 dark:text-indigo-300',
            render: (value) => (
                <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 flex-shrink-0 text-[#1F3F3F]/60 dark:text-[#1F3F3F]/40" />
                    <span className="font-medium">{String(value || '')}</span>
                </div>
            ),
        },
        {
            key: 'phone',
            header: t('suppliers.table_columns.phone'),
            accessor: 'phone',
            sortable: true,
            headerClassName: 'text-green-700 dark:text-green-300',
            render: (value) => (
                <span className="text-sm text-muted-foreground">
                    {String(value || 'N/A')}
                </span>
            ),
        },
        {
            key: 'total_amount',
            header: t('suppliers.table_columns.total_amount'),
            accessor: 'total_amount',
            sortable: true,
            headerClassName: 'text-purple-700 dark:text-purple-300',
            render: (value) => (
                <span className="font-medium">
                    {formatCurrency(Number(value) || 0)}
                </span>
            ),
        },
        {
            key: 'total_paid',
            header: t('suppliers.table_columns.total_paid'),
            accessor: 'total_paid',
            sortable: true,
            headerClassName: 'text-red-700 dark:text-red-300',
            render: (value) => (
                <span className="font-medium text-green-600 dark:text-green-400">
                    {formatCurrency(Number(value) || 0)}
                </span>
            ),
        },
        {
            key: 'remain_amount',
            header: t('suppliers.table_columns.remain_amount'),
            accessor: 'remain_amount',
            sortable: true,
            headerClassName: 'text-teal-700 dark:text-teal-300',
            render: (value) => (
                <span className="font-medium text-red-600 dark:text-red-400">
                    {formatCurrency(Number(value) || 0)}
                </span>
            ),
        },
        {
            key: 'actions',
            header: t('suppliers.table_columns.actions'),
            headerClassName: 'text-pink-700 dark:text-pink-300',
            render: (_, row) => (
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewPayments(row)}
                        className="h-8 w-8 p-0 border-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/20"
                        title={t('suppliers.action_titles.view_payments')}
                    >
                        <CreditCard className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditSupplier(row)}
                        className="h-8 w-8 p-0 border-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
                        title={t('suppliers.action_titles.edit_supplier')}
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSupplier(row)}
                        className="h-8 w-8 p-0 border-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                        title={t('suppliers.action_titles.delete_supplier')}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('navigation.suppliers')} />
            <div className="flex flex-1 flex-col gap-6 rounded-xl p-6">
                <PageHeader
                    title={t('suppliers.title')}
                    description={t('suppliers.description')}
                >
                    <Button variant="outline" size="sm" onClick={handleRefresh} className="!border-cyan-300 !bg-cyan-50 !text-cyan-700 hover:!border-cyan-500 hover:!bg-cyan-100 dark:!border-cyan-600 dark:!bg-cyan-900/20 dark:!text-cyan-300 dark:hover:!border-cyan-500 dark:hover:!bg-cyan-900/30">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        {t('suppliers.refresh')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExport} className="!border-amber-300 !bg-amber-50 !text-amber-700 hover:!border-amber-500 hover:!bg-amber-100 dark:!border-amber-600 dark:!bg-amber-900/20 dark:!text-amber-300 dark:hover:!border-amber-500 dark:hover:!bg-amber-900/30">
                        <Download className="mr-2 h-4 w-4" />
                        {t('suppliers.export')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleImport} className="!border-pink-300 !bg-pink-50 !text-pink-700 hover:!border-pink-500 hover:!bg-pink-100 dark:!border-pink-600 dark:!bg-pink-900/20 dark:!text-pink-300 dark:hover:!border-pink-500 dark:hover:!bg-pink-900/30">
                        <Upload className="mr-2 h-4 w-4" />
                        {t('suppliers.import')}
                    </Button>
                    <Button size="sm" onClick={handleAddSupplier} className="!border-emerald-300 !bg-emerald-50 !text-emerald-700 hover:!border-emerald-500 hover:!bg-emerald-100 dark:!border-emerald-600 dark:!bg-emerald-900/20 dark:!text-emerald-300 dark:hover:!border-emerald-500 dark:hover:!bg-emerald-900/30">
                        <Plus className="mr-2 h-4 w-4" />
                        {t('suppliers.add_supplier')}
                    </Button>
                </PageHeader>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title={t('suppliers.suppliers')}
                        value={suppliers.length.toString()}
                        description={t('suppliers.total_suppliers')}
                        icon={Building2}
                        color="blue"
                        badge={{
                            text: t('suppliers.total_count'),
                            variant: 'secondary',
                            color: 'blue',
                        }}
                    />
                    <StatCard
                        title={t('suppliers.total_amount')}
                        value={formatCurrency(
                            suppliers.reduce(
                                (sum, s) => sum + (Number(s.total_amount) || 0),
                                0,
                            ),
                        )}
                        description={t('suppliers.total_amount_desc')}
                        icon={CreditCard}
                        color="red"
                        badge={{
                            text: t('suppliers.outstanding'),
                            variant: 'destructive',
                            color: 'red',
                        }}
                    />
                    <StatCard
                        title={t('suppliers.total_paid')}
                        value={formatCurrency(
                            suppliers.reduce(
                                (sum, s) => sum + (Number(s.total_paid) || 0),
                                0,
                            ),
                        )}
                        description={t('suppliers.total_paid_desc')}
                        icon={CheckCircle}
                        color="green"
                        badge={{
                            text: t('suppliers.paid_amount'),
                            variant: 'default',
                            color: 'green',
                        }}
                    />
                    <StatCard
                        title={t('suppliers.remain_amount')}
                        value={formatCurrency(
                            suppliers.reduce(
                                (sum, s) =>
                                    sum + (Number(s.remain_amount) || 0),
                                0,
                            ),
                        )}
                        description={t('suppliers.remain_amount_desc')}
                        icon={AlertTriangle}
                        color="orange"
                        badge={{
                            text: t('suppliers.remaining'),
                            variant: 'secondary',
                            color: 'orange',
                        }}
                    />
                </div>

                {/* Filter Component */}
                <SupplierFilter
                    filters={filters}
                    onFiltersChange={setFilters}
                    className="bg-background"
                />

                {/* Suppliers Data Table */}
                <DataTable
                    title={t('suppliers.suppliers')}
                    subtitle={`${t('suppliers.showing')} ${filteredSuppliers.length} ${t('suppliers.of')} ${suppliers.length} ${t('suppliers.suppliers')}`}
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
                    data={paginatedSuppliers}
                    columns={columns}
                    loading={loading}
                    emptyMessage={
                        Object.keys(filters).length > 0
                            ? t('suppliers.empty_states.no_suppliers_filtered')
                            : t('suppliers.empty_states.no_suppliers_found')
                    }
                    onRowClick={handleRowClick}
                    pagination={{
                        currentPage: currentPage,
                        totalPages: totalPages,
                        pageSize: pageSize,
                        totalItems: filteredSuppliers.length,
                        onPageChange: (page) => setCurrentPage(page),
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

            <SupplierModal
                isOpen={isSupplierModalOpen}
                onClose={handleCloseSupplierModal}
                onSuccess={handleSupplierSuccess}
                editSupplier={editingSupplier || undefined}
            />

            <DeleteModal
                isOpen={isDeleteModalOpen}
                title={t('suppliers.delete_modal.title')}
                description={
                    supplierToDelete
                        ? t('suppliers.delete_modal.description', { name: supplierToDelete.name })
                        : ''
                }
                confirmButtonText={t('suppliers.delete_modal.confirm')}
                cancelButtonText={t('suppliers.delete_modal.cancel')}
                onConfirm={handleDeleteConfirm}
                onClose={handleDeleteModalClose}
                warning={deleteWarning || undefined}
                isDeleteDisabled={isDeleteDisabled}
            />

            <SupplierPaymentsModal
                isOpen={isPaymentsModalOpen}
                onClose={handlePaymentsModalClose}
                supplier={selectedSupplierForPayments}
            />

            <ImportSuppliersModal
                isOpen={isImportModalOpen}
                onClose={(importedData?: unknown[]) => {
                    setIsImportModalOpen(false);
                    if (
                        importedData &&
                        Array.isArray(importedData) &&
                        importedData.length > 0
                    ) {
                        loadSuppliers();
                    }
                }}
            />
        </AppLayout>
    );
}
