import {
    BarcodePrinterFilter,
    type BarcodePrinterFilterOptions,
} from '@/components/filters/barcode-printer-filter';
import {
    BarcodePrinterTable,
    type BarcodePrinterItem,
} from '@/components/tables/barcode-printer-table';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { PrintConfigurationModal } from '@/components/modals/print-configuration-modal';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useRemember } from '@inertiajs/react';
import { RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { categoryService, type Category } from '@/services/business/categoryService';
import { supplierService, type Supplier } from '@/services/business/supplierService';
import { barcodePrintService } from '@/services/business/barcodePrintService';
import { barcodeLabelService } from '@/services/utils/barcodeLabelService';

interface PrintConfiguration {
    quantityPerProduct?: number;
    includeProductName: boolean;
    includePrice: boolean;
    labelSize?: string;
}

export default function PrintBarcode() {
    const { t } = useTranslation();
    const [refreshing, setRefreshing] = useState(false);
    const [filters, setFilters] = useRemember<BarcodePrinterFilterOptions>({}, 'barcode-printer:filters');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
    
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize] = useState(10);
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

    const [categories, setCategories] = useRemember<Category[]>([], 'barcode-printer:categories');
    const [suppliers, setSuppliers] = useRemember<Supplier[]>([], 'barcode-printer:suppliers');
    const [products, setProducts] = useState<BarcodePrinterItem[]>([]);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [productsToPrint, setProductsToPrint] = useState<BarcodePrinterItem[]>([]);
    const [isPrinting, setIsPrinting] = useState(false);
    const [printError, setPrintError] = useState<string | null>(null);
    const isInitialRender = useRef(true);
    const manualPageChange = useRef(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('navigation.admin') },
        {
            title: t('navigation.barcode_printing'),
            href: '/admin/print-barcode',
        },
    ];

    const loadCategories = useCallback(async () => {
        try {
            const response = await categoryService.getCategories();
            if (response.success && response.data) {
                setCategories(response.data);
            }
        } catch {
            // Error handled silently
        }
    }, [setCategories]);

    const loadSuppliers = useCallback(async () => {
        try {
            const response = await supplierService.getSuppliers();
            if (response.success && response.data) {
                setSuppliers(response.data);
            }
        } catch {
            // Error handled silently
        }
    }, [setSuppliers]);

    const loadProducts = useCallback(async (page: number) => {
        setLoading(true);
        setError(null);
        try {
            const response = await barcodePrintService.getProducts(
                {
                    name: filters.name,
                    barcode: filters.barcode,
                    category: filters.category,
                    supplier: filters.supplier,
                },
                page,
                pageSize
            );
            
            if (response.success && response.data) {
                const items = Array.isArray(response.data) ? response.data : [];
                
                setProducts(items.map((item) => ({
                    id: item.id,
                    name: item.name,
                    barcode: item.barcode,
                    category: item.category,
                    supplier: item.supplier,
                    sell_price: item.sell_price,
                    barcode_type: item.barcode_type ?? null,
                    created_at: item.created_at,
                    updated_at: item.updated_at,
                })));
                
                if (response.pagination) {
                    setPaginationMeta({
                        current_page: response.pagination.current_page || page,
                        last_page: response.pagination.last_page || 1,
                        per_page: response.pagination.per_page || pageSize,
                        total: response.pagination.total || 0,
                        from: response.pagination.from || 0,
                        to: response.pagination.to || 0,
                    });
                } else {
                    setPaginationMeta({
                        current_page: page,
                        last_page: 1,
                        per_page: pageSize,
                        total: items.length,
                        from: items.length > 0 ? 1 : 0,
                        to: items.length,
                    });
                }
            } else {
                setProducts([]);
                setPaginationMeta({
                    current_page: 1,
                    last_page: 1,
                    per_page: pageSize,
                    total: 0,
                    from: 0,
                    to: 0,
                });
                setError(response.message || t('barcode_printing.error_messages.failed_to_load'));
            }
        } catch {
            setProducts([]);
            setPaginationMeta({
                current_page: 1,
                last_page: 1,
                per_page: pageSize,
                total: 0,
                from: 0,
                to: 0,
            });
            setError(t('barcode_printing.error_messages.failed_to_load'));
        } finally {
            setLoading(false);
        }
    }, [filters, pageSize, t]);

    useEffect(() => {
        if (categories.length === 0) {
            void loadCategories();
        }
        if (suppliers.length === 0) {
            void loadSuppliers();
        }
    }, [categories.length, suppliers.length, loadCategories, loadSuppliers]);

    const hasActiveFilters = useMemo(() => {
        return Object.values(filters).some((value) =>
            typeof value === 'string' && value.trim().length > 0,
        );
    }, [filters]);

    useEffect(() => {
        if (isInitialRender.current) {
            isInitialRender.current = false;
            void loadProducts(1);
            return;
        }

        const timer = window.setTimeout(() => {
            setCurrentPage((prev) => (prev === 1 ? prev : 1));
            void loadProducts(1);
        }, hasActiveFilters ? 400 : 200);

        return () => {
            window.clearTimeout(timer);
        };
    }, [filters, hasActiveFilters, loadProducts]);

    useEffect(() => {
        if (!manualPageChange.current) {
            return;
        }

        manualPageChange.current = false;
        void loadProducts(currentPage);
    }, [currentPage, loadProducts]);

    const handlePageChange = useCallback(
        (page: number) => {
            manualPageChange.current = true;
            setCurrentPage(page);
        },
        [],
    );

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadProducts(currentPage);
        setRefreshing(false);
    }, [currentPage, loadProducts]);

    const handleFiltersChange = (newFilters: BarcodePrinterFilterOptions) => {
        setFilters(newFilters);
    };

    const handleSelectionChange = (newSelectedItems: Set<number>) => {
        setSelectedItems(newSelectedItems);
    };

    const handleSelectAll = (selectAll: boolean) => {
        if (selectAll) {
            const allIds = new Set(products.map(product => product.id));
            setSelectedItems(allIds);
        } else {
            setSelectedItems(new Set());
        }
    };

    const convertToModalProduct = (item: BarcodePrinterItem) => ({
        id: item.id,
        name: item.name,
        barcode: item.barcode,
        sell_price: item.sell_price,
        barcode_type: item.barcode_type ?? null,
    });

    const handlePrintItem = (item: BarcodePrinterItem) => {
        setPrintError(null);
        setProductsToPrint([item]);
        setIsPrintModalOpen(true);
    };

    const handlePrintSelected = () => {
        const selectedProducts = products.filter(product => 
            selectedItems.has(product.id)
        );
        if (selectedProducts.length > 0) {
            setPrintError(null);
            setProductsToPrint(selectedProducts);
            setIsPrintModalOpen(true);
        }
    };

    const handlePrintConfirm = useCallback(async (config: PrintConfiguration) => {
        setPrintError(null);
        setIsPrinting(true);
        try {
            const products = productsToPrint.map((item) => ({
                id: item.id,
                name: item.name,
                barcode: item.barcode,
                sell_price: item.sell_price,
                barcode_type: item.barcode_type ?? null,
            }));

            await barcodeLabelService.print(products, {
                quantity: Math.max(1, Number(config.quantityPerProduct) || 1),
                includeProductName: Boolean(config.includeProductName),
                includePrice: Boolean(config.includePrice),
                labelSize: config.labelSize || '50x30',
            });

            setSelectedItems(new Set());
            setIsPrintModalOpen(false);
            setProductsToPrint([]);
        } catch (err) {
            const fallback = t('barcode_printing.error_messages.print_failed');
            const message = err instanceof Error && err.message ? err.message : fallback;
            setPrintError(message);
        } finally {
            setIsPrinting(false);
        }
    }, [productsToPrint, t]);

    const handleClosePrintModal = () => {
        setPrintError(null);
        setIsPrintModalOpen(false);
        setProductsToPrint([]);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('navigation.barcode_printing')} />
            <div className="flex flex-1 flex-col gap-6 rounded-xl p-6">
                <PageHeader
                    title={t('barcode_printing.title')}
                    description={t('barcode_printing.description')}
                >
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="!border-purple-300 !bg-purple-50 !text-purple-700 hover:!border-purple-500 hover:!bg-purple-100 dark:!border-purple-600 dark:!bg-purple-900/20 dark:!text-purple-300 dark:hover:!border-purple-500 dark:hover:!bg-purple-900/30"
                    >
                        <RefreshCw
                            className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
                        />
                        {refreshing ? t('barcode_printing.refreshing') : t('barcode_printing.refresh')}
                    </Button>
                </PageHeader>

                <BarcodePrinterFilter
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                    categories={categories}
                    suppliers={suppliers}
                />

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

                <BarcodePrinterTable
                    data={products}
                    loading={loading}
                    selectedItems={selectedItems}
                    onSelectionChange={handleSelectionChange}
                    onSelectAll={handleSelectAll}
                    onPrintItem={handlePrintItem}
                    onPrintSelected={handlePrintSelected}
                    pagination={{
                        currentPage: paginationMeta.current_page,
                        totalPages: paginationMeta.last_page,
                        pageSize: paginationMeta.per_page,
                        totalItems: paginationMeta.total,
                        onPageChange: handlePageChange,
                    }}
                />

                <PrintConfigurationModal
                    isOpen={isPrintModalOpen}
                    onClose={handleClosePrintModal}
                    products={productsToPrint.map(convertToModalProduct)}
                    onConfirm={handlePrintConfirm}
                    loading={isPrinting}
                    errorMessage={printError}
                    onClearError={() => setPrintError(null)}
                />
            </div>
        </AppLayout>
    );
}
