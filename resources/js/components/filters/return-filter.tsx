import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
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
import { DollarSign, Filter, RotateCcw, Search, X } from 'lucide-react';

// Return Filter interfaces
export interface ReturnFilterOptions {
    returnId?: string;
    dateFrom?: string;
    dateTo?: string;
    timeFrom?: string;
    timeTo?: string;
    returnType?: string;
    amountMin?: string;
    amountMax?: string;
}

interface ReturnFilterProps {
    filters: ReturnFilterOptions;
    onFiltersChange: (filters: ReturnFilterOptions) => void;
    className?: string;
    disabled?: boolean;
}

export function ReturnFilter({
    filters,
    onFiltersChange,
    className = '',
    disabled = false,
}: ReturnFilterProps) {
    const { t } = useTranslation();
    const returnTypeOptions = [
        { value: 'all', label: t('return_filter.all_return_types') },
        { value: 'receipt', label: t('return_filter.receipt_returns') },
        { value: 'manual', label: t('return_filter.manual_returns') },
    ];

    const handleFilterChange = (
        key: keyof ReturnFilterOptions,
        value: string,
    ) => {
        const newFilters = {
            ...filters,
            [key]: value === '' || value === 'all' ? undefined : value,
        };
        onFiltersChange(newFilters);
    };

    const clearFilter = (key: keyof ReturnFilterOptions) => {
        const newFilters = { ...filters };
        delete newFilters[key];
        onFiltersChange(newFilters);
    };

    const clearAllFilters = () => {
        onFiltersChange({});
    };

    const getActiveFiltersCount = (): number => {
        return Object.values(filters).filter(
            (value) => value !== undefined && value !== '' && value !== 'all',
        ).length;
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
                                {t('return_filter.title')}
                            </h3>
                        </div>
                        {activeFiltersCount > 0 && (
                            <Badge
                                variant="secondary"
                                className="border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 dark:border-primary/80 dark:bg-primary/90/20 dark:text-primary/30"
                            >
                                {activeFiltersCount} {t('return_filter.active_filters')}
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
                                {t('return_filter.clear_all')}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Main Filter Section */}
                <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-8">
                    {/* Return Type Filter */}
                    <div className="space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-primary/5/50 dark:hover:bg-primary/95/10">
                        <Label className="text-sm font-medium text-primary transition-colors duration-200 hover:text-primary dark:text-primary/30 dark:hover:text-primary/20">
                            {t('return_filter.return_type')}
                        </Label>
                        <Select
                            value={filters.returnType || 'all'}
                            onValueChange={(value: string) =>
                                handleFilterChange('returnType', value)
                            }
                            disabled={disabled}
                        >
                            <SelectTrigger className="border-primary/20 hover:border-primary/30 hover:bg-primary/5 focus:border-primary focus:bg-primary/5 focus:ring-2 focus:ring-primary/20 focus:outline-none dark:border-primary/80 dark:hover:border-primary/70 dark:hover:bg-primary/95/20 dark:focus:border-primary dark:focus:bg-primary/95/20 dark:focus:ring-2 dark:focus:ring-primary/80">
                                <SelectValue placeholder={t('return_filter.select_return_type')} />
                            </SelectTrigger>
                            <SelectContent className="border-primary/20 dark:border-primary/80">
                                {returnTypeOptions.map((option) => (
                                    <SelectItem
                                        key={option.value}
                                        value={option.value}
                                        className="focus:bg-primary/5 focus:text-primary data-[highlighted]:bg-primary/5 data-[highlighted]:text-primary data-[state=checked]:bg-primary/10 data-[state=checked]:text-primary dark:focus:bg-primary/95/20 dark:focus:text-primary/10 dark:data-[highlighted]:bg-primary/95/20 dark:data-[highlighted]:text-primary/10 dark:data-[state=checked]:bg-primary/90/30 dark:data-[state=checked]:text-primary/10"
                                    >
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Search by Return ID */}
                    <div className="space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/10">
                        <Label className="text-sm font-medium text-indigo-700 transition-colors duration-200 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200">
                            {t('return_filter.return_id')}
                        </Label>
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-indigo-600 dark:text-indigo-400" />
                            <Input
                                placeholder={t('return_filter.search_by_return_id')}
                                value={filters.returnId || ''}
                                onChange={(e) =>
                                    handleFilterChange(
                                        'returnId',
                                        e.target.value,
                                    )
                                }
                                className="border-indigo-200 pl-10 hover:border-indigo-300 hover:bg-indigo-50 focus:border-indigo-400 focus:bg-indigo-50 focus:ring-2 focus:ring-indigo-200 focus:outline-none dark:border-indigo-800 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/20 dark:focus:border-indigo-600 dark:focus:bg-indigo-950/20 dark:focus:ring-2 dark:focus:ring-indigo-800"
                                disabled={disabled}
                            />
                            {filters.returnId && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => clearFilter('returnId')}
                                    disabled={disabled}
                                    className="absolute top-1/2 right-2 h-6 w-6 -translate-y-1/2 p-0 text-red-600 hover:bg-red-100 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* From Date */}
                    <div className="space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-green-50/50 dark:hover:bg-green-950/10">
                        <Label className="text-sm font-medium text-green-700 transition-colors duration-200 hover:text-green-800 dark:text-green-300 dark:hover:text-green-200">
                            {t('return_filter.from_date')}
                        </Label>
                        <DatePicker
                            value={filters.dateFrom || ''}
                            onChange={(date) =>
                                handleFilterChange('dateFrom', date)
                            }
                            placeholder={t('return_filter.from_date')}
                            className="border-green-200 hover:border-green-300 hover:bg-green-50 focus:border-green-400 focus:bg-green-50 focus:ring-2 focus:ring-green-200 focus:outline-none dark:border-green-800 dark:hover:border-green-700 dark:hover:bg-green-950/20 dark:focus:border-green-600 dark:focus:bg-green-950/20 dark:focus:ring-2 dark:focus:ring-green-800"
                            disabled={disabled}
                        />
                    </div>

                    {/* To Date */}
                    <div className="space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-green-50/50 dark:hover:bg-green-950/10">
                        <Label className="text-sm font-medium text-green-700 transition-colors duration-200 hover:text-green-800 dark:text-green-300 dark:hover:text-green-200">
                            {t('return_filter.to_date')}
                        </Label>
                        <DatePicker
                            value={filters.dateTo || ''}
                            onChange={(date) =>
                                handleFilterChange('dateTo', date)
                            }
                            placeholder={t('return_filter.to_date')}
                            className="border-green-200 hover:border-green-300 hover:bg-green-50 focus:border-green-400 focus:bg-green-50 focus:ring-2 focus:ring-green-200 focus:outline-none dark:border-green-800 dark:hover:border-green-700 dark:hover:bg-green-950/20 dark:focus:border-green-600 dark:focus:bg-green-950/20 dark:focus:ring-2 dark:focus:ring-green-800"
                            disabled={disabled}
                        />
                    </div>

                    {/* Time From Filter */}
                    <div className="space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/10">
                        <Label className="text-sm font-medium text-cyan-700 transition-colors duration-200 hover:text-cyan-800 dark:text-cyan-300 dark:hover:text-cyan-200">
                            {t('filters.time_from')}
                        </Label>
                        <TimePicker
                            value={filters.timeFrom || ''}
                            onChange={(time) =>
                                handleFilterChange('timeFrom', time)
                            }
                            placeholder={t('filters.select_time_from')}
                            className="border-cyan-200 hover:border-cyan-300 hover:bg-cyan-50 focus:border-cyan-400 focus:bg-cyan-50 focus:ring-2 focus:ring-cyan-200 focus:outline-none dark:border-cyan-800 dark:hover:border-cyan-700 dark:hover:bg-cyan-950/20 dark:focus:border-cyan-600 dark:focus:bg-cyan-950/20 dark:focus:ring-2 dark:focus:ring-cyan-800"
                            disabled={disabled}
                        />
                    </div>

                    {/* Time To Filter */}
                    <div className="space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/10">
                        <Label className="text-sm font-medium text-cyan-700 transition-colors duration-200 hover:text-cyan-800 dark:text-cyan-300 dark:hover:text-cyan-200">
                            {t('filters.time_to')}
                        </Label>
                        <TimePicker
                            value={filters.timeTo || ''}
                            onChange={(time) =>
                                handleFilterChange('timeTo', time)
                            }
                            placeholder={t('filters.select_time_to')}
                            className="border-cyan-200 hover:border-cyan-300 hover:bg-cyan-50 focus:border-cyan-400 focus:bg-cyan-50 focus:ring-2 focus:ring-cyan-200 focus:outline-none dark:border-cyan-800 dark:hover:border-cyan-700 dark:hover:bg-cyan-950/20 dark:focus:border-cyan-600 dark:focus:bg-cyan-950/20 dark:focus:ring-2 dark:focus:ring-cyan-800"
                            disabled={disabled}
                        />
                    </div>

                    {/* Min Amount */}
                    <div className="space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-purple-50/50 dark:hover:bg-purple-950/10">
                        <Label className="text-sm font-medium text-purple-700 transition-colors duration-200 hover:text-purple-800 dark:text-purple-300 dark:hover:text-purple-200">
                            {t('return_filter.min_amount')}
                        </Label>
                        <div className="relative">
                            <DollarSign className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-purple-600 dark:text-purple-400" />
                            <Input
                                type="number"
                                step="0.01"
                                placeholder={t('return_filter.min_amount_placeholder')}
                                value={filters.amountMin || ''}
                                onChange={(e) =>
                                    handleFilterChange(
                                        'amountMin',
                                        e.target.value,
                                    )
                                }
                                className="border-purple-200 pl-10 hover:border-purple-300 hover:bg-purple-50 focus:border-purple-400 focus:bg-purple-50 focus:ring-2 focus:ring-purple-200 focus:outline-none dark:border-purple-800 dark:hover:border-purple-700 dark:hover:bg-purple-950/20 dark:focus:border-purple-600 dark:focus:bg-purple-950/20 dark:focus:ring-2 dark:focus:ring-purple-800"
                                disabled={disabled}
                            />
                            {filters.amountMin && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => clearFilter('amountMin')}
                                    disabled={disabled}
                                    className="absolute top-1/2 right-2 h-6 w-6 -translate-y-1/2 p-0 text-red-600 hover:bg-red-100 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Max Amount */}
                    <div className="space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-pink-50/50 dark:hover:bg-pink-950/10">
                        <Label className="text-sm font-medium text-pink-700 transition-colors duration-200 hover:text-pink-800 dark:text-pink-300 dark:hover:text-pink-200">
                            {t('return_filter.max_amount')}
                        </Label>
                        <div className="relative">
                            <DollarSign className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-pink-600 dark:text-pink-400" />
                            <Input
                                type="number"
                                step="0.01"
                                placeholder={t('return_filter.max_amount_placeholder')}
                                value={filters.amountMax || ''}
                                onChange={(e) =>
                                    handleFilterChange(
                                        'amountMax',
                                        e.target.value,
                                    )
                                }
                                className="border-pink-200 pl-10 hover:border-pink-300 hover:bg-pink-50 focus:border-pink-400 focus:bg-pink-50 focus:ring-2 focus:ring-pink-200 focus:outline-none dark:border-pink-800 dark:hover:border-pink-700 dark:hover:bg-pink-950/20 dark:focus:border-pink-600 dark:focus:bg-pink-950/20 dark:focus:ring-2 dark:focus:ring-pink-800"
                                disabled={disabled}
                            />
                            {filters.amountMax && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => clearFilter('amountMax')}
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
                                {t('return_filter.active_filters')}:
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
                                                key as keyof ReturnFilterOptions,
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
