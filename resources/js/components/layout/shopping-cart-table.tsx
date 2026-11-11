import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Kbd } from '@/components/ui/kbd';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from '@/hooks/use-translation';
import { formatCurrency } from '@/lib/currency';
import { normalizeToEnglishNumbers } from '@/utils/keyboard-normalization';
// Direct calculations - no service needed
import { CartItem } from '@/types/cart';
import {
    CheckCircle,
    Minus,
    Pause,
    Plus,
    RotateCcw,
    ShoppingCart,
    Trash2,
} from 'lucide-react';
import React, { forwardRef, useImperativeHandle, useRef, useEffect, useCallback } from 'react';

// CartItem interface moved to @/types/cart

interface ShoppingCartTableProps {
    items: CartItem[];
    onUpdateQuantity?: (itemId: string, quantity: number, cartonMode?: {
        isCartonMode?: boolean;
        cartonQuantity?: number;
        displayQuantity?: number;
    }) => void;
    onRemoveItem?: (itemId: string) => void;
    onClearCart?: () => void;
    onClearHold?: () => void;
    onRecall?: () => void;
    onHold?: () => void;
    onCheckout?: () => void;
    discount?: number;
    onDiscountChange?: (discount: number) => void;
    discountEnabled?: boolean;
    onDiscountToggleChange?: (enabled: boolean) => void;
    hasHeldCarts?: boolean;
    className?: string;
    focusedItemIndex?: number;
    onFocusChange?: (index: number) => void;
    lastUpdatedItemId?: string | null;
    onItemUpdated?: () => void;
}

export interface ShoppingCartTableRef {
    focusItem: (index: number) => void;
    focusLastItem: () => void;
    getEditableItemsCount: () => number;
}

