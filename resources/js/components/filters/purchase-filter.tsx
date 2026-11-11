import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { useTranslation } from '@/hooks/use-translation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Calendar,
    ChevronDown,
    ChevronUp,
    Clock,
    DollarSign,
    Filter,
    RotateCcw,
    Search,
    X,
} from 'lucide-react';
import { useState } from 'react';

export interface PurchaseFilterOptions {
    invoiceName?: string;
    invoiceId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    timeFrom?: string;
    timeTo?: string;
    priceMin?: string;
    priceMax?: string;
    multiSupplier?: string;
}

interface PurchaseFilterProps {
    filters: PurchaseFilterOptions;
    onFiltersChange: (filters: PurchaseFilterOptions) => void;
    className?: string;
    disabled?: boolean;
}

export function PurchaseFilter({
    filters,
    onFiltersChange,
    className = '',
    disabled = false,
}: PurchaseFilterProps) {
    const { t } = useTranslation();
    const [showAdvanced, setShowAdvanced] = useState(false);

    const handleFilterChange = (
        key: keyof PurchaseFilterOptions,
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

    const clearFilter = (key: keyof PurchaseFilterOptions) => {
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
                                {t('purchase.filter_title')}
                            </h3>
                        </div>
                        {activeFiltersCount > 0 && (
                            <Badge
                                variant="secondary"
                                className="border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 dark:border-primary/80 dark:bg-primary/90/20 dark:text-primary/30"
                            >
                                {activeFiltersCount} active
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
                                {t('purchase.filter_clear_all')}
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            disabled={disabled}
                            className="text-purple-600 hover:bg-purple-100 hover:text-purple-700 dark:text-purple-400 dark:hover:bg-purple-900/20 dark:hover:text-purple-300"
                        >
                            {t('purchase.filter_advanced')}
                            {showAdvanced ? (
                                <ChevronUp className="ml-1 h-4 w-4" />
                            ) : (
                                <ChevronDown className="ml-1 h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>

                {/* Basic Filter Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {/* Invoice Name Search */}
                    <div className="space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/10">
                            <Label className="text-sm font-medium text-indigo-700 transition-colors duration-200 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200">
                            {t('purchase.filter_invoice_name')}
                        </Label>
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-indigo-600 dark:text-indigo-400" />
                            <Input
                                placeholder={t('purchase.filter_invoice_name_placeholder')}
                                value={filters.invoiceName || ''}
                                onChange={(e) =>
                                    handleFilterChange(
                                        'invoiceName',
                                        e.target.value,
                                    )
                                }
                                className="border-indigo-200 pl-10 hover:border-indigo-300 hover:bg-indigo-50 focus:border-indigo-400 focus:bg-indigo-50 focus:ring-2 focus:ring-indigo-200 focus:outline-none dark:border-indigo-800 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/20 dark:focus:border-indigo-600 dark:focus:bg-indigo-950/20 dark:focus:ring-2 dark:focus:ring-indigo-800"
                                disabled={disabled}
                            />
                        </div>
                    </div>

                    {/* Invoice ID Search */}
                    <div className="space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-green-50/50 dark:hover:bg-green-950/10">
                            <Label className="text-sm font-medium text-green-700 transition-colors duration-200 hover:text-green-800 dark:text-green-300 dark:hover:text-green-200">
                            {t('purchase.filter_invoice_id')}
                        </Label>
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-green-600 dark:text-green-400" />
                            <Input
                                placeholder={t('purchase.filter_invoice_id_placeholder')}
                                value={filters.invoiceId || ''}
                                onChange={(e) =>
                                    handleFilterChange(
                                        'invoiceId',
                                        e.target.value,
                                    )
                                }
                                className="border-green-200 pl-10 hover:border-green-300 hover:bg-green-50 focus:border-green-400 focus:bg-green-50 focus:ring-2 focus:ring-green-200 focus:outline-none dark:border-green-800 dark:hover:border-green-700 dark:hover:bg-green-950/20 dark:focus:border-green-600 dark:focus:bg-green-950/20 dark:focus:ring-2 dark:focus:ring-green-800"
                                disabled={disabled}
                            />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div className="space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-sky-50/50 dark:hover:bg-sky-950/10">
                            <Label className="text-sm font-medium text-[#1F3F3F]/70 transition-colors duration-200 hover:text-sky-800 dark:text-[#1F3F3F]/30 dark:hover:text-sky-200">
                            {t('purchase.filter_status')}
                        </Label>
                        <Select
                            value={filters.status || 'all'}
                            onValueChange={(value: string) =>
                                handleFilterChange('status', value)
                            }
                            disabled={disabled}
                        >
                            <SelectTrigger className="border-sky-200 hover:border-[#1F3F3F]/30 hover:bg-sky-50 focus:border-[#1F3F3F]/40 focus:bg-sky-50 focus:ring-2 focus:ring-sky-200 focus:outline-none dark:border-sky-800 dark:hover:border-[#1F3F3F]/70 dark:hover:bg-sky-950/20 dark:focus:border-[#1F3F3F]/60 dark:focus:bg-sky-950/20 dark:focus:ring-2 dark:focus:ring-sky-800">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="border-sky-200 dark:border-sky-800">
                                <SelectItem value="all">{t('purchase.filter_options.all_statuses')}</SelectItem>
                                <SelectItem value="order">{t('purchase.status_labels.order')}</SelectItem>
                                <SelectItem value="receive">
                                    {t('purchase.status_labels.received')}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Multi-Supplier Filter */}
                    <div className="space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-purple-50/50 dark:hover:bg-purple-950/10">
                            <Label className="text-sm font-medium text-purple-700 transition-colors duration-200 hover:text-purple-800 dark:text-purple-300 dark:hover:text-purple-200">
                            {t('purchase.filter_suppliers')}
                        </Label>
                        <Select
                            value={filters.multiSupplier || 'all'}
                            onValueChange={(value: string) =>
                                handleFilterChange('multiSupplier', value)
                            }
                            disabled={disabled}
                        >
                            <SelectTrigger className="border-purple-200 hover:border-purple-300 hover:bg-purple-50 focus:border-purple-400 focus:bg-purple-50 focus:ring-2 focus:ring-purple-200 focus:outline-none dark:border-purple-800 dark:hover:border-purple-700 dark:hover:bg-purple-950/20 dark:focus:border-purple-600 dark:focus:bg-purple-950/20 dark:focus:ring-2 dark:focus:ring-purple-800">
                                <SelectValue placeholder={t('purchase.filter_options.supplier_filter')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    {t('purchase.filter_options.all_purchases')}
                                </SelectItem>
                                <SelectItem value="single">
                                    {t('purchase.filter_options.single_supplier')}
                                </SelectItem>
                                <SelectItem value="multiple">
                                    {t('purchase.filter_options.multiple_suppliers')}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <>
                    {/* Active Filters Tags */}
                    {activeFiltersCount > 0 && (
                        <div className="mt-4 border-t border-border/50 pt-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                    {t('purchase.filter_active_label')}
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
                                                    key as keyof PurchaseFilterOptions,
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

                    {/* Advanced Filter Section */}
                    <div
                        className={`transition-all duration-300 ease-in-out ${showAdvanced ? 'max-h-96 opacity-100' : 'max-h-0 overflow-hidden opacity-0'}`}
                    >
                        {showAdvanced && (
                            <div className="mt-2 border-t border-border/50 pt-6">
                                <h4 className="text-md mb-4 flex items-center gap-2 font-medium text-foreground">
                                    <Filter className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                    {t('purchase.filter_advanced_title')}
                                </h4>
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                                    {/* From Date Filter */}
                                    <div className="space-y-3 rounded-md p-3 transition-colors duration-200 hover:bg-primary/5/50 dark:hover:bg-primary/95/10">
                                        <Label className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-primary dark:hover:text-primary/30">
                                            <Calendar className="h-4 w-4 text-primary transition-colors duration-200 hover:text-primary dark:text-primary dark:hover:text-primary/30" />
                                            {t('purchase.filter_from_date')}
                                        </Label>
                                        <div className="relative">
                                            <DatePicker
                                                value={filters.dateFrom || ''}
                                                onChange={(date) =>
                                                    handleFilterChange(
                                                        'dateFrom',
                                                        date,
                                                    )
                                                }
                                                placeholder={t('purchase.filter_options.date_from')}
                                                className="border-primary/20 hover:border-primary/30 hover:bg-primary/5 focus:border-primary focus:bg-primary/5 focus:ring-2 focus:ring-primary/20 focus:outline-none dark:border-primary/80 dark:hover:border-primary/70 dark:hover:bg-primary/95/20 dark:focus:border-primary dark:focus:bg-primary/95/20 dark:focus:ring-2 dark:focus:ring-primary/80"
                                                disabled={disabled}
                                            />
                                        </div>
                                    </div>

                                    {/* To Date Filter */}
                                    <div className="space-y-3 rounded-md p-3 transition-colors duration-200 hover:bg-primary/5/50 dark:hover:bg-primary/95/10">
                                        <Label className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-primary dark:hover:text-primary/30">
                                            <Calendar className="h-4 w-4 text-primary transition-colors duration-200 hover:text-primary dark:text-primary dark:hover:text-primary/30" />
                                            {t('purchase.filter_to_date')}
                                        </Label>
                                        <div className="relative">
                                            <DatePicker
                                                value={filters.dateTo || ''}
                                                onChange={(date) =>
                                                    handleFilterChange(
                                                        'dateTo',
                                                        date,
                                                    )
                                                }
                                                placeholder={t('purchase.filter_options.date_to')}
                                                className="border-primary/20 hover:border-primary/30 hover:bg-primary/5 focus:border-primary focus:bg-primary/5 focus:ring-2 focus:ring-primary/20 focus:outline-none dark:border-primary/80 dark:hover:border-primary/70 dark:hover:bg-primary/95/20 dark:focus:border-primary dark:focus:bg-primary/95/20 dark:focus:ring-2 dark:focus:ring-primary/80"
                                                disabled={disabled}
                                            />
                                        </div>
                                    </div>

                                    {/* Time From Filter */}
                                    <div className="space-y-3 rounded-md p-3 transition-colors duration-200 hover:bg-orange-50/50 dark:hover:bg-orange-950/10">
                                        <Label className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-orange-700 dark:hover:text-orange-300">
                                            <Clock className="h-4 w-4 text-orange-600 transition-colors duration-200 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300" />
                                            {t('filters.time_from')}
                                        </Label>
                                        <TimePicker
                                            value={filters.timeFrom || ''}
                                            onChange={(time) =>
                                                handleFilterChange('timeFrom', time)
                                            }
                                            placeholder={t('filters.select_time_from')}
                                            className="border-orange-200 hover:border-orange-300 hover:bg-orange-50 focus:border-orange-400 focus:bg-orange-50 focus:ring-2 focus:ring-orange-200 focus:outline-none dark:border-orange-800 dark:hover:border-orange-700 dark:hover:bg-orange-950/20 dark:focus:border-orange-600 dark:focus:bg-orange-950/20 dark:focus:ring-2 dark:focus:ring-orange-800"
                                            disabled={disabled}
                                        />
                                    </div>

                                    {/* Time To Filter */}
                                    <div className="space-y-3 rounded-md p-3 transition-colors duration-200 hover:bg-orange-50/50 dark:hover:bg-orange-950/10">
                                        <Label className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-orange-700 dark:hover:text-orange-300">
                                            <Clock className="h-4 w-4 text-orange-600 transition-colors duration-200 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300" />
                                            {t('filters.time_to')}
                                        </Label>
                                        <TimePicker
                                            value={filters.timeTo || ''}
                                            onChange={(time) =>
                                                handleFilterChange('timeTo', time)
                                            }
                                            placeholder={t('filters.select_time_to')}
                                            className="border-orange-200 hover:border-orange-300 hover:bg-orange-50 focus:border-orange-400 focus:bg-orange-50 focus:ring-2 focus:ring-orange-200 focus:outline-none dark:border-orange-800 dark:hover:border-orange-700 dark:hover:bg-orange-950/20 dark:focus:border-orange-600 dark:focus:bg-orange-950/20 dark:focus:ring-2 dark:focus:ring-orange-800"
                                            disabled={disabled}
                                        />
                                    </div>

                                    {/* Min Amount Filter */}
                                    <div className="space-y-3 rounded-md p-3 transition-colors duration-200 hover:bg-green-50/50 dark:hover:bg-green-950/10">
                                        <Label className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-green-700 dark:hover:text-green-300">
                                            <DollarSign className="h-4 w-4 text-green-600 transition-colors duration-200 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300" />
                                            {t('purchase.filter_min_amount')}
                                        </Label>
                                        <div className="relative">
                                            <DollarSign className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-green-600 dark:text-green-400" />
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder={t('purchase.filter_options.min_amount')}
                                                value={filters.priceMin || ''}
                                                onChange={(e) =>
                                                    handleFilterChange(
                                                        'priceMin',
                                                        e.target.value,
                                                    )
                                                }
                                                className="border-green-200 pl-10 hover:border-green-300 hover:bg-green-50 focus:border-green-400 focus:bg-green-50 focus:ring-2 focus:ring-green-200 focus:outline-none dark:border-green-800 dark:hover:border-green-700 dark:hover:bg-green-950/20 dark:focus:border-green-600 dark:focus:bg-green-950/20 dark:focus:ring-2 dark:focus:ring-green-800"
                                                disabled={disabled}
                                            />
                                        </div>
                                    </div>

                                    {/* Max Amount Filter */}
                                    <div className="space-y-3 rounded-md p-3 transition-colors duration-200 hover:bg-green-50/50 dark:hover:bg-green-950/10">
                                        <Label className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-green-700 dark:hover:text-green-300">
                                            <DollarSign className="h-4 w-4 text-green-600 transition-colors duration-200 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300" />
                                            {t('purchase.filter_max_amount')}
                                        </Label>
                                        <div className="relative">
                                            <DollarSign className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-green-600 dark:text-green-400" />
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder={t('purchase.filter_options.max_amount')}
                                                value={filters.priceMax || ''}
                                                onChange={(e) =>
                                                    handleFilterChange(
                                                        'priceMax',
                                                        e.target.value,
                                                    )
                                                }
                                                className="border-green-200 pl-10 hover:border-green-300 hover:bg-green-50 focus:border-green-400 focus:bg-green-50 focus:ring-2 focus:ring-green-200 focus:outline-none dark:border-green-800 dark:hover:border-green-700 dark:hover:bg-green-950/20 dark:focus:border-green-600 dark:focus:bg-green-950/20 dark:focus:ring-2 dark:focus:ring-green-800"
                                                disabled={disabled}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            </div>
        </div>
    );
}
