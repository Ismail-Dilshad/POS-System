import { SCALE_PRODUCTS_ENABLED } from '@/config/features';
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
import { TimePicker } from '@/components/ui/time-picker';
import { useTranslation } from '@/hooks/use-translation';
import { categoryService, type Category } from '@/services/business/categoryService';
import { supplierService, type Supplier } from '@/services/business/supplierService';
import { userService, type User } from '@/services/business/userService';
import { ChevronDown, ChevronUp, Filter, Loader2, RotateCcw, Search, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRemember } from '@inertiajs/react';

export interface ReportFilter {
    productType: 'all' | 'normal' | 'scale' | 'card';
    barcode: string;
    cashier: string;
    category: string;
    supplier: string;
    priceFrom: number | '';
    priceTo: number | '';
    startDate: Date | null;
    endDate: Date | null;
    startTime: string;
    endTime: string;
}

interface ReportsFilterProps {
    mode: 'all' | 'transaction' | 'purchase';
    onModeChange: (mode: 'all' | 'transaction' | 'purchase') => void;
    onFilterChange: (filters: ReportFilter) => void;
    loading?: boolean;
}

const defaultFilters: ReportFilter = {
    productType: 'all',
    barcode: '',
    cashier: '',
    category: '',
    supplier: '',
    priceFrom: '',
    priceTo: '',
    startDate: null,
    endDate: null,
    startTime: '',
    endTime: '',
};