const ShoppingCartTableComponent = (
    {
        items,
        onUpdateQuantity,
        onRemoveItem,
        onClearCart,
        onClearHold,
        onRecall,
        onHold,
        onCheckout,
    discount = 0,
    discountEnabled = true,
        onDiscountChange,
        onDiscountToggleChange,
        hasHeldCarts = false,
        className = '',
        onFocusChange,
        lastUpdatedItemId,
        onItemUpdated,
    }: ShoppingCartTableProps,
    ref: React.Ref<ShoppingCartTableRef>,
) => {
    const { t } = useTranslation();
    // Create refs for quantity inputs (only for normal products)
    const quantityInputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const scrollableContainerRef = useRef<HTMLDivElement>(null);

    // Get editable items (normal products and cards, not scale products)
    const editableItems = items.filter((item) => !item.isScaleProduct);

    // Ensure refs array has the correct length
    useEffect(() => {
        if (quantityInputRefs.current.length !== editableItems.length) {
            const newArray = new Array(editableItems.length).fill(null);
            // Preserve existing refs when resizing
            for (let i = 0; i < Math.min(quantityInputRefs.current.length, editableItems.length); i++) {
                if (quantityInputRefs.current[i]) {
                    newArray[i] = quantityInputRefs.current[i];
                }
            }
            quantityInputRefs.current = newArray;
        }
    }, [editableItems.length]);

    // Create stable refs for focus methods
    const focusItemRef = useRef<((index: number) => void) | null>(null);
    const focusLastItemRef = useRef<(() => void) | null>(null);

    // Define focus methods with useCallback
    const focusItemCallback = useCallback((index: number) => {
        // Add small delay to ensure refs are set after render
        setTimeout(() => {
            const editableIndex = Math.min(index, editableItems.length - 1);
            if (
                editableIndex >= 0 &&
                quantityInputRefs.current[editableIndex]
            ) {
                quantityInputRefs.current[editableIndex]?.focus();
                quantityInputRefs.current[editableIndex]?.select();
                onFocusChange?.(editableIndex);
            }
        }, 50);
    }, [editableItems.length, onFocusChange]);

    const focusLastItemCallback = useCallback(() => {
        setTimeout(() => {
            const lastIndex = editableItems.length - 1;
            if (lastIndex >= 0 && quantityInputRefs.current[lastIndex]) {
                quantityInputRefs.current[lastIndex]?.focus();
                quantityInputRefs.current[lastIndex]?.select();
                onFocusChange?.(lastIndex);
            }
        }, 50);
    }, [editableItems.length, onFocusChange]);

    // Update refs
    useEffect(() => {
        focusItemRef.current = focusItemCallback;
        focusLastItemRef.current = focusLastItemCallback;
    }, [focusItemCallback, focusLastItemCallback]);

    // Expose stable methods to parent
    useImperativeHandle(ref, () => ({
        focusItem: (index: number) => focusItemRef.current?.(index),
        focusLastItem: () => focusLastItemRef.current?.(),
        getEditableItemsCount: () => editableItems.length,
    }), [editableItems.length]);

    // Scroll to updated item effect
    useEffect(() => {
        if (lastUpdatedItemId && scrollableContainerRef.current) {
            const itemElement = scrollableContainerRef.current.querySelector(`[data-item-id="${lastUpdatedItemId}"]`);
            if (itemElement) {
                // Scroll the item into view with smooth behavior
                itemElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                });
                
                // Call the callback to reset the tracking
                setTimeout(() => {
                    onItemUpdated?.();
                }, 1000); // Reset after scroll animation completes
            }
        }
    }, [lastUpdatedItemId, onItemUpdated]);
    // Direct calculations - simple and fast
    // Use pre-calculated totals from items (ultra-fast)
    const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
    const validDiscount = Number(discount);
    const grandTotal = Math.max(0, subtotal - validDiscount);

    return (
        <div
            data-testid="shopping-cart-table"
            className={`flex h-full flex-col overflow-hidden bg-card rounded-md shadow-[0_4px_8px_0_rgba(0,0,0,0.2),0_2px_4px_0_rgba(0,0,0,0.1)] dark:shadow-[0_4px_8px_0_rgba(0,0,0,0.4),0_2px_4px_0_rgba(0,0,0,0.3)] ${className}`}
        >
            {/* Fixed Header */}
            <div className="flex-shrink-0 rounded-t-md shadow-[0_1px_0_0_rgba(0,0,0,0.1)] dark:shadow-[0_1px_0_0_rgba(0,0,0,0.3)] bg-card text-card-foreground p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            <h3 className="text-base font-semibold text-card-foreground">
                                {t('point_of_sale.shopping_cart_title')}
                            </h3>
                        </div>
                        <div className="rounded-md bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700 shadow-sm hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/40">
                            {items.length} {items.length === 1 ? t('point_of_sale.item') : t('point_of_sale.items')}
                        </div>
                    </div>
                    {items.length > 0 && (
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <span>{t('point_of_sale.remove_first_item') || 'Remove first item'}</span>
                                <Kbd className="text-xs">Z</Kbd>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 border-red-300 bg-red-50 px-3 text-red-700 transition-all duration-200 hover:scale-105 hover:border-red-500 hover:bg-red-100 hover:text-red-800 dark:border-red-600 dark:bg-red-900/20 dark:text-red-300 dark:hover:border-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-200"
                                onClick={onClearCart}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t('point_of_sale.clear_all')}
                                <Kbd className="ml-2">A</Kbd>
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Fixed Table Header */}
            <div className="flex-shrink-0 shadow-[0_1px_0_0_rgba(0,0,0,0.1)] dark:shadow-[0_1px_0_0_rgba(0,0,0,0.3)] bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-card-foreground">
                <div className="grid grid-cols-12 gap-3 p-4 text-sm font-semibold">
                    <div className="col-span-2 text-left">
                        <span className="text-blue-700 dark:text-blue-300">{t('point_of_sale.table_header_barcode')}</span>
                    </div>
                    <div className="col-span-3 text-left">
                        <span className="text-green-700 dark:text-green-300">{t('point_of_sale.table_header_product')}</span>
                    </div>
                    <div className="col-span-1 text-center">
                        <span className="text-indigo-700 dark:text-indigo-300">{t('point_of_sale.table_header_carton')}</span>
                    </div>
                    <div className="col-span-2 text-center">
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-purple-700 dark:text-purple-300">{t('point_of_sale.table_header_qty')}</span>
                            <div className="flex gap-1">
                                <Kbd className="text-xs">Tab</Kbd>
                                <Kbd className="text-xs">↑↓</Kbd>
                            </div>
                        </div>
                    </div>
                    <div className="col-span-2 text-center">
                        <span className="text-orange-700 dark:text-orange-300">{t('point_of_sale.table_header_price')}</span>
                    </div>
                    <div className="col-span-1 text-right">
                        <span className="text-emerald-700 dark:text-emerald-300">{t('point_of_sale.table_header_total')}</span>
                    </div>
                    <div className="col-span-1 text-center">
                        <span className="text-red-700 dark:text-red-300">{t('point_of_sale.table_header_action')}</span>
                    </div>
                </div>
            </div>

            {/* Scrollable Table Body */}
            <div ref={scrollableContainerRef} className="min-h-0 flex-1 overflow-y-auto">
                <div className="divide-y divide-border">
                    {items.length > 0 ? (
                        items.map((item, itemIndex) => {
                            // Calculate editable item index for ref management
                            const editableItemIndex = items
                                .slice(0, itemIndex)
                                .filter((i) => !i.isScaleProduct).length;
                            const unitPrice = Number(item.price);
                            const perCarton = item.per_carton ?? 0;
                            const fallbackCartonPrice = perCarton ? unitPrice * perCarton : null;
                            const effectiveCartonPrice = item.carton_price ?? fallbackCartonPrice;
                            const priceDisplayValue = item.isCartonMode
                                ? (effectiveCartonPrice ?? unitPrice)
                                : unitPrice;
                            const priceLabel = item.isCartonMode
                                ? t('product.carton_price') || 'Carton Price'
                                : t('product.sell_price') || 'Sell Price';
                            

                            return (
                                <div
                                    key={item.id}
                                    data-item-id={item.id}
                                    className={`grid grid-cols-12 gap-3 p-4 transition-all duration-200 hover:shadow-md ${
                                        itemIndex % 2 === 0 
                                            ? 'bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-gray-800/50 hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20' 
                                            : 'bg-gradient-to-r from-white to-slate-50 dark:from-slate-900/50 dark:to-slate-800/50 hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-900/20 dark:hover:to-emerald-900/20'
                                    }`}
                                >
                                    <div className="col-span-2">
                                        <span className="font-mono text-sm text-blue-700 dark:text-blue-300 font-medium">
                                            {item.barcode}
                                        </span>
                                    </div>
                                    <div className="col-span-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                                                {item.name}
                                            </span>
                                            {item.isScaleProduct && (
                                                <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">
                                                    SCALE
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="col-span-1 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <span className={`text-xs font-medium ${
                                                item.per_carton 
                                                    ? 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded' 
                                                    : 'text-gray-500 dark:text-gray-400'
                                            }`}>
                                                {(() => {
                                                    // Only show carton info for normal products (not scale products or cards)
                                                    if (item.isScaleProduct || item.productType === 'card') {
                                                        return '-';
                                                    }
                                                    
                                                    return item.per_carton ? `${item.per_carton}` : '-';
                                                })()}
                                            </span>
                                            {/* Carton Mode Toggle Button */}
                                            {item.per_carton && !item.isScaleProduct && item.productType !== 'card' && (
                                                <Button
                                                    variant={item.isCartonMode ? "default" : "outline"}
                                                    size="sm"
                                                    className={`h-6 px-2 text-xs ${
                                                        item.isCartonMode 
                                                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                                            : 'border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900/20'
                                                    }`}
                                                    onClick={() => {
                                                        // Toggle carton mode
                                                        const newCartonMode = !item.isCartonMode;
                                                        const newCartonQuantity = newCartonMode ? 1 : undefined;
                                                        const newQuantity = newCartonMode 
                                                            ? (item.per_carton || 1)  // Switch to carton: start with 1 carton
                                                            : ((item.cartonQuantity || 1) * (item.per_carton || 1)); // Switch to unit: convert cartons to units
                                                        
                                                        onUpdateQuantity?.(item.id, newQuantity, {
                                                            isCartonMode: newCartonMode,
                                                            cartonQuantity: newCartonQuantity,
                                                            displayQuantity: newCartonMode ? 1 : newQuantity
                                                        });
                                                    }}
                                                >
                                                    {item.isCartonMode ? 'Carton' : 'Unit'}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="col-span-2 flex items-center justify-center gap-2">
                                        {item.isScaleProduct ? (
                                            // Scale products show weight, no quantity controls
                                            <div className="text-center">
                                                <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                                                    {`${item.weight} ${t('point_of_sale.kg')}`}
                                                </span>
                                            </div>
                                        ) : (
                                            // Regular products show quantity input with controls
                                            <div className="flex items-center justify-center gap-1">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 w-8 border-purple-300 bg-purple-50 p-0 text-purple-700 hover:border-purple-500 hover:bg-purple-100 hover:text-purple-800 dark:border-purple-600 dark:bg-purple-900/20 dark:text-purple-300 dark:hover:border-purple-500 dark:hover:bg-purple-900/30 dark:hover:text-purple-200"
                                                    onClick={() => {
                                                        if (item.isCartonMode) {
                                                            // In carton mode, decrease carton quantity
                                                            const newCartonQty = Math.max(1, (item.cartonQuantity || 1) - 1);
                                                            const newUnitQty = newCartonQty * (item.per_carton || 1);
                                                            onUpdateQuantity?.(item.id, newUnitQty, {
                                                                isCartonMode: true,
                                                                cartonQuantity: newCartonQty,
                                                                displayQuantity: newCartonQty
                                                            });
                                                        } else {
                                                            // In unit mode, decrease unit quantity
                                                            onUpdateQuantity?.(
                                                                item.id,
                                                                Math.max(1, (item.quantity || 1) - 1)
                                                            );
                                                        }
                                                    }}
                                                    disabled={
                                                        item.isCartonMode 
                                                            ? (item.cartonQuantity || 1) <= 1
                                                            : (item.quantity || 1) <= 1
                                                    }
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <Input
                                                    ref={(el) => {
                                                        // Only assign the ref, let useEffect handle array length management
                                                        if (editableItemIndex >= 0 && editableItemIndex < editableItems.length) {
                                                            quantityInputRefs.current[editableItemIndex] = el;
                                                        }
                                                    }}
                                                    data-testid="quantity-input"
                                                    type="text"
                                                    min="1"
                                                    value={item.isCartonMode ? (item.cartonQuantity || 1) : (item.quantity || 1)}
                                                    onClick={(e) => {
                                                        e.currentTarget.focus();
                                                        e.currentTarget.select();
                                                        onFocusChange?.(editableItemIndex);
                                                    }}
                                                    onChange={(e) => {
                                                        const normalizedValue = normalizeToEnglishNumbers(e.target.value);
                                                        const newValue = parseInt(normalizedValue) || 1;
                                                        
                                                        if (item.isCartonMode) {
                                                            // Update carton quantity and calculate unit quantity
                                                            const newUnitQty = newValue * (item.per_carton || 1);
                                                            onUpdateQuantity?.(item.id, newUnitQty, {
                                                                isCartonMode: true,
                                                                cartonQuantity: newValue,
                                                                displayQuantity: newValue
                                                            });
                                                        } else {
                                                            // Update unit quantity directly
                                                            onUpdateQuantity?.(item.id, newValue);
                                                        }
                                                    }}
                                                    onFocus={(e) => {
                                                        e.target.select();
                                                        onFocusChange?.(editableItemIndex);
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            (e.target as HTMLInputElement).blur();
                                                        } else if (e.key === 'ArrowDown' || e.key === '-' || e.key === '_') {
                                                            // Always prevent default to stop browser from changing quantity
                                                            e.preventDefault();
                                                            
                                                            // Only change quantity if user is actively typing (has modified the input)
                                                            const input = e.target as HTMLInputElement;
                                                            const originalValue = item.isCartonMode ? (item.cartonQuantity || 1).toString() : (item.quantity || 1).toString();
                                                            const isTyping = input.value !== originalValue;
                                                            
                                                            if (isTyping) {
                                                                if (item.isCartonMode) {
                                                                    const currentCartonQty = item.cartonQuantity || 1;
                                                                    if (currentCartonQty > 1) {
                                                                        const newCartonQty = currentCartonQty - 1;
                                                                        const newUnitQty = newCartonQty * (item.per_carton || 1);
                                                                        onUpdateQuantity?.(item.id, newUnitQty, {
                                                                            isCartonMode: true,
                                                                            cartonQuantity: newCartonQty,
                                                                            displayQuantity: newCartonQty
                                                                        });
                                                                    }
                                                                } else {
                                                                    const currentQty = item.quantity || 1;
                                                                    if (currentQty > 1) {
                                                                        onUpdateQuantity?.(item.id, currentQty - 1);
                                                                    }
                                                                }
                                                            } else {
                                                                // User is not typing, handle circular navigation
                                                                const quantityInputs = document.querySelectorAll('[data-testid="shopping-cart-table"] [data-testid="quantity-input"]');
                                                                const currentIndex = Array.from(quantityInputs).indexOf(input);
                                                                const targetIndex = currentIndex < quantityInputs.length - 1 ? currentIndex + 1 : 0;
                                                                const targetInput = quantityInputs[targetIndex] as HTMLInputElement;
                                                                targetInput.focus();
                                                                targetInput.select();
                                                            }
                                                        } else if (e.key === 'ArrowUp' || e.key === '+' || e.key === '=') {
                                                            // Always prevent default to stop browser from changing quantity
                                                            e.preventDefault();
                                                            
                                                            // Only change quantity if user is actively typing (has modified the input)
                                                            const input = e.target as HTMLInputElement;
                                                            const originalValue = item.isCartonMode ? (item.cartonQuantity || 1).toString() : (item.quantity || 1).toString();
                                                            const isTyping = input.value !== originalValue;
                                                            
                                                            if (isTyping) {
                                                                if (item.isCartonMode) {
                                                                    const currentCartonQty = item.cartonQuantity || 1;
                                                                    const newCartonQty = currentCartonQty + 1;
                                                                    const newUnitQty = newCartonQty * (item.per_carton || 1);
                                                                    onUpdateQuantity?.(item.id, newUnitQty, {
                                                                        isCartonMode: true,
                                                                        cartonQuantity: newCartonQty,
                                                                        displayQuantity: newCartonQty
                                                                    });
                                                                } else {
                                                                    const currentQty = item.quantity || 1;
                                                                    onUpdateQuantity?.(item.id, currentQty + 1);
                                                                }
                                                            } else {
                                                                // User is not typing, handle circular navigation
                                                                const quantityInputs = document.querySelectorAll('[data-testid="shopping-cart-table"] [data-testid="quantity-input"]');
                                                                const currentIndex = Array.from(quantityInputs).indexOf(input);
                                                                const targetIndex = currentIndex > 0 ? currentIndex - 1 : quantityInputs.length - 1;
                                                                const targetInput = quantityInputs[targetIndex] as HTMLInputElement;
                                                                targetInput.focus();
                                                                targetInput.select();
                                                            }
                                                        }
                                                    }}
                                                    className="h-8 w-16 text-center text-sm font-semibold text-purple-700 border-purple-300 focus:border-purple-500 focus:ring-purple-500/20 dark:text-purple-300 dark:border-purple-600 dark:focus:border-purple-500 dark:focus:ring-purple-500/30 cursor-pointer"
                                                />
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 w-8 border-purple-300 bg-purple-50 p-0 text-purple-700 hover:border-purple-500 hover:bg-purple-100 hover:text-purple-800 dark:border-purple-600 dark:bg-purple-900/20 dark:text-purple-300 dark:hover:border-purple-500 dark:hover:bg-purple-900/30 dark:hover:text-purple-200"
                                                    onClick={() => {
                                                        if (item.isCartonMode) {
                                                            // In carton mode, increase carton quantity
                                                            const newCartonQty = (item.cartonQuantity || 1) + 1;
                                                            const newUnitQty = newCartonQty * (item.per_carton || 1);
                                                            onUpdateQuantity?.(item.id, newUnitQty, {
                                                                isCartonMode: true,
                                                                cartonQuantity: newCartonQty,
                                                                displayQuantity: newCartonQty
                                                            });
                                                        } else {
                                                            // In unit mode, increase unit quantity
                                                            onUpdateQuantity?.(
                                                                item.id,
                                                                (item.quantity || 1) + 1
                                                            );
                                                        }
                                                    }}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-span-2 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                                                {formatCurrency(priceDisplayValue)}
                                            </span>
                                            <span className="text-xs text-muted-foreground dark:text-muted-foreground/80">
                                                {priceLabel}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="col-span-1 text-right">
                                        <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                                            {formatCurrency(item.total || 0)}
                                        </span>
                                    </div>
                                    <div className="col-span-1 text-center">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-100 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                                            onClick={() =>
                                                onRemoveItem?.(item.id)
                                            }
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="flex h-full min-h-[300px] items-center justify-center">
                            <div className="text-center text-muted-foreground">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="rounded-full bg-purple-100 dark:bg-purple-900/20 p-4">
                                        <ShoppingCart className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-lg font-semibold text-purple-700 dark:text-purple-300">
                                            {t('point_of_sale.cart_empty_title')}
                                        </p>
                                        <p className="text-sm text-purple-600 dark:text-purple-400">
                                            {t('point_of_sale.cart_empty_message')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Fixed Footer with totals - Always visible */}
            <div className="flex-shrink-0 rounded-b-md shadow-[0_-1px_0_0_rgba(0,0,0,0.1)] dark:shadow-[0_-1px_0_0_rgba(0,0,0,0.3)] bg-card text-card-foreground p-6">
                <div className="space-y-4">
                    {/* Single Row Layout for Discount, Subtotal, and Total */}
                    <div className="grid grid-cols-3 items-center gap-4">
                        {/* Discount */}
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 mb-2">
                                <Label className="text-sm font-medium text-orange-600 dark:text-orange-400">
                                    {t('point_of_sale.discount_label')}
                                </Label>
                                <Kbd className="text-xs">D</Kbd>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="relative flex-1">
                                    <Input
                                        type="text"
                                        min="0"
                                        step="0.01"
                                        value={
                                            validDiscount === 0
                                                ? ''
                                                : validDiscount
                                        }
                                        onChange={(e) => {
                                            // Normalize Arabic numbers to English
                                            const normalizedValue = normalizeToEnglishNumbers(e.target.value);
                                            const value = parseFloat(
                                                normalizedValue,
                                            );
                                            const cleanDiscount =
                                                isNaN(value) || value < 0
                                                    ? 0
                                                    : value;
                                            onDiscountChange?.(cleanDiscount);
                                        }}
                                        className="h-10 pr-10 text-sm border-orange-300 bg-orange-50 focus:border-orange-500 focus:ring-orange-500/20 dark:border-orange-600 dark:bg-orange-900/20 dark:focus:border-orange-500 dark:focus:ring-orange-500/30"
                                        data-shortcut-target="discount"
                                        placeholder={t('point_of_sale.discount_placeholder')}
                                        disabled={items.length === 0}
                                    />
                                    <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 transform text-sm font-medium text-orange-600 dark:text-orange-400">
                                        {t('point_of_sale.currency_iqd')}
                                    </span>
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                    <Switch
                                        checked={discountEnabled}
                                        onCheckedChange={(checked) =>
                                            onDiscountToggleChange?.(checked)
                                        }
                                        className="data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500 focus:ring-cyan-200 dark:data-[state=checked]:bg-cyan-600 dark:data-[state=checked]:border-cyan-600 dark:focus:ring-cyan-400"
                                    />
                                    <span className={`text-xs font-medium transition-colors duration-200 ${
                                        discountEnabled 
                                            ? 'text-cyan-600 dark:text-cyan-400' 
                                            : 'text-gray-500 dark:text-gray-400'
                                    }`}>
                                        {discountEnabled 
                                            ? t('point_of_sale.discount_status_enabled') 
                                            : t('point_of_sale.discount_status_disabled')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Subtotal */}
                        <div className="flex flex-col">
                            <span className="text-sm text-blue-600 dark:text-blue-400">
                                {t('point_of_sale.subtotal_label')}
                            </span>
                            <span className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                                {formatCurrency(subtotal)}
                            </span>
                        </div>

                        {/* Total */}
                        <div className="flex flex-col">
                            <span className="text-sm text-green-600 dark:text-green-400">
                                {t('point_of_sale.total_label')}
                            </span>
                            <span className="text-2xl font-bold text-green-700 dark:text-green-300">
                                {formatCurrency(grandTotal)}
                            </span>
                        </div>
                    </div>
                    <div className="mt-4 flex gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-10 flex-1 border-red-300 bg-red-50 text-red-700 text-sm transition-all duration-200 hover:scale-105 hover:border-red-500 hover:bg-red-100 hover:text-red-800 dark:border-red-600 dark:bg-red-900/20 dark:text-red-300 dark:hover:border-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-200"
                            onClick={onClearHold}
                            disabled={!hasHeldCarts}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t('point_of_sale.clear_hold_button')}
                            <Kbd className="ml-2">S</Kbd>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-10 flex-1 border-green-300 bg-green-50 text-green-700 text-sm transition-all duration-200 hover:scale-105 hover:border-green-500 hover:bg-green-100 hover:text-green-800 dark:border-green-600 dark:bg-green-900/20 dark:text-green-300 dark:hover:border-green-500 dark:hover:bg-green-900/30 dark:hover:text-green-200"
                            onClick={onRecall}
                            disabled={!hasHeldCarts}
                        >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            {t('point_of_sale.recall_button')}
                            <Kbd className="ml-2">B</Kbd>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-10 flex-1 border-blue-300 bg-blue-50 text-blue-700 text-sm transition-all duration-200 hover:scale-105 hover:border-blue-500 hover:bg-blue-100 hover:text-blue-800 dark:border-blue-600 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:border-blue-500 dark:hover:bg-blue-900/30 dark:hover:text-blue-200"
                            onClick={onHold}
                            disabled={items.length === 0}
                        >
                            <Pause className="mr-2 h-4 w-4" />
                            {t('point_of_sale.hold_button')}
                            <Kbd className="ml-2">H</Kbd>
                        </Button>
                        <Button
                            size="sm"
                            className="h-10 flex-1 bg-gradient-to-r from-[#4A6CF7] to-[#F7A64A] text-sm text-white transition-all duration-200 hover:scale-105 hover:from-[#4A6CF7]/90 hover:to-[#F7A64A]/90 shadow-lg"
                            onClick={onCheckout}
                            disabled={items.length === 0}
                        >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            {t('point_of_sale.checkout_button')}
                            <Kbd className="ml-2">C</Kbd>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ShoppingCartTable = forwardRef<
    ShoppingCartTableRef,
    ShoppingCartTableProps
>(ShoppingCartTableComponent);
