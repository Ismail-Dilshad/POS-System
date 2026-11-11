import { ItemThumbnail } from '@/components/layout/item-thumbnail';
import { AddCardModal } from '@/components/modals/add-card-modal';
import { AdjustModal } from '@/components/modals/adjust-modal';
import { CategoryModal } from '@/components/modals/category-modal';
import { InventoryCardsModal } from '@/components/modals/inventory-cards-modal';
import {
    FilterComponent,
    type FilterOptions,
} from '@/components/filters/filter-component';
import { ImportProductsModal } from '@/components/modals/import-products-modal';
import { PageHeader } from '@/components/layout/page-header';
import { ProductDetailsModal } from '@/components/modals/product-details-modal';
import { ProductModal } from '@/components/modals/product-modal';
import { ScaleProductModal } from '@/components/modals/scale-product-modal';
import { StatCard } from '@/components/charts/stats-cards';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { DeleteModal } from '@/components/ui/delete-modal';
import { useToast } from '@/components/ui/toast';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/lib/currency';
import admin from '@/routes/admin';
import { type Card } from '@/services/business/cardService';
import { categoryService, type Category } from '@/services/business/categoryService';
import inventoryService, {
    type InventoryItem,
} from '@/services/business/inventoryService';
import { productService, type Product } from '@/services/business/productService';
import { posVisibilitySyncService } from '@/services/utils/posVisibilitySyncService';
import {
    scaleProductService,
    type ScaleProduct,
} from '@/services/business/scaleProductService';
import { supplierService, type Supplier } from '@/services/business/supplierService';
import { type BreadcrumbItem } from '@/types';
import { type Column } from '@/types/table';
import { Head, useRemember } from '@inertiajs/react';
import {
    AlertTriangle,
    BarChart3,
    CheckCircle,
    Clock,
    DollarSign,
    Download,
    Edit,
    Eye,
    FileSpreadsheet,
    FolderOpen,
    FolderPlus,
    Package,
    Plus,
    RefreshCw,
    Scale,
    Settings,
    ShoppingCart,
    Trash2,
    Upload,
    Weight,
    X,
    XCircle,
} from 'lucide-react';
import {
    useCallback,
    useEffect,
    useMemo,
    useReducer,
    useRef,
    useState,
} from 'react';


// Local NameCard interface to match AddCardModal
interface NameCard {
    id: number;
    name: string;
    image_path?: string;
    image_url?: string;
    has_image?: boolean;
    created_at: string;
}

// Modal state management
type ModalType =
    | 'category'
    | 'product'
    | 'scaleProduct'
    | 'card'
    | 'adjust'
    | 'import'
    | 'delete'
    | 'productDetails'
    | 'cards'
    | null;
type ModalMode = 'create' | 'edit' | null;

interface ModalState {
    type: ModalType;
    mode: ModalMode;
    isOpen: boolean;
    data?: Record<string, unknown>;
}

type ModalAction =
    | {
          type: 'OPEN_CREATE';
          modalType:
              | 'category'
              | 'product'
              | 'scaleProduct'
              | 'card'
              | 'adjust'
              | 'import';
      }
    | {
          type: 'OPEN_EDIT';
          modalType: 'product' | 'scaleProduct' | 'card';
          data: Record<string, unknown>;
      }
    | { type: 'OPEN_DELETE'; data: InventoryItem }
    | { type: 'OPEN_PRODUCT_DETAILS'; data: InventoryItem }
    | { type: 'CLOSE' };

const modalReducer = (state: ModalState, action: ModalAction): ModalState => {
    switch (action.type) {
        case 'OPEN_CREATE':
            return {
                type: action.modalType,
                mode: 'create',
                isOpen: true,
                data: undefined,
            };
        case 'OPEN_EDIT':
            return {
                type: action.modalType,
                mode: 'edit',
                isOpen: true,
                data: action.data,
            };
        case 'OPEN_DELETE':
            return {
                type: 'delete',
                mode: null,
                isOpen: true,
                data: action.data,
            };
        case 'OPEN_PRODUCT_DETAILS':
            return {
                type: 'productDetails',
                mode: null,
                isOpen: true,
                data: action.data,
            };
        case 'CLOSE':
            return {
                type: null,
                mode: null,
                isOpen: false,
                data: undefined,
            };
        default:
            return state;
    }
};

