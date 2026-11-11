import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/hooks/use-translation';
import {
    Building2,
    DollarSign,
    Filter,
    Phone,
    RotateCcw,
    Search,
    X,
} from 'lucide-react';

export interface SupplierFilterOptions {
    search?: string;
    phone?: string;
    priceMin?: string;
    priceMax?: string;
}

interface SupplierFilterProps {
    filters: SupplierFilterOptions;
    onFiltersChange: (filters: SupplierFilterOptions) => void;
    className?: string;
    disabled?: boolean;
}

export function SupplierFilter({
    filters,
    onFiltersChange,
    className = '',
    disabled = false,
}: SupplierFilterProps) {
    const { t } = useTranslation();
    const handleFilterChange = (
        key: keyof SupplierFilterOptions,
        value: string,
    ) => {
        onFiltersChange({
            ...filters,
            [key]: value || undefined,
        });
    };

    const getActiveFiltersCount = () => {
        return Object.entries(filters).filter(([, value]) => {
            if (value && value.trim() !== '' && value !== 'all') return true;
            return false;
        }).length;
    };

    const clearAllFilters = () => {
        onFiltersChange({});
    };

    const clearFilter = (key: keyof SupplierFilterOptions) => {
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
                                {t('supplier_filter.title')}
                            </h3>
                        </div>
                        {activeFiltersCount > 0 && (
                            <Badge
                                variant="secondary"
                                className="border-primary-200 bg-primary-100 text-[#1F3F3F]/80 hover:bg-primary-200 dark:border-[#1F3F3F]/80 dark:bg-[#1F3F3F]/90/20 dark:text-[#1F3F3F]/30"
                            >
                                {activeFiltersCount} {t('supplier_filter.active_filters')}
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
                                {t('supplier_filter.clear_all')}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Filter Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                    {/* Name and Code Search */}
                    <div className="space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/10">
                        <Label className="flex items-center gap-1 text-sm font-medium text-indigo-700 transition-colors duration-200 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200">
                            <Building2 className="h-4 w-4" />
                            {t('supplier_filter.name_code')}
                        </Label>
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-indigo-600 dark:text-indigo-400" />
                            <Input
                                placeholder={t('supplier_filter.search_by_name_code')}
                                value={filters.search || ''}
                                onChange={(e) =>
                                    handleFilterChange('search', e.target.value)
                                }
                                className="border-indigo-200 pl-10 hover:border-indigo-300 hover:bg-indigo-50 focus:border-indigo-400 focus:bg-indigo-50 focus:ring-2 focus:ring-indigo-200 focus:outline-none dark:border-indigo-800 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/20 dark:focus:border-indigo-600 dark:focus:bg-indigo-950/20 dark:focus:ring-2 dark:focus:ring-indigo-800"
                                disabled={disabled}
                            />
                            {filters.search && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => clearFilter('search')}
                                    disabled={disabled}
                                    className="absolute top-1/2 right-2 h-6 w-6 -translate-y-1/2 p-0 text-red-600 hover:bg-red-100 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Phone Search */}
                    <div className="space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-green-50/50 dark:hover:bg-green-950/10">
                        <Label className="flex items-center gap-1 text-sm font-medium text-green-700 transition-colors duration-200 hover:text-green-800 dark:text-green-300 dark:hover:text-green-200">
                            <Phone className="h-4 w-4" />
                            {t('supplier_filter.phone')}
                        </Label>
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-green-600 dark:text-green-400" />
                            <Input
                                placeholder={t('supplier_filter.search_by_phone')}
                                value={filters.phone || ''}
                                onChange={(e) =>
                                    handleFilterChange('phone', e.target.value)
                                }
                                className="border-green-200 pl-10 hover:border-green-300 hover:bg-green-50 focus:border-green-400 focus:bg-green-50 focus:ring-2 focus:ring-green-200 focus:outline-none dark:border-green-800 dark:hover:border-green-700 dark:hover:bg-green-950/20 dark:focus:border-green-600 dark:focus:bg-green-950/20 dark:focus:ring-2 dark:focus:ring-green-800"
                                disabled={disabled}
                            />
                            {filters.phone && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => clearFilter('phone')}
                                    disabled={disabled}
                                    className="absolute top-1/2 right-2 h-6 w-6 -translate-y-1/2 p-0 text-red-600 hover:bg-red-100 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Min Amount Filter */}
                    <div className="space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-orange-50/50 dark:hover:bg-orange-950/10">
                        <Label className="flex items-center gap-1 text-sm font-medium text-orange-700 transition-colors duration-200 hover:text-orange-800 dark:text-orange-300 dark:hover:text-orange-200">
                            <DollarSign className="h-4 w-4" />
                            {t('supplier_filter.min_amount')}
                        </Label>
                        <div className="relative">
                            <DollarSign className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-orange-600 dark:text-orange-400" />
                            <Input
                                type="number"
                                step="0.01"
                                placeholder={t('supplier_filter.min_amount_placeholder')}
                                value={filters.priceMin || ''}
                                onChange={(e) =>
                                    handleFilterChange(
                                        'priceMin',
                                        e.target.value,
                                    )
                                }
                                className="border-orange-200 pl-10 hover:border-orange-300 hover:bg-orange-50 focus:border-orange-400 focus:bg-orange-50 focus:ring-2 focus:ring-orange-200 focus:outline-none dark:border-orange-800 dark:hover:border-orange-700 dark:hover:bg-orange-950/20 dark:focus:border-orange-600 dark:focus:bg-orange-950/20 dark:focus:ring-2 dark:focus:ring-orange-800"
                                disabled={disabled}
                            />
                            {filters.priceMin && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => clearFilter('priceMin')}
                                    disabled={disabled}
                                    className="absolute top-1/2 right-2 h-6 w-6 -translate-y-1/2 p-0 text-red-600 hover:bg-red-100 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Max Amount Filter */}
                    <div className="space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-orange-50/50 dark:hover:bg-orange-950/10">
                        <Label className="flex items-center gap-1 text-sm font-medium text-orange-700 transition-colors duration-200 hover:text-orange-800 dark:text-orange-300 dark:hover:text-orange-200">
                            <DollarSign className="h-4 w-4" />
                            {t('supplier_filter.max_amount')}
                        </Label>
                        <div className="relative">
                            <DollarSign className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-orange-600 dark:text-orange-400" />
                            <Input
                                type="number"
                                step="0.01"
                                placeholder={t('supplier_filter.max_amount_placeholder')}
                                value={filters.priceMax || ''}
                                onChange={(e) =>
                                    handleFilterChange(
                                        'priceMax',
                                        e.target.value,
                                    )
                                }
                                className="border-orange-200 pl-10 hover:border-orange-300 hover:bg-orange-50 focus:border-orange-400 focus:bg-orange-50 focus:ring-2 focus:ring-orange-200 focus:outline-none dark:border-orange-800 dark:hover:border-orange-700 dark:hover:bg-orange-950/20 dark:focus:border-orange-600 dark:focus:bg-orange-950/20 dark:focus:ring-2 dark:focus:ring-orange-800"
                                disabled={disabled}
                            />
                            {filters.priceMax && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => clearFilter('priceMax')}
                                    disabled={disabled}
                                    className="absolute top-1/2 right-2 h-6 w-6 -translate-y-1/2 p-0 text-red-600 hover:bg-red-100 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Active Filters Tags */}
                {activeFiltersCount > 0 && (
                    <div className="mt-4 border-t border-border/50 pt-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                                {t('supplier_filter.active_filters_label')}
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
                                                key as keyof SupplierFilterOptions,
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
