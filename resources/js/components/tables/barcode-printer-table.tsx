import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable } from '@/components/ui/data-table';
import { useTranslation } from '@/hooks/use-translation';
import { Printer } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { type Column } from '@/types/table';

// Barcode printer item interface
export interface BarcodePrinterItem {
    id: number;
    name: string;
    barcode: string;
    category?: string;
    supplier?: string;
    sell_price: number;
    barcode_type?: string | null;
    created_at: string;
    updated_at: string;
}

interface BarcodePrinterTableProps {
    data: BarcodePrinterItem[];
    loading?: boolean;
    selectedItems: Set<number>;
    onSelectionChange: (selectedItems: Set<number>) => void;
    onSelectAll: (selectAll: boolean) => void;
    onPrintItem: (item: BarcodePrinterItem) => void;
    onPrintSelected: () => void;
    pagination?: {
        currentPage: number;
        totalPages: number;
        pageSize: number;
        totalItems: number;
        onPageChange: (page: number) => void;
    };
    className?: string;
}

export function BarcodePrinterTable({
    data,
    loading = false,
    selectedItems,
    onSelectionChange,
    onSelectAll,
    onPrintItem,
    onPrintSelected,
    pagination,
    className = '',
}: BarcodePrinterTableProps) {
    const { t } = useTranslation();

    const totalItems = pagination?.totalItems ?? data.length;
    const allSelected = data.length > 0 && selectedItems.size === data.length;

    const handleSelectAll = useCallback((checked: boolean) => {
        onSelectAll(checked);
    }, [onSelectAll]);

    const handleSelectItem = useCallback((itemId: number) => {
        const newSelection = new Set(selectedItems);
        if (newSelection.has(itemId)) {
            newSelection.delete(itemId);
        } else {
            newSelection.add(itemId);
        }
        onSelectionChange(newSelection);
    }, [selectedItems, onSelectionChange]);

    // Table columns definition
    const columns: Column<BarcodePrinterItem>[] = useMemo(() => [
        {
            key: 'select',
            header: (
                <div className="flex items-center">
                    <Checkbox
                        checked={allSelected}
                        onCheckedChange={handleSelectAll}
                        className="h-4 w-4"
                    />
                </div>
            ),
            accessor: 'id',
            headerClassName: 'text-center w-12',
            render: (_, row) => (
                <div className="flex justify-center">
                    <Checkbox
                        checked={selectedItems.has(row.id)}
                        onCheckedChange={() => handleSelectItem(row.id)}
                        className="h-4 w-4"
                    />
                </div>
            ),
        },
        {
            key: 'name',
            header: t('barcode_printing.table.item_name'),
            accessor: 'name',
            sortable: true,
            headerClassName: 'text-blue-700 dark:text-blue-300 text-xs',
            render: (value) => (
                <span className="text-xs font-medium">{String(value)}</span>
            ),
        },
        {
            key: 'barcode',
            header: t('barcode_printing.table.barcode'),
            accessor: 'barcode',
            headerClassName: 'text-green-700 dark:text-green-300 text-xs',
            render: (value) => (
                <span className="font-mono text-xs">
                    {String(value || '-')}
                </span>
            ),
        },
        {
            key: 'category',
            header: t('barcode_printing.table.category'),
            accessor: 'category',
            headerClassName: 'text-purple-700 dark:text-purple-300 text-xs',
            render: (value) => {
                if (!value) return '-';
                const categoryName = typeof value === 'object' && value !== null
                    ? (value as { name?: string })?.name || '-'
                    : String(value);
                return (
                    <span className="font-medium text-purple-700 dark:text-purple-300 text-xs">
                        {categoryName}
                    </span>
                );
            },
        },
        {
            key: 'supplier',
            header: t('barcode_printing.table.supplier'),
            accessor: 'supplier',
            headerClassName: 'text-red-700 dark:text-red-300 text-xs',
            render: (value) => {
                if (!value) return '-';
                const supplierName = typeof value === 'object' && value !== null
                    ? (value as { name?: string })?.name || '-'
                    : String(value);
                return (
                    <span className="text-xs">{supplierName}</span>
                );
            },
        },
        {
            key: 'sell_price',
            header: t('barcode_printing.table.sell_price'),
            accessor: 'sell_price',
            sortable: true,
            headerClassName: 'text-emerald-700 dark:text-emerald-300 text-xs',
            render: (value) => (
                <span className="text-xs font-medium">
                    {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'IQD',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                    }).format(Number(value) || 0)}
                </span>
            ),
        },
        {
            key: 'actions',
            header: t('barcode_printing.table.actions'),
            headerClassName: 'text-pink-700 dark:text-pink-300 text-xs',
            render: (_, row) => (
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onPrintItem(row)}
                        className="h-8 w-8 p-0 border-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:text-purple-300 dark:hover:bg-purple-900/20"
                    >
                        <Printer className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ], [t, allSelected, selectedItems, handleSelectAll, handleSelectItem, onPrintItem]);

    return (
        <div className={`w-full ${className}`}>
            <DataTable
                title={t('barcode_printing.table.title')}
                subtitle={
                    data.length > 0 
                        ? `${t('barcode_printing.table.showing')} ${data.length} ${t('barcode_printing.table.products')}`
                        : t('barcode_printing.table.apply_filters_to_see_products')
                }
                headerActions={
                    selectedItems.size > 0 && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onPrintSelected}
                                className="h-8 border-purple-300 bg-purple-50 px-3 text-purple-700 hover:border-purple-400 hover:bg-purple-100 dark:border-purple-700 dark:bg-purple-900/20 dark:text-purple-300 dark:hover:border-purple-600 dark:hover:bg-purple-900/30"
                            >
                                <Printer className="mr-2 h-4 w-4" />
                                {t('barcode_printing.print_selected')} ({selectedItems.size})
                            </Button>
                        </div>
                    )
                }
                data={data}
                columns={columns}
                loading={loading}
                emptyMessage={t('barcode_printing.table.use_filters_to_search')}
                sorting={{
                    sortBy: 'name',
                    sortOrder: 'asc',
                    onSort: () => {},
                }}
                pagination={pagination ? {
                    currentPage: pagination.currentPage,
                    totalPages: pagination.totalPages,
                    pageSize: pagination.pageSize,
                    totalItems: pagination.totalItems,
                    onPageChange: pagination.onPageChange,
                } : undefined}
                virtualScrolling={totalItems > 1000}
                rowHeight={60}
                className="bg-background"
            />
        </div>
    );
}