export default function Inventory() {
    const { t } = useTranslation();
    const { toast } = useToast();

    // Unified modal state management
    const [modalState, dispatchModal] = useReducer(modalReducer, {
        type: null,
        mode: null,
        isOpen: false,
        data: undefined,
    });
    const [cardsModalOpen, setCardsModalOpen] = useState(false);
    const [togglingItems, setTogglingItems] = useState<Set<number>>(new Set());

    // Edit data states
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const refreshPending = useRef(false);
    const [categories, setCategories] = useRemember<Category[]>([], 'inventory:categories');
    const [suppliers, setSuppliers] = useRemember<Supplier[]>([], 'inventory:suppliers');
    const [error, setError] = useState<string | null>(null);

    // Filter state
    const [filters, setFilters] = useRemember<FilterOptions>({}, 'inventory:filters');
    

    // Sorting state
    const [sorting, setSorting] = useRemember<{
        sortBy: string;
        sortOrder: 'asc' | 'desc';
    }>(
        {
            sortBy: 'name',
            sortOrder: 'asc',
        },
        'inventory:sorting'
    );

    const [allItems, setAllItems] = useState<InventoryItem[]>([]);
    const [totalItems, setTotalItems] = useState<number>(0);
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
        per_page: 10, // 10 items per page
        total: 0,
        from: 0,
        to: 0,
    });
    const [comprehensiveStats, setComprehensiveStats] = useRemember<Record<
        string,
        unknown
    > | null>(null, 'inventory:stats');

    // Backend pagination state
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize] = useState(10); // 10 items per page (standard for inventory systems)
    
    const filterDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inventoryRequest = useRef<AbortController | null>(null);
    const loadInventoryItems = useCallback(
        async (forceRefresh: boolean = false) => {
            inventoryRequest.current?.abort();
            const controller = new AbortController();
            inventoryRequest.current = controller;
        setLoading(true);
            setError(null);
            try {
                // Build search query from name/barcode filters
                const searchQuery = filters.barcode?.trim() || filters.name?.trim() || '';
                
                // Send ALL filters to backend for database-level filtering
                const response = await inventoryService.getInventoryItems(
                    {
                        search: searchQuery,
                        status: filters.status,
                        category: filters.category,
                        supplier: filters.supplier,
                        productType: filters.productType,
                        priceMin: filters.priceMin,
                        priceMax: filters.priceMax,
                        stockMin: filters.stockMin,
                        stockMax: filters.stockMax,
                        dateFrom: filters.dateFrom,
                        dateTo: filters.dateTo,
                        notSoldPeriod: filters.notSoldPeriod,
                        profitMarginMin: filters.profitMarginMin,
                        profitMarginMax: filters.profitMarginMax,
                    },
                    currentPage,
                    pageSize, false, false, controller.signal, forceRefresh
                );
                
            if (controller.signal.aborted) return;
            if (response.success && response.data) {
                    // Backend returns: { success: true, data: [...], pagination: {...} }
                    const items = Array.isArray(response.data) ? response.data : [];
                    
                    setAllItems(items);
                    
                    // Extract pagination metadata from response
                    if ('pagination' in response && response.pagination) {
                        const pagination = response.pagination as typeof paginationMeta;
                        setPaginationMeta(pagination);
                        setTotalItems(pagination.total);
                    } else {
                        // Fallback: calculate from items (shouldn't happen with new backend)
                        setTotalItems(items.length);
                        setPaginationMeta({
                            current_page: currentPage,
                            last_page: Math.ceil(items.length / pageSize),
                            per_page: pageSize,
                            total: items.length,
                            from: items.length > 0 ? (currentPage - 1) * pageSize + 1 : 0,
                            to: items.length > 0 ? Math.min(currentPage * pageSize, items.length) : 0,
                        });
                    }
                } else {
                    setError(response.message || 'Failed to load inventory items');
                    setAllItems([]);
                }
            } catch {
                if (controller.signal.aborted) return;
                setError('Failed to load inventory items');
                setAllItems([]);
        } finally {
            if (!controller.signal.aborted) setLoading(false);
        }
        },
        [currentPage, pageSize, filters],
    );

    // Load categories from API
    const loadCategories = useCallback(async () => {
        try {
            const response = await categoryService.getCategories();
            if (response.success && response.data) {
                setCategories(response.data);
            }
        } catch {
            // Error handling for categories loading
        }
    }, [setCategories]);

    // Load suppliers from API
    const loadSuppliers = useCallback(async () => {
        try {
            const response = await supplierService.getSuppliers();
            if (response.success && response.data) {
                setSuppliers(response.data);
            }
        } catch {
            // Error handling for suppliers loading
        }
    }, [setSuppliers]);

    // Load comprehensive statistics for ALL products (not just loaded ones)
    const loadComprehensiveStatistics = useCallback(async (forceRefresh: boolean = false) => {
        try {
            // Get statistics for all products using the comprehensive API
            const response =
                await inventoryService.getComprehensiveStatistics(forceRefresh);
            if (response.success && response.data) {

                // Store comprehensive statistics for StatCards
                // These will be used to show accurate counts for ALL products
                setComprehensiveStats(response.data);
            }
        } catch {
            // Clean up on error
            setComprehensiveStats(null);
        }
    }, [setComprehensiveStats]);

    // Smart product update function
    const updateProductInList = useCallback(
        (productId: number, updatedProduct: Product | ScaleProduct | Card) => {
            setAllItems((prevItems) => {
                const updatedItems = [...prevItems];
                const index = updatedItems.findIndex(
                    (item) => item.id === productId,
                );

                if (index !== -1) {
                    // Update existing product - only update the original_data and relevant fields
                    const existingItem = updatedItems[index];
                    updatedItems[index] = {
                        ...existingItem,
                        image_url: 'image_url' in updatedProduct ? (typeof updatedProduct.image_url === 'string' ? updatedProduct.image_url : null) : existingItem.image_url,
                        name:
                            'name' in updatedProduct
                                ? String(updatedProduct.name)
                                : existingItem.name,
                        cost_price:
                            Number(updatedProduct.cost_price) ||
                            existingItem.cost_price,
                        sell_price:
                            Number(updatedProduct.sell_price) ||
                            existingItem.sell_price,
                        stock:
                            'stock' in updatedProduct
                                ? Number(updatedProduct.stock)
                                : existingItem.stock,
                        min_stock:
                            'min_stock' in updatedProduct
                                ? Number(updatedProduct.min_stock)
                                : existingItem.min_stock,
                        per_carton:
                            'per_carton' in updatedProduct
                                ? Number(updatedProduct.per_carton)
                                : existingItem.per_carton,
                        carton_info:
                            'carton_info' in updatedProduct
                                ? String(updatedProduct.carton_info)
                                : existingItem.carton_info,
                        status:
                            'status' in updatedProduct
                                ? (updatedProduct.status as
                                      | 'active'
                                      | 'inactive'
                                      | 'low_stock'
                                      | 'out_of_stock')
                                : existingItem.status,
                        updated_at: new Date().toISOString(),
                        original_data: updatedProduct as unknown as
                            | Product
                            | ScaleProduct
                            | Card,
                        // Recalculate profit
                        profit_amount:
                            (updatedProduct.sell_price ||
                                existingItem.sell_price) -
                            (updatedProduct.cost_price ||
                                existingItem.cost_price),
                        profit_margin:
                            updatedProduct.cost_price &&
                            updatedProduct.cost_price > 0
                                ? ((updatedProduct.sell_price -
                                      updatedProduct.cost_price) /
                                      updatedProduct.cost_price) *
                                  100
                                : existingItem.profit_margin,
                    };
                }

                return updatedItems;
            });
        },
        [setAllItems],
    );

    // Smart product add function
    const addProductToList = useCallback(
        (newProduct: Product | ScaleProduct | Card) => {
            setAllItems((prevItems) => {
                // Convert Product/ScaleProduct/Card to InventoryItem
                const newInventoryItem: InventoryItem = {
                    id: newProduct.id,
                    image_url: typeof newProduct.image_url === 'string' ? newProduct.image_url : null,
                    name:
                        'name' in newProduct
                            ? String(newProduct.name)
                            : 'Card Product',
                    product_type: ('product_type' in newProduct
                        ? newProduct.product_type
                        : 'plu' in newProduct
                          ? 'scale_product'
                          : 'barcode' in newProduct
                            ? 'product'
                            : 'card') as 'product' | 'scale_product' | 'card',
                    identifier: String(
                        'barcode' in newProduct
                            ? newProduct.barcode
                            : 'plu' in newProduct
                              ? newProduct.plu
                              : newProduct.id.toString(),
                    ),
                    identifier_type: String(
                        'barcode' in newProduct
                            ? 'barcode'
                            : 'plu' in newProduct
                              ? 'plu'
                              : 'card',
                    ),
                    secondary_barcode:
                        'secondary_barcode' in newProduct
                            ? String(newProduct.secondary_barcode)
                            : undefined,
                    category:
                        'category' in newProduct && newProduct.category
                            ? typeof newProduct.category === 'string'
                                ? newProduct.category
                                : (newProduct.category as { name?: string })
                                      ?.name
                            : undefined,
                    supplier:
                        'supplier' in newProduct && newProduct.supplier
                            ? typeof newProduct.supplier === 'string'
                                ? newProduct.supplier
                                : (newProduct.supplier as { name?: string })
                                      ?.name
                            : undefined,
                    cost_price: Number(newProduct.cost_price) || 0,
                    sell_price: Number(newProduct.sell_price) || 0,
                    stock:
                        'stock' in newProduct
                            ? Number(newProduct.stock)
                            : undefined,
                    min_stock:
                        'min_stock' in newProduct
                            ? Number(newProduct.min_stock)
                            : undefined,
                    status:
                        'status' in newProduct
                            ? (newProduct.status as
                                  | 'active'
                                  | 'inactive'
                                  | 'low_stock'
                                  | 'out_of_stock')
                            : 'active',
                    profit_margin:
                        newProduct.cost_price && newProduct.cost_price > 0
                            ? ((newProduct.sell_price - newProduct.cost_price) /
                                  newProduct.cost_price) *
                              100
                            : 0,
                    profit_amount:
                        (newProduct.sell_price || 0) -
                        (newProduct.cost_price || 0),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    original_data: newProduct as unknown as
                        | Product
                        | ScaleProduct
                        | Card,
                };

                // Add new product to the beginning of the list
                const updatedItems = [newInventoryItem, ...prevItems];
                return updatedItems;
            });
        },
        [setAllItems],
    );

    // Simple loading without polling

    // This prevents excessive API calls when user is typing or changing filters quickly
    // Debounced effect for filter changes (300ms delay)
    useEffect(() => {
        if (filterDebounceTimer.current) {
            clearTimeout(filterDebounceTimer.current);
        }

        filterDebounceTimer.current = setTimeout(() => {
        loadInventoryItems();
        }, 300);

        return () => {
            inventoryRequest.current?.abort();
            if (filterDebounceTimer.current) {
                clearTimeout(filterDebounceTimer.current);
            }
        };
    }, [loadInventoryItems]);


    // Load categories and suppliers once on mount
    useEffect(() => {
        if (categories.length === 0) {
            loadCategories();
        }

        if (suppliers.length === 0) {
            loadSuppliers();
        }

        if (!comprehensiveStats) {
            loadComprehensiveStatistics();
        }
    }, [
        categories.length,
        suppliers.length,
        comprehensiveStats,
        loadCategories,
        loadSuppliers,
        loadComprehensiveStatistics,
    ]);

    // Reset to page 1 when filters change (but not when currentPage changes)
    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);


    // Handler functions for new buttons
    const handleAdjust = useCallback(() => {
        dispatchModal({ type: 'OPEN_CREATE', modalType: 'adjust' });
    }, []);

    const handleRefresh = useCallback(async () => {
        if (refreshPending.current) return;
        refreshPending.current = true;
        setRefreshing(true);
        try {
            await Promise.all([
                loadInventoryItems(true),
                loadComprehensiveStatistics(true),
                loadCategories(),
                loadSuppliers(),
            ]);
        } finally {
            refreshPending.current = false;
            setRefreshing(false);
        }
    }, [loadInventoryItems, loadComprehensiveStatistics, loadCategories, loadSuppliers]);


    // const handleClearFilters = useCallback(() => {
    //     setFilters({});
    // }, []);

    const handleSort = useCallback(
        (columnKey: string) => {
            setSorting((prevSorting) => {
                // If clicking the same column, toggle sort order
                if (prevSorting.sortBy === columnKey) {
                    return {
                        sortBy: columnKey,
                        sortOrder:
                            prevSorting.sortOrder === 'asc' ? 'desc' : 'asc',
                    };
                }
                // If clicking a different column, set it as ascending
                return {
                    sortBy: columnKey,
                    sortOrder: 'asc',
                };
            });
        },
        [setSorting],
    );

    // OPTIMIZATION: All filtering is done at database level by backend
    // Frontend only handles sorting for the current page items
    const sortedInventoryItems = useMemo(() => {
        return [...allItems].sort((a, b) => {
                // Primary sort: product type priority (normal -> scale_product -> card)
                const typeRank = (t: string | undefined) => {
                    if (t === 'product') return 0;
                    if (t === 'scale_product') return 1;
                    if (t === 'card') return 2;
                    return 3;
                };

                const aRank = typeRank(a.product_type as unknown as string);
                const bRank = typeRank(b.product_type as unknown as string);
                if (aRank !== bRank) return aRank - bRank;

                const { sortBy, sortOrder } = sorting;
                let aValue: unknown = a[sortBy as keyof InventoryItem];
                let bValue: unknown = b[sortBy as keyof InventoryItem];

                // Handle nested properties and different data types for sorting
                if (sortBy === 'category') {
                aValue = typeof a.category === 'object' && a.category !== null
                    ? (a.category as { name?: string })?.name || ''
                    : String(a.category || '');
                bValue = typeof b.category === 'object' && b.category !== null
                    ? (b.category as { name?: string })?.name || ''
                    : String(b.category || '');
                } else if (sortBy === 'supplier') {
                aValue = typeof a.supplier === 'object' && a.supplier !== null
                    ? (a.supplier as { name?: string })?.name || ''
                    : String(a.supplier || '');
                bValue = typeof b.supplier === 'object' && b.supplier !== null
                    ? (b.supplier as { name?: string })?.name || ''
                    : String(b.supplier || '');
                } else if (
                    sortBy === 'cost_price' ||
                    sortBy === 'sell_price' ||
                    sortBy === 'profit_margin'
                ) {
                aValue = parseFloat(String(aValue || '0'));
                bValue = parseFloat(String(bValue || '0'));
                } else if (sortBy === 'stock' || sortBy === 'min_stock') {
                aValue = parseFloat(String(aValue || '0'));
                bValue = parseFloat(String(bValue || '0'));
                } else if (sortBy === 'created_at' || sortBy === 'updated_at') {
                    aValue = new Date(String(aValue || '')).getTime();
                    bValue = new Date(String(bValue || '')).getTime();
                } else {
                    // String comparison
                    aValue = String(aValue || '').toLowerCase();
                    bValue = String(bValue || '').toLowerCase();
                }

                // Compare values with proper type checking
                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    const comparison = aValue.localeCompare(bValue);
                    return sortOrder === 'asc' ? comparison : -comparison;
                }

                if (typeof aValue === 'number' && typeof bValue === 'number') {
                    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
                    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
                    return 0;
                }

                // Fallback to string comparison
                const aStr = String(aValue || '');
                const bStr = String(bValue || '');
                const comparison = aStr.localeCompare(bStr);
                return sortOrder === 'asc' ? comparison : -comparison;
            });
    }, [allItems, sorting]);

    const calculateExportSummary = useCallback((items: InventoryItem[]) => {
        const totalItems = items.length;
            
            // Calculate total value properly: sell_price * stock
        const totalValue = items.reduce((sum, item) => {
                const stock = Number(item.stock) || 0;
                const sellPrice = Number(item.sell_price) || 0;
                return sum + (sellPrice * stock);
            }, 0);
            
            // Calculate total cost: cost_price * stock
        const totalCost = items.reduce((sum, item) => {
                const stock = Number(item.stock) || 0;
                const costPrice = Number(item.cost_price) || 0;
                return sum + (costPrice * stock);
            }, 0);
            
            // Calculate potential profit
            const potentialProfit = totalValue - totalCost;
            
            // Count items by status
        const statusCounts = items.reduce((counts, item) => {
            const status = item.status || 'active';
                counts[status] = (counts[status] || 0) + 1;
                return counts;
            }, {} as Record<string, number>);
            
            const lowStockItems = statusCounts.low_stock || 0;
            const outOfStockItems = statusCounts.out_of_stock || 0;
            const inStockItems = statusCounts.active || 0;
            
            // Count by product type
        const productTypeCounts = items.reduce((counts, item) => {
                counts[item.product_type] = (counts[item.product_type] || 0) + 1;
                return counts;
            }, {} as Record<string, number>);
            
            const regularProducts = productTypeCounts.product || 0;
            const scaleProducts = productTypeCounts.scale_product || 0;
            const cardProducts = productTypeCounts.card || 0;

        return {
            totalItems,
            totalValue,
            totalCost,
            potentialProfit,
            inStockItems,
            lowStockItems,
            outOfStockItems,
            regularProducts,
            scaleProducts,
            cardProducts,
        };
    }, []);

    // Unified export handler for both CSV and Excel
    const handleExport = useCallback(async (format: 'xlsx' | 'csv') => {
        try {
            setLoading(true);

            // Build search query from name/barcode filters
            const searchQuery = filters.barcode?.trim() || filters.name?.trim() || '';

            // Fetch all filtered items without pagination
            const response = await inventoryService.getInventoryItems(
                {
                    search: searchQuery,
                    status: filters.status,
                    category: filters.category,
                    supplier: filters.supplier,
                    productType: filters.productType,
                    priceMin: filters.priceMin,
                    priceMax: filters.priceMax,
                    stockMin: filters.stockMin,
                    stockMax: filters.stockMax,
                    dateFrom: filters.dateFrom,
                    dateTo: filters.dateTo,
                    notSoldPeriod: filters.notSoldPeriod,
                    profitMarginMin: filters.profitMarginMin,
                    profitMarginMax: filters.profitMarginMax,
                },
                1,
                10,
                true // export mode - fetch all items
            );

            if (!response.success || !response.data) {
                toast({
                    title: t('inventory.export.error'),
                    description: response.message || t('inventory.export.error_description'),
                    type: 'error',
                });
                return;
            }

            const items = Array.isArray(response.data) ? response.data : [];

            if (items.length === 0) {
                toast({
                    title: t('inventory.export.no_data'),
                    description: t('inventory.export.no_data_description'),
                    type: 'warning',
                });
                return;
            }

            const { exportData } = await import('@/services/utils/excelService');

            // Calculate summary (excluding cards for totals)
            const summary = calculateExportSummary(items);
            const itemsExcludingCards = items.filter((i) => i.product_type !== 'card');
            const totalValueExcl = itemsExcludingCards.reduce((s, i) => s + (Number(i.stock) || 0) * (Number(i.sell_price) || 0), 0);
            const totalCostExcl = itemsExcludingCards.reduce((s, i) => s + (Number(i.stock) || 0) * (Number(i.cost_price) || 0), 0);
            const potentialProfitExcl = totalValueExcl - totalCostExcl;

            // Build summary rows
            const summaryRows: (string | number)[][] = [
                ['INVENTORY EXPORT SUMMARY (totals exclude cards)'],
                ['Export Date', new Date().toLocaleString()],
                ['Total Items (excl. cards)', itemsExcludingCards.length],
                ['Total Value (Sell Price)', formatCurrency(totalValueExcl)],
                ['Total Cost', formatCurrency(totalCostExcl)],
                ['Potential Profit', formatCurrency(potentialProfitExcl)],
                ['Profit Margin %', totalValueExcl > 0 ? ((potentialProfitExcl / totalValueExcl) * 100).toFixed(2) + '%' : '0%'],
                [],
                ['STOCK STATUS BREAKDOWN'],
                ['In Stock Items', summary.inStockItems],
                ['Low Stock Items', summary.lowStockItems],
                ['Out of Stock Items', summary.outOfStockItems],
                [],
                ['PRODUCT TYPE BREAKDOWN'],
                ['Regular Products', summary.regularProducts],
                ['Scale Products', summary.scaleProducts],
                ['Card Products (excl. from totals)', summary.cardProducts],
                [],
            ];

            // Calculate totals for footer row
            const sumStock = itemsExcludingCards.reduce((s, i) => s + (Number(i.stock) || 0), 0);
            const sumMinStock = itemsExcludingCards.reduce((s, i) => s + (Number(i.min_stock) || 0), 0);
            const avgCostPrice = itemsExcludingCards.length > 0
                ? itemsExcludingCards.reduce((s, i) => s + (Number(i.cost_price) || 0), 0) / itemsExcludingCards.length
                : 0;
            const avgSellPrice = itemsExcludingCards.length > 0
                ? itemsExcludingCards.reduce((s, i) => s + (Number(i.sell_price) || 0), 0) / itemsExcludingCards.length
                : 0;
            const avgProfitMargin = totalValueExcl > 0 ? (potentialProfitExcl / totalValueExcl) * 100 : 0;

            await exportData(items, {
                sheetName: 'Inventory',
                filename: 'inventory',
                headers: [
                    t('inventory.export.name'),
                    t('inventory.export.category'),
                    t('inventory.export.supplier'),
                    t('inventory.export.barcode'),
                    t('inventory.export.secondary_barcode'),
                    t('inventory.export.product_type'),
                    t('inventory.export.cost_price'),
                    t('inventory.export.sell_price'),
                    t('inventory.export.stock'),
                    t('inventory.export.min_stock'),
                    t('inventory.export.total_value'),
                    t('inventory.export.profit_margin'),
                    t('inventory.export.profit_amount'),
                    t('inventory.export.carton_info'),
                    t('inventory.export.status'),
                    t('inventory.export.last_updated'),
                ],
                rowMapper: (item) => {
                    const costPrice = Number(item.cost_price) || 0;
                    const sellPrice = Number(item.sell_price) || 0;
                    const stock = Number(item.stock) || 0;
                    const totalValue = stock * sellPrice;
                    const profitAmount = totalValue - (stock * costPrice);
                    const profitMargin = totalValue > 0 ? (profitAmount / totalValue) * 100 : 0;
                    const status = item.status || 'active';
                    const statusDisplay = status === 'active' ? 'In Stock' :
                                         status === 'low_stock' ? 'Low Stock' :
                                         status === 'out_of_stock' ? 'Out of Stock' : 'Unknown';
                    const productType = item.product_type === 'product' ? 'Product' :
                                       item.product_type === 'scale_product' ? 'Scale Product' : 'Card';

                    return [
                        item.name,
                        typeof item.category === 'object' ? item.category?.name || '' : String(item.category || ''),
                        typeof item.supplier === 'object' ? item.supplier?.name || '' : String(item.supplier || ''),
                        item.identifier || '',
                        item.secondary_barcode || '',
                        productType,
                        costPrice,
                        sellPrice,
                        stock,
                        Number(item.min_stock) || 0,
                        totalValue,
                        profitMargin,
                        profitAmount,
                        item.per_carton ? `${item.per_carton} items per carton` : '-',
                        statusDisplay,
                        new Date(item.updated_at).toLocaleString(),
                    ];
                },
                summaryRows,
                totalsRow: [
                    '', '', '', '', '',
                    `Total (excl. cards): ${itemsExcludingCards.length}`,
                    avgCostPrice, avgSellPrice, sumStock, sumMinStock,
                    totalValueExcl, avgProfitMargin, potentialProfitExcl,
                    '', '', '',
                ],
                columnWidths: [28, 18, 24, 18, 18, 18, 22, 22, 18, 18, 28, 18, 28, 22, 16, 24],
            }, format);

        } catch (error) {
            console.error('Error generating export:', error);
            toast({
                title: t('inventory.export.error'),
                description: t('inventory.export.error_description'),
                type: 'error',
            });
        } finally {
            setLoading(false);
        }
    }, [filters, t, toast, calculateExportSummary]);

    // Convenience handlers for button clicks
    const handleDownloadCSV = useCallback(() => handleExport('csv'), [handleExport]);
    const handleDownloadExcel = useCallback(() => handleExport('xlsx'), [handleExport]);

    // Use backend pagination metadata for navigation
    const totalPages = paginationMeta.last_page || 1;


    // Memoized calculations for StatCards - Performance optimization with batch processing
    const productTypeCounts = useMemo(() => {
        // No fallback - statistics should always be loaded
        if (comprehensiveStats) {
            return {
                normal: comprehensiveStats.total_products || 0,
                scale: comprehensiveStats.total_scale_products || 0,
                card: comprehensiveStats.total_cards || 0,
                total: comprehensiveStats.total_items || 0,
            };
        }

        // Return zeros if stats not available yet
        return {
            normal: 0,
            scale: 0,
            card: 0,
            total: 0,
        };
    }, [comprehensiveStats]);

    const stockStatusCounts = useMemo(() => {
        // No fallback - statistics should always be loaded
        if (comprehensiveStats) {
            return {
                inStock: comprehensiveStats.active_items || 0,
                lowStock: comprehensiveStats.low_stock_items || 0,
                outOfStock: comprehensiveStats.out_of_stock_items || 0,
            };
        }

        // Return zeros if stats not available yet
        return {
            inStock: 0,
            lowStock: 0,
            outOfStock: 0,
        };
    }, [comprehensiveStats]);

    const valueCalculations = useMemo(() => {
        // This ensures stats cards show static values regardless of pagination or filters
        if (comprehensiveStats) {
            const totalValue = Number(comprehensiveStats.total_sales_value || 0);
            const normalValue = Number(comprehensiveStats.normal_products_value || 0);
            const scaleValue = Number(comprehensiveStats.scale_products_value || 0);
            const totalCost = Number(comprehensiveStats.total_value || 0);
            const potentialProfit = totalValue - totalCost;

            return { totalValue, normalValue, scaleValue, totalCost, potentialProfit };
        }

        // Fallback: Calculate from current page items only (should rarely happen)
        let totalValue = 0;
        let normalValue = 0;
        let scaleValue = 0;

        const batchSize = 100;
        for (let i = 0; i < allItems.length; i += batchSize) {
            const batch = allItems.slice(i, i + batchSize);
            batch.forEach((p) => {
                const stock = p.stock !== undefined ? Number(p.stock) || 0 : 1;
                const sellPrice = Number(p.sell_price) || 0;
                const value = sellPrice * stock;

                if (
                    p.product_type === 'product' ||
                    p.product_type === 'scale_product'
                ) {
                    totalValue += value;
                }

                if (p.product_type === 'product') {
                    normalValue += value;
                } else if (p.product_type === 'scale_product') {
                    scaleValue += value;
                }
            });
        }

        const totalCost = comprehensiveStats && typeof (comprehensiveStats as Record<string, unknown>).total_value === 'number' ? (comprehensiveStats as Record<string, unknown>).total_value as number : 0;
        const potentialProfit = totalValue - totalCost;

        return { totalValue, normalValue, scaleValue, totalCost, potentialProfit };
    }, [comprehensiveStats, allItems]);

    const expiryCalculations = useMemo(() => {
        // Use comprehensive statistics if available (shows ALL products)
        if (comprehensiveStats?.expiry_calculations) {
            const expiryCalculations =
                comprehensiveStats.expiry_calculations as Record<
                    string,
                    number
                >;
            return {
                expiringIn30Days: expiryCalculations.expiring_in_30_days || 0,
                expiredItems: expiryCalculations.expired_items || 0,
            };
        }

        // Fallback: no expiry data available
        return { expiringIn30Days: 0, expiredItems: 0 };
    }, [comprehensiveStats]);

    const averageStockLevel = useMemo(() => {
        // OPTIMIZATION: Use comprehensive statistics for accurate average stock level
        if (comprehensiveStats?.average_stock_level !== undefined) {
            return Number(comprehensiveStats.average_stock_level) || 0;
        }
        // Fallback: return 0 if stats not available
        return 0;
    }, [comprehensiveStats]);

    const scaleStockTotal = useMemo(() => {
        if (comprehensiveStats?.scale_stock_total !== undefined) {
            return Number(comprehensiveStats.scale_stock_total) || 0;
                }
        // Fallback: return 0 if stats not available
        return 0;
    }, [comprehensiveStats]);

    // Handle page changes
    const handlePageChange = useCallback(
        (page: number) => {
            setCurrentPage(page);
        },
        [setCurrentPage],
    );

    // Helper function to extract name from category/supplier object or string
    const extractName = useCallback((item: unknown): string | null => {
        if (typeof item === 'object' && item !== null) {
            return (item as { name?: string })?.name || null;
        }
        return typeof item === 'string' ? item : null;
    }, []);

    // Memoized category options from allItems
    const categoryOptions = useMemo(() => {
        const uniqueCategories = Array.from(
            new Set(
                allItems
                    .map((item) => extractName(item.category))
                    .filter(Boolean)
            )
        );
        
        return [
            { value: 'all', label: t('inventory.filter.all_categories') },
            ...uniqueCategories.map((name) => ({
                value: String(name),
                label: String(name),
            })),
        ];
    }, [allItems, t, extractName]);

    // Memoized supplier options from allItems
    const supplierOptions = useMemo(() => {
        const uniqueSuppliers = Array.from(
            new Set(
                allItems
                    .map((item) => extractName(item.supplier))
                    .filter(Boolean)
            )
        );
        
        return [
            { value: 'all', label: t('inventory.filter.all_suppliers') },
            ...uniqueSuppliers.map((name) => ({
                value: String(name),
                label: String(name),
            })),
        ];
    }, [allItems, t, extractName]);

    // Reset pagination when filters change
    const handleFiltersChange = useCallback(
        (newFilters: FilterOptions) => {
            setFilters(newFilters);
            setCurrentPage(1); // Reset to first page when filters change
        },
        [setFilters, setCurrentPage],
    );
    

        // Clean up modal state when filters change
    useEffect(() => {
        dispatchModal({ type: 'CLOSE' });
    }, [dispatchModal, filters]);

    // Load data on mount - removed duplicate, already handled above

    // Inventory table columns
    const inventoryColumns: Column<InventoryItem>[] = [
        {
            key: 'image_url',
            header: t('item_images.column'),
            accessor: 'image_url',
            render: (_value, row) => <ItemThumbnail url={row.image_url} name={row.name} />,
        },
        {
            key: 'name',
            header: t('inventory.table.item_name'),
            accessor: 'name',
            sortable: true,
            headerClassName: 'text-blue-700 dark:text-blue-300 text-xs',
            render: (value) => (
                <span className="text-xs font-medium">{String(value)}</span>
            ),
        },
        {
            key: 'product_type',
            header: t('inventory.table.product_type'),
            accessor: 'product_type',
            headerClassName: 'text-indigo-700 dark:text-indigo-300 text-xs',
            render: (value) => {
                const typeConfig = {
                    product: {
                        label: t('inventory.table.product'),
                        className:
                            'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-600',
                    },
                    scale_product: {
                        label: t('inventory.table.scale_product'),
                        className:
                            'bg-green-100 text-green-800 border-green-200',
                    },
                    card: {
                        label: t('inventory.table.card'),
                        className:
                            'bg-purple-100 text-purple-800 border-purple-200',
                    },
                };
                const config = typeConfig[value as keyof typeof typeConfig] || {
                    label: String(value) || t('inventory.table.unknown'),
                    className: 'bg-gray-100 text-gray-800 border-gray-200',
                };
                return (
                    <Badge variant="outline" className={config.className}>
                        {config.label}
                    </Badge>
                );
            },
        },
        {
            key: 'identifier',
            header: t('inventory.table.identifier'),
            accessor: 'identifier',
            headerClassName: 'text-green-700 dark:text-green-300 text-xs',
            render: (value, row) => (
                <div className="flex flex-col">
                    <span className="font-mono text-xs">
                        {String(value || '-')}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {String(row.identifier_type || '')}
                    </span>
                    {/* Show secondary barcode if available */}
                    {row.original_data &&
                        'secondary_barcode' in row.original_data &&
                        (row.original_data as { secondary_barcode?: string })
                            .secondary_barcode && (
                            <span className="mt-1 text-xs text-muted-foreground">
                                {t('inventory.table.secondary')}{' '}
                                {
                                    (
                                        row.original_data as {
                                            secondary_barcode?: string;
                                        }
                                    ).secondary_barcode
                                }
                            </span>
                        )}
                    </div>
                ),
            },
            {
            key: 'category',
            header: t('inventory.table.category'),
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
            header: t('inventory.table.supplier'),
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
            key: 'cost_price',
            header: t('inventory.table.cost_price'),
            accessor: 'cost_price',
            sortable: true,
            headerClassName: 'text-teal-700 dark:text-teal-300 text-xs',
            render: (value) => (
                <span className="text-xs">{formatCurrency(Number(value) || 0)}</span>
            ),
        },
        {
            key: 'sell_price',
            header: t('inventory.table.sell_price'),
            accessor: 'sell_price',
            sortable: true,
            headerClassName: 'text-emerald-700 dark:text-emerald-300 text-xs',
            render: (value) => (
                <span className="text-xs">{formatCurrency(Number(value) || 0)}</span>
            ),
        },
        {
            key: 'profit_margin',
            header: t('inventory.table.profit_margin'),
            accessor: 'profit_margin',
            sortable: true,
            headerClassName: 'text-cyan-700 dark:text-cyan-300 text-xs',
            render: (value) => (
                <span className="text-xs">{`${Number(value).toFixed(2)}%`}</span>
            ),
        },
        {
            key: 'stock',
            header: t('inventory.table.stock'),
            accessor: 'stock',
            sortable: true,
            headerClassName: 'text-orange-700 dark:text-orange-300 text-xs',
            render: (value, row) => {
                if (value === undefined || value === null) {
                    return row.product_type === 'card' ? <span className="text-xs">∞</span> : <span className="text-xs">N/A</span>;
                }

                // Add appropriate units based on product type
                switch (row.product_type) {
                    case 'product':
                        return <span className="text-xs">{`${value} ${t('inventory.table.qty')}`}</span>;
                    case 'scale_product':
                        return <span className="text-xs">{`${value} ${t('inventory.table.kg')}`}</span>;
                    case 'card':
                        return <span className="text-xs">∞</span>; // Cards have unlimited stock
                    default:
                        return <span className="text-xs">{value.toString()}</span>;
                }
            },
        },
        {
            key: 'per_carton',
            header: t('inventory.table.carton_info'),
            accessor: 'per_carton',
            headerClassName: 'text-indigo-700 dark:text-indigo-300 text-xs',
            render: (value) => {
                if (!value || typeof value !== 'number' || value <= 0) {
                    return <span className="text-muted-foreground">-</span>;
                }
                    return (
                    <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
                        {value}
                                </span>
                    );
                },
            },
            {
            key: 'expire_date',
            header: t('inventory.table.expire_date'),
            headerClassName: 'text-amber-700 dark:text-amber-300 text-xs',
            render: (value, row) => {
                if (
                    !row.original_data ||
                    !('expire_date' in row.original_data) ||
                    !row.original_data.expire_date
                ) {
                    return (
                        <span className="text-muted-foreground">{t('inventory.table.no_expiry')}</span>
                    );
                }

                const expireDate = new Date(
                    (row.original_data as { expire_date?: string })
                        .expire_date || '',
                );
                const today = new Date();
                const diffTime = expireDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                const getExpireStatus = () => {
                    if (diffDays < 0) {
                        return {
                            variant: 'destructive' as const,
                            className:
                                'bg-red-100 text-red-800 border-red-200 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
                            label: t('inventory.table.expired'),
                        };
                    } else if (diffDays <= 30) {
                        return {
                            variant: 'secondary' as const,
                            className:
                                'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800',
                            label: t('inventory.table.expiring_soon'),
                        };
                    } else {
                        return {
                            variant: 'outline' as const,
                            className:
                                'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
                            label: t('inventory.table.valid'),
                        };
                    }
                };

                const status = getExpireStatus();

                return (
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium">
                            {expireDate.toLocaleDateString()}
                        </span>
                        <Badge
                            variant={status.variant}
                            className={`${status.className} text-xs`}
                        >
                            {status.label}
                        </Badge>
                    </div>
                    );
                },
            },
            {
                key: 'created_at',
                header: t('inventory.table.created_at'),
                accessor: 'created_at',
                sortable: true,
                headerClassName: 'text-slate-700 dark:text-slate-300 text-xs',
                render: (value) => {
                    if (!value || typeof value !== 'string') return '-';
                    const date = new Date(value);
                    const now = new Date();
                    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
                    const isNew = diffInHours <= 24;
                    
                    return (
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1">
                                <span className="text-xs font-medium">
                                    {date.toLocaleDateString()}
                                </span>
                                {isNew && (
                                    <Badge 
                                        variant="outline" 
                                        className="text-xs px-1 py-0 bg-green-100 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-600"
                                    >
                                        New
                                    </Badge>
                                )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                                {date.toLocaleTimeString()}
                            </span>
                        </div>
                    );
                },
            },
            {
                key: 'updated_at',
                header: t('inventory.table.updated_at'),
                accessor: 'updated_at',
                sortable: true,
                headerClassName: 'text-slate-700 dark:text-slate-300 text-xs',
                render: (value) => {
                    if (!value || typeof value !== 'string') return '-';
                    const date = new Date(value);
                    const now = new Date();
                    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
                    const isUpdated = diffInHours <= 24;
                    
                    return (
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1">
                                <span className="text-xs font-medium">
                                    {date.toLocaleDateString()}
                                </span>
                                {isUpdated && (
                                    <Badge 
                                        variant="outline" 
                                        className="text-xs px-1 py-0 bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-600"
                                    >
                                        Updated
                                    </Badge>
                                )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                                {date.toLocaleTimeString()}
                            </span>
                        </div>
                    );
                },
            },
            {
            key: 'actions',
                header: t('inventory.table.actions'),
            headerClassName: 'text-pink-700 dark:text-pink-300 text-xs',
            render: (_, row) => (
                    <div className="grid w-fit grid-cols-2 gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                        onClick={() => handleViewItem(row)}
                        className="h-8 w-8 p-0 border-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                        {row.product_type !== 'card' && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditItem(row)}
                                className="h-8 w-8 p-0 border-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/20"
                            >
                                <Edit className="h-4 w-4" />
                            </Button>
                        )}
                    {row.product_type === 'product' &&
                        (() => {
                            const showInPosValue = (
                                row.original_data as Record<string, unknown>
                            )?.show_in_pos;
                            const isVisible =
                                showInPosValue === true || showInPosValue === 1;
                            return (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                                        handleTogglePosVisibility(row)
                                    }
                                    disabled={togglingItems.has(row.id)}
                                    className={`h-8 w-8 p-0 border-0 ${
                                        isVisible
                                            ? 'text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:text-purple-300 dark:hover:bg-purple-900/20'
                                            : 'text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:text-orange-400 dark:hover:text-orange-300 dark:hover:bg-orange-900/20'
                                    } ${togglingItems.has(row.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    title={
                                        isVisible
                                            ? t('inventory.buttons.hide_from_pos')
                                            : t('inventory.buttons.show_in_pos')
                                    }
                                >
                                    {togglingItems.has(row.id) ? (
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    ) : isVisible ? (
                                        <ShoppingCart className="h-4 w-4" />
                                    ) : (
                                        <X className="h-4 w-4" />
                                    )}
                        </Button>
                            );
                        })()}
                    {/* Quick Set Carton Button for Testing */}
                    {row.name === 'test' && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleQuickSetCarton(row)}
                            className="h-8 w-8 p-0 border-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
                            title="Set Carton Value (12)"
                        >
                            <span className="text-xs font-bold">12</span>
                        </Button>
                    )}
                            {row.product_type !== 'card' && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteItem(row)}
                        className="h-8 w-8 p-0 border-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                    >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                    </div>
                ),
            },
    ];

    // Inventory item action handlers
    const handleViewItem = useCallback((item: InventoryItem) => {
        dispatchModal({ type: 'OPEN_PRODUCT_DETAILS', data: item });
    }, []);

    const handleProductDetailsModalClose = useCallback(() => {
        dispatchModal({ type: 'CLOSE' });
    }, []);

    const handleTogglePosVisibility = useCallback(
        async (item: InventoryItem) => {
            // Skip if already toggling this item or if it's not a regular product
            if (
                togglingItems.has(item.id) ||
                item.product_type !== 'product' ||
                !item.original_data
            ) {
                return;
            }

            // Get current status, handle both boolean and number types from database
            const showInPosValue = (
                item.original_data as Record<string, unknown>
            ).show_in_pos;
            const currentPosStatus =
                showInPosValue === true || showInPosValue === 1;
            const newPosStatus = !currentPosStatus;

            try {
                // Add to toggling set to prevent multiple clicks
                setTogglingItems((prev) => new Set(prev).add(item.id));
                setError(null);

                // Optimistic update - update UI immediately
                setAllItems((prevItems) =>
                    prevItems.map((invItem) =>
                        invItem.id === item.id &&
                        invItem.product_type === 'product'
                            ? {
                                  ...invItem,
                                  original_data: {
                                      ...invItem.original_data,
                                      show_in_pos: newPosStatus,
                                  } as Product,
                              }
                            : invItem,
                    ),
                );

                // Show immediate feedback (optimistic update)
                toast({
                    title: t('inventory.messages.pos_visibility_updated'),
                    description: newPosStatus
                        ? `${t('inventory.messages.pos_visible_text')} ${item.name}`
                        : `${t('inventory.messages.pos_hidden_text')} ${item.name}`,
                });

                const response = await productService.togglePosVisibility(
                    item.id,
                );

                if (!response.success || !response.data) {
                    throw new Error(
                        response.message ||
                            t('inventory.messages.failed_update_pos'),
                    );
                }

                const updatedProduct = response.data;
                updateProductInList(item.id, updatedProduct);

                // Notify POS about visibility change
                await posVisibilitySyncService.notifyChange();
                if (updatedProduct.show_in_pos !== newPosStatus) {
                    toast({
                        title: t('inventory.messages.pos_visibility_updated'),
                        description: updatedProduct.show_in_pos
                            ? `${t('inventory.messages.pos_visible_text')} ${item.name}`
                            : `${t('inventory.messages.pos_hidden_text')} ${item.name}`,
                    });
                }
            } catch (error: unknown) {
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : t('inventory.messages.failed_update_pos');
                setError(errorMessage);

                // Revert update on error
                setAllItems((prevItems) =>
                    prevItems.map((invItem) =>
                        invItem.id === item.id &&
                        invItem.product_type === 'product'
                            ? {
                                  ...invItem,
                                  original_data: {
                                      ...invItem.original_data,
                                      show_in_pos: currentPosStatus,
                                  } as Product,
                              }
                            : invItem,
                    ),
                );

                const errorMsg =
                    error instanceof Error
                        ? error.message
                        : t('inventory.messages.failed_update_pos');
                toast({
                    title: t('inventory.messages.error'),
                    description: errorMsg,
                });
            } finally {
                setTogglingItems((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(item.id);
                    return newSet;
                });
            }
        },
        [
            setAllItems,
            setError,
            setTogglingItems,
            togglingItems,
            toast,
            t,
            updateProductInList,
        ],
    );

    const handleEditItem = useCallback((item: InventoryItem) => {
        // Prevent editing cards
        if (item.product_type === 'card') return;
        
        setEditingItem(item);

        // Open the appropriate modal based on product type
        switch (item.product_type) {
            case 'product': {
                // Map inventory item data to product modal format
                // Get category and supplier from original_data or item level
                const categoryFromOriginal = item.original_data?.category as
                    | { id: number; name: string }
                    | undefined;
                const supplierFromOriginal = item.original_data?.supplier as
                    | { id: number; name: string }
                    | undefined;

                const category =
                    categoryFromOriginal ||
                    (typeof item.category === 'object' && item.category !== null
                        ? (item.category as { id: number; name: string })
                        : null);
                const supplier =
                    supplierFromOriginal ||
                    (typeof item.supplier === 'object' && item.supplier !== null
                        ? (item.supplier as { id: number; name: string })
                        : null);

                const productData = {
                    id: item.id,
                    name: item.name,
                    category_id:
                        item.original_data?.category_id || category?.id || null,
                    supplier_id:
                        item.original_data?.supplier_id || supplier?.id || null,
                    barcode_type: item.original_data?.barcode_type || 'ean13',
                    barcode: item.barcode || item.original_data?.barcode || '',
                    secondary_barcode:
                        item.secondary_barcode ||
                        item.original_data?.secondary_barcode ||
                        '',
                    cost_price: item.cost_price,
                    sell_price: item.sell_price,
                    stock: item.stock || 0,
                    min_stock: item.min_stock || 0,
                    per_carton: item.per_carton || item.original_data?.per_carton || null,
                    carton_price: item.carton_price ?? item.original_data?.carton_price ?? null,
                    expire_date: item.original_data?.expire_date || '',
                    show_in_pos: item.original_data?.show_in_pos ?? false,
                    category: category,
                    supplier: supplier,
                };
                dispatchModal({
                    type: 'OPEN_EDIT',
                    modalType: 'product',
                    data: productData,
                });
                break;
            }
            case 'scale_product':
                dispatchModal({
                    type: 'OPEN_EDIT',
                    modalType: 'scaleProduct',
                    data: item.original_data,
                });
                break;
            default:
            // Unknown product type
        }
    }, []);

    const handleDeleteItem = useCallback((item: InventoryItem) => {
        // Prevent deleting cards
        if (item.product_type === 'card') return;
        
        dispatchModal({ type: 'OPEN_DELETE', data: item });
    }, []);

    // Quick set carton value for testing
    const handleQuickSetCarton = useCallback(async (item: InventoryItem) => {
        if (item.product_type !== 'product' || !item.original_data) {
            return;
        }

        try {
            setError(null);
            
            const originalData = item.original_data as Record<string, unknown>;
            
            // Update the product with per_carton = 12
            const response = await fetch(`/api/products/${item.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    name: item.name,
                    category_id: originalData.category_id,
                    supplier_id: originalData.supplier_id,
                    barcode_type: originalData.barcode_type || 'ean13',
                    barcode: item.barcode,
                    secondary_barcode: item.secondary_barcode || '',
                    cost_price: item.cost_price,
                    sell_price: item.sell_price,
                    stock: item.stock,
                    min_stock: item.min_stock,
                    per_carton: 12, // Set carton value to 12
                    show_in_pos: originalData.show_in_pos ?? false,
                    expire_date: originalData.expire_date || '',
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to update product');
            }

            const result = await response.json();
            
            if (result.success) {
                // Update the local state
                setAllItems((prevItems) =>
                    prevItems.map((invItem) =>
                        invItem.id === item.id
                            ? {
                                  ...invItem,
                                  per_carton: 12,
                                  carton_info: '1 carton + 0 loose',
                              }
                            : invItem,
                    ),
                );

                // Force refresh POS cache to ensure carton info is available
                try {
                    const cacheResponse = await fetch('/api/pos/refresh-cache', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                        },
                    });
                    
                    if (cacheResponse.ok) {
                        await cacheResponse.json();
                    } else {
                        // POS cache refresh failed - handled silently
                    }
                } catch {
                    // Failed to refresh POS cache - handled silently
                }

                toast({
                    title: 'Carton Value Set',
                    description: `Product "${item.name}" now has "${item.per_carton}" items per carton. POS cache refreshed.`,
                });
            }
        } catch {
            // Error setting carton value - handled by setting error state
            setError('Failed to set carton value');
        }
    }, [setAllItems, toast]);

    const handleDeleteModalClose = useCallback(() => {
        dispatchModal({ type: 'CLOSE' });
    }, []);

    // Remove item from inventory (for delete operations)
    const removeInventoryItem = useCallback(
        (itemId: number, itemType: 'product' | 'scale_product' | 'card') => {
            setAllItems((prevItems) =>
                prevItems.filter(
                    (item) =>
                        !(item.id === itemId && item.product_type === itemType),
                ),
            );
        },
        [setAllItems],
    );

    // const handleDeleteConfirmed = useCallback((deletedItemId?: number) => {
    //     // If we have the deleted item ID, remove it from the list immediately
    //     if (deletedItemId && modalState.data) {
    //         removeInventoryItem(deletedItemId, modalState.data.product_type);
    //     } else {
    //         // Fallback to full refresh if no ID provided
    //         loadInventoryItems(true); // Force refresh after deletion
    //     }
    //     handleDeleteModalClose();
    // }, [modalState.data, loadInventoryItems, removeInventoryItem]);

    // Delete function with optimistic updates
    const handleDeleteConfirm = useCallback(async () => {
        if (!modalState.data) return;

        try {
            // Optimistic update - remove from UI immediately
            const itemId = Number(modalState.data.id) || 0;
            const itemType = String(
                modalState.data.product_type || 'product',
            ) as 'product' | 'scale_product' | 'card';
            removeInventoryItem(itemId, itemType);

            // Close modal immediately for better UX
            handleDeleteModalClose();

            // Perform actual delete in background
            let response;
            switch (itemType) {
                case 'product':
                    response = await productService.deleteProduct(itemId);
                    break;
                case 'scale_product':
                    response =
                        await scaleProductService.deleteScaleProduct(itemId);
                    break;
                default:
                    throw new Error('Unknown item type');
            }

            // Check if deletion was successful
            if (!response.success) {
                // Add item back to list since deletion failed
                if (modalState.data) {
                    setAllItems((prevItems) => [
                        ...prevItems,
                        modalState.data as InventoryItem,
                    ]);
                }
                throw new Error(response.message || 'Failed to delete item');
            }

            // Show success toast
            toast({
                title: t('inventory.messages.item_deleted'),
                description: `${t('inventory.messages.item_deleted_desc_text')} ${modalState.data.name}`,
                type: 'success',
            });
        } catch (error: unknown) {
            // If delete failed, add the item back to the list if it's not already there
            const itemExists = allItems.some(
                (item) =>
                    item.id === modalState.data?.id &&
                    item.product_type === modalState.data?.product_type,
            );
            if (modalState.data && !itemExists) {
                setAllItems((prevItems) => [
                    ...prevItems,
                    modalState.data as InventoryItem,
                ]);
            }

            // Show error toast
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : t('inventory.messages.delete_failed_desc');
            toast({
                title: t('inventory.messages.delete_failed'),
                description: errorMessage,
                type: 'error',
            });
        }
    }, [
        modalState.data,
        removeInventoryItem,
        handleDeleteModalClose,
        allItems,
        setAllItems,
        toast,
        t,
    ]);


    // Smart update for multiple inventory adjustments
    const updateMultipleInventoryItems = (adjustmentResults: unknown[]) => {
        if (!adjustmentResults || adjustmentResults.length === 0) {
            return;
        }

        setAllItems((prevItems) =>
            prevItems.map((item) => {
                // Find if this item was adjusted
                const adjustment = adjustmentResults.find((result: unknown) => {
                    const adj = result as {
                        id?: number;
                        product_type?: string;
                    };
                    return (
                        adj.id === item.id &&
                        adj.product_type === item.product_type
                    );
                });

                if (adjustment) {
                    const adj = adjustment as { new_stock: number };
                    // Update the stock for this item
                    const updatedItem = {
                        ...item,
                        stock: adj.new_stock,
                        // Update status based on new stock
                        status:
                            adj.new_stock === 0
                                ? ('out_of_stock' as const)
                                : adj.new_stock <= (item.min_stock || 0)
                                  ? ('low_stock' as const)
                                  : ('active' as const),
                    };

                    return updatedItem;
                }

                return item;
            }),
        );
    };

    // Edit modal close handlers with smart refresh
    const handleCloseEditModals = useCallback(
        (updatedData?: Product | ScaleProduct | Card) => {
            setEditingItem(null);
            dispatchModal({ type: 'CLOSE' });

            // Smart refresh: Update only the edited product instead of full refresh
            if (updatedData && editingItem) {
                // Update the specific product in the list
                updateProductInList(
                    editingItem.id,
                    updatedData as Product | ScaleProduct | Card,
                );

                // Show success toast
                const productName =
                    'name' in updatedData ? updatedData.name : 'Product';
                toast({
                    title: t('inventory.messages.product_updated'),
                    description: `${t('inventory.messages.product_updated_desc_text')} ${productName}`,
                    type: 'success',
                    duration: 3000,
                });
            }
            // No refresh on simple close/cancel
        },
        [editingItem, updateProductInList, toast, t],
    );

    const handleRowClick = useCallback(() => {
        // You can navigate to item detail or open a modal
    }, []);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('navigation.admin'),
        },
        {
            title: t('navigation.inventory'),
            href: admin.inventory.url(),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('navigation.inventory')} />
            <div className="flex flex-1 flex-col gap-6 rounded-xl p-6">
            <PageHeader
                    title={t('inventory.title')}
                    description={t('inventory.description')}
                >
                <Button
                    variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={refreshing || loading}
                        aria-busy={refreshing}
                        className="!border-blue-300 !bg-blue-50 !text-blue-700 hover:!border-blue-500 hover:!bg-blue-100 hover:!text-blue-800 focus:!border-blue-500 focus:!bg-blue-100 focus:!ring-2 focus:!ring-blue-200 focus:!outline-none dark:!border-blue-600 dark:!bg-blue-900/20 dark:!text-blue-300 dark:hover:!border-blue-500 dark:hover:!bg-blue-900/30 dark:hover:!text-blue-200 dark:focus:!border-blue-500 dark:focus:!bg-blue-900/30 dark:focus:!ring-2 dark:focus:!ring-blue-400"
                >
                        <RefreshCw className={refreshing ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />
                        {t(refreshing ? 'inventory_refresh.loading' : 'inventory.refresh')}
                </Button>
                <Button
                        variant="outline"
                        size="sm"
                        onClick={() => dispatchModal({ type: 'OPEN_CREATE', modalType: 'import' })}
                        className="!border-cyan-300 !bg-cyan-50 !text-cyan-700 hover:!border-cyan-500 hover:!bg-cyan-100 hover:!text-cyan-800 focus:!border-cyan-500 focus:!bg-cyan-100 focus:!ring-2 focus:!ring-cyan-200 focus:!outline-none dark:!border-cyan-600 dark:!bg-cyan-900/20 dark:!text-cyan-300 dark:hover:!border-cyan-500 dark:hover:!bg-cyan-900/30 dark:hover:!text-cyan-200 dark:focus:!border-cyan-500 dark:focus:!bg-cyan-900/30 dark:focus:!ring-2 dark:focus:!ring-cyan-400"
                    >
                        <Upload className="mr-2 h-4 w-4" />
                        {t('inventory.import_products')}
                    </Button>
                <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAdjust}
                        className="!border-orange-300 !bg-orange-50 !text-orange-700 hover:!border-orange-500 hover:!bg-orange-100 hover:!text-orange-800 focus:!border-orange-500 focus:!bg-orange-100 focus:!ring-2 focus:!ring-orange-200 focus:!outline-none dark:!border-orange-600 dark:!bg-orange-900/20 dark:!text-orange-300 dark:hover:!border-orange-500 dark:hover:!bg-orange-900/30 dark:hover:!text-orange-200 dark:focus:!border-orange-500 dark:focus:!bg-orange-900/30 dark:focus:!ring-2 dark:focus:!ring-orange-400"
                    >
                        <Settings className="mr-2 h-4 w-4" />
                        {t('inventory.adjust')}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            dispatchModal({
                                type: 'OPEN_CREATE',
                                modalType: 'category',
                            })
                        }
                        className="!border-purple-300 !bg-purple-50 !text-purple-700 hover:!border-purple-500 hover:!bg-purple-100 hover:!text-purple-800 focus:!border-purple-500 focus:!bg-purple-100 focus:!ring-2 focus:!ring-purple-200 focus:!outline-none dark:!border-purple-600 dark:!bg-purple-900/20 dark:!text-purple-300 dark:hover:!border-purple-500 dark:hover:!bg-purple-900/30 dark:hover:!text-purple-200 dark:focus:!border-purple-500 dark:focus:!bg-purple-900/30 dark:focus:!ring-2 dark:focus:!ring-purple-400"
                    >
                        <FolderPlus className="mr-2 h-4 w-4" />
                        {t('inventory.category')}
                    </Button>
                <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCardsModalOpen(true)}
                        className="!border-cyan-300 !bg-cyan-50 !text-cyan-700 hover:!border-cyan-500 hover:!bg-cyan-100 hover:!text-cyan-800 focus:!border-cyan-500 focus:!bg-cyan-100 focus:!ring-2 focus:!ring-cyan-200 focus:!outline-none dark:!border-cyan-600 dark:!bg-cyan-900/20 dark:!text-cyan-300 dark:hover:!border-cyan-500 dark:hover:!bg-cyan-900/30 dark:hover:!text-cyan-200 dark:focus:!border-cyan-500 dark:focus:!bg-cyan-900/30 dark:focus:!ring-2 dark:focus:!ring-cyan-400"
                    >
                        <FolderOpen className="mr-2 h-4 w-4" />
                        {t('inventory.buttons.cards')}
                </Button>
                <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            dispatchModal({
                                type: 'OPEN_CREATE',
                                modalType: 'card',
                            })
                        }
                        className="!border-pink-300 !bg-pink-50 !text-pink-700 hover:!border-pink-500 hover:!bg-pink-100 hover:!text-pink-800 focus:!border-pink-500 focus:!bg-pink-100 focus:!ring-2 focus:!ring-pink-200 focus:!outline-none dark:!border-pink-600 dark:!bg-pink-900/20 dark:!text-pink-300 dark:hover:!border-pink-500 dark:hover:!bg-pink-900/30 dark:hover:!text-pink-200 dark:focus:!border-pink-500 dark:focus:!bg-pink-900/30 dark:focus:!ring-2 dark:focus:!ring-pink-400"
                >
                    <Plus className="mr-2 h-4 w-4" />
                        {t('inventory.buttons.add_card')}
                </Button>
                <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            dispatchModal({
                                type: 'OPEN_CREATE',
                                modalType: 'scaleProduct',
                            })
                        }
                        className="!border-teal-300 !bg-teal-50 !text-teal-700 hover:!border-teal-500 hover:!bg-teal-100 hover:!text-teal-800 focus:!border-teal-500 focus:!bg-teal-100 focus:!ring-2 focus:!ring-teal-200 focus:!outline-none dark:!border-teal-600 dark:!bg-teal-900/20 dark:!text-teal-300 dark:hover:!border-teal-500 dark:hover:!bg-teal-900/30 dark:hover:!text-teal-200 dark:focus:!border-teal-500 dark:focus:!bg-teal-900/30 dark:focus:!ring-2 dark:focus:!ring-teal-400"
                    >
                        <Scale className="mr-2 h-4 w-4" />
                        {t('inventory.buttons.add_scale_product')}
                </Button>
                <Button
                        size="sm"
                        onClick={() =>
                            dispatchModal({
                                type: 'OPEN_CREATE',
                                modalType: 'product',
                            })
                        }
                        className="!border-indigo-300 !bg-indigo-50 !text-indigo-700 hover:!border-indigo-500 hover:!bg-indigo-100 hover:!text-indigo-800 focus:!border-indigo-500 focus:!bg-indigo-100 focus:!ring-2 focus:!ring-indigo-200 focus:!outline-none dark:!border-indigo-600 dark:!bg-indigo-900/20 dark:!text-indigo-300 dark:hover:!border-indigo-500 dark:hover:!bg-indigo-900/30 dark:hover:!text-indigo-200 dark:focus:!border-indigo-500 dark:focus:!bg-indigo-900/30 dark:focus:!ring-2 dark:focus:!ring-indigo-400"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        {t('inventory.add_product')}
                </Button>
                </PageHeader>

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

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                    {/* All Product Count */}
                <StatCard
                        title={t('inventory.stat_cards.all_products')}
                        value={productTypeCounts.total.toString()}
                        description={t('inventory.stat_cards.total_count')}
                    icon={Package}
                    color="blue"
                        badge={{
                            text: t('inventory.stat_cards.all_products_badge'),
                            variant: 'secondary',
                            color: 'blue',
                        }}
                />

                    {/* Normal Products Count */}
                <StatCard
                        title={t('inventory.stat_cards.normal_products')}
                        value={productTypeCounts.normal.toString()}
                        description={t('inventory.stat_cards.regular_products')}
                        icon={Package}
                        color="indigo"
                        badge={{
                            text: t('inventory.stat_cards.normal_products_badge'),
                            variant: 'secondary',
                            color: 'indigo',
                        }}
                    />

                    {/* Scale Products Count */}
                    <StatCard
                        title={t('inventory.stat_cards.scale_products')}
                        value={productTypeCounts.scale.toString()}
                        description={t('inventory.stat_cards.weight_products')}
                        icon={Scale}
                        color="green"
                        badge={{
                            text: t('inventory.stat_cards.scale_products_badge'),
                            variant: 'secondary',
                            color: 'green',
                        }}
                    />

                    {/* Cards Product Count */}
                    <StatCard
                        title={t('inventory.stat_cards.cards')}
                        value={productTypeCounts.card.toString()}
                        description={t('inventory.stat_cards.card_products')}
                        icon={Package}
                        color="purple"
                        badge={{
                            text: t('inventory.stat_cards.cards_badge'),
                            variant: 'secondary',
                            color: 'purple',
                        }}
                    />

                    {/* Category Count */}
                    <StatCard
                        title={t('inventory.stat_cards.categories')}
                        value={categories.length.toString()}
                        description={t('inventory.stat_cards.total_categories')}
                        icon={FolderOpen}
                        color="pink"
                        badge={{
                            text: t('inventory.stat_cards.categories_badge'),
                            variant: 'secondary',
                            color: 'pink',
                        }}
                    />

                    {/* In Stock Count (Normal Products) */}
                    <StatCard
                        title={t('inventory.stat_cards.in_stock_normal')}
                        value={stockStatusCounts.inStock.toString()}
                        description={t('inventory.stat_cards.normal_products_in_stock')}
                        icon={CheckCircle}
                        color="green"
                        badge={{
                            text: t('inventory.stat_cards.in_stock_badge'),
                            variant: 'default',
                            color: 'green',
                        }}
                    />

                    {/* Low Stock Count (Normal Products) */}
                    <StatCard
                        title={t('inventory.stat_cards.low_stock_normal')}
                        value={stockStatusCounts.lowStock.toString()}
                        description={t('inventory.stat_cards.normal_products_in_stock')}
                    icon={AlertTriangle}
                    color="orange"
                        badge={{
                            text: t('inventory.stat_cards.low_stock_badge'),
                            variant: 'secondary',
                            color: 'orange',
                        }}
                />

                    {/* Out of Stock Count (Normal Products) */}
                <StatCard
                        title={t('inventory.stat_cards.out_of_stock_normal')}
                        value={stockStatusCounts.outOfStock.toString()}
                        description={t('inventory.stat_cards.normal_products_in_stock')}
                    icon={XCircle}
                    color="red"
                        badge={{
                            text: t('inventory.stat_cards.out_of_stock_badge'),
                            variant: 'destructive',
                            color: 'red',
                        }}
                />

                    {/* Total Value (Products + Scale Products Only) */}
                <StatCard
                        title={t('inventory.stat_cards.total_value')}
                        value={valueCalculations.totalValue.toString()}
                        description={t('inventory.stat_cards.products_scale')}
                        icon={DollarSign}
                        color="teal"
                        isCurrency={true}
                        showInfoButton={true}
                        badge={{
                            text: t('inventory.stat_cards.total_value_badge'),
                            variant: 'default',
                            color: 'teal',
                        }}
                    />

                    {/* Normal Products Value */}
                <StatCard
                        title={t('inventory.stat_cards.normal_products_value')}
                        value={valueCalculations.normalValue.toString()}
                        description={t('inventory.stat_cards.regular_products')}
                        icon={DollarSign}
                        color="indigo"
                        isCurrency={true}
                        showInfoButton={true}
                        badge={{
                            text: t('inventory.stat_cards.normal_value_badge'),
                            variant: 'secondary',
                            color: 'indigo',
                        }}
                    />

                    {/* Scale Products Value */}
                <StatCard
                        title={t('inventory.stat_cards.scale_products_value')}
                        value={valueCalculations.scaleValue.toString()}
                        description={t('inventory.stat_cards.weight_products')}
                    icon={DollarSign}
                    color="green"
                        isCurrency={true}
                        showInfoButton={true}
                        badge={{
                            text: t('inventory.stat_cards.scale_value_badge'),
                            variant: 'default',
                            color: 'green',
                        }}
                    />

                    {/* Scale Products Stock (kg) */}
                <StatCard
                        title={t('inventory.stat_cards.scale_stock_kg')}
                        value={Number(scaleStockTotal).toFixed(1)}
                        description={t('inventory.stat_cards.total_weight')}
                        icon={Weight}
                        color="green"
                        badge={{
                            text: t('inventory.stat_cards.scale_stock_badge'),
                            variant: 'secondary',
                            color: 'green',
                        }}
                    />

                    {/* Expiring in 30 Days */}
                    <StatCard
                        title={t('inventory.stat_cards.expiring_in_30_days')}
                        value={expiryCalculations.expiringIn30Days.toString()}
                        description={t('inventory.stat_cards.products_expiring_soon')}
                        icon={Clock}
                        color="orange"
                        badge={{
                            text: t('inventory.stat_cards.expiring_soon_badge'),
                            variant: 'secondary',
                            color: 'orange',
                        }}
                    />

                    {/* Expired Items */}
                    <StatCard
                        title={t('inventory.stat_cards.expired_items')}
                        value={expiryCalculations.expiredItems.toString()}
                        description={t('inventory.stat_cards.products_past_expiry')}
                        icon={XCircle}
                        color="red"
                        badge={{
                            text: t('inventory.stat_cards.expired_badge'),
                            variant: 'destructive',
                            color: 'red',
                        }}
                    />

                    {/* Average Stock Level */}
                    <StatCard
                        title={t('inventory.stat_cards.average_stock_level')}
                        value={averageStockLevel.toFixed(1)}
                        description={t('inventory.stat_cards.average_inventory')}
                    icon={BarChart3}
                        color="blue"
                        badge={{
                            text: t('inventory.stat_cards.avg_stock_badge'),
                            variant: 'secondary',
                            color: 'blue',
                        }}
                />
            </div>

                {/* Filter Component */}
                <FilterComponent
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                    categories={categories}
                    suppliers={suppliers}
                    config={{
                        showStatus: true,
                        showCategory: true,
                        showSupplier: true,
                        showProductType: true,
                        showDateRange: false,
                        showPriceRange: true,
                        showStockRange: true,
                        showInventoryRange: true,
                        showProfitMarginRange: true,
                        showNotSoldPeriod: true,
                        showAdvanced: true,
                        statusOptions: [
                            { value: 'all', label: t('inventory.filter.all_status') },
                            { value: 'active', label: t('inventory.filter.in_stock') },
                            { value: 'low_stock', label: t('inventory.status.low_stock') },
                            { value: 'out_of_stock', label: t('inventory.status.out_of_stock') },
                        ],
                        categoryOptions,
                        supplierOptions,
                        productTypeOptions: [
                            { value: 'all', label: t('inventory.filter.all_types') },
                            { value: 'product', label: t('inventory.filter.product') },
                            { value: 'scale_product', label: t('inventory.filter.scale_product') },
                            { value: 'card', label: t('inventory.filter.card') },
                        ],
                    }}
                />

                {/* Inventory Data Table */}
            <DataTable
                    title={t('inventory.data_table.inventory_items')}
                    subtitle={`${t('inventory.showing')} ${paginationMeta.from || 0} - ${paginationMeta.to || 0} ${t('inventory.of')} ${paginationMeta.total || totalItems || 0} ${t('inventory.products')}`}
                    headerActions={
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDownloadCSV}
                                className="h-8 border-green-300 bg-green-50 px-3 text-green-700 hover:border-green-400 hover:bg-green-100 dark:border-green-700 dark:bg-green-900/20 dark:text-green-300 dark:hover:border-green-600 dark:hover:bg-green-900/30"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                CSV
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDownloadExcel}
                                className="h-8 border-blue-300 bg-blue-50 px-3 text-blue-700 hover:border-blue-400 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:border-blue-600 dark:hover:bg-blue-900/30"
                            >
                                <FileSpreadsheet className="mr-2 h-4 w-4" />
                                Excel
                            </Button>
                        </div>
                    }
                    data={sortedInventoryItems}
                    columns={inventoryColumns}
                loading={loading}
                    emptyMessage={
                        Object.keys(filters).length > 0
                            ? t('inventory.data_table.no_match_filters')
                            : t('inventory.data_table.no_items')
                    }
                    onRowClick={handleRowClick}
                    sorting={{
                        sortBy: sorting.sortBy,
                        sortOrder: sorting.sortOrder,
                        onSort: handleSort,
                    }}
                pagination={{
                        currentPage: paginationMeta.current_page || currentPage,
                        totalPages: paginationMeta.last_page || totalPages,
                        pageSize: paginationMeta.per_page || pageSize,
                        totalItems: paginationMeta.total || totalItems,
                    onPageChange: handlePageChange,
                }}
                    virtualScrolling={totalItems > 100}
                    rowHeight={60}
                    className="bg-background"
                />
            </div>

            {/* Unified Modal System */}
            {modalState.isOpen && (
                <>
                    {/* Category Modal */}
                    {modalState.type === 'category' && (
            <CategoryModal
                            isOpen={modalState.mode === 'create'}
                            onChanged={() => {
                                void loadCategories();
                                void loadComprehensiveStatistics();
                            }}
                            onClose={(categoryData?: Category) => {
                                dispatchModal({ type: 'CLOSE' });
                                // Only reload categories if something was created/modified
                                if (categoryData) {
                                    loadCategories();
                                }
                            }}
                        />
                    )}

                    {/* Product Modal */}
                    {modalState.type === 'product' && (
            <ProductModal
                            isOpen={true}
                            onClose={(
                                productData?: Record<string, unknown>,
                            ) => {
                                dispatchModal({ type: 'CLOSE' });
                                if (
                                    modalState.mode === 'create' &&
                                    productData
                                ) {
                                    // Smart add: Add new product to list instead of full refresh
                                    addProductToList(
                                        productData as unknown as Product,
                                    );

                                    // Show success toast
                                    const productName =
                                        'name' in productData
                                            ? productData.name
                                            : 'Product';
                                    toast({
                                        title: t('inventory.messages.product_created'),
                                        description: `${t('inventory.messages.product_created_desc_text')} ${productName}`,
                                        type: 'success',
                                        duration: 3000,
                                    });
                                } else if (
                                    modalState.mode === 'edit' &&
                                    productData
                                ) {
                                    // Handle edit completion
                                    handleCloseEditModals(
                                        productData as unknown as Product,
                                    );
                                }
                            }}
                            editProduct={
                                modalState.mode === 'edit'
                                    ? (modalState.data as Record<
                                          string,
                                          unknown
                                      >)
                                    : undefined
                            }
                        />
                    )}

                    {/* Scale Product Modal */}
                    {modalState.type === 'scaleProduct' && (
            <ScaleProductModal
                            isOpen={true}
                            onClose={(scaleProductData?: ScaleProduct) => {
                                dispatchModal({ type: 'CLOSE' });
                                if (
                                    modalState.mode === 'create' &&
                                    scaleProductData
                                ) {
                                    // Smart add: Add new scale product to list instead of full refresh
                                    addProductToList(scaleProductData);

                                    // Show success toast
                                    const productName =
                                        'name' in scaleProductData
                                            ? scaleProductData.name
                                            : 'Scale Product';
                                    toast({
                                        title: t('inventory.messages.scale_product_created'),
                                        description: `${t('inventory.messages.scale_product_created_desc_text')} ${productName}`,
                                        type: 'success',
                                        duration: 3000,
                                    });
                                } else if (
                                    modalState.mode === 'edit' &&
                                    scaleProductData
                                ) {
                                    // Handle edit completion
                                    handleCloseEditModals(scaleProductData);
                                }
                            }}
                            editScaleProduct={
                                modalState.mode === 'edit'
                                    ? (modalState.data as unknown as ScaleProduct)
                                    : undefined
                            }
                        />
                    )}

                    {/* Card Modal */}
                    {modalState.type === 'card' && (
            <AddCardModal
                            isOpen={true}
                            onClose={(
                                updatedData?:
                                    | NameCard
                                    | { id: number; name_card: NameCard }
                                    | undefined,
                            ) => {
                                dispatchModal({ type: 'CLOSE' });
                                if (
                                    modalState.mode === 'create' &&
                                    updatedData
                                ) {
                                    // Check if it's a name card or card update
                                    if ('name_card' in updatedData) {
                                        // It's a card update
                                        addProductToList(
                                            updatedData as unknown as Card,
                                        );

                                        // Show success toast
                                        const cardName = updatedData.name_card?.name || 'Card';
                                        toast({
                                            title: t('inventory.messages.card_created'),
                                            description: `${t('inventory.messages.card_created_desc_text')} ${cardName}`,
                                            type: 'success',
                                            duration: 3000,
                                        });
                                    } else {
                                        // It's a name card update - refresh the inventory to show updated name cards
                                        loadInventoryItems();
                                        
                                        // Show success toast
                                        const nameCardName = updatedData.name || 'Name Card';
                                        toast({
                                            title: t('inventory.messages.name_card_created'),
                                            description: `${t('inventory.messages.name_card_created_desc_text')} ${nameCardName}`,
                                            type: 'success',
                                            duration: 3000,
                                        });
                                    }
                                } else if (
                                    modalState.mode === 'edit' &&
                                    updatedData
                                ) {
                                    // Handle edit completion - check if it's name card or card
                                    if ('name_card' in updatedData) {
                                        // It's a card edit
                                        handleCloseEditModals(
                                            updatedData as unknown as Card,
                                        );
                                    } else {
                                        // It's a name card edit - refresh the inventory to show updated name cards
                                        loadInventoryItems();
                                        
                                        // Show success toast
                                        const nameCardName = updatedData.name || 'Name Card';
                                        toast({
                                            title: t('inventory.messages.name_card_updated'),
                                            description: `${t('inventory.messages.name_card_updated_desc_text')} ${nameCardName}`,
                                            type: 'success',
                                            duration: 3000,
                                        });
                                    }
                                }
                            }}
                        />
                    )}

                    {/* Adjust Modal */}
                    {modalState.type === 'adjust' && (
            <AdjustModal
                            isOpen={true}
                            onClose={(adjustmentResults?: unknown[]) => {
                                dispatchModal({ type: 'CLOSE' });
                                // Smart update: only update if there are actual adjustment results
                                if (
                                    adjustmentResults &&
                                    adjustmentResults.length > 0
                                ) {
                                    updateMultipleInventoryItems(
                                        adjustmentResults,
                                    );
                                }
                                // No refresh on simple close/cancel
                            }}
                            inventoryItems={allItems}
                        />
                    )}

                    {/* Import Modal */}
                    {modalState.type === 'import' && (
            <ImportProductsModal
                            isOpen={true}
                            onClose={(result) => {
                                dispatchModal({ type: 'CLOSE' });
                                
                                if (result?.requiresRefresh || (result?.created ?? result?.imported ?? 0) > 0 || (result?.updated ?? 0) > 0) {
                                    void loadInventoryItems(true);
                                    void loadComprehensiveStatistics(true);
                                }
                            }}
                        />
                    )}

                    {/* Delete Modal */}
                    {modalState.type === 'delete' && (
            <DeleteModal
                            isOpen={true}
                            title={t('inventory.delete_modal.delete_item')}
                            description={
                                modalState.data
                                    ? `${t('inventory.delete_modal.confirm_delete_text')} ${modalState.data.name}`
                                    : ''
                            }
                            confirmButtonText={t('inventory.delete_modal.delete_button')}
                            cancelButtonText={t('inventory.delete_modal.cancel_button')}
                            onConfirm={handleDeleteConfirm}
                            onClose={handleDeleteModalClose}
                        />
                    )}

                    {/* Product Details Modal */}
                    {modalState.type === 'productDetails' && (
            <ProductDetailsModal
                            isOpen={true}
                            onClose={handleProductDetailsModalClose}
                            item={modalState.data as InventoryItem}
                        />
                    )}
                </>
            )}

            {/* Inventory Cards Modal - Independent Modal */}
            <InventoryCardsModal
                isOpen={cardsModalOpen}
                onClose={() => setCardsModalOpen(false)}
                onDataChange={() => {
                    // Refresh inventory data when cards are modified
                    loadInventoryItems();
                }}
            />
        </AppLayout>
    );
}
