import { forwardRef, useImperativeHandle, useMemo, useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ItemThumbnail } from '@/components/layout/item-thumbnail';
import { Input } from '@/components/ui/input';
import { Kbd } from '@/components/ui/kbd';
import { useTranslation } from '@/hooks/use-translation';
import { formatCurrency } from '@/lib/currency';
import { normalizeToEnglishNumbers } from '@/utils/keyboard-normalization';
// Direct calculations - no service needed
import { type CartItem } from '@/types/cart';
import {
    ShoppingCart,
    Trash2,
    Plus,
    Minus,
    X,
    Clock,
    RotateCcw,
    Trash,
    Scale,
    CreditCard,
    ChevronDown,
    ChevronUp,
    Percent,
    Package,
} from 'lucide-react';

interface CashierShoppingCartProps {
    items: CartItem[];
    discount: number;
    discountEnabled?: boolean;
    onDiscountChange: (discount: number) => void;
    onClearCart: () => void;
    onRemoveItem: (itemId: string) => void;
    onUpdateQuantity: (itemId: string, quantity: number, cartonMode?: {
        isCartonMode?: boolean;
        cartonQuantity?: number;
        displayQuantity?: number;
    }) => void;
    onHold: () => void;
    onRecall: () => void;
    onClearHold: () => void;
    heldCartsCount: number;
    onCheckout: () => void;
    focusedItemIndex?: number;
    onFocusChange?: (index: number) => void;
    lastUpdatedItemId?: string | null;
    onItemUpdated?: () => void;
}

export interface CashierShoppingCartRef {
    focusItem: (index: number) => void;
    focusLastItem: () => void;
    getEditableItemsCount: () => number;
}

interface ProductTypeStyle {
    borderColor: string;
    bgGradient: string;
    iconColor: string;
    icon: typeof ShoppingCart;
}
const getProductTypeStyle = (productType?: string): ProductTypeStyle => {
    switch (productType) {
        case 'scale_product':
            return {
                borderColor: 'border-green-200 dark:border-green-800',
                bgGradient: 'bg-gradient-to-br from-green-500/20 to-emerald-500/20',
                iconColor: 'text-green-600 dark:text-green-400',
                icon: Scale,
            };
        case 'card':
            return {
                borderColor: 'border-purple-200 dark:border-purple-800',
                bgGradient: 'bg-gradient-to-br from-purple-500/20 to-violet-500/20',
                iconColor: 'text-purple-600 dark:text-purple-400',
                icon: CreditCard,
            };
        default:
            return {
                borderColor: 'border-cyan-200 dark:border-cyan-800',
                bgGradient: 'bg-gradient-to-br from-cyan-500/20 to-emerald-500/20',
                iconColor: 'text-cyan-600 dark:text-cyan-400',
                icon: ShoppingCart,
            };
    }
};

export const CashierShoppingCart = forwardRef<
    CashierShoppingCartRef,
    CashierShoppingCartProps
