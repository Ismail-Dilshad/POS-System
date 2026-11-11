import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import {
    Filter,
    RotateCcw,
    Shield,
    User,
    UserCheck,
    UserX,
    X,
} from 'lucide-react';

export interface UserFilterOptions {
    search?: string;
    role?: string;
    status?: string;
}

interface UserFilterProps {
    filters: UserFilterOptions;
    onFiltersChange: (filters: UserFilterOptions) => void;
    className?: string;
    disabled?: boolean;
}

export function UserFilter({
    filters,
    onFiltersChange,
    className = '',
    disabled = false
}: UserFilterProps) {
    const { t } = useTranslation();
    const handleFilterChange = (
        key: keyof UserFilterOptions,
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

    const clearFilter = (key: keyof UserFilterOptions) => {
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
                                {t('user_filter.title')}
                            </h3>
                        </div>
                        {activeFiltersCount > 0 && (
                            <Badge
                                variant="secondary"
                                className="border-primary-200 bg-primary-100 text-[#1F3F3F]/80 hover:bg-primary-200 dark:border-[#1F3F3F]/80 dark:bg-[#1F3F3F]/90/20 dark:text-[#1F3F3F]/30"
                            >
                                {activeFiltersCount} {t('user_filter.active_filters')}
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
                                {t('user_filter.clear_all')}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Filter Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                    {/* Search by Name and Username */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            <Label className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                                {t('user_filter.search_users')}
                            </Label>
                            {filters.search && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => clearFilter('search')}
                                    className="h-6 w-6 p-0 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-300"
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                        <Input
                            placeholder={t('user_filter.search_placeholder')}
                            value={filters.search || ''}
                            onChange={(e) =>
                                handleFilterChange('search', e.target.value)
                            }
                            disabled={disabled}
                            className="border-indigo-200 focus:border-indigo-400 focus:ring-indigo-400/20 dark:border-indigo-800 dark:focus:border-indigo-600"
                        />
                    </div>

                    {/* Role Filter */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                            <Label className="text-sm font-medium text-orange-700 dark:text-orange-300">
                                {t('user_filter.role')}
                            </Label>
                            {filters.role && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => clearFilter('role')}
                                    className="h-6 w-6 p-0 text-orange-600 hover:bg-orange-100 hover:text-orange-700 dark:text-orange-400 dark:hover:bg-orange-900/20 dark:hover:text-orange-300"
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                        <Select
                            value={filters.role || 'all'}
                            onValueChange={(value) =>
                                handleFilterChange(
                                    'role',
                                    value === 'all' ? '' : value,
                                )
                            }
                            disabled={disabled}
                        >
                            <SelectTrigger className="border-orange-200 focus:border-orange-400 focus:ring-orange-400/20 dark:border-orange-800 dark:focus:border-orange-600">
                                <SelectValue placeholder={t('user_filter.all_roles')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('user_filter.all_roles_option')}</SelectItem>
                                <SelectItem value="admin">
                                    <div className="flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-red-600" />
                                        <span>{t('users.role_labels.admin')}</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="cashier">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-[#1F3F3F]/60" />
                                        <span>{t('users.role_labels.cashier')}</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="dataentry">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-green-600" />
                                        <span>{t('users.role_labels.dataentry')}</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Status Filter */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            <Label className="text-sm font-medium text-purple-700 dark:text-purple-300">
                                {t('user_filter.status')}
                            </Label>
                            {filters.status && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => clearFilter('status')}
                                    className="h-6 w-6 p-0 text-purple-600 hover:bg-purple-100 hover:text-purple-700 dark:text-purple-400 dark:hover:bg-purple-900/20 dark:hover:text-purple-300"
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                        <Select
                            value={filters.status || 'all'}
                            onValueChange={(value) =>
                                handleFilterChange(
                                    'status',
                                    value === 'all' ? '' : value,
                                )
                            }
                            disabled={disabled}
                        >
                            <SelectTrigger className="border-purple-200 focus:border-purple-400 focus:ring-purple-400/20 dark:border-purple-800 dark:focus:border-purple-600">
                                <SelectValue placeholder={t('user_filter.all_status')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('user_filter.all_status_option')}</SelectItem>
                                <SelectItem value="active">
                                    <div className="flex items-center gap-2">
                                        <UserCheck className="h-4 w-4 text-green-600" />
                                        <span>{t('users.status_labels.active')}</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="inactive">
                                    <div className="flex items-center gap-2">
                                        <UserX className="h-4 w-4 text-red-600" />
                                        <span>{t('users.status_labels.inactive')}</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Active Filters Display */}
                {activeFiltersCount > 0 && (
                    <div className="mt-4 border-t border-border pt-4">
                        <div className="flex flex-wrap gap-2">
                            {filters.search && (
                                <Badge
                                    variant="secondary"
                                    className="border-indigo-200 bg-indigo-100 text-indigo-800 dark:border-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300"
                                >
                                    <User className="mr-1 h-3 w-3" />
                                    {t('user_filter.active_filters_display.search', { value: filters.search })}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => clearFilter('search')}
                                        className="ml-1 h-4 w-4 p-0 text-indigo-600 hover:bg-indigo-200 hover:text-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-800 dark:hover:text-indigo-300"
                                    >
                                        <X className="h-2 w-2" />
                                    </Button>
                                </Badge>
                            )}
                            {filters.role && (
                                <Badge
                                    variant="secondary"
                                    className="border-orange-200 bg-orange-100 text-orange-800 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-300"
                                >
                                    <Shield className="mr-1 h-3 w-3" />
                                    {t('user_filter.active_filters_display.role', { value: filters.role })}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => clearFilter('role')}
                                        className="ml-1 h-4 w-4 p-0 text-orange-600 hover:bg-orange-200 hover:text-orange-700 dark:text-orange-400 dark:hover:bg-orange-800 dark:hover:text-orange-300"
                                    >
                                        <X className="h-2 w-2" />
                                    </Button>
                                </Badge>
                            )}
                            {filters.status && (
                                <Badge
                                    variant="secondary"
                                    className="border-purple-200 bg-purple-100 text-purple-800 dark:border-purple-800 dark:bg-purple-900/20 dark:text-purple-300"
                                >
                                    {filters.status === 'active' ? (
                                        <UserCheck className="mr-1 h-3 w-3" />
                                    ) : (
                                        <UserX className="mr-1 h-3 w-3" />
                                    )}
                                    {t('user_filter.active_filters_display.status', { value: filters.status })}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => clearFilter('status')}
                                        className="ml-1 h-4 w-4 p-0 text-purple-600 hover:bg-purple-200 hover:text-purple-700 dark:text-purple-400 dark:hover:bg-purple-800 dark:hover:text-purple-300"
                                    >
                                        <X className="h-2 w-2" />
                                    </Button>
                                </Badge>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
