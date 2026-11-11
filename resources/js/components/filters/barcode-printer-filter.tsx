import { SearchableDropdown } from '@/components/forms/searchable-dropdown';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/hooks/use-translation';
import { type Category } from '@/services/business/categoryService';
import { type Supplier } from '@/services/business/supplierService';
import { Filter, RotateCcw, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

// Filter interfaces
export interface BarcodePrinterFilterOptions {
    name?: string;
    barcode?: string;
    category?: string;
    supplier?: string;
}

interface BarcodePrinterFilterProps {
    filters: BarcodePrinterFilterOptions;
    onFiltersChange: (filters: BarcodePrinterFilterOptions) => void;
    className?: string;
    disabled?: boolean;
    categories?: Category[];
    suppliers?: Supplier[];
}

export function BarcodePrinterFilter({
    filters,
    onFiltersChange,
    className = '',
    disabled = false,
    categories = [],
    suppliers = [],
}: BarcodePrinterFilterProps) {
    const { t } = useTranslation();
    const [localNameSearch, setLocalNameSearch] = useState(filters.name || '');
    const [localBarcodeSearch, setLocalBarcodeSearch] = useState(filters.barcode || '');

    useEffect(() => {
        setLocalNameSearch(filters.name || '');
    }, [filters.name]);

    useEffect(() => {
        setLocalBarcodeSearch(filters.barcode || '');
    }, [filters.barcode]);

    const fetchCategoryOptions = useCallback(
        async (query: string) => {
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
        key: keyof BarcodePrinterFilterOptions,
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

    const clearFilter = (key: keyof BarcodePrinterFilterOptions) => {
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
                    </div>
                </div>

                {/* Main Filter Section - 4 filters only */}
                <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                    {/* Name Search Filter */}
                    <div className="space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                        <Label className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {t('filters.name_search')}
                        </Label>
                        <Input
                            type="text"
                            placeholder={t('filters.name_search_placeholder')}
                            value={localNameSearch}
                            onChange={(e) => {
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

                    <div className="space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-green-50 dark:hover:bg-green-900/20">
                        <Label className="text-sm font-medium text-green-600 dark:text-green-400">
                            {t('filters.barcode_search')}
                        </Label>
                        <Input
                            type="text"
                            placeholder={t('filters.barcode_search_placeholder')}
                            value={localBarcodeSearch}
                            onChange={(e) => {
                                setLocalBarcodeSearch(e.target.value);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleFilterChange('barcode', localBarcodeSearch);
                                }
                            }}
                            className="border-green-300 bg-green-50 hover:border-green-500 hover:bg-green-100 focus:border-green-500 focus:bg-green-100 focus:ring-2 focus:ring-green-200 focus:outline-none dark:border-green-600 dark:bg-green-900/20 dark:hover:border-green-500 dark:hover:bg-green-900/30 dark:focus:border-green-500 dark:focus:bg-green-900/30 dark:focus:ring-2 dark:focus:ring-green-400"
                            disabled={disabled}
                        />
                    </div>

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
                </div>

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
                                                key as keyof BarcodePrinterFilterOptions,
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