>(
    (
        {
            items,
            discount,
            discountEnabled = true,
            onDiscountChange,
            onClearCart,
            onRemoveItem,
            onUpdateQuantity,
            onHold,
            onRecall,
            onClearHold,
            heldCartsCount,
            onCheckout,
            focusedItemIndex = 0,
            onFocusChange,
            lastUpdatedItemId,
            onItemUpdated,
        },
        ref,
    ) => {
        const { t } = useTranslation();
        const quantityInputRefs = useRef<(HTMLInputElement | null)[]>([]);
        const scrollableContainerRef = useRef<HTMLDivElement>(null);
        const [isDiscountExpanded, setIsDiscountExpanded] = useState(false);

        const editableItems = useMemo(
            () => items.filter((item) => !item.isScaleProduct),
            [items],
        );

        useImperativeHandle(ref, () => ({
            focusItem: (index: number) => {
                const safeIndex = Math.min(
                    Math.max(index, 0),
                    editableItems.length - 1,
                );
                const element = quantityInputRefs.current[safeIndex];
                if (element) {
                    element.focus();
                    element.select();
                    onFocusChange?.(safeIndex);
                }
            },
            focusLastItem: () => {
                const lastIndex = editableItems.length - 1;
                if (lastIndex >= 0) {
                    const element = quantityInputRefs.current[lastIndex];
                    if (element) {
                        element.focus();
                        element.select();
                        onFocusChange?.(lastIndex);
                    }
                }
            },
            getEditableItemsCount: () => editableItems.length,
        }));

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
        const summary = useMemo(() => {
            // Use pre-calculated totals from items (ultra-fast)
            const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);

            // Calculate discount and grand total
            const discountAmount = discountEnabled ? Number(discount) : 0;
            const grandTotal = Math.max(0, subtotal - discountAmount);

            return {
                itemsCount: items.length,
                subtotal,
                discount: discountAmount,
                discountAmount,
                grandTotal,
                hasItems: items.length > 0,
                hasScaleProducts: items.some(item => item.isScaleProduct),
                hasRegularProducts: items.some(item => !item.isScaleProduct && !item.barcode?.startsWith('CARD_')),
                hasCardProducts: items.some(item => item.barcode?.startsWith('CARD_')),
            };
        }, [items, discount, discountEnabled]);

        let editableCounter = 0;

        return (
            <div className="relative z-0 flex h-full flex-col border-l border-border/60 bg-gradient-to-br from-cyan-50/50 via-emerald-50/30 to-cyan-50/50 shadow-[-4px_0_12px_0_rgba(6,182,212,0.15)] dark:shadow-[-4px_0_12px_0_rgba(0,0,0,0.25)] dark:from-cyan-900/10 dark:via-emerald-900/5 dark:to-cyan-900/10" data-testid="cashier-shopping-cart">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border/60 bg-gradient-to-r from-cyan-100/50 via-emerald-100/50 to-cyan-100/50 px-6 py-4 dark:from-cyan-900/20 dark:via-emerald-900/20 dark:to-cyan-900/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 shadow-md">
                    <ShoppingCart className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                    <h2 className="text-xl font-bold text-foreground">
                        {t('point_of_sale.shopping_cart') || 'Shopping Cart'}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {items.length}{' '}
                        {items.length === 1
                            ? t('point_of_sale.item') || 'item'
                            : t('point_of_sale.items') || 'items'}
                    </p>
                </div>
                {items.length > 0 && (
                    <div className="flex items-center gap-4">
                        <span className="text-2xl font-bold text-foreground">
                            {formatCurrency(summary.grandTotal)}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-10 w-10 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={onClearCart}
                        >
                            <Trash2 className="h-5 w-5" />
                        </Button>
                    </div>
                )}
            </div>

            {/* Cart Items */}
            <div ref={scrollableContainerRef} className="flex-1 overflow-y-auto px-4 py-4">
                {items.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted/40">
                            <ShoppingCart className="h-10 w-10 text-muted-foreground/40" />
                        </div>
                        <p className="text-lg font-semibold text-muted-foreground">
                            {t('point_of_sale.cart_empty') || 'Cart is empty'}
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground/70">
                            {t('point_of_sale.add_items_to_cart') || 'Add items to get started'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {items.map((item) => {
                            const typeStyle = getProductTypeStyle(item.productType);
                            const Icon = typeStyle.icon;
                            const editableIndex = item.isScaleProduct
                                ? null
                                : editableCounter++;
                            const isFocused =
                                editableIndex !== null &&
                                editableIndex === focusedItemIndex;
                            const unitPrice = Number(item.price);
                            const perCarton = item.per_carton ?? 0;
                            const fallbackCartonPrice = perCarton ? unitPrice * perCarton : null;
                            const effectiveCartonPrice = item.carton_price ?? fallbackCartonPrice;
                            const priceDisplayValue = item.isCartonMode
                                ? (effectiveCartonPrice ?? unitPrice)
                                : unitPrice;

                            return (
                                <div
                                    key={item.id}
                                    data-item-id={item.id}
                                    className={`group relative overflow-hidden rounded-lg border ${typeStyle.borderColor} bg-gradient-to-r from-background/95 to-background/90 p-4 shadow-sm transition-all duration-200 hover:shadow-md ${
                                        isFocused
                                            ? 'ring-2 ring-offset-1 ring-offset-background ring-blue-500/40'
                                            : ''
                                    }`}
                                    onClick={() => {
                                        if (editableIndex !== null) {
                                            quantityInputRefs.current[editableIndex]?.focus();
                                        }
                                    }}
                                >
                                    {/* X Button - Positioned at top-right corner */}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="absolute top-2 right-2 h-7 w-7 p-0 text-muted-foreground hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 z-10"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRemoveItem(item.id);
                                        }}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                    <div className="flex items-center gap-3">
                                        {/* Product Icon */}
                                        {item.image_url ? (
                                            <ItemThumbnail url={item.image_url} name={item.name} />
                                        ) : (<div
                                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${typeStyle.bgGradient} ${typeStyle.iconColor} shadow-sm`}
                                        >
                                            <Icon className="h-5 w-5" />
                                        </div>)}

                                        {/* Product Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="mb-2">
                                                <h3 className="text-base font-semibold text-foreground truncate pr-8">
                                                    {item.name}
                                                </h3>
                                            </div>
                                            
                                            {/* Barcode */}
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xs font-mono text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded text-[10px]">
                                                    {item.barcode}
                                                </span>
                                                {/* Carton Info */}
                                                {!item.isScaleProduct && item.productType !== 'card' && (
                                                    <div className="flex items-center gap-1">
                                                        <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                                            item.per_carton 
                                                                ? 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20' 
                                                                : 'text-gray-500 dark:text-gray-400'
                                                        }`}>
                                                            <Package className="h-3 w-3" />
                                                            <span>{item.per_carton ? `${item.per_carton}` : 'N/A'}</span>
                                                        </div>
                                                        {/* Carton Toggle Button */}
                                                        {item.per_carton && (
                                                            <Button
                                                                variant={item.isCartonMode ? "default" : "outline"}
                                                                size="sm"
                                                                className={`h-6 px-2 text-xs font-medium transition-all duration-200 ${
                                                                    item.isCartonMode 
                                                                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                                                        : 'border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900/20'
                                                                }`}
                                                                onClick={() => {
                                                                    const newCartonMode = !item.isCartonMode;
                                                                    const newCartonQuantity = newCartonMode ? 1 : undefined;
                                                                    const newQuantity = newCartonMode 
                                                                        ? (item.per_carton || 1)
                                                                        : ((item.cartonQuantity || 1) * (item.per_carton || 1));
                                                                    
                                                                    onUpdateQuantity(item.id, newQuantity, {
                                                                        isCartonMode: newCartonMode,
                                                                        cartonQuantity: newCartonQuantity,
                                                                        displayQuantity: newCartonMode ? 1 : newQuantity
                                                                    });
                                                                }}
                                                            >
                                                                {item.isCartonMode ? (
                                                                    <Package className="h-3 w-3" />
                                                                ) : (
                                                                    <span className="text-xs font-mono">#</span>
                                                                )}
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
                                                {item.isCartonMode && (
                                                    <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">
                                                        {item.cartonQuantity || 1} {(item.cartonQuantity || 1) > 1 ? t('point_of_sale.cartons') : t('point_of_sale.carton')}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Quantity Controls */}
                                        {item.isScaleProduct ? (
                                            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-2 py-1.5 shadow-sm dark:border-green-800 dark:bg-green-900/20">
                                                <Scale className="h-3 w-3 text-green-600 dark:text-green-400" />
                                                <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                                                    {item.weight} kg
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 rounded-lg border border-border/40 bg-muted/20 p-1.5">
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground mr-2">
                                                    <Kbd className="bg-background text-foreground border border-border/50 px-1.5 py-0.5 text-xs font-mono">Tab</Kbd>
                                                    <Kbd className="bg-background text-foreground border border-border/50 px-1.5 py-0.5 text-xs font-mono">↑↓</Kbd>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 p-0 hover:bg-background hover:text-primary"
                                                    onClick={() => {
                                                        if (item.isCartonMode) {
                                                            const newCartonQty = Math.max(1, (item.cartonQuantity || 1) - 1);
                                                            const newUnitQty = newCartonQty * (item.per_carton || 1);
                                                            onUpdateQuantity(item.id, newUnitQty, {
                                                                isCartonMode: true,
                                                                cartonQuantity: newCartonQty,
                                                                displayQuantity: newCartonQty
                                                            });
                                                        } else {
                                                            if (
                                                                typeof item.quantity === 'number' &&
                                                                item.quantity > 1
                                                            ) {
                                                                onUpdateQuantity(
                                                                    item.id,
                                                                    item.quantity - 1,
                                                                );
                                                            }
                                                        }
                                                    }}
                                                    disabled={
                                                        item.isCartonMode 
                                                            ? (item.cartonQuantity || 1) <= 1
                                                            : (typeof item.quantity !== 'number' || item.quantity <= 1)
                                                    }
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </Button>
                                                <Input
                                                    ref={(element) => {
                                                        if (editableIndex !== null) {
                                                            quantityInputRefs.current[editableIndex] = element;
                                                        }
                                                    }}
                                                    type="text"
                                                    min={1}
                                                    value={item.isCartonMode ? (item.cartonQuantity || 1) : (item.quantity || 1)}
                                                    onClick={(event) => {
                                                        event.currentTarget.focus();
                                                        event.currentTarget.select();
                                                        if (editableIndex !== null) {
                                                            onFocusChange?.(editableIndex);
                                                        }
                                                    }}
                                                    onFocus={(event) => {
                                                        event.target.select();
                                                        if (editableIndex !== null) {
                                                            onFocusChange?.(editableIndex);
                                                        }
                                                    }}
                                                    data-testid="quantity-input"
                                                    onChange={(event) => {
                                                        const normalizedValue = normalizeToEnglishNumbers(event.target.value);
                                                        const newValue = parseInt(normalizedValue) || 1;
                                                        
                                                        if (item.isCartonMode) {
                                                            const newUnitQty = newValue * (item.per_carton || 1);
                                                            onUpdateQuantity(item.id, newUnitQty, {
                                                                isCartonMode: true,
                                                                cartonQuantity: newValue,
                                                                displayQuantity: newValue
                                                            });
                                                        } else {
                                                            onUpdateQuantity(item.id, newValue);
                                                        }
                                                    }}
                                                    onKeyDown={(event) => {
                                                        if (event.key === 'Enter') {
                                                            event.preventDefault();
                                                            (event.target as HTMLInputElement).blur();
                                                        } else if (event.key === 'ArrowDown' || event.key === '-' || event.key === '_') {
                                                            // Always prevent default to stop browser from changing quantity
                                                            event.preventDefault();
                                                            
                                                            // Only change quantity if user is actively typing (has modified the input)
                                                            const input = event.target as HTMLInputElement;
                                                            const originalValue = item.isCartonMode ? (item.cartonQuantity || 1).toString() : (item.quantity || 1).toString();
                                                            const isTyping = input.value !== originalValue;
                                                            
                                                            if (isTyping) {
                                                                if (item.isCartonMode) {
                                                                    const currentCartonQty = item.cartonQuantity || 1;
                                                                    if (currentCartonQty > 1) {
                                                                        const newCartonQty = currentCartonQty - 1;
                                                                        const newUnitQty = newCartonQty * (item.per_carton || 1);
                                                                        onUpdateQuantity(item.id, newUnitQty, {
                                                                            isCartonMode: true,
                                                                            cartonQuantity: newCartonQty,
                                                                            displayQuantity: newCartonQty
                                                                        });
                                                                    }
                                                                } else {
                                                                    const currentQty = item.quantity ?? 1;
                                                                    if (currentQty > 1) {
                                                                        onUpdateQuantity(item.id, currentQty - 1);
                                                                    }
                                                                }
                                                            } else {
                                                                // User is not typing, handle circular navigation
                                                                const quantityInputs = document.querySelectorAll('[data-testid="cashier-shopping-cart"] [data-testid="quantity-input"]');
                                                                const currentIndex = Array.from(quantityInputs).indexOf(input);
                                                                const targetIndex = currentIndex < quantityInputs.length - 1 ? currentIndex + 1 : 0;
                                                                const targetInput = quantityInputs[targetIndex] as HTMLInputElement;
                                                                targetInput.focus();
                                                                targetInput.select();
                                                            }
                                                        } else if (event.key === 'ArrowUp' || event.key === '+' || event.key === '=') {
                                                            // Always prevent default to stop browser from changing quantity
                                                            event.preventDefault();
                                                            
                                                            // Only change quantity if user is actively typing (has modified the input)
                                                            const input = event.target as HTMLInputElement;
                                                            const originalValue = item.isCartonMode ? (item.cartonQuantity || 1).toString() : (item.quantity || 1).toString();
                                                            const isTyping = input.value !== originalValue;
                                                            
                                                            if (isTyping) {
                                                                if (item.isCartonMode) {
                                                                    const currentCartonQty = item.cartonQuantity || 1;
                                                                    const newCartonQty = currentCartonQty + 1;
                                                                    const newUnitQty = newCartonQty * (item.per_carton || 1);
                                                                    onUpdateQuantity(item.id, newUnitQty, {
                                                                        isCartonMode: true,
                                                                        cartonQuantity: newCartonQty,
                                                                        displayQuantity: newCartonQty
                                                                    });
                                                                } else {
                                                                    const currentQty = item.quantity ?? 1;
                                                                    onUpdateQuantity(item.id, currentQty + 1);
                                                                }
                                                            } else {
                                                                // User is not typing, handle circular navigation
                                                                const quantityInputs = document.querySelectorAll('[data-testid="cashier-shopping-cart"] [data-testid="quantity-input"]');
                                                                const currentIndex = Array.from(quantityInputs).indexOf(input);
                                                                const targetIndex = currentIndex > 0 ? currentIndex - 1 : quantityInputs.length - 1;
                                                                const targetInput = quantityInputs[targetIndex] as HTMLInputElement;
                                                                targetInput.focus();
                                                                targetInput.select();
                                                            }
                                                        }
                                                    }}
                                                    className="h-7 w-14 border-0 bg-transparent px-0 text-center text-sm font-semibold text-foreground focus:outline-none focus:ring-0 cursor-pointer"
                                                    aria-label={
                                                        t('point_of_sale.quantity_input_label') ||
                                                        'Quantity'
                                                    }
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 p-0 hover:bg-background hover:text-primary"
                                                    onClick={() => {
                                                        if (item.isCartonMode) {
                                                            const newCartonQty = (item.cartonQuantity || 1) + 1;
                                                            const newUnitQty = newCartonQty * (item.per_carton || 1);
                                                            onUpdateQuantity(item.id, newUnitQty, {
                                                                isCartonMode: true,
                                                                cartonQuantity: newCartonQty,
                                                                displayQuantity: newCartonQty
                                                            });
                                                        } else {
                                                            const currentQuantity =
                                                                typeof item.quantity === 'number'
                                                                    ? item.quantity
                                                                    : 0;
                                                            onUpdateQuantity(item.id, currentQuantity + 1);
                                                        }
                                                    }}
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}

                                        {/* Price and Total */}
                                        <div className="text-right min-w-[80px] mt-4">
                                            <p className="text-xs text-muted-foreground whitespace-nowrap">
                                                {item.isScaleProduct
                                                    ? `${formatCurrency(unitPrice)}/${t('point_of_sale.kg') || 'kg'}`
                                                    : item.isCartonMode
                                                        ? `${t('product.carton_price') || 'Carton Price'}: ${formatCurrency(priceDisplayValue)}`
                                                        : `${t('product.sell_price') || 'Sell Price'}: ${formatCurrency(priceDisplayValue)}`}
                                            </p>
                                            <p className="text-base font-bold text-primary whitespace-nowrap">
                                                {formatCurrency(item.total)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer - Summary & Actions */}
            <div className="border-t border-border/60 bg-gradient-to-br from-[#4A6CF7]/10 via-[#F7A64A]/10 to-[#4A6CF7]/10 px-6 py-3">
                {/* Collapsible Discount Section */}
                <div className="mb-3">
                    {/* Discount Toggle Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-full justify-between px-2 text-xs font-medium text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/20"
                        onClick={() => setIsDiscountExpanded(!isDiscountExpanded)}
                    >
                        <div className="flex items-center gap-2">
                            <Percent className="h-3.5 w-3.5" />
                            <span>{t('point_of_sale.discount_label') || 'Discount'}</span>
                            {discount > 0 && (
                                <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                                    {formatCurrency(discount)}
                                </span>
                            )}
                            {!discountEnabled && (
                                <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                    {t('point_of_sale.disabled') || 'Disabled'}
                                </span>
                            )}
                        </div>
                        {isDiscountExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                        )}
                    </Button>

                    {/* Collapsible Discount Content */}
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isDiscountExpanded ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                        <div className="space-y-2 rounded-lg bg-background/80 p-3 shadow-sm">
                            <div className="relative">
                                <Input
                                    type="text"
                                    min="0"
                                    step="0.01"
                                    value={
                                        !discountEnabled || discount === 0
                                            ? ''
                                            : discount
                                    }
                                    onFocus={() => onFocusChange?.(-1)}
                                    onChange={(e) => {
                                        if (!discountEnabled) {
                                            return;
                                        }
                                        // Normalize Arabic numbers to English
                                        const normalizedValue = normalizeToEnglishNumbers(e.target.value);
                                        const value = parseFloat(normalizedValue);
                                        const cleanDiscount = isNaN(value) || value < 0 ? 0 : value;
                                        onDiscountChange(cleanDiscount);
                                    }}
                                    className="h-7 pr-10 text-xs border-orange-300 bg-orange-50 focus:border-orange-500 focus:ring-orange-500/20 dark:border-orange-600 dark:bg-orange-900/20 dark:focus:border-orange-500 dark:focus:ring-orange-500/30"
                                    data-shortcut-target="discount"
                                    placeholder={
                                        discountEnabled
                                            ? t('point_of_sale.discount_placeholder') || '0.00'
                                            : t(
                                                  'point_of_sale.discount_disabled_placeholder',
                                              ) || 'Hidden'
                                    }
                                    disabled={!discountEnabled || items.length === 0}
                                />
                                <span className="absolute top-1/2 right-2 -translate-y-1/2 transform text-[10px] font-medium text-orange-600 dark:text-orange-400">
                                    {t('point_of_sale.currency_iqd') || 'IQD'}
                                </span>
                            </div>
                            {!discountEnabled && (
                                <p className="text-[10px] font-medium text-orange-600/90 dark:text-orange-300">
                                    {t('point_of_sale.discount_disabled_message') ||
                                        'Discount is disabled by admin. Apply promotions at checkout manually.'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Compact Summary */}
                <div className="mb-3 rounded-lg bg-background/80 p-3 shadow-sm">
                    <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-blue-600 dark:text-blue-400">
                            {t('point_of_sale.subtotal') || 'Subtotal'}
                        </span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                            {formatCurrency(summary.subtotal)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-base font-bold text-foreground">
                            {t('point_of_sale.total') || 'Total'}
                        </span>
                        <span className="text-xl font-bold text-foreground">
                            {formatCurrency(summary.grandTotal)}
                        </span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                    <Button
                        className="h-10 w-full bg-gradient-to-r from-cyan-500 to-emerald-500 text-sm font-semibold text-white shadow-md hover:from-cyan-600 hover:to-emerald-600 hover:shadow-lg"
                        disabled={items.length === 0}
                        onClick={onCheckout}
                    >
                        {t('point_of_sale.checkout') || 'Checkout'}
                        <Kbd className="ml-2 bg-background text-foreground border border-border/50 px-1.5 py-0.5 text-xs font-mono">C</Kbd>
                    </Button>

                    {/* Hold/Recall/Clear Row */}
                    <div className="grid grid-cols-3 gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 border-orange-500/40 text-orange-600 hover:bg-orange-500/10 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                            onClick={onHold}
                            disabled={items.length === 0}
                        >
                            <Clock className="mr-1 h-3 w-3" />
                            <span className="text-xs">{t('point_of_sale.hold') || 'Hold'}</span>
                            <Kbd className="ml-1 bg-background text-foreground border border-border/50 px-1 py-0.5 text-[10px] font-mono">H</Kbd>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 border-blue-500/40 text-blue-600 hover:bg-blue-500/10 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 disabled:border-border disabled:text-muted-foreground disabled:hover:bg-transparent"
                            onClick={onRecall}
                            disabled={heldCartsCount === 0}
                        >
                            <RotateCcw className="mr-1 h-3 w-3" />
                            <span className="text-xs">{t('point_of_sale.recall') || 'Recall'}</span>
                            {heldCartsCount > 0 && (
                                <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[9px] font-bold text-white">
                                    {heldCartsCount}
                                </span>
                            )}
                            <Kbd className="ml-1 bg-background text-foreground border border-border/50 px-1 py-0.5 text-[10px] font-mono">B</Kbd>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 border-red-500/40 text-red-600 hover:bg-red-500/10 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:border-border disabled:text-muted-foreground disabled:hover:bg-transparent"
                            onClick={onClearHold}
                            disabled={heldCartsCount === 0}
                        >
                            <Trash className="mr-1 h-3 w-3" />
                            <span className="text-xs">{t('point_of_sale.clear_hold') || 'Clear'}</span>
                            <Kbd className="ml-1 bg-background text-foreground border border-border/50 px-1 py-0.5 text-[10px] font-mono">S</Kbd>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
        );
    },
);

CashierShoppingCart.displayName = 'CashierShoppingCart';
