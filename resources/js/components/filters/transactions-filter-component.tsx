import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TimePicker } from '@/components/ui/time-picker';
import { useTranslation } from '@/hooks/use-translation';
import { Filter, Hash, RotateCcw, User as UserIcon, X } from 'lucide-react';

export interface transactionsFilterOptions {
    orderId?: string;
    cashierFullName?: string;
    dateFrom?: string;
    dateTo?: string;
    timeFrom?: string;
    timeTo?: string;
    priceMin?: string;
    priceMax?: string;
}

interface transactionsFilterComponentProps {
    filters: transactionsFilterOptions;
    onFiltersChange: (filters: transactionsFilterOptions) => void;
}

export function TransactionsFilterComponent({
    filters,
    onFiltersChange,
}: transactionsFilterComponentProps) {
    const { t } = useTranslation();

    const handleFilterChange = (
        key: keyof transactionsFilterOptions,
        value: string,
    ) => {
        onFiltersChange({
            ...filters,
            [key]: value || undefined,
        });
    };

    const getActiveFiltersCount = () => {
        return Object.entries(filters).filter(([key, value]) => {
            if (key === 'orderId' && value) return true;
            if (key === 'cashierFullName' && value) return true;
            if (
                key !== 'orderId' &&
                key !== 'cashierFullName' &&
                value &&
                value !== 'all'
            )
                return true;
            return false;
        }).length;
    };

    const clearAllFilters = () => {
        onFiltersChange({});
    };

    const clearFilter = (key: keyof transactionsFilterOptions) => {
        const newFilters = { ...filters };
        delete newFilters[key];
        onFiltersChange(newFilters);
    };

    const activeFiltersCount = getActiveFiltersCount();

    return (
        <div className="w-full rounded-md bg-card text-card-foreground shadow-[0_-2px_8px_0_rgba(0,0,0,0.1),0_2px_8px_0_rgba(0,0,0,0.1)] dark:shadow-[0_-2px_8px_0_rgba(0,0,0,0.3),0_2px_8px_0_rgba(0,0,0,0.3)]">
            <div className="p-6">
                {/* Header with active filters count and clear button */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Filter className="h-5 w-5 text-[#1F3F3F]/60 dark:text-[#1F3F3F]/40" />
                            <h3 className="text-lg font-semibold text-foreground">
                                {t('transactions.filter_transactions')}
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
                                className="text-red-600 hover:bg-red-100 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                            >
                                <RotateCcw className="mr-1 h-4 w-4" />
                                {t('filters.clear_all')}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Main Filter Section */}
                <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
                    {/* Order ID Input */}
                    <div className="space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/10">
                        <Label className="text-sm font-medium text-indigo-700 transition-colors duration-200 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200">
                            {t('transactions.order_id')}
                        </Label>
                        <div className="relative">
                            <Hash className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-indigo-600 dark:text-indigo-400" />
                            <Input
                                placeholder={t(
                                    'transactions.order_id_placeholder',
                                )}
                                value={filters.orderId || ''}
                                onChange={(e) =>
                                    handleFilterChange(
                                        'orderId',
                                        e.target.value,
                                    )
                                }
                                className="border-indigo-200 pl-10 hover:border-indigo-300 hover:bg-indigo-50 focus:border-indigo-400 focus:bg-indigo-50 focus:ring-2 focus:ring-indigo-200 focus:outline-none dark:border-indigo-800 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/20 dark:focus:border-indigo-600 dark:focus:bg-indigo-950/20 dark:focus:ring-2 dark:focus:ring-indigo-800"
                            />
                            {filters.orderId && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => clearFilter('orderId')}
                                    className="absolute top-1/2 right-2 h-6 w-6 -translate-y-1/2 p-0 text-red-600 hover:bg-red-100 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Cashier Full Name Input */}
                    <div className="space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-green-50/50 dark:hover:bg-green-950/10">
                        <Label className="text-sm font-medium text-green-700 transition-colors duration-200 hover:text-green-800 dark:text-green-300 dark:hover:text-green-200">
                            {t('transactions.cashier')}
                        </Label>
                        <div className="relative">
                            <UserIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-green-600 dark:text-green-400" />
                            <Input
                                placeholder={t(
                                    'transactions.cashier_fullname_placeholder',
                                )}
                                value={filters.cashierFullName || ''}
                                onChange={(e) =>
                                    handleFilterChange(
                                        'cashierFullName',
                                        e.target.value,
                                    )
                                }
                                className="border-green-200 pl-10 hover:border-green-300 hover:bg-green-50 focus:border-green-400 focus:bg-green-50 focus:ring-2 focus:ring-green-200 focus:outline-none dark:border-green-800 dark:hover:border-green-700 dark:hover:bg-green-950/20 dark:focus:border-green-600 dark:focus:bg-green-950/20 dark:focus:ring-2 dark:focus:ring-green-800"
                            />
                            {filters.cashierFullName && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                        clearFilter('cashierFullName')
                                    }
                                    className="absolute top-1/2 right-2 h-6 w-6 -translate-y-1/2 p-0 text-red-600 hover:bg-red-100 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Date From Filter */}
                    <div className="space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-primary/5/50 dark:hover:bg-primary/95/10">
                        <Label className="text-sm font-medium text-primary transition-colors duration-200 hover:text-primary dark:text-primary/30 dark:hover:text-primary/20">
                            {t('filters.date_from')}
                        </Label>
                        <DatePicker
                            value={filters.dateFrom || ''}
                            onChange={(date) =>
                                handleFilterChange('dateFrom', date)
                            }
                            placeholder={t('filters.date_from')}
                            className="border-primary/20 hover:border-primary/30 hover:bg-primary/5 focus:border-primary focus:bg-primary/5 focus:ring-2 focus:ring-primary/20 focus:outline-none dark:border-primary/80 dark:hover:border-primary/70 dark:hover:bg-primary/95/20 dark:focus:border-primary dark:focus:bg-primary/95/20 dark:focus:ring-2 dark:focus:ring-primary/80"
                        />
                    </div>

                    {/* Date To Filter */}
                    <div className="space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-primary/5/50 dark:hover:bg-primary/95/10">
                        <Label className="text-sm font-medium text-primary transition-colors duration-200 hover:text-primary dark:text-primary/30 dark:hover:text-primary/20">
                            {t('filters.date_to')}
                        </Label>
                        <DatePicker
                            value={filters.dateTo || ''}
                            onChange={(date) =>
                                handleFilterChange('dateTo', date)
                            }
                            placeholder={t('filters.date_to')}
                            className="border-primary/20 hover:border-primary/30 hover:bg-primary/5 focus:border-primary focus:bg-primary/5 focus:ring-2 focus:ring-primary/20 focus:outline-none dark:border-primary/80 dark:hover:border-primary/70 dark:hover:bg-primary/95/20 dark:focus:border-primary dark:focus:bg-primary/95/20 dark:focus:ring-2 dark:focus:ring-primary/80"
                        />
                    </div>

                    {/* Time From Filter */}
                    <div className="space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-orange-50/50 dark:hover:bg-orange-950/10">
                        <Label className="text-sm font-medium text-orange-700 transition-colors duration-200 hover:text-orange-800 dark:text-orange-300 dark:hover:text-orange-200">
                            {t('filters.time_from')}
                        </Label>
                        <TimePicker
                            value={filters.timeFrom || ''}
                            onChange={(time) =>
                                handleFilterChange('timeFrom', time)
                            }
                            placeholder={t('filters.select_time_from')}
                            className="border-orange-200 hover:border-orange-300 hover:bg-orange-50 focus:border-orange-400 focus:bg-orange-50 focus:ring-2 focus:ring-orange-200 focus:outline-none dark:border-orange-800 dark:hover:border-orange-700 dark:hover:bg-orange-950/20 dark:focus:border-orange-600 dark:focus:bg-orange-950/20 dark:focus:ring-2 dark:focus:ring-orange-800"
                        />
                    </div>

                    {/* Time To Filter */}
                    <div className="space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-orange-50/50 dark:hover:bg-orange-950/10">
                        <Label className="text-sm font-medium text-orange-700 transition-colors duration-200 hover:text-orange-800 dark:text-orange-300 dark:hover:text-orange-200">
                            {t('filters.time_to')}
                        </Label>
                        <TimePicker
                            value={filters.timeTo || ''}
                            onChange={(time) =>
                                handleFilterChange('timeTo', time)
                            }
                            placeholder={t('filters.select_time_to')}
                            className="border-orange-200 hover:border-orange-300 hover:bg-orange-50 focus:border-orange-400 focus:bg-orange-50 focus:ring-2 focus:ring-orange-200 focus:outline-none dark:border-orange-800 dark:hover:border-orange-700 dark:hover:bg-orange-950/20 dark:focus:border-orange-600 dark:focus:bg-orange-950/20 dark:focus:ring-2 dark:focus:ring-orange-800"
                        />
                    </div>

                    {/* Min Price Filter */}
                    <div className="space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-green-50/50 dark:hover:bg-green-950/10">
                        <Label className="text-sm font-medium text-green-700 transition-colors duration-200 hover:text-green-800 dark:text-green-300 dark:hover:text-green-200">
                            {t('filters.price_min')}
                        </Label>
                        <Input
                            type="number"
                            placeholder={t('filters.price_min')}
                            value={filters.priceMin || ''}
                            onChange={(e) =>
                                handleFilterChange('priceMin', e.target.value)
                            }
                            className="border-green-200 hover:border-green-300 hover:bg-green-50 focus:border-green-400 focus:bg-green-50 focus:ring-2 focus:ring-green-200 focus:outline-none dark:border-green-800 dark:hover:border-green-700 dark:hover:bg-green-950/20 dark:focus:border-green-600 dark:focus:bg-green-950/20 dark:focus:ring-2 dark:focus:ring-green-800"
                        />
                    </div>

                    {/* Max Price Filter */}
                    <div className="space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-green-50/50 dark:hover:bg-green-950/10">
                        <Label className="text-sm font-medium text-green-700 transition-colors duration-200 hover:text-green-800 dark:text-green-300 dark:hover:text-green-200">
                            {t('filters.price_max')}
                        </Label>
                        <Input
                            type="number"
                            placeholder={t('filters.price_max')}
                            value={filters.priceMax || ''}
                            onChange={(e) =>
                                handleFilterChange('priceMax', e.target.value)
                            }
                            className="border-green-200 hover:border-green-300 hover:bg-green-50 focus:border-green-400 focus:bg-green-50 focus:ring-2 focus:ring-green-200 focus:outline-none dark:border-green-800 dark:hover:border-green-700 dark:hover:bg-green-950/20 dark:focus:border-green-600 dark:focus:bg-green-950/20 dark:focus:ring-2 dark:focus:ring-green-800"
                        />
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
                                                key as keyof transactionsFilterOptions,
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
