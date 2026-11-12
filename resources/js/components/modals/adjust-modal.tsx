import { SCALE_PRODUCTS_ENABLED } from '@/config/features';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/toast';
import { useTranslation } from '@/hooks/use-translation';
import inventoryService, {
    type AdjustmentItem,
    type InventoryItem,
} from '@/services/business/inventoryService';
import {
    Edit,
    Minus,
    Package,
    Plus,
    Scale,
    Search,
    ToggleLeft,
    ToggleRight,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface AdjustItem {
    id: number;
    name: string;
    product_type: 'product' | 'scale_product';
    identifier: string;
    current_stock: number;
    adjust_qty: number | '';
    adjust_type: 'add' | 'delete' | 'set';
}

interface AdjustModalProps {
    isOpen: boolean;
    onClose: (adjustmentResults?: Array<Record<string, unknown>>) => void;
    inventoryItems: InventoryItem[];
}

export function AdjustModal({
    isOpen,
    onClose,
    inventoryItems,
}: AdjustModalProps) {
    const { toast } = useToast();
    const { t } = useTranslation();
    const [productType, setProductType] = useState<'product' | 'scale_product'>(
        'product',
    );
    const [searchTerm, setSearchTerm] = useState('');
    const [adjustType, setAdjustType] = useState<'add' | 'delete' | 'set'>(
        'add',
    );
    const [bulkQty, setBulkQty] = useState('');
    const [useBulkAdjustment, setUseBulkAdjustment] = useState(false);
    const [adjustItems, setAdjustItems] = useState<AdjustItem[]>([]);
    const [searchResults, setSearchResults] = useState<AdjustItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [manuallyChangedItems, setManuallyChangedItems] = useState<
        Set<number>
    >(new Set());

    // Create a search function for exact barcode matching only (like add-purchase modal)
    const searchInventoryItems = useCallback((searchTerm: string): InventoryItem[] => {
        if (!searchTerm || !Array.isArray(inventoryItems)) {
            return [];
        }

        const normalizedSearch = searchTerm.trim().toLowerCase();
        const exactResults: InventoryItem[] = [];

        for (const item of inventoryItems) {
            try {
                // Skip invalid items
                if (!item || typeof item.id === 'undefined') continue;

                // Check product type
                if (item.product_type !== productType) continue;

                let exactMatch = false;

                // Search by identifier (barcode for products, PLU for scale products) - EXACT MATCH ONLY
                const itemIdentifier = String(item.identifier || '').toLowerCase();
                if (itemIdentifier === normalizedSearch) {
                    exactMatch = true;
                }

                // For normal products, also check barcode and secondary_barcode fields - EXACT MATCH ONLY
                if (productType === 'product') {
                    const barcode = String(item.barcode || '').toLowerCase();
                    const secondaryBarcode = String(item.secondary_barcode || '').toLowerCase();
                    
                    if (barcode === normalizedSearch || secondaryBarcode === normalizedSearch) {
                        exactMatch = true;
                    }
                }

                if (exactMatch) {
                    exactResults.push(item);
                }
            } catch {
                // Error processing item
            }
        }

        return exactResults.slice(0, 10); // Limit to 10 results
    }, [inventoryItems, productType]);

    // Filter products based on search term and product type (for display only)
    useEffect(() => {
        if (!searchTerm.trim()) {
            setSearchResults([]);
            return;
        }

        const freshResults = searchInventoryItems(searchTerm);
        
        // Convert to AdjustItem format for search results
        const searchResultsFormatted = freshResults.map((product) => ({
            id: product.id,
            name: product.name,
            product_type: product.product_type as 'product' | 'scale_product',
            identifier: product.identifier,
            current_stock: product.stock || 0,
            adjust_qty: '' as const,
            adjust_type: adjustType,
        }));

        setSearchResults(searchResultsFormatted);
    }, [searchTerm, productType, inventoryItems, adjustType, searchInventoryItems]);

    // Add product to adjust list (from InventoryItem)
    const addToAdjustListFromInventory = (product: InventoryItem) => {
        // Check if we already have items of a different product type
        if (adjustItems.length > 0) {
            const existingProductType = adjustItems[0].product_type;
            if (existingProductType !== product.product_type) {
                return;
            }
        }

        const newItem: AdjustItem = {
            id: product.id,
            name: product.name,
            product_type: product.product_type as 'product' | 'scale_product',
            identifier: product.identifier,
            current_stock: product.stock || 0,
            adjust_qty: '' as const,
            adjust_type: adjustType,
        };

        setAdjustItems((prev) => {
            // Check if item already exists
            if (prev.find((item) => item.id === product.id)) {
                return prev;
            }
            return [...prev, newItem];
        });

        // Clear search term after adding (manual Enter only)
        setSearchTerm('');
    };

    // Add product to adjust list (from AdjustItem - for search results)
    const addToAdjustList = (product: AdjustItem) => {
        setAdjustItems((prev) => {
            // Check if item already exists
            if (prev.find((item) => item.id === product.id)) {
                return prev;
            }
            return [...prev, product];
        });

        // Clear search term after adding
        setSearchTerm('');
    };


    // Remove product from adjust list
    const removeFromAdjustList = (id: number) => {
        setAdjustItems((prev) => prev.filter((item) => item.id !== id));
        setManuallyChangedItems((prev) => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
        });
    };

    // Update individual item
    const updateAdjustItem = (
        id: number,
        field: keyof AdjustItem,
        value: string | number | 'add' | 'delete' | 'set',
    ) => {
        setAdjustItems((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, [field]: value } : item,
            ),
        );

        // Track manually changed items for adjust_type field
        if (field === 'adjust_type') {
            setManuallyChangedItems((prev) => new Set(prev).add(id));
        }
    };

    // Apply bulk adjustment to all items
    const applyBulkAdjustment = () => {
        if (!bulkQty || isNaN(Number(bulkQty))) return;

        setAdjustItems((prev) =>
            prev.map((item) => ({
                ...item,
                adjust_qty: Number(bulkQty),
                adjust_type: adjustType,
            })),
        );

        // Reset manually changed items when bulk adjustment is applied
        setManuallyChangedItems(new Set());
    };

    // Reset individual quantities when bulk mode is enabled
    useEffect(() => {
        if (useBulkAdjustment) {
            setAdjustItems((prev) =>
                prev.map((item) => ({
                    ...item,
                    adjust_qty: '' as const,
                })),
            );
            // Reset manually changed items when bulk mode is enabled
            setManuallyChangedItems(new Set());
        }
    }, [useBulkAdjustment]);

    // Clear adjust items when product type changes
    useEffect(() => {
        if (adjustItems.length > 0) {
            const currentProductType = adjustItems[0].product_type;
            if (currentProductType !== productType) {
                setAdjustItems([]);
                setManuallyChangedItems(new Set());
            }
        }
    }, [productType, adjustItems]);

    // Auto-apply adjust type to all items except manually changed ones
    useEffect(() => {
        setAdjustItems((prev) =>
            prev.map((item) => {
                // Skip items that were manually changed
                if (manuallyChangedItems.has(item.id)) {
                    return item;
                }
                // Apply the current adjust type to all other items
                return {
                    ...item,
                    adjust_type: adjustType,
                };
            }),
        );
    }, [adjustType, manuallyChangedItems]);

    // Calculate new stock for an item
    const calculateNewStock = (item: AdjustItem) => {
        const qty = useBulkAdjustment
            ? Number(bulkQty) || 0
            : Number(item.adjust_qty) || 0;

        switch (item.adjust_type) {
            case 'add':
                return item.current_stock + qty;
            case 'delete':
                return Math.max(0, item.current_stock - qty);
            case 'set':
                return qty;
            default:
                return item.current_stock;
        }
    };

    // Handle form submission
    const handleSubmit = async () => {
        if (adjustItems.length === 0) {
            setError(t('adjust_modal.error_at_least_one'));
            return;
        }

        // Prepare adjustments data
        const adjustments: AdjustmentItem[] = adjustItems
            .map((item) => ({
                id: item.id,
                product_type: item.product_type,
                adjust_type: item.adjust_type,
                adjust_qty: useBulkAdjustment
                    ? Number(bulkQty) || 0
                    : Number(item.adjust_qty) || 0,
            }))
            .filter((adj) => {
                // For 'set' type, allow 0 quantity
                if (adj.adjust_type === 'set') {
                    return adj.adjust_qty >= 0;
                }
                // For 'add' and 'delete' types, require positive quantity
                return adj.adjust_qty > 0;
            });

        if (adjustments.length === 0) {
            setError(t('adjust_modal.error_valid_quantities'));
            return;
        }

        // Validate adjustments
        const validation =
            await inventoryService.validateAdjustments(adjustments);
        if (!validation.success || !validation.data?.valid) {
            setError(
                validation.data?.errors?.join(', ') || t('adjust_modal.error_validation_failed'),
            );
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response =
                await inventoryService.adjustInventory(adjustments);

            if (response.success) {
                const adjustmentResults = response.data?.adjusted_items || [];
                const itemCount = adjustmentResults.length;

                // Show success toast
                toast({
                    title: t('adjust_modal.inventory_adjusted'),
                    description: t('adjust_modal.inventory_adjusted_desc', {
                        count: itemCount,
                        plural: itemCount !== 1 ? 's' : ''
                    }),
                    type: 'success',
                });

                // Pass adjustment results for smart refresh
                handleClose(adjustmentResults);
            } else {
                const errorMessage =
                    response.message || t('adjust_modal.failed_to_adjust');
                toast({
                    title: t('adjust_modal.adjustment_failed'),
                    description: errorMessage,
                    type: 'error',
                });
                setError(errorMessage);
            }
        } catch (error: unknown) {
            const err = error as { message?: string };
            const errorMessage =
                err.message || t('adjust_modal.failed_to_adjust');
            toast({
                title: t('adjust_modal.operation_failed'),
                description: errorMessage,
                type: 'error',
            });
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Reset form
    const handleClose = (
        adjustmentResults?: Array<Record<string, unknown>>,
    ) => {
        setProductType('product');
        setSearchTerm('');
        setAdjustType('add');
        setBulkQty('');
        setUseBulkAdjustment(false);
        setAdjustItems([]);
        setSearchResults([]);
        setError(null);
        setManuallyChangedItems(new Set());
        onClose(adjustmentResults);
    };

    const getAdjustTypeIcon = (type: string) => {
        switch (type) {
            case 'add':
                return <Plus className="h-4 w-4" />;
            case 'delete':
                return <Minus className="h-4 w-4" />;
            case 'set':
                return <Edit className="h-4 w-4" />;
            default:
                return null;
        }
    };

    const getAdjustTypeColor = (type: string) => {
        switch (type) {
            case 'add':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'delete':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'set':
                return 'bg-primary/10 text-primary border-primary/20';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getAdjustTypeLabel = (type: AdjustItem['adjust_type']) => {
        switch (type) {
            case 'add':
                return t('adjust_modal.add_type');
            case 'delete':
                return t('adjust_modal.remove_type');
            case 'set':
                return t('adjust_modal.set_type');
            default:
                return type;
        }
    };

    // Handle Enter key for form submission
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (
            e.key === 'Enter' &&
            !e.shiftKey &&
            !e.ctrlKey &&
            !e.altKey &&
            !loading
        ) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => handleClose()}>
            <DialogContent
                className="max-h-[95vh] overflow-y-auto [&>button]:hidden border-orange-200 shadow-[0_4px_8px_0_rgba(0,0,0,0.2),0_2px_4px_0_rgba(0,0,0,0.1)] dark:border-orange-800 dark:shadow-[0_4px_8px_0_rgba(0,0,0,0.4),0_2px_4px_0_rgba(0,0,0,0.3)]"
                style={{
                    zIndex: 9999,
                    maxWidth: '85vw',
                    width: '1400px',
                }}
                hideClose
                onKeyDown={handleKeyDown}
            >
                <DialogHeader className="border-b border-orange-200 pb-6 dark:border-orange-800">
                    <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-orange-800 dark:text-orange-200">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg">
                            <Package className="h-6 w-6 text-white" />
                        </div>
                        {t('adjust_modal.title')}
                    </DialogTitle>
                </DialogHeader>

                {error && (
                    <div className="rounded-md border border-red-200 bg-red-50 p-4 text-base text-red-600">
                        {error}
                    </div>
                )}

                <div className="space-y-8 p-2">
                    {/* Product Type Selection */}
                    <div className="space-y-4">
                        <Label className="text-base font-semibold">
                            {t('adjust_modal.product_type')}
                        </Label>
                        <Select
                            value={productType}
                            onValueChange={(
                                value: 'product' | 'scale_product',
                            ) => setProductType(value)}
                        >
                            <SelectTrigger className="h-12 w-full text-base border-orange-300 focus:border-orange-500 focus:ring-orange-200 dark:border-orange-600 dark:focus:border-orange-500 dark:focus:ring-orange-400">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="product">
                                    <div className="flex items-center gap-3">
                                        <Package className="h-5 w-5" />
                                        <span className="text-base">{t('adjust_modal.normal_product')}</span>
                                    </div>
                                </SelectItem>
                                {SCALE_PRODUCTS_ENABLED && (<SelectItem value="scale_product">
                                    <div className="flex items-center gap-3">
                                        <Scale className="h-5 w-5" />
                                        <span className="text-base">{t('adjust_modal.scale_product')}</span>
                                    </div>
                                </SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Search Input */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-base font-semibold">
                                {t('adjust_modal.search_products')}
                            </Label>
                            <span className="text-sm text-muted-foreground">
                                {`${inventoryItems.filter(
                                    (item) =>
                                        (item.product_type === 'product' ||
                                            item.product_type ===
                                                'scale_product') &&
                                        item.product_type === productType,
                                ).length} ${productType === 'scale_product'
                                    ? t('adjust_modal.scale_products')
                                    : t('adjust_modal.normal_products')
                                } ${t('adjust_modal.available')}`}
                            </span>
                        </div>
                        <div className="relative">
                            <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 transform text-orange-500 dark:text-orange-400" />
                            <Input
                                placeholder={t('adjust_modal.search_placeholder')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        
                                        const currentSearchTerm = searchTerm.trim();
                                        if (currentSearchTerm) {
                                            // Use the search function directly to get fresh results (like add-purchase modal)
                                            const freshResults = searchInventoryItems(currentSearchTerm);
                                            
                                            if (freshResults.length === 1) {
                                                // Single product found - add to adjust list
                                                addToAdjustListFromInventory(freshResults[0]);
                                            } else if (freshResults.length === 0) {
                                                // No products found - do nothing
                                            } else if (freshResults.length > 1) {
                                                // Multiple products - add first one
                                                addToAdjustListFromInventory(freshResults[0]);
                                            }
                                            
                                            // Clear input after processing (manual Enter only)
                                            setSearchTerm('');
                                        }
                                    }
                                }}
                                className="h-12 pl-12 text-base border-orange-300 focus:border-orange-500 focus:ring-orange-200 dark:border-orange-600 dark:focus:border-orange-500 dark:focus:ring-orange-400"
                            />
                        </div>

                        {/* Search Results */}
                        {searchTerm.trim() && (
                            <div className="max-h-64 overflow-y-auto rounded-md border">
                                {searchResults.length > 0 ? (
                                    searchResults.map((product) => {
                                        const canAdd =
                                            adjustItems.length === 0 ||
                                            adjustItems[0].product_type ===
                                                product.product_type;
                                        return (
                                            <div
                                                key={product.id}
                                                className={`flex items-center justify-between border-b p-4 last:border-b-0 ${
                                                    canAdd
                                                        ? 'cursor-pointer hover:bg-muted/50'
                                                        : 'cursor-not-allowed bg-red-50 opacity-50'
                                                }`}
                                                onClick={() =>
                                                    canAdd &&
                                                    addToAdjustList(product)
                                                }
                                            >
                                                <div className="flex-1">
                                                    <div className="text-base font-semibold">
                                                        {product.name}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground mt-1">
                                                        {product.identifier} • {t('adjust_modal.current')}{' '}
                                                        {product.current_stock}{' '}
                                                        {product.product_type ===
                                                        'scale_product'
                                                            ? t('adjust_modal.kg')
                                                            : t('adjust_modal.qty_unit')}
                                                    </div>
                                                    {!canAdd &&
                                                        adjustItems.length >
                                                            0 && (
                                                            <div className="mt-2 text-sm text-red-600">
                                                                {`${t('adjust_modal.cannot_mix_text')} ${adjustItems[0]
                                                                    .product_type ===
                                                                'scale_product'
                                                                    ? t('adjust_modal.scale_products')
                                                                    : t('adjust_modal.normal_products')
                                                                }`}
                                                            </div>
                                                        )}
                                                </div>
                                                <Button
                                                    size="default"
                                                    variant="outline"
                                                    disabled={!canAdd}
                                                    className="h-10 border-orange-300 bg-orange-50 text-orange-700 hover:border-orange-500 hover:bg-orange-100 hover:text-orange-800 focus:border-orange-500 focus:bg-orange-100 focus:ring-2 focus:ring-orange-200 focus:outline-none disabled:opacity-50 dark:border-orange-600 dark:bg-orange-900/20 dark:text-orange-300 dark:hover:border-orange-500 dark:hover:bg-orange-900/30 dark:hover:text-orange-200 dark:focus:border-orange-500 dark:focus:bg-orange-900/30 dark:focus:ring-2 dark:focus:ring-orange-400"
                                                >
                                                    {canAdd
                                                        ? t('adjust_modal.add')
                                                        : t('adjust_modal.mixed_types')}
                                                </Button>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="p-6 text-center text-muted-foreground">
                                        <Search className="mx-auto mb-3 h-10 w-10 opacity-50" />
                                        <p className="text-base">
                                            {`${t('adjust_modal.no_products_found_text')} "${searchTerm}"`}
                                        </p>
                                        <p className="text-sm mt-1">
                                            {t('adjust_modal.try_searching')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Adjust Type Selection */}
                    <div className="space-y-4">
                        <Label className="text-base font-semibold">
                            {t('adjust_modal.adjustment_type')}
                        </Label>
                        <Select
                            value={adjustType}
                            onValueChange={(value: 'add' | 'delete' | 'set') =>
                                setAdjustType(value)
                            }
                        >
                            <SelectTrigger className="h-12 w-full text-base border-orange-300 focus:border-orange-500 focus:ring-orange-200 dark:border-orange-600 dark:focus:border-orange-500 dark:focus:ring-orange-400">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="add">
                                    <div className="flex items-center gap-3">
                                        <Plus className="h-5 w-5 text-green-600" />
                                        <span className="text-base">{t('adjust_modal.add_stock')}</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="delete">
                                    <div className="flex items-center gap-3">
                                        <Minus className="h-5 w-5 text-red-600" />
                                        <span className="text-base">{t('adjust_modal.remove_stock')}</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="set">
                                    <div className="flex items-center gap-3">
                                        <Edit className="h-5 w-5 text-primary" />
                                        <span className="text-base">{t('adjust_modal.set_stock')}</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Bulk Adjustment Toggle */}
                    <div className="flex items-center justify-between rounded-lg border p-6">
                        <div className="flex items-center gap-4">
                            {useBulkAdjustment ? (
                                <ToggleRight className="h-6 w-6 text-primary" />
                            ) : (
                                <ToggleLeft className="h-6 w-6 text-muted-foreground" />
                            )}
                            <div>
                                <Label className="text-base font-semibold">
                                    {t('adjust_modal.bulk_adjustment')}
                                </Label>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {t('adjust_modal.bulk_adjustment_desc')}
                                </p>
                            </div>
                        </div>
                        <Switch
                            checked={useBulkAdjustment}
                            onCheckedChange={setUseBulkAdjustment}
                            className="h-6 w-11 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500 focus:ring-orange-200 dark:data-[state=checked]:bg-orange-600 dark:data-[state=checked]:border-orange-600 dark:focus:ring-orange-400"
                        />
                    </div>

                    {/* Bulk Quantity Input */}
                    {useBulkAdjustment && (
                        <div className="space-y-4">
                            <Label className="text-base font-semibold">
                                {t('adjust_modal.bulk_quantity', {
                                    unit: productType === 'scale_product'
                                        ? t('adjust_modal.kg')
                                        : t('adjust_modal.qty_unit')
                                })}
                            </Label>
                            <div className="flex gap-3">
                                <Input
                                    type="number"
                                    placeholder={t('adjust_modal.bulk_quantity_placeholder')}
                                    value={bulkQty}
                                    onChange={(e) => setBulkQty(e.target.value)}
                                    className="h-12 flex-1 text-base border-orange-300 focus:border-orange-500 focus:ring-orange-200 dark:border-orange-600 dark:focus:border-orange-500 dark:focus:ring-orange-400"
                                />
                                <Button
                                    onClick={applyBulkAdjustment}
                                    disabled={!bulkQty}
                                    size="lg"
                                    className="h-12 px-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 focus:ring-2 focus:ring-orange-200 focus:outline-none disabled:opacity-50 dark:from-orange-600 dark:to-orange-700 dark:hover:from-orange-700 dark:hover:to-orange-800 dark:focus:ring-2 dark:focus:ring-orange-400"
                                >
                                    {t('adjust_modal.apply_to_all')}
                                </Button>
                            </div>
                        </div>
                    )}

                    <Separator />

                    {/* Adjust Items List */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Label className="text-base font-semibold">
                                    {`${t('adjust_modal.products_to_adjust_text')} (${adjustItems.length})`}
                                </Label>
                                {adjustItems.length > 0 && (
                                    <Badge
                                        variant="secondary"
                                        className="text-sm px-3 py-1"
                                    >
                                        {adjustItems[0].product_type ===
                                        'scale_product'
                                            ? t('adjust_modal.scale_products_badge')
                                            : t('adjust_modal.normal_products_badge')}
                                    </Badge>
                                )}
                            </div>
                            {adjustItems.length > 0 && (
                                <Button
                                    variant="outline"
                                    size="default"
                                    onClick={() => setAdjustItems([])}
                                    className="h-10 border-orange-300 bg-orange-50 text-orange-700 hover:border-orange-500 hover:bg-orange-100 hover:text-orange-800 focus:border-orange-500 focus:bg-orange-100 focus:ring-2 focus:ring-orange-200 focus:outline-none dark:border-orange-600 dark:bg-orange-900/20 dark:text-orange-300 dark:hover:border-orange-500 dark:hover:bg-orange-900/30 dark:hover:text-orange-200 dark:focus:border-orange-500 dark:focus:bg-orange-900/30 dark:focus:ring-2 dark:focus:ring-orange-400"
                                >
                                    {t('adjust_modal.clear_all')}
                                </Button>
                            )}
                        </div>

                        {adjustItems.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground">
                                <Package className="mx-auto mb-4 h-16 w-16 opacity-50" />
                                <p className="text-base">{t('adjust_modal.no_products_selected')}</p>
                                <p className="text-sm mt-2">
                                    {t('adjust_modal.search_and_add')}
                                </p>
                            </div>
                        ) : (
                            <div className="max-h-[500px] space-y-3 overflow-y-auto">
                                {adjustItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="rounded-lg border p-4 bg-card"
                                    >
                                        <div className="mb-3 flex items-center justify-between">
                                            <div className="min-w-0 flex-1">
                                                <div className="truncate text-base font-semibold">
                                                    {item.name}
                                                </div>
                                                <div className="text-sm text-muted-foreground mt-1">
                                                    {item.identifier} •{' '}
                                                    {item.current_stock}{' '}
                                                    {item.product_type ===
                                                    'scale_product'
                                                        ? t('adjust_modal.kg')
                                                        : t('adjust_modal.qty_unit')}
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="default"
                                                onClick={() =>
                                                    removeFromAdjustList(
                                                        item.id,
                                                    )
                                                }
                                                className="h-9 w-9 text-base text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                ×
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-5 gap-4">
                                            {/* Adjust Type */}
                                            <div>
                                                <Label className="text-sm font-medium mb-2 block">
                                                    {t('adjust_modal.type')}
                                                </Label>
                                                <Select
                                                    value={item.adjust_type}
                                                    onValueChange={(
                                                        value:
                                                            | 'add'
                                                            | 'delete'
                                                            | 'set',
                                                    ) =>
                                                        updateAdjustItem(
                                                            item.id,
                                                            'adjust_type',
                                                            value,
                                                        )
                                                    }
                                                    disabled={useBulkAdjustment}
                                                >
                                                    <SelectTrigger className="h-10 text-sm border-orange-300 focus:border-orange-500 focus:ring-orange-200 dark:border-orange-600 dark:focus:border-orange-500 dark:focus:ring-orange-400">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="add">
                                                            {t('adjust_modal.add_type')}
                                                        </SelectItem>
                                                        <SelectItem value="delete">
                                                            {t('adjust_modal.remove_type')}
                                                        </SelectItem>
                                                        <SelectItem value="set">
                                                            {t('adjust_modal.set_type')}
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Adjust Quantity */}
                                            <div>
                                                <Label className="text-sm font-medium mb-2 block">
                                                    {t('adjust_modal.qty', {
                                                        unit: item.product_type ===
                                                        'scale_product'
                                                            ? t('adjust_modal.kg')
                                                            : t('adjust_modal.qty_unit')
                                                    })}
                                                </Label>
                                                <Input
                                                    type="number"
                                                    value={item.adjust_qty}
                                                    onChange={(e) =>
                                                        updateAdjustItem(
                                                            item.id,
                                                            'adjust_qty',
                                                            e.target.value ===
                                                                ''
                                                                ? ''
                                                                : Number(
                                                                      e.target
                                                                          .value,
                                                                  ),
                                                        )
                                                    }
                                                    className="h-10 text-sm border-orange-300 focus:border-orange-500 focus:ring-orange-200 dark:border-orange-600 dark:focus:border-orange-500 dark:focus:ring-orange-400"
                                                    min="0"
                                                    step={
                                                        item.product_type ===
                                                        'scale_product'
                                                            ? '0.1'
                                                            : '1'
                                                    }
                                                    disabled={useBulkAdjustment}
                                                    placeholder={
                                                        useBulkAdjustment
                                                            ? t('adjust_modal.bulk_placeholder')
                                                            : t('adjust_modal.zero_placeholder')
                                                    }
                                                />
                                            </div>

                                            {/* New Stock Preview */}
                                            <div>
                                                <Label className="text-sm font-medium mb-2 block">
                                                    {t('adjust_modal.new')}
                                                </Label>
                                                <div className="flex h-10 items-center rounded-sm bg-muted px-3">
                                                    <span className="text-sm font-semibold">
                                                        {calculateNewStock(
                                                            item,
                                                        )}{' '}
                                                        {item.product_type ===
                                                        'scale_product'
                                                            ? t('adjust_modal.kg')
                                                            : t('adjust_modal.qty_unit')}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Status Badge */}
                                            <div>
                                                <Label className="text-sm font-medium mb-2 block">
                                                    {t('adjust_modal.status')}
                                                </Label>
                                                <div className="flex h-10 items-center">
                                                    <Badge
                                                        variant="outline"
                                                        className={`${getAdjustTypeColor(item.adjust_type)} h-8 px-2 py-0 text-sm`}
                                                    >
                                                        {getAdjustTypeIcon(
                                                            item.adjust_type,
                                                        )}
                                                        <span className="ml-2 text-sm capitalize">
                                                            {getAdjustTypeLabel(
                                                                item.adjust_type,
                                                            )}
                                                        </span>
                                                    </Badge>
                                                </div>
                                            </div>

                                            {/* Additional Badges */}
                                            <div>
                                                <Label className="text-sm font-medium mb-2 block">
                                                    {t('adjust_modal.extra')}
                                                </Label>
                                                <div className="flex h-10 flex-col gap-1.5 justify-center">
                                                    {useBulkAdjustment && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="h-5 border-orange-200 bg-orange-100 px-2 py-0 text-xs text-orange-800 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-300"
                                                        >
                                                            {t('adjust_modal.bulk')}
                                                        </Badge>
                                                    )}
                                                    {manuallyChangedItems.has(
                                                        item.id,
                                                    ) && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="h-5 border-orange-200 bg-orange-100 px-2 py-0 text-xs text-orange-800 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-300"
                                                        >
                                                            {t('adjust_modal.manual')}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="border-t border-orange-200 pt-6 dark:border-orange-800 gap-3">
                    <Button
                        variant="outline"
                        onClick={() => handleClose()}
                        disabled={loading}
                        size="lg"
                        className="h-12 px-8 text-base border-orange-300 bg-orange-50 text-orange-700 hover:border-orange-500 hover:bg-orange-100 hover:text-orange-800 focus:border-orange-500 focus:bg-orange-100 focus:ring-2 focus:ring-orange-200 focus:outline-none dark:border-orange-600 dark:bg-orange-900/20 dark:text-orange-300 dark:hover:border-orange-500 dark:hover:bg-orange-900/30 dark:hover:text-orange-200 dark:focus:border-orange-500 dark:focus:bg-orange-900/30 dark:focus:ring-2 dark:focus:ring-orange-400"
                    >
                        {t('adjust_modal.cancel')}
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || adjustItems.length === 0}
                        size="lg"
                        className="h-12 px-8 text-base bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 focus:ring-2 focus:ring-orange-200 focus:outline-none disabled:opacity-50 dark:from-orange-600 dark:to-orange-700 dark:hover:from-orange-700 dark:hover:to-orange-800 dark:focus:ring-2 dark:focus:ring-orange-400"
                    >
                        {loading
                            ? t('adjust_modal.adjusting')
                            : `${t('adjust_modal.adjust_text')} ${adjustItems.length} ${adjustItems.length !== 1 ? t('adjust_modal.products') : t('adjust_modal.product')}`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
