import { SearchableDropdown } from '@/components/forms/searchable-dropdown';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useTranslation } from '@/hooks/use-translation';
import { type Category } from '@/services/business/categoryService';
import { type Supplier } from '@/services/business/supplierService';
import {
    Calendar,
    CalendarDays,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    Clock,
    DollarSign,
    Filter,
    Package2,
    RotateCcw,
    TrendingUp,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

// Filter interfaces
export interface FilterOptions {
    name?: string;
    barcode?: string;
    status?: string;
    category?: string;
    supplier?: string;
    productType?: string;
    dateFrom?: string;
    dateTo?: string;
    priceMin?: string;
    priceMax?: string;
    stockMin?: string;
    stockMax?: string;
    notSoldPeriod?: string;
    expireDateMin?: string;
    expireDateMax?: string;
    inventoryMin?: string;
    inventoryMax?: string;
    profitMarginMin?: string;
    profitMarginMax?: string;
}

export interface FilterConfig {
    showNameSearch?: boolean;
    showBarcodeSearch?: boolean;
    showStatus?: boolean;
    showCategory?: boolean;
    showSupplier?: boolean;
    showProductType?: boolean;
    showDateRange?: boolean;
    showPriceRange?: boolean;
    showStockRange?: boolean;
    showNotSoldPeriod?: boolean;
    showExpireDateRange?: boolean;
    showInventoryRange?: boolean;
    showProfitMarginRange?: boolean;
    showAdvanced?: boolean;
    statusOptions?: Array<{ value: string; label: string }>;
    categoryOptions?: Array<{ value: string; label: string }>;
    supplierOptions?: Array<{ value: string; label: string }>;
    productTypeOptions?: Array<{ value: string; label: string }>;
    notSoldPeriodOptions?: Array<{ value: string; label: string }>;
}

interface FilterComponentProps {
    filters: FilterOptions;
    onFiltersChange: (filters: FilterOptions) => void;
    config?: FilterConfig;
    className?: string;
    disabled?: boolean;
    categories?: Category[];
    suppliers?: Supplier[];
}

const createDefaultConfig = (
    t: (key: string) => string,
): FilterConfig => ({
    showNameSearch: true,
    showBarcodeSearch: true,
    showStatus: true,
    showCategory: true,
    showSupplier: true,
    showProductType: true,
    showDateRange: true,
    showPriceRange: true,
    showStockRange: true,
    showNotSoldPeriod: true,
    showExpireDateRange: true,
    showInventoryRange: true,
    showProfitMarginRange: true,
    showAdvanced: true,
    statusOptions: [
        {
            value: 'all',
            label: t('filter_component.status_options.all_status'),
        },
        {
            value: 'active',
            label: t('filter_component.status_options.in_stock'),
        },
        {
            value: 'low_stock',
            label: t('filter_component.status_options.low_stock'),
        },
        {
            value: 'out_of_stock',
            label: t('filter_component.status_options.out_of_stock'),
        },
    ],
    categoryOptions: [
        {
            value: 'all',
            label: t('filter_component.category_options.all_categories'),
        },
    ],
    supplierOptions: [
        {
            value: 'all',
            label: t('filter_component.supplier_options.all_suppliers'),
        },
    ],
    productTypeOptions: [
        {
            value: 'all',
            label: t('filter_component.product_type_options.all_types'),
        },
        {
            value: 'normal',
            label: t('filter_component.product_type_options.normal_product'),
        },
        { value: 'card', label: t('filter_component.product_type_options.card') },
        {
            value: 'scale',
            label: t('filter_component.product_type_options.scale'),
        },
    ],
    notSoldPeriodOptions: [
        {
            value: 'all',
            label: t('filter_component.not_sold_period_options.all_products'),
        },
        {
            value: '15',
            label: t('filter_component.not_sold_period_options.not_sold_15'),
        },
        {
            value: '30',
            label: t('filter_component.not_sold_period_options.not_sold_30'),
        },
        {
            value: '60',
            label: t('filter_component.not_sold_period_options.not_sold_60'),
        },
        {
            value: '90',
            label: t('filter_component.not_sold_period_options.not_sold_90'),
        },
        {
            value: '120',
            label: t('filter_component.not_sold_period_options.not_sold_120'),
        },
    ],
});

export function FilterComponent({
    filters,
    onFiltersChange,
    config,
    className = '',
    disabled = false,
    categories = [],
    suppliers = [],
}: FilterComponentProps) {
    const { t } = useTranslation();
    const [showAdvanced, setShowAdvanced] = useState(false);
    
    // Local state for input values (to prevent auto-triggering filters)
    const [localNameSearch, setLocalNameSearch] = useState(filters.name || '');
    const [localBarcodeSearch, setLocalBarcodeSearch] = useState(filters.barcode || '');
    
    // Ref to track when we intentionally clear the barcode input
    const isClearingBarcodeRef = useRef(false);

    // Sync local state with filters when they change externally
    useEffect(() => {
        setLocalNameSearch(filters.name || '');
    }, [filters.name]);

    useEffect(() => {
        // Don't sync if we're intentionally clearing the input
        if (!isClearingBarcodeRef.current) {
            setLocalBarcodeSearch(filters.barcode || '');
        } else {
            // Reset the flag after sync is skipped
            isClearingBarcodeRef.current = false;
        }
    }, [filters.barcode]);

    const defaultConfig = createDefaultConfig(t);

    const mergedConfig = {
        ...defaultConfig,
        ...config,
        categoryOptions: [
            {
                value: 'all',
                label: t('filter_component.category_options.all_categories'),
            },
            ...categories.map((cat) => ({ value: cat.name, label: cat.name })),
        ],
        supplierOptions: [
            {
                value: 'all',
                label: t('filter_component.supplier_options.all_suppliers'),
            },
            ...suppliers.map((sup) => ({ value: sup.name, label: sup.name })),
        ],
    };

    const fetchCategoryOptions = useCallback(
        async (query: string) => {
            // Use static categories for fast, no-loading performance
            const normalizedQuery = query.trim().toLowerCase();
            if (!normalizedQuery) {
                return categories;
            }

            return categories.filter((category) =>
                category.name
                    ?.toLowerCase()
                    .includes(normalizedQuery),
            );
        },
        [categories],
    );

    const fetchSupplierOptions = useCallback(
        async (query: string) => {
            // Use static suppliers for fast, no-loading performance
            const normalizedQuery = query.trim().toLowerCase();
            if (!normalizedQuery) {
                return suppliers;
            }

            return suppliers.filter((supplier) =>
                supplier.name
                    ?.toLowerCase()
                    .includes(normalizedQuery),
            );
        },
        [suppliers],
    );

    const handleFilterChange = (
        key: keyof FilterOptions,
        value?: string,
    ) => {
        const sanitizedValue =
            value === undefined ||
            (typeof value === 'string' &&
                (value.trim() === '' || value === 'all'))
                ? undefined
                : value;
        onFiltersChange({
            ...filters,
            [key]: sanitizedValue,
        });
    };

    const getActiveFiltersCount = () => {
        return Object.entries(filters).filter(([key, value]) => {
            if (key === 'search' && value) return true;
            if (key !== 'search' && value && value !== 'all') return true;
            return false;
        }).length;
    };

    const clearAllFilters = () => {
        onFiltersChange({});
    };

    const clearFilter = (key: keyof FilterOptions) => {
        const newFilters = { ...filters };
        delete newFilters[key];
        onFiltersChange(newFilters);
    };

    const activeFiltersCount = getActiveFiltersCount();

    return (
        <div
            className={`w-full rounded-md bg-card text-card-foreground shadow-[0_-2px_8px_0_rgba(0,0,0,0.1),0_2px_8px_0_rgba(0,0,0,0.1)] dark:shadow-[0_-2px_8px_0_rgba(0,0,0,0.3),0_2px_8px_0_rgba(0,0,0,0.3)] ${className}`}
        >
            <div className="p-6">
                {/* Header with active filters count and clear button */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Filter className="h-5 w-5 text-[#1F3F3F]/60 dark:text-[#1F3F3F]/40" />
                            <h3 className="text-lg font-semibold text-foreground">
                                {t('filters.title')}
                            </h3>
                        </div>
                        {activeFiltersCount > 0 && (
                            <Badge
                                variant="secondary"
                                className="border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 dark:border-primary/80 dark:bg-primary/90/20 dark:text-primary/30"
                            >
                                {activeFiltersCount} {t('filters.active')}
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {activeFiltersCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearAllFilters}
                                disabled={disabled}
                                className="text-red-600 hover:bg-red-100 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                            >
                                <RotateCcw className="mr-1 h-4 w-4" />
                                {t('filters.clear_all')}
                            </Button>
                        )}
                        {mergedConfig.showAdvanced && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                disabled={disabled}
                                className="text-purple-600 hover:bg-purple-100 hover:text-purple-700 dark:text-purple-400 dark:hover:bg-purple-900/20 dark:hover:text-purple-300"
                            >
                                {t('filters.advanced')}
                                {showAdvanced ? (
                                    <ChevronUp className="ml-1 h-4 w-4" />
                                ) : (
                                    <ChevronDown className="ml-1 h-4 w-4" />
                                )}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Main Filter Section */}
                <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">

                    {/* Name Search Filter */}
                    {mergedConfig.showNameSearch && (
                        <div className="space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                            <Label className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                {t('filters.name_search')}
                            </Label>
                            <Input
                                type="text"
                                placeholder={t('filters.name_search_placeholder')}
                                value={localNameSearch}
                                onChange={(e) => {
                                    // Update local state only, don't trigger filter
                                    setLocalNameSearch(e.target.value);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleFilterChange('name', localNameSearch);
                                    }
                                }}
                                className="border-blue-300 bg-blue-50 hover:border-blue-500 hover:bg-blue-100 focus:border-blue-500 focus:bg-blue-100 focus:ring-2 focus:ring-blue-200 focus:outline-none dark:border-blue-600 dark:bg-blue-900/20 dark:hover:border-blue-500 dark:hover:bg-blue-900/30 dark:focus:border-blue-500 dark:focus:bg-blue-900/30 dark:focus:ring-2 dark:focus:ring-blue-400"
                                disabled={disabled}
                            />
                        </div>
                    )}

                    {/* Barcode Search Filter */}
                    {mergedConfig.showBarcodeSearch && (
                        <div className="space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-green-50 dark:hover:bg-green-900/20">
                            <Label className="text-sm font-medium text-green-600 dark:text-green-400">
                                {t('filters.barcode_search')}
                            </Label>
                            <Input
                                type="text"
                                placeholder={t('filters.barcode_search_placeholder')}
                                value={localBarcodeSearch}
                                onChange={(e) => {
                                    // Update local state only, don't trigger filter
                                    setLocalBarcodeSearch(e.target.value);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        // Apply filter first
                                        handleFilterChange('barcode', localBarcodeSearch);
                                        // Then clear only the input (filter stays active)
                                        // Set flag to prevent useEffect from syncing it back
                                        isClearingBarcodeRef.current = true;
                                        setLocalBarcodeSearch('');
                                    }
                                }}
                                className="border-green-300 bg-green-50 hover:border-green-500 hover:bg-green-100 focus:border-green-500 focus:bg-green-100 focus:ring-2 focus:ring-green-200 focus:outline-none dark:border-green-600 dark:bg-green-900/20 dark:hover:border-green-500 dark:hover:bg-green-900/30 dark:focus:border-green-500 dark:focus:bg-green-900/30 dark:focus:ring-2 dark:focus:ring-green-400"
                                disabled={disabled}
                            />
                        </div>
                    )}

                    {/* Product Type Filter */}
                    {mergedConfig.showProductType && (
                        <div className="space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-orange-50 dark:hover:bg-orange-900/20">
                            <Label className="text-sm font-medium text-orange-600 dark:text-orange-400">
                                {t('filters.product_type')}
                            </Label>
                            <Select
                                value={filters.productType || 'all'}
                                onValueChange={(value: string) =>
                                    handleFilterChange('productType', value)
                                }
                                disabled={disabled}
                            >
                                <SelectTrigger className="border-orange-300 bg-orange-50 hover:border-orange-500 hover:bg-orange-100 focus:border-orange-500 focus:bg-orange-100 focus:ring-2 focus:ring-orange-200 focus:outline-none dark:border-orange-600 dark:bg-orange-900/20 dark:hover:border-orange-500 dark:hover:bg-orange-900/30 dark:focus:border-orange-500 dark:focus:bg-orange-900/30 dark:focus:ring-2 dark:focus:ring-orange-400">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="border-orange-300 dark:border-orange-600">
                                    {mergedConfig.productTypeOptions?.map(
                                        (option) => (
                                            <SelectItem
                                                key={option.value}
                                                value={option.value}
                                                className="focus:bg-orange-50 focus:text-orange-900 data-[highlighted]:bg-orange-50 data-[highlighted]:text-orange-900 data-[state=checked]:bg-orange-100 data-[state=checked]:text-orange-900 dark:focus:bg-orange-900/20 dark:focus:text-orange-100 dark:data-[highlighted]:bg-orange-900/20 dark:data-[highlighted]:text-orange-100 dark:data-[state=checked]:bg-orange-900/30 dark:data-[state=checked]:text-orange-100"
                                            >
                                                {option.label}
                                            </SelectItem>
                                        ),
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Category Filter */}
                    {mergedConfig.showCategory && (
                        <SearchableDropdown<Category>
                            label={t('filters.category')}
                            value={
                                filters.category && filters.category !== 'all'
                                    ? filters.category
                                    : undefined
                            }
                            onValueChange={(value) =>
                                handleFilterChange('category', value)
                            }
                            fetchOptions={fetchCategoryOptions}
                            getOptionLabel={(category) =>
                                category.name ?? ''
                            }
                            placeholder={t('filters.category_placeholder')}
                            searchPlaceholder={t(
                                'filters.category_placeholder',
                            )}
                            initialOptions={categories}
                            disabled={disabled}
                            className="hover:bg-purple-50 dark:hover:bg-purple-900/20"
                            labelClassName="text-purple-600 dark:text-purple-400"
                            inputClassName="border-purple-300 bg-purple-50 hover:border-purple-500 hover:bg-purple-100 focus:border-purple-500 focus:bg-purple-100 focus:ring-2 focus:ring-purple-200 focus:outline-none dark:border-purple-600 dark:bg-purple-900/20 dark:hover:border-purple-500 dark:hover:bg-purple-900/30 dark:focus:border-purple-500 dark:focus:bg-purple-900/30 dark:focus:ring-2 dark:focus:ring-purple-400"
                            selectionClassName="border-purple-300 bg-purple-50 hover:border-purple-500 hover:bg-purple-100 dark:border-purple-600 dark:bg-purple-900/20 dark:hover:border-purple-500 dark:hover:bg-purple-900/30"
                            dropdownClassName="border-purple-200 dark:border-purple-800"
                            optionClassName="hover:bg-purple-50 hover:text-purple-900 dark:hover:bg-purple-900/20 dark:hover:text-purple-100"
                            allLabel={t(
                                'filter_component.category_options.all_categories',
                            )}
                            allButtonClassName="text-purple-600 hover:bg-purple-50 hover:text-purple-900 dark:text-purple-300 dark:hover:bg-purple-900/20 dark:hover:text-purple-100"
                        />
                    )}

                    {/* Supplier Filter */}
                    {mergedConfig.showSupplier && (
                        <SearchableDropdown<Supplier>
                            label={t('filters.supplier')}
                            value={
                                filters.supplier && filters.supplier !== 'all'
                                    ? filters.supplier
                                    : undefined
                            }
                            onValueChange={(value) =>
                                handleFilterChange('supplier', value)
                            }
                            fetchOptions={fetchSupplierOptions}
                            getOptionLabel={(supplier) =>
                                supplier.name ?? ''
                            }
                            getOptionDescription={(supplier) =>
                                supplier.phone || undefined
                            }
                            placeholder={t('filters.supplier_placeholder')}
                            searchPlaceholder={t(
                                'filters.supplier_placeholder',
                            )}
                            initialOptions={suppliers}
                            disabled={disabled}
                            className="hover:bg-red-50 dark:hover:bg-red-900/20"
                            labelClassName="text-red-600 dark:text-red-400"
                            inputClassName="border-red-300 bg-red-50 hover:border-red-500 hover:bg-red-100 focus:border-red-500 focus:bg-red-100 focus:ring-2 focus:ring-red-200 focus:outline-none dark:border-red-600 dark:bg-red-900/20 dark:hover:border-red-500 dark:hover:bg-red-900/30 dark:focus:border-red-500 dark:focus:bg-red-900/30 dark:focus:ring-2 dark:focus:ring-red-400"
                            selectionClassName="border-red-300 bg-red-50 hover:border-red-500 hover:bg-red-100 dark:border-red-600 dark:bg-red-900/20 dark:hover:border-red-500 dark:hover:bg-red-900/30"
                            dropdownClassName="border-red-200 dark:border-red-800"
                            optionClassName="hover:bg-red-50 hover:text-red-900 dark:hover:bg-red-900/20 dark:hover:text-red-100"
                            allLabel={t(
                                'filter_component.supplier_options.all_suppliers',
                            )}
                            allButtonClassName="text-red-600 hover:bg-red-50 hover:text-red-900 dark:text-red-300 dark:hover:bg-red-900/20 dark:hover:text-red-100"
                        />
                    )}
                </div>

                {/* Advanced Filter Section */}
                <div
                    className={`transition-all duration-300 ease-in-out ${
                        showAdvanced
                            ? 'max-h-96 opacity-100'
                            : 'max-h-0 overflow-hidden opacity-0'
                    }`}
                >
                    <div className="mt-2 border-t border-border/50 pt-6">
                        <h4 className="text-md mb-4 flex items-center gap-2 font-medium text-foreground">
                            <Filter className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            {t('filters.advanced_filters')}
                        </h4>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                            {/* Status Filter */}
                            {mergedConfig.showStatus && (
                                <div className="space-y-3 rounded-md p-3">
                                    <Label className="flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400">
                                        <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        {t('filters.status')}
                                    </Label>
                                    <Select
                                        value={filters.status || 'all'}
                                        onValueChange={(value: string) =>
                                            handleFilterChange('status', value)
                                        }
                                        disabled={disabled}
                                    >
                                        <SelectTrigger className="border-blue-200 focus:border-blue-400 focus:bg-blue-50 focus:ring-2 focus:ring-blue-200 focus:outline-none dark:border-blue-800 dark:focus:border-blue-600 dark:focus:bg-blue-950/20 dark:focus:ring-2 dark:focus:ring-blue-800">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="border-blue-200 dark:border-blue-800">
                                            {mergedConfig.statusOptions?.map(
                                                (option) => (
                                                    <SelectItem
                                                        key={option.value}
                                                        value={option.value}
                                                        className="focus:bg-blue-50 focus:text-blue-900 data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-900 data-[state=checked]:bg-blue-100 data-[state=checked]:text-blue-900 dark:focus:bg-blue-950/20 dark:focus:text-blue-100 dark:data-[highlighted]:bg-blue-950/20 dark:data-[highlighted]:text-blue-100 dark:data-[state=checked]:bg-blue-900/30 dark:data-[state=checked]:text-blue-100"
                                                    >
                                                        {option.label}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Not Sold Period Filter */}
                            {mergedConfig.showNotSoldPeriod && (
                                <div className="space-y-3 rounded-md p-3">
                                    <Label className="flex items-center gap-1 text-sm font-medium text-red-600 dark:text-red-400">
                                        <Clock className="h-4 w-4 text-red-600 dark:text-red-400" />
                                        {t('filters.not_sold_period')}
                                    </Label>
                                    <Select
                                        value={filters.notSoldPeriod || 'all'}
                                        onValueChange={(value: string) =>
                                            handleFilterChange(
                                                'notSoldPeriod',
                                                value,
                                            )
                                        }
                                        disabled={disabled}
                                    >
                                        <SelectTrigger className="border-red-200 focus:border-red-400 focus:bg-red-50 focus:ring-2 focus:ring-red-200 focus:outline-none dark:border-red-800 dark:focus:border-red-600 dark:focus:bg-red-950/20 dark:focus:ring-2 dark:focus:ring-red-800">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="border-red-200 dark:border-red-800">
                                            {mergedConfig.notSoldPeriodOptions?.map(
                                                (option) => (
                                                    <SelectItem
                                                        key={option.value}
                                                        value={option.value}
                                                        className="focus:bg-red-50 focus:text-red-900 data-[highlighted]:bg-red-50 data-[highlighted]:text-red-900 data-[state=checked]:bg-red-100 data-[state=checked]:text-red-900 dark:focus:bg-red-950/20 dark:focus:text-red-100 dark:data-[highlighted]:bg-red-950/20 dark:data-[highlighted]:text-red-100 dark:data-[state=checked]:bg-red-900/30 dark:data-[state=checked]:text-red-100"
                                                    >
                                                        {option.label}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Min Expire Date Filter */}
                            {mergedConfig.showExpireDateRange && (
                                <div className="space-y-3 rounded-md p-3">
                                    <Label className="flex items-center gap-1 text-sm font-medium text-green-600 dark:text-green-400">
                                        <CalendarDays className="h-4 w-4 text-green-600 dark:text-green-400" />
                                        {t('filters.expire_date_min')}
                                    </Label>
                                    <DatePicker
                                        value={filters.expireDateMin || ''}
                                        onChange={(date) =>
                                            handleFilterChange(
                                                'expireDateMin',
                                                date,
                                            )
                                        }
                                        placeholder={t(
                                            'filters.expire_date_min',
                                        )}
                                        className="border-green-200 focus:border-green-400 focus:bg-green-50 focus:ring-2 focus:ring-green-200 focus:outline-none dark:border-green-800 dark:focus:border-green-600 dark:focus:bg-green-950/20 dark:focus:ring-2 dark:focus:ring-green-800"
                                        disabled={disabled}
                                    />
                                </div>
                            )}

                            {/* Max Expire Date Filter */}
                            {mergedConfig.showExpireDateRange && (
                                <div className="space-y-3 rounded-md p-3">
                                    <Label className="flex items-center gap-1 text-sm font-medium text-green-600 dark:text-green-400">
                                        <CalendarDays className="h-4 w-4 text-green-600 dark:text-green-400" />
                                        {t('filters.expire_date_max')}
                                    </Label>
                                    <DatePicker
                                        value={filters.expireDateMax || ''}
                                        onChange={(date) =>
                                            handleFilterChange(
                                                'expireDateMax',
                                                date,
                                            )
                                        }
                                        placeholder={t(
                                            'filters.expire_date_max',
                                        )}
                                        className="border-green-200 focus:border-green-400 focus:bg-green-50 focus:ring-2 focus:ring-green-200 focus:outline-none dark:border-green-800 dark:focus:border-green-600 dark:focus:bg-green-950/20 dark:focus:ring-2 dark:focus:ring-green-800"
                                        disabled={disabled}
                                    />
                                </div>
                            )}

                            {/* Min Price Filter */}
                            {mergedConfig.showPriceRange && (
                                <div className="space-y-3 rounded-md p-3">
                                    <Label className="flex items-center gap-1 text-sm font-medium text-purple-600 dark:text-purple-400">
                                        <DollarSign className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                        {t('filters.price_min')}
                                    </Label>
                                    <Input
                                        type="number"
                                        placeholder={t('filters.price_min')}
                                        value={filters.priceMin || ''}
                                        onChange={(e) =>
                                            handleFilterChange(
                                                'priceMin',
                                                e.target.value,
                                            )
                                        }
                                        className="border-purple-200 focus:border-purple-400 focus:bg-purple-50 focus:ring-2 focus:ring-purple-200 focus:outline-none dark:border-purple-800 dark:focus:border-purple-600 dark:focus:bg-purple-950/20 dark:focus:ring-2 dark:focus:ring-purple-800"
                                        disabled={disabled}
                                    />
                                </div>
                            )}

                            {/* Max Price Filter */}
                            {mergedConfig.showPriceRange && (
                                <div className="space-y-3 rounded-md p-3">
                                    <Label className="flex items-center gap-1 text-sm font-medium text-purple-600 dark:text-purple-400">
                                        <DollarSign className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                        {t('filters.price_max')}
                                    </Label>
                                    <Input
                                        type="number"
                                        placeholder={t('filters.price_max')}
                                        value={filters.priceMax || ''}
                                        onChange={(e) =>
                                            handleFilterChange(
                                                'priceMax',
                                                e.target.value,
                                            )
                                        }
                                        className="border-purple-200 focus:border-purple-400 focus:bg-purple-50 focus:ring-2 focus:ring-purple-200 focus:outline-none dark:border-purple-800 dark:focus:border-purple-600 dark:focus:bg-purple-950/20 dark:focus:ring-2 dark:focus:ring-purple-800"
                                        disabled={disabled}
                                    />
                                </div>
                            )}

                            {/* Min Inventory Filter */}
                            {mergedConfig.showInventoryRange && (
                                <div className="space-y-3 rounded-md p-3">
                                    <Label className="flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400">
                                        <Package2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                        {t('filters.inventory_min')}
                                    </Label>
                                    <Input
                                        type="number"
                                        placeholder={t('filters.inventory_min')}
                                        value={filters.inventoryMin || ''}
                                        onChange={(e) =>
                                            handleFilterChange(
                                                'inventoryMin',
                                                e.target.value,
                                            )
                                        }
                                        className="border-indigo-200 focus:border-indigo-400 focus:bg-indigo-50 focus:ring-2 focus:ring-indigo-200 focus:outline-none dark:border-indigo-800 dark:focus:border-indigo-600 dark:focus:bg-indigo-950/20 dark:focus:ring-2 dark:focus:ring-indigo-800"
                                        disabled={disabled}
                                    />
                                </div>
                            )}

                            {/* Max Inventory Filter */}
                            {mergedConfig.showInventoryRange && (
                                <div className="space-y-3 rounded-md p-3">
                                    <Label className="flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400">
                                        <Package2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                        {t('filters.inventory_max')}
                                    </Label>
                                    <Input
                                        type="number"
                                        placeholder={t('filters.inventory_max')}
                                        value={filters.inventoryMax || ''}
                                        onChange={(e) =>
                                            handleFilterChange(
                                                'inventoryMax',
                                                e.target.value,
                                            )
                                        }
                                        className="border-indigo-200 focus:border-indigo-400 focus:bg-indigo-50 focus:ring-2 focus:ring-indigo-200 focus:outline-none dark:border-indigo-800 dark:focus:border-indigo-600 dark:focus:bg-indigo-950/20 dark:focus:ring-2 dark:focus:ring-indigo-800"
                                        disabled={disabled}
                                    />
                                </div>
                            )}

                            {/* Min Profit Margin Filter */}
                            {mergedConfig.showProfitMarginRange && (
                                <div className="space-y-3 rounded-md p-3 transition-colors duration-200 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/10">
                                    <Label className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-emerald-700 dark:hover:text-emerald-300">
                                        <TrendingUp className="h-4 w-4 text-emerald-600 transition-colors duration-200 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300" />
                                        {t('filters.profit_margin_min')}
                                    </Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder={t(
                                            'filters.profit_margin_min',
                                        )}
                                        value={filters.profitMarginMin || ''}
                                        onChange={(e) =>
                                            handleFilterChange(
                                                'profitMarginMin',
                                                e.target.value,
                                            )
                                        }
                                        className="border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 focus:border-emerald-400 focus:bg-emerald-50 focus:ring-2 focus:ring-emerald-200 focus:outline-none dark:border-emerald-800 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/20 dark:focus:border-emerald-600 dark:focus:bg-emerald-950/20 dark:focus:ring-2 dark:focus:ring-emerald-800"
                                        disabled={disabled}
                                    />
                                </div>
                            )}

                            {/* Max Profit Margin Filter */}
                            {mergedConfig.showProfitMarginRange && (
                                <div className="space-y-3 rounded-md p-3 transition-colors duration-200 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/10">
                                    <Label className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-emerald-700 dark:hover:text-emerald-300">
                                        <TrendingUp className="h-4 w-4 text-emerald-600 transition-colors duration-200 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300" />
                                        {t('filters.profit_margin_max')}
                                    </Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder={t(
                                            'filters.profit_margin_max',
                                        )}
                                        value={filters.profitMarginMax || ''}
                                        onChange={(e) =>
                                            handleFilterChange(
                                                'profitMarginMax',
                                                e.target.value,
                                            )
                                        }
                                        className="border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 focus:border-emerald-400 focus:bg-emerald-50 focus:ring-2 focus:ring-emerald-200 focus:outline-none dark:border-emerald-800 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/20 dark:focus:border-emerald-600 dark:focus:bg-emerald-950/20 dark:focus:ring-2 dark:focus:ring-emerald-800"
                                        disabled={disabled}
                                    />
                                </div>
                            )}

                            {/* Date Range Filters */}
                            {mergedConfig.showDateRange && (
                                <>
                                    {/* From Date Filter */}
                                    <div className="space-y-3 rounded-md p-3">
                                        <Label className="flex items-center gap-1 text-sm font-medium text-orange-600 dark:text-orange-400">
                                            <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                            {t('filters.date_from')}
                                        </Label>
                                        <Input
                                            type="date"
                                            value={filters.dateFrom || ''}
                                            onChange={(e) =>
                                                handleFilterChange(
                                                    'dateFrom',
                                                    e.target.value,
                                                )
                                            }
                                            className="border-orange-200 focus:border-orange-400 focus:bg-orange-50 focus:ring-2 focus:ring-orange-200 focus:outline-none dark:border-orange-800 dark:focus:border-orange-600 dark:focus:bg-orange-950/20 dark:focus:ring-2 dark:focus:ring-orange-800"
                                            disabled={disabled}
                                        />
                                    </div>

                                    {/* To Date Filter */}
                                    <div className="space-y-3 rounded-md p-3">
                                        <Label className="flex items-center gap-1 text-sm font-medium text-orange-600 dark:text-orange-400">
                                            <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                            {t('filters.date_to')}
                                        </Label>
                                        <Input
                                            type="date"
                                            value={filters.dateTo || ''}
                                            onChange={(e) =>
                                                handleFilterChange(
                                                    'dateTo',
                                                    e.target.value,
                                                )
                                            }
                                            className="border-orange-200 focus:border-orange-400 focus:bg-orange-50 focus:ring-2 focus:ring-orange-200 focus:outline-none dark:border-orange-800 dark:focus:border-orange-600 dark:focus:bg-orange-950/20 dark:focus:ring-2 dark:focus:ring-orange-800"
                                            disabled={disabled}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Active Filters Tags */}
                {activeFiltersCount > 0 && (
                    <div className="mt-4 border-t border-border/50 pt-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                                {t('filters.active_filters')}:
                            </span>
                            {Object.entries(filters).map(([key, value]) => {
                                if (
                                    !value ||
                                    (typeof value === 'string' &&
                                        (value === 'all' ||
                                            value.trim() === ''))
                                )
                                    return null;
                                return (
                                    <Badge
                                        key={key}
                                        variant="secondary"
                                        className="cursor-pointer border-sky-200 bg-sky-100 text-sky-800 hover:bg-sky-200 dark:border-sky-800 dark:bg-sky-900/20 dark:text-[#1F3F3F]/30"
                                        onClick={() =>
                                            clearFilter(
                                                key as keyof FilterOptions,
                                            )
                                        }
                                    >
                                        {key}: {value}
                                        <X className="ml-1 h-3 w-3" />
                                    </Badge>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