export function ReportsFilter({
    mode,
    onModeChange,
    onFilterChange,
    loading = false,
}: ReportsFilterProps) {
    const { t } = useTranslation();
    const [filters, setFilters] = useState<ReportFilter>(defaultFilters);
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeFiltersCount, setActiveFiltersCount] = useState(0);

    // Category, supplier, and cashier data (cached)
    const [categories, setCategories] = useRemember<Category[]>([], 'reports-filter:categories');
    const [suppliers, setSuppliers] = useRemember<Supplier[]>([], 'reports-filter:suppliers');
    const [cashiers, setCashiers] = useState<User[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [loadingSuppliers, setLoadingSuppliers] = useState(false);
    const [loadingCashiers, setLoadingCashiers] = useState(false);

    // Category search state
    const [categorySearchTerm, setCategorySearchTerm] = useState('');
    const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

    // Supplier search state
    const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
    const [supplierDropdownOpen, setSupplierDropdownOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

    // Barcode: apply filter only on Enter (pending value until then)
    const [barcodePending, setBarcodePending] = useState('');

    // Refs for click outside handling
    const categoryRef = useRef<HTMLDivElement>(null);
    const supplierRef = useRef<HTMLDivElement>(null);

    // Filter categories from cached data (no API calls)
    const filteredCategories = useMemo(() => {
        if (!categorySearchTerm.trim()) {
            return categories;
        }
        return categories.filter(category =>
            category.name.toLowerCase().includes(categorySearchTerm.toLowerCase())
        );
    }, [categories, categorySearchTerm]);

    // Filter suppliers from cached data (no API calls)
    const filteredSuppliers = useMemo(() => {
        if (!supplierSearchTerm.trim()) {
            return suppliers;
        }
        return suppliers.filter(supplier =>
            supplier.name.toLowerCase().includes(supplierSearchTerm.toLowerCase()) ||
            supplier.supplier_code.toLowerCase().includes(supplierSearchTerm.toLowerCase())
        );
    }, [suppliers, supplierSearchTerm]);

    // Load categories
    const loadCategories = useCallback(async () => {
        setLoadingCategories(true);
        try {
            const response = await categoryService.getCategories();
            if (response.success && response.data) {
                setCategories(response.data);
            }
        } catch {
            // Error loading categories
        } finally {
            setLoadingCategories(false);
        }
    }, [setCategories]);

    // Load suppliers
    const loadSuppliers = useCallback(async () => {
        setLoadingSuppliers(true);
        try {
            const response = await supplierService.getSuppliers();
            if (response.success && response.data) {
                setSuppliers(response.data);
            }
        } catch {
            // Error handled silently
        } finally {
            setLoadingSuppliers(false);
        }
    }, [setSuppliers]);

    // Load cashiers (all users)
    const loadCashiers = async () => {
        setLoadingCashiers(true);
        try {
            const response = await userService.getUsers();
            if (response.success && response.data) {
                // Filter to show only admin and cashier roles
                const filteredUsers = Array.isArray(response.data)
                    ? response.data.filter(user => user.role === 'admin' || user.role === 'cashier')
                    : [];
                setCashiers(filteredUsers);
            }
        } catch {
            // Error loading cashiers
        } finally {
            setLoadingCashiers(false);
        }
    };

    // Load data when component mounts (only if not cached)
    useEffect(() => {
        if (categories.length === 0) {
            loadCategories();
        }
        if (suppliers.length === 0) {
            loadSuppliers();
        }
        loadCashiers();
    }, [categories.length, suppliers.length, loadCategories, loadSuppliers]);

    // Handle category selection
    const handleCategorySelect = (category: Category) => {
        setSelectedCategory(category);
        handleFilterUpdate('category', category.name);
        setCategoryDropdownOpen(false);
        setCategorySearchTerm('');
    };

    // Handle supplier selection
    const handleSupplierSelect = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        handleFilterUpdate('supplier', supplier.name);
        setSupplierDropdownOpen(false);
        setSupplierSearchTerm('');
    };

    // Clear category selection
    const clearCategorySelection = () => {
        setSelectedCategory(null);
        handleFilterUpdate('category', '');
    };

    // Clear supplier selection
    const clearSupplierSelection = () => {
        setSelectedSupplier(null);
        handleFilterUpdate('supplier', '');
    };

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                categoryRef.current &&
                !categoryRef.current.contains(event.target as Node)
            ) {
                setCategoryDropdownOpen(false);
            }
            if (
                supplierRef.current &&
                !supplierRef.current.contains(event.target as Node)
            ) {
                setSupplierDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Update active filters count
    useEffect(() => {
        let count = 0;
        if (filters.productType && filters.productType !== 'all') count++;
        if (filters.barcode && filters.barcode.trim() !== '') count++;
        if (mode === 'transaction' && filters.cashier && filters.cashier !== '')
            count++;
        if (filters.category && filters.category !== '') count++;
        if (filters.supplier && filters.supplier !== '') count++;
        if (filters.priceFrom || filters.priceTo) count++;
        if (filters.startDate || filters.endDate) count++;
        if (filters.startTime || filters.endTime) count++;
        setActiveFiltersCount(count);
    }, [filters, mode]);

    const handleFilterUpdate = (
        key: keyof ReportFilter,
        value: string | number | Date | null,
    ) => {
        setFilters((prev) => {
            const newFilters = {
                ...prev,
                [key]: value,
            };
            // Automatically apply filters when they change
            onFilterChange(newFilters);
            return newFilters;
        });
    };

    const handleResetFilters = () => {
        setFilters(defaultFilters);
        setBarcodePending('');
        setIsExpanded(false);
        // Automatically apply the reset filters
        onFilterChange(defaultFilters);
    };

    const applyBarcodeFilter = () => {
        const value = barcodePending.trim();
        handleFilterUpdate('barcode', value);
    };

    return (
        <div className="w-full rounded-md bg-card p-6 text-card-foreground shadow-[0_-2px_8px_0_rgba(0,0,0,0.1),0_2px_8px_0_rgba(0,0,0,0.1)] dark:shadow-[0_-2px_8px_0_rgba(0,0,0,0.3),0_2px_8px_0_rgba(0,0,0,0.3)]">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Filter className="h-5 w-5 text-[#1F3F3F]/60 dark:text-[#1F3F3F]/40" />
                            <h3 className="text-lg font-semibold text-foreground">
                                {t('reports_filter.title')}
                            </h3>
                        </div>
                        {activeFiltersCount > 0 && (
                            <Badge
                                variant="secondary"
                                className="border-primary/30 bg-gradient-to-r from-primary/10 to-primary/20 text-primary shadow-sm backdrop-blur-sm transition-all duration-300 hover:from-primary/20 hover:to-primary/30 hover:shadow-md dark:border-primary/40 dark:from-primary/20 dark:to-primary/30 dark:text-primary"
                            >
                                <div className="flex items-center gap-1">
                                    <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary"></div>
                                    {activeFiltersCount} {t('reports_filter.active')}
                                </div>
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {activeFiltersCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleResetFilters}
                                disabled={loading || mode === 'all'}
                                className="text-red-600 hover:bg-red-100 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                            >
                                <RotateCcw className="mr-1 h-4 w-4" />
                                {t('reports_filter.clear_all')}
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsExpanded(!isExpanded)}
                            disabled={loading}
                            className="text-purple-600 hover:bg-purple-100 hover:text-purple-700 dark:text-purple-400 dark:hover:bg-purple-900/20 dark:hover:text-purple-300"
                        >
                            {t('reports_filter.advanced')}
                            {isExpanded ? (
                                <ChevronUp className="ml-1 h-4 w-4" />
                            ) : (
                                <ChevronDown className="ml-1 h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Filter Section */}
            <div className="mb-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
                {/* Report Type */}
                <div className="space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-blue-50/50 dark:hover:bg-blue-950/10">
                    <Label className="text-sm font-medium text-blue-700 transition-colors duration-200 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200">
                        {t('reports_filter.mode_label')}
                    </Label>
                    <Select
                        value={mode}
                        onValueChange={(value: 'all' | 'transaction' | 'purchase') =>
                            onModeChange(value)
                        }
                        disabled={loading}
                    >
                        <SelectTrigger className="h-11 border-blue-200 hover:border-blue-300 hover:bg-blue-50 focus:border-blue-400 focus:bg-blue-50 focus:ring-2 focus:ring-blue-200 focus:outline-none dark:border-blue-800 dark:hover:border-blue-700 dark:hover:bg-blue-950/20 dark:focus:border-blue-600 dark:focus:bg-blue-950/20 dark:focus:ring-2 dark:focus:ring-blue-800">
                            <SelectValue placeholder={t('reports_filter.mode_placeholder')} />
                        </SelectTrigger>
                        <SelectContent className="border-blue-200 dark:border-blue-800">
                            <SelectItem
                                value="all"
                                className="focus:bg-blue-50 focus:text-blue-900 data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-900 data-[state=checked]:bg-blue-100 data-[state=checked]:text-blue-900 dark:focus:bg-blue-950/20 dark:focus:text-blue-100 dark:data-[highlighted]:bg-blue-950/20 dark:data-[highlighted]:text-blue-100 dark:data-[state=checked]:bg-blue-900/30 dark:data-[state=checked]:text-blue-100"
                            >
                                {t('reports_filter.mode_all')}
                            </SelectItem>
                            <SelectItem
                                value="transaction"
                                className="focus:bg-blue-50 focus:text-blue-900 data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-900 data-[state=checked]:bg-blue-100 data-[state=checked]:text-blue-900 dark:focus:bg-blue-950/20 dark:focus:text-blue-100 dark:data-[highlighted]:bg-blue-950/20 dark:data-[highlighted]:text-blue-100 dark:data-[state=checked]:bg-blue-900/30 dark:data-[state=checked]:text-blue-100"
                            >
                                {t('reports_filter.mode_transaction')}
                            </SelectItem>
                            <SelectItem
                                value="purchase"
                                className="focus:bg-blue-50 focus:text-blue-900 data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-900 data-[state=checked]:bg-blue-100 data-[state=checked]:text-blue-900 dark:focus:bg-blue-950/20 dark:focus:text-blue-100 dark:data-[highlighted]:bg-blue-950/20 dark:data-[highlighted]:text-blue-100 dark:data-[state=checked]:bg-blue-900/30 dark:data-[state=checked]:text-blue-100"
                            >
                                {t('reports_filter.mode_purchase')}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Barcode / Identifier — filter applies on Enter */}
                {(mode === 'transaction' || mode === 'purchase') && (
                    <div className="space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/10">
                        <Label className="text-sm font-medium text-cyan-700 transition-colors duration-200 hover:text-cyan-800 dark:text-cyan-300 dark:hover:text-cyan-200">
                            {t('reports_filter.barcode')}
                        </Label>
                        <Input
                            placeholder={t('reports_filter.barcode_placeholder')}
                            value={barcodePending}
                            onChange={(e) => setBarcodePending(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    applyBarcodeFilter();
                                }
                            }}
                            className="h-11 border-cyan-200 pr-10 hover:border-cyan-300 hover:bg-cyan-50 focus:border-cyan-400 focus:bg-cyan-50 focus:ring-2 focus:ring-cyan-200 focus:outline-none dark:border-cyan-800 dark:hover:border-cyan-700 dark:hover:bg-cyan-950/20 dark:focus:border-cyan-600 dark:focus:bg-cyan-950/20 dark:focus:ring-2 dark:focus:ring-cyan-800"
                            disabled={loading}
                        />
                    </div>
                )}

                {/* Product Type */}
                <div className="space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-primary/5/50 dark:hover:bg-primary/95/10">
                    <Label className="text-sm font-medium text-primary transition-colors duration-200 hover:text-primary dark:text-primary/30 dark:hover:text-primary/20">
                        {t('reports_filter.product_type')}
                    </Label>
                    <Select
                        value={filters.productType}
                        onValueChange={(value: string) =>
                            handleFilterUpdate('productType', value)
                        }
                        disabled={loading || mode === 'all'}
                    >
                        <SelectTrigger className="h-11 border-primary/20 hover:border-primary/30 hover:bg-primary/5 focus:border-primary focus:bg-primary/5 focus:ring-2 focus:ring-primary/20 focus:outline-none dark:border-primary/80 dark:hover:border-primary/70 dark:hover:bg-primary/95/20 dark:focus:border-primary dark:focus:bg-primary/95/20 dark:focus:ring-2 dark:focus:ring-primary/80">
                            <SelectValue placeholder={t('reports_filter.select_type')} />
                        </SelectTrigger>
                        <SelectContent className="border-primary/20 dark:border-primary/80">
                            <SelectItem
                                value="all"
                                className="focus:bg-primary/5 focus:text-primary data-[highlighted]:bg-primary/5 data-[highlighted]:text-primary data-[state=checked]:bg-primary/10 data-[state=checked]:text-primary dark:focus:bg-primary/95/20 dark:focus:text-primary/10 dark:data-[highlighted]:bg-primary/95/20 dark:data-[highlighted]:text-primary/10 dark:data-[state=checked]:bg-primary/90/30 dark:data-[state=checked]:text-primary/10"
                            >
                                {t('reports_filter.all_products')}
                            </SelectItem>
                            <SelectItem
                                value="normal"
                                className="focus:bg-primary/5 focus:text-primary data-[highlighted]:bg-primary/5 data-[highlighted]:text-primary data-[state=checked]:bg-primary/10 data-[state=checked]:text-primary dark:focus:bg-primary/95/20 dark:focus:text-primary/10 dark:data-[highlighted]:bg-primary/95/20 dark:data-[highlighted]:text-primary/10 dark:data-[state=checked]:bg-primary/90/30 dark:data-[state=checked]:text-primary/10"
                            >
                                {t('reports_filter.normal_products')}
                            </SelectItem>
                            {SCALE_PRODUCTS_ENABLED && (<SelectItem
                                value="scale"
                                className="focus:bg-primary/5 focus:text-primary data-[highlighted]:bg-primary/5 data-[highlighted]:text-primary data-[state=checked]:bg-primary/10 data-[state=checked]:text-primary dark:focus:bg-primary/95/20 dark:focus:text-primary/10 dark:data-[highlighted]:bg-primary/95/20 dark:data-[highlighted]:text-primary/10 dark:data-[state=checked]:bg-primary/90/30 dark:data-[state=checked]:text-primary/10"
                            >
                                {t('reports_filter.scale_products')}
                            </SelectItem>)}
                            {mode === 'transaction' && (
                                <SelectItem
                                    value="card"
                                    className="focus:bg-primary/5 focus:text-primary data-[highlighted]:bg-primary/5 data-[highlighted]:text-primary data-[state=checked]:bg-primary/10 data-[state=checked]:text-primary dark:focus:bg-primary/95/20 dark:focus:text-primary/10 dark:data-[highlighted]:bg-primary/95/20 dark:data-[highlighted]:text-primary/10 dark:data-[state=checked]:bg-primary/90/30 dark:data-[state=checked]:text-primary/10"
                                >
                                    {t('reports_filter.name_cards')}
                                </SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                </div>

                {/* Cashier Filter (transaction mode) */}
                {mode === 'transaction' && (
                    <div className="space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-green-50/50 dark:hover:bg-green-950/10">
                        <Label className="text-sm font-medium text-green-700 transition-colors duration-200 hover:text-green-800 dark:text-green-300 dark:hover:text-green-200">
                            {t('reports_filter.cashier')}
                        </Label>
                        <Select
                            value={filters.cashier || 'all'}
                            onValueChange={(value: string) =>
                                handleFilterUpdate(
                                    'cashier',
                                    value === 'all' ? '' : value,
                                )
                            }
                            disabled={loading || loadingCashiers}
                        >
                            <SelectTrigger className="h-11 border-green-200 hover:border-green-300 hover:bg-green-50 focus:border-green-400 focus:bg-green-50 focus:ring-2 focus:ring-green-200 focus:outline-none dark:border-green-800 dark:hover:border-green-700 dark:hover:bg-green-950/20 dark:focus:border-green-600 dark:focus:bg-green-950/20 dark:focus:ring-2 dark:focus:ring-green-800">
                                <SelectValue placeholder={t('reports_filter.select_cashier')} />
                            </SelectTrigger>
                            <SelectContent className="border-green-200 dark:border-green-800">
                                <SelectItem
                                    value="all"
                                    className="focus:bg-green-50 focus:text-green-900 data-[highlighted]:bg-green-50 data-[highlighted]:text-green-900 data-[state=checked]:bg-green-100 data-[state=checked]:text-green-900 dark:focus:bg-green-950/20 dark:focus:text-green-100 dark:data-[highlighted]:bg-green-950/20 dark:data-[highlighted]:text-green-100 dark:data-[state=checked]:bg-green-900/30 dark:data-[state=checked]:text-green-100"
                                >
                                    {t('reports_filter.all_cashiers')}
                                </SelectItem>
                                {cashiers.map((cashier) => (
                                    <SelectItem
                                        key={cashier.id}
                                        value={cashier.full_name}
                                        className="focus:bg-green-50 focus:text-green-900 data-[highlighted]:bg-green-50 data-[highlighted]:text-green-900 data-[state=checked]:bg-green-100 data-[state=checked]:text-green-900 dark:focus:bg-green-950/20 dark:focus:text-green-100 dark:data-[highlighted]:bg-green-950/20 dark:data-[highlighted]:text-green-100 dark:data-[state=checked]:bg-green-900/30 dark:data-[state=checked]:text-green-100"
                                    >
                                        {cashier.full_name} ({cashier.role})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Category Filter (transaction mode) */}
                {mode === 'transaction' && (
                    <div className="relative space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-purple-50/50 dark:hover:bg-purple-950/10" ref={categoryRef}>
                        <Label className="text-sm font-medium text-purple-700 transition-colors duration-200 hover:text-purple-800 dark:text-purple-300 dark:hover:text-purple-200">
                            {t('reports_filter.category')}
                        </Label>
                        <div className="relative">
                            {selectedCategory ? (
                                <div className="flex h-11 items-center justify-between rounded-md border border-purple-200 bg-purple-50 p-3 transition-colors hover:border-purple-300 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/20 dark:hover:border-purple-700 dark:hover:bg-purple-950/30">
                                    <span className="text-sm">
                                        {selectedCategory.name}
                                    </span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                        onClick={clearCategorySelection}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <Input
                                        placeholder={t('reports_filter.select_category')}
                                        value={categorySearchTerm}
                                        onChange={(e) =>
                                            setCategorySearchTerm(
                                                e.target.value,
                                            )
                                        }
                                        onFocus={() =>
                                            setCategoryDropdownOpen(true)
                                        }
                                        className="h-11 border-purple-200 pr-10 hover:border-purple-300 hover:bg-purple-50 focus:border-purple-400 focus:bg-purple-50 focus:ring-2 focus:ring-purple-200 focus:outline-none dark:border-purple-800 dark:hover:border-purple-700 dark:hover:bg-purple-950/20 dark:focus:border-purple-600 dark:focus:bg-purple-950/20 dark:focus:ring-2 dark:focus:ring-purple-800"
                                        disabled={loading || loadingCategories}
                                    />
                                    <Search className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                                </>
                            )}

                            {/* Category Dropdown */}
                            {categoryDropdownOpen && !selectedCategory && (
                                <div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-md border border-purple-200 bg-popover shadow-lg dark:border-purple-800">
                                    {loadingCategories ? (
                                        <div className="p-3 text-center text-sm text-muted-foreground">
                                            <Loader2 className="mx-auto mb-1 h-4 w-4 animate-spin" />
                                            {t('common.loading')}
                                        </div>
                                    ) : filteredCategories.length > 0 ? (
                                        filteredCategories.map((category) => (
                                            <button
                                                key={category.id}
                                                type="button"
                                                className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-purple-50 hover:text-purple-900 focus:bg-purple-50 focus:text-purple-900 dark:hover:bg-purple-950/20 dark:hover:text-purple-100 dark:focus:bg-purple-950/20 dark:focus:text-purple-100"
                                                onClick={() =>
                                                    handleCategorySelect(
                                                        category,
                                                    )
                                                }
                                            >
                                                {category.name}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="p-3 text-center text-sm text-muted-foreground">
                                            {t('common.no_categories_found')}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Category Filter (purchase mode) */}
                {mode === 'purchase' && (
                    <div className="relative space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-purple-50/50 dark:hover:bg-purple-950/10" ref={categoryRef}>
                        <Label className="text-sm font-medium text-purple-700 transition-colors duration-200 hover:text-purple-800 dark:text-purple-300 dark:hover:text-purple-200">
                            {t('reports_filter.category')}
                        </Label>
                        <div className="relative">
                            {selectedCategory ? (
                                <div className="flex h-11 items-center justify-between rounded-md border border-purple-200 bg-purple-50 p-3 transition-colors hover:border-purple-300 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/20 dark:hover:border-purple-700 dark:hover:bg-purple-950/30">
                                    <span className="text-sm">
                                        {selectedCategory.name}
                                    </span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                        onClick={clearCategorySelection}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <Input
                                        placeholder={t('reports_filter.select_category')}
                                        value={categorySearchTerm}
                                        onChange={(e) =>
                                            setCategorySearchTerm(
                                                e.target.value,
                                            )
                                        }
                                        onFocus={() =>
                                            setCategoryDropdownOpen(true)
                                        }
                                        className="h-11 border-purple-200 pr-10 hover:border-purple-300 hover:bg-purple-50 focus:border-purple-400 focus:bg-purple-50 focus:ring-2 focus:ring-purple-200 focus:outline-none dark:border-purple-800 dark:hover:border-purple-700 dark:hover:bg-purple-950/20 dark:focus:border-purple-600 dark:focus:bg-purple-950/20 dark:focus:ring-2 dark:focus:ring-purple-800"
                                        disabled={loading || loadingCategories}
                                    />
                                    <Search className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                                </>
                            )}

                            {/* Category Dropdown */}
                            {categoryDropdownOpen && !selectedCategory && (
                                <div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-md border border-purple-200 bg-popover shadow-lg dark:border-purple-800">
                                    {loadingCategories ? (
                                        <div className="p-3 text-center text-sm text-muted-foreground">
                                            <Loader2 className="mx-auto mb-1 h-4 w-4 animate-spin" />
                                            {t('common.loading')}
                                        </div>
                                    ) : filteredCategories.length > 0 ? (
                                        filteredCategories.map((category) => (
                                            <button
                                                key={category.id}
                                                type="button"
                                                className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-purple-50 hover:text-purple-900 focus:bg-purple-50 focus:text-purple-900 dark:hover:bg-purple-950/20 dark:hover:text-purple-100 dark:focus:bg-purple-950/20 dark:focus:text-purple-100"
                                                onClick={() =>
                                                    handleCategorySelect(
                                                        category,
                                                    )
                                                }
                                            >
                                                {category.name}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="p-3 text-center text-sm text-muted-foreground">
                                            {t('common.no_categories_found')}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Supplier Filter */}
                <div className="relative space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-amber-50/60 dark:hover:bg-amber-950/10" ref={supplierRef}>
                    <Label className="text-sm font-medium text-amber-700 transition-colors duration-200 hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200">
                        {t('reports_filter.supplier')}
                    </Label>
                    <div className="relative">
                        {selectedSupplier ? (
                            <div className="flex h-11 items-center justify-between rounded-md border border-amber-200 bg-amber-50 p-3 transition-colors hover:border-amber-300 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/20 dark:hover:border-amber-700 dark:hover:bg-amber-950/30">
                                <div className="flex flex-col">
                                    <span className="text-sm">
                                        {selectedSupplier.name}
                                    </span>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                    onClick={clearSupplierSelection}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <>
                                <Input
                                    placeholder={t('reports_filter.select_supplier')}
                                    value={supplierSearchTerm}
                                    onChange={(e) =>
                                        setSupplierSearchTerm(
                                            e.target.value,
                                        )
                                    }
                                    onFocus={() =>
                                        setSupplierDropdownOpen(true)
                                    }
                                    className="h-11 border-amber-200 pr-10 hover:border-amber-300 hover:bg-amber-50 focus:border-amber-400 focus:bg-amber-50 focus:ring-2 focus:ring-amber-200 focus:outline-none dark:border-amber-800 dark:hover:border-amber-700 dark:hover:bg-amber-950/20 dark:focus:border-amber-600 dark:focus:bg-amber-950/20 dark:focus:ring-2 dark:focus:ring-amber-800"
                                    disabled={loading || loadingSuppliers || mode === 'all'}
                                />
                                <Search className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                            </>
                        )}

                        {/* Supplier Dropdown */}
                        {supplierDropdownOpen && !selectedSupplier && (
                            <div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-md border border-amber-200 bg-popover shadow-lg dark:border-amber-800">
                                {loadingSuppliers ? (
                                    <div className="p-3 text-center text-sm text-muted-foreground">
                                        <Loader2 className="mx-auto mb-1 h-4 w-4 animate-spin" />
                                        {t('common.loading')}
                                    </div>
                                ) : filteredSuppliers.length > 0 ? (
                                    filteredSuppliers.map((supplier) => (
                                        <button
                                            key={supplier.id}
                                            type="button"
                                            className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-amber-50 hover:text-amber-900 focus:bg-amber-50 focus:text-amber-900 dark:hover:bg-amber-950/20 dark:hover:text-amber-100 dark:focus:bg-amber-950/20 dark:focus:text-amber-100"
                                            onClick={() =>
                                                handleSupplierSelect(
                                                    supplier,
                                                )
                                            }
                                        >
                                            <div className="flex flex-col">
                                                <span>
                                                    {supplier.name}
                                                </span>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="p-3 text-center text-sm text-muted-foreground">
                                        {t('common.no_suppliers_found')}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Advanced Filter Section */}
            <div
                className={`transition-all duration-300 ease-in-out ${
                    isExpanded
                        ? 'max-h-96 opacity-100'
                        : 'max-h-0 overflow-hidden opacity-0'
                }`}
            >
                <div className="mt-2 shadow-[0_1px_0_0_rgba(0,0,0,0.1)] dark:shadow-[0_1px_0_0_rgba(0,0,0,0.3)] pt-6">
                    <h4 className="text-md mb-4 flex items-center gap-2 font-medium text-foreground">
                        <Filter className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        {t('reports_filter.advanced_filters')}
                    </h4>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                        {/* Price From */}
                        <div className="space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/10">
                            <Label className="text-sm font-medium text-emerald-700 transition-colors duration-200 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200">
                                {t('reports_filter.price_from')}
                            </Label>
                            <Input
                                type="number"
                                placeholder={t('reports_filter.min_price')}
                                value={filters.priceFrom || ''}
                                onChange={(e) =>
                                    handleFilterUpdate(
                                        'priceFrom',
                                        e.target.value
                                            ? parseFloat(e.target.value)
                                            : '',
                                    )
                                }
                                className="h-11 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 focus:border-emerald-400 focus:bg-emerald-50 focus:ring-2 focus:ring-emerald-200 focus:outline-none dark:border-emerald-800 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/20 dark:focus:border-emerald-600 dark:focus:bg-emerald-950/20 dark:focus:ring-2 dark:focus:ring-emerald-800"
                                disabled={loading || mode === 'all'}
                            />
                        </div>

                        {/* Price To */}
                        <div className="space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/10">
                            <Label className="text-sm font-medium text-emerald-700 transition-colors duration-200 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200">
                                {t('reports_filter.price_to')}
                            </Label>
                            <Input
                                type="number"
                                placeholder={t('reports_filter.max_price')}
                                value={filters.priceTo || ''}
                                onChange={(e) =>
                                    handleFilterUpdate(
                                        'priceTo',
                                        e.target.value
                                            ? parseFloat(e.target.value)
                                            : '',
                                    )
                                }
                                className="h-11 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 focus:border-emerald-400 focus:bg-emerald-50 focus:ring-2 focus:ring-emerald-200 focus:outline-none dark:border-emerald-800 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/20 dark:focus:border-emerald-600 dark:focus:bg-emerald-950/20 dark:focus:ring-2 dark:focus:ring-emerald-800"
                                disabled={loading || mode === 'all'}
                            />
                        </div>

                        {/* From Date */}
                        <div className="space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-primary-50/50 dark:hover:bg-primary-950/10">
                            <Label className="text-sm font-medium text-[#1F3F3F]/70 transition-colors duration-200 hover:text-[#1F3F3F]/80 dark:text-[#1F3F3F]/30 dark:hover:text-primary-200">
                                {t('reports_filter.from_date')}
                            </Label>
                            <DatePicker
                                value={
                                    filters.startDate
                                        ? filters.startDate
                                              .toISOString()
                                              .split('T')[0]
                                        : ''
                                }
                                onChange={(date) =>
                                    handleFilterUpdate(
                                        'startDate',
                                        date ? new Date(date) : null,
                                    )
                                }
                                placeholder={t('reports_filter.select_start_date')}
                                className="h-11 border-primary-200 hover:border-[#1F3F3F]/30 hover:bg-primary-50 focus:border-[#1F3F3F]/40 focus:bg-primary-50 focus:ring-2 focus:ring-primary-200 focus:outline-none dark:border-[#1F3F3F]/80 dark:hover:border-[#1F3F3F]/70 dark:hover:bg-primary-950/20 dark:focus:border-[#1F3F3F]/60 dark:focus:bg-primary-950/20 dark:focus:ring-2 dark:focus:ring-[#1F3F3F]/80"
                                disabled={loading || mode === 'all'}
                            />
                        </div>

                        {/* To Date */}
                        <div className="space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-primary-50/50 dark:hover:bg-primary-950/10">
                            <Label className="text-sm font-medium text-[#1F3F3F]/70 transition-colors duration-200 hover:text-[#1F3F3F]/80 dark:text-[#1F3F3F]/30 dark:hover:text-primary-200">
                                {t('reports_filter.to_date')}
                            </Label>
                            <DatePicker
                                value={
                                    filters.endDate
                                        ? filters.endDate
                                              .toISOString()
                                              .split('T')[0]
                                        : ''
                                }
                                onChange={(date) =>
                                    handleFilterUpdate(
                                        'endDate',
                                        date ? new Date(date) : null,
                                    )
                                }
                                placeholder={t('reports_filter.select_end_date')}
                                className="h-11 border-primary-200 hover:border-[#1F3F3F]/30 hover:bg-primary-50 focus:border-[#1F3F3F]/40 focus:bg-primary-50 focus:ring-2 focus:ring-primary-200 focus:outline-none dark:border-[#1F3F3F]/80 dark:hover:border-[#1F3F3F]/70 dark:hover:bg-primary-950/20 dark:focus:border-[#1F3F3F]/60 dark:focus:bg-primary-950/20 dark:focus:ring-2 dark:focus:ring-[#1F3F3F]/80"
                                disabled={loading || mode === 'all'}
                            />
                        </div>

                        {/* Start Time */}
                        <div className="space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-orange-50/50 dark:hover:bg-orange-950/10">
                            <Label className="text-sm font-medium text-orange-700 transition-colors duration-200 hover:text-orange-800 dark:text-orange-300 dark:hover:text-orange-200">
                                {t('reports_filter.start_time')}
                            </Label>
                            <TimePicker
                                value={filters.startTime}
                                onChange={(time) =>
                                    handleFilterUpdate('startTime', time)
                                }
                                placeholder={t('reports_filter.select_start_time')}
                                className="h-11 border-orange-200 hover:border-orange-300 hover:bg-orange-50 focus:border-orange-400 focus:bg-orange-50 focus:ring-2 focus:ring-orange-200 focus:outline-none dark:border-orange-800 dark:hover:border-orange-700 dark:hover:bg-orange-950/20 dark:focus:border-orange-600 dark:focus:bg-orange-950/20 dark:focus:ring-2 dark:focus:ring-orange-800"
                                disabled={loading || mode === 'all'}
                            />
                        </div>

                        {/* End Time */}
                        <div className="space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-orange-50/50 dark:hover:bg-orange-950/10">
                            <Label className="text-sm font-medium text-orange-700 transition-colors duration-200 hover:text-orange-800 dark:text-orange-300 dark:hover:text-orange-200">
                                {t('reports_filter.end_time')}
                            </Label>
                            <TimePicker
                                value={filters.endTime}
                                onChange={(time) =>
                                    handleFilterUpdate('endTime', time)
                                }
                                placeholder={t('reports_filter.select_end_time')}
                                className="h-11 border-orange-200 hover:border-orange-300 hover:bg-orange-50 focus:border-orange-400 focus:bg-orange-50 focus:ring-2 focus:ring-orange-200 focus:outline-none dark:border-orange-800 dark:hover:border-orange-700 dark:hover:bg-orange-950/20 dark:focus:border-orange-600 dark:focus:bg-orange-950/20 dark:focus:ring-2 dark:focus:ring-orange-800"
                                disabled={loading || mode === 'all'}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
