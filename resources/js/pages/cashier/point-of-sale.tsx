import { cartPriceIssue, withCartPrice } from '@/lib/cart-pricing';
import { formatIQD } from '@/lib/currency';
import { getItemImageUrl } from '@/lib/item-image';
import { SCALE_PRODUCTS_ENABLED } from '@/config/features';
import CashierLayout from '@/layouts/cashier/cashier-layout';
import {
    CashierShoppingCart,
    type CashierShoppingCartRef,
} from '@/components/layout/cashier-shopping-cart';
import { CashierProductGrid } from '@/components/layout/cashier-product-grid';
import { useTranslation } from '@/hooks/use-translation';
import { Head, usePage } from '@inertiajs/react';
import {
    BarcodeSearchFilter,
    type BarcodeSearchFilterRef,
} from '@/components/filters/barcode-search-filter';
import { NameSearchFilter } from '@/components/filters/name-search-filter';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { CreditCard, Receipt, Scale } from 'lucide-react';
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { posService, type PosProduct } from '@/services/utils/posService';
import {
    productService,
    type Product as ProductRecord,
} from '@/services/business/productService';
import { posVisibilitySyncService } from '@/services/utils/posVisibilitySyncService';
import { cardCacheService } from '@/services/business/cardCacheService';
import { normalizeKeyboardShortcuts } from '@/utils/keyboard-normalization';
import type { CartItem } from '@/types/cart';
import type { Card, User } from '@/types';
import type { ScaleProduct } from '@/services/business/scaleProductService';
// Direct calculations - no service needed
import { holdCartService, type HoldCartData } from '@/services/utils/holdCartService';
import {
    transactionService,
    type CreateTransactionData,
    type Transaction,
    type StockIssueDetail,
} from '@/services/business/transactionService';
import { discountVisibilityService } from '@/services/utils/discountVisibilityService';
import { receiptService } from '@/services/utils/receiptService';
import { ReceiptPreviewModal } from '@/components/modals/receipt-preview-modal';

const RecallCartModal = lazy(() =>
    import('@/components/modals/recall-cart-modal').then((module) => ({
        default: module.RecallCartModal,
    })),
);

const OverwriteHoldModal = lazy(() =>
    import('@/components/modals/overwrite-hold-modal').then((module) => ({
        default: module.OverwriteHoldModal,
    })),
);

const ScaleModal = lazy(() =>
    import('@/components/modals/scale-modal').then((module) => ({
        default: module.ScaleModal,
    })),
);

const UnifiedCardsModal = lazy(() =>
    import('@/components/modals/unified-cards-modal').then((module) => ({
        default: module.UnifiedCardsModal,
    })),
);

const computeNextHoldNumber = (existingHoldNumbers: string[]): string => {
    const usedNumbers = new Set<number>();

    existingHoldNumbers.forEach((label) => {
        const match = label.match(/(\d+)/);
        if (!match) {
            return;
        }

        const parsed = Number.parseInt(match[1] ?? '', 10);
        if (Number.isFinite(parsed)) {
            usedNumbers.add(parsed);
        }
    });

    let candidate = 1;
    while (usedNumbers.has(candidate)) {
        candidate += 1;
    }

    return `Hold ${candidate}`;
};

export default function CashierPointOfSalePage() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const page = usePage();
    const { auth } = (page.props as Record<string, unknown>) || {};
    const user = (auth as { user: User })?.user;
    const barcodeSearchRef = useRef<BarcodeSearchFilterRef>(null);
    const cartRef = useRef<CashierShoppingCartRef>(null);
    const isProcessingCheckoutRef = useRef(false);
    const lastTransactionRef = useRef<Transaction | null>(null);
    const LAST_RECEIPT_KEY = 'pos:cashier:last_receipt';
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [cartDiscount, setCartDiscount] = useState(0);
    const [isDiscountVisible, setIsDiscountVisible] = useState(true);
    const [heldCartsCount, setHeldCartsCount] = useState(0);
    const [scaleModalOpen, setScaleModalOpen] = useState(false);
    const [cardsModalOpen, setCardsModalOpen] = useState(false);
    const [recallCartModalOpen, setRecallCartModalOpen] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewHtml, setPreviewHtml] = useState<string | null>(null);
    const [lastUpdatedItemId, setLastUpdatedItemId] = useState<string | null>(null);

    // Cart persistence constants
    const CART_STORAGE_KEY = 'pos:cashier:cart';
    const DISCOUNT_STORAGE_KEY = 'pos:cashier:discount';

    // Cart persistence utilities
    const saveCartToStorage = useCallback((items: CartItem[], discountValue: number) => {
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
            localStorage.setItem(DISCOUNT_STORAGE_KEY, JSON.stringify(discountValue));
        } catch (error) {
            console.warn('Failed to save cart to localStorage:', error);
        }
    }, [CART_STORAGE_KEY, DISCOUNT_STORAGE_KEY]);

    const loadCartFromStorage = useCallback((): { items: CartItem[]; discount: number } => {
        try {
            const savedItems = localStorage.getItem(CART_STORAGE_KEY);
            const savedDiscount = localStorage.getItem(DISCOUNT_STORAGE_KEY);
            
            return {
                items: savedItems ? JSON.parse(savedItems) : [],
                discount: savedDiscount ? JSON.parse(savedDiscount) : 0
            };
        } catch (error) {
            console.warn('Failed to load cart from localStorage:', error);
            return { items: [], discount: 0 };
        }
    }, [CART_STORAGE_KEY, DISCOUNT_STORAGE_KEY]);

    const clearCartFromStorage = useCallback(() => {
        try {
            localStorage.removeItem(CART_STORAGE_KEY);
            localStorage.removeItem(DISCOUNT_STORAGE_KEY);
        } catch (error) {
            console.warn('Failed to clear cart from localStorage:', error);
        }
    }, [CART_STORAGE_KEY, DISCOUNT_STORAGE_KEY]);

    // Local product cache for instant barcode lookup (supports duplicates)
    const [productCache, setProductCache] = useState<Map<string, PosProduct[]>>(new Map());
    // Store all products array for name search
    const [allProducts, setAllProducts] = useState<PosProduct[]>([]);
    const [cacheLoaded, setCacheLoaded] = useState(false);
    const [cacheLoading, setCacheLoading] = useState(false);
    const [overwriteModalOpen, setOverwriteModalOpen] = useState(false);
    const [quickPickProducts, setQuickPickProducts] = useState<PosProduct[]>([]);
    const [quickPickLoading, setQuickPickLoading] = useState(false);

    // Audio refs for checkout sound
    const checkoutAudioRefs = useRef<HTMLAudioElement[]>([]);
    const currentCheckoutAudioIndex = useRef(0);

    // Audio refs for quantity increase sound
    const increaseAudioRefs = useRef<HTMLAudioElement[]>([]);
    const currentIncreaseAudioIndex = useRef(0);

    // Audio refs for add item sound
    const addAudioRefs = useRef<HTMLAudioElement[]>([]);
    const currentAddAudioIndex = useRef(0);

    // Memoized cart calculations - only recalculates when cart changes
    const cartSummary = useMemo(() => {
        const subtotal = cartItems.reduce((sum, item) => {
            // Use stored total, or calculate if missing (fallback)
            const itemTotal = item.total || (item.isScaleProduct 
                ? Number(item.price) * Number(item.weight || 0)
                : Number(item.price) * Number(item.quantity || 1));
            return sum + itemTotal;
        }, 0);
        return {
            subtotal,
            itemCount: cartItems.length,
        };
    }, [cartItems]);

    const checkHeldCarts = useCallback(() => {
        const heldCarts = holdCartService.getAllHeldCarts();
        setHeldCartsCount(heldCarts.length);
        return heldCarts;
    }, []);

    // Pre-load checkout audio for instant playback
    useEffect(() => {
        try {
            for (let i = 0; i < 3; i++) {
                const audio = new Audio('/audio/sounds/checkout.mp3');
                audio.volume = 1.0;
                audio.preload = 'auto';
                audio.load();
                checkoutAudioRefs.current.push(audio);
            }
        } catch {
            // Silent fail
        }
    }, []);

    // Pre-load increase audio for instant playback
    useEffect(() => {
        try {
            for (let i = 0; i < 3; i++) {
                const audio = new Audio('/audio/sounds/increase.mp3');
                audio.volume = 1.0;
                audio.preload = 'auto';
                audio.load();
                increaseAudioRefs.current.push(audio);
            }
        } catch {
            // Silent fail
        }
    }, []);

    // Pre-load add audio for instant playback
    useEffect(() => {
        try {
            for (let i = 0; i < 3; i++) {
                const audio = new Audio('/audio/sounds/add.mp3');
                audio.volume = 1.0;
                audio.preload = 'auto';
                audio.load();
                addAudioRefs.current.push(audio);
            }
        } catch {
            // Silent fail
        }
    }, []);

    // Load cart from localStorage on component mount
    useEffect(() => {
        const { items, discount: savedDiscount } = loadCartFromStorage();
        if (items.length > 0) {
            setCartItems(items);
            setCartDiscount(savedDiscount);
        }
    }, [loadCartFromStorage]);

    // Save cart to localStorage whenever cartItems or cartDiscount changes
    useEffect(() => {
        if (cartItems.length > 0 || cartDiscount > 0) {
            saveCartToStorage(cartItems, cartDiscount);
        }
    }, [cartItems, cartDiscount, saveCartToStorage]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        checkHeldCarts();
        cardCacheService.preloadCards().catch(() => {
            // Preload failed silently - cards will load on demand
        });
    }, [checkHeldCarts]);

    // Play checkout sound function
    const playCheckoutSound = useCallback(() => {
        if (checkoutAudioRefs.current.length > 0) {
            try {
                const audio = checkoutAudioRefs.current[currentCheckoutAudioIndex.current];
                audio.currentTime = 0;
                audio.play().catch(() => {});
                currentCheckoutAudioIndex.current = (currentCheckoutAudioIndex.current + 1) % checkoutAudioRefs.current.length;
            } catch {
                // Silent fail
            }
        }
    }, []);

    // Play increase sound function
    const playIncreaseSound = useCallback(() => {
        if (increaseAudioRefs.current.length > 0) {
            try {
                const audio = increaseAudioRefs.current[currentIncreaseAudioIndex.current];
                
                // Pause and reset audio to ensure it can play again
                audio.pause();
                audio.currentTime = 0;
                
                // Play with promise handling for better reliability
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.catch(() => {
                        // If play fails, try to reload and play
                        audio.load();
                        audio.play().catch(() => {});
                    });
                }
                
                // Rotate to next audio instance for rapid consecutive plays
                currentIncreaseAudioIndex.current = (currentIncreaseAudioIndex.current + 1) % increaseAudioRefs.current.length;
            } catch {
                // Silent fail
            }
        }
    }, []);

    // Play add sound function
    const playAddSound = useCallback(() => {
        if (addAudioRefs.current.length > 0) {
            try {
                const audio = addAudioRefs.current[currentAddAudioIndex.current];
                audio.currentTime = 0;
                audio.play().catch(() => {});
                currentAddAudioIndex.current = (currentAddAudioIndex.current + 1) % addAudioRefs.current.length;
            } catch {
                // Silent fail
            }
        }
    }, []);

    const focusBarcodeSearch = useCallback((delay = 120) => {
        const focusInput = () => {
            // Try ref-based approach first
            if (barcodeSearchRef.current) {
                barcodeSearchRef.current.focus();
            }
            
            // Also try direct DOM query as fallback (more reliable)
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    const barcodeInput = document.querySelector('[data-testid="barcode-search"]') as HTMLInputElement;
                    if (barcodeInput) {
                        barcodeInput.focus();
                        barcodeInput.select();
                    }
                });
            });
        };

        if (delay > 0) {
            setTimeout(focusInput, delay);
        } else {
            // Use requestAnimationFrame for immediate focus
            requestAnimationFrame(() => {
                requestAnimationFrame(focusInput);
            });
        }
    }, []);

    const handlePrintPreviousReceipt = useCallback(async () => {
        if (!lastTransactionRef.current || !user) {
            // Try to load from localStorage fallback
            try {
                const saved = localStorage.getItem(LAST_RECEIPT_KEY);
                if (saved) {
                    lastTransactionRef.current = JSON.parse(saved) as Transaction;
                }
            } catch (e) {
                console.warn('Failed to load last receipt from storage', e);
            }
        }
        if (!lastTransactionRef.current || !user) {
            toast({
                title: t('point_of_sale.no_previous_receipt'),
                description: t('point_of_sale.no_previous_receipt_desc'),
                type: 'info',
                duration: 2500,
            });
            return;
        }

        try {
            const html = await receiptService.getReceiptHTML(lastTransactionRef.current, user);
            setPreviewHtml(html);
            setPreviewOpen(true);
        } catch (err) {
            console.warn('Previous receipt preview failed:', err);
        }
    }, [toast, t, user]);

    useEffect(() => {
        focusBarcodeSearch(0);
    }, [focusBarcodeSearch]);

    useEffect(() => {
        const initialVisibility = discountVisibilityService.getVisibility();
        setIsDiscountVisible(initialVisibility);
        if (!initialVisibility) {
            setCartDiscount(0);
        }

        const unsubscribe = discountVisibilityService.subscribe((enabled) => {
            setIsDiscountVisible(enabled);
            if (!enabled) {
                setCartDiscount(0);
            }
        });

        discountVisibilityService.syncFromServer().catch(() => undefined);

        return () => {
            unsubscribe?.();
        };
    }, []);


    // Ensure discount is always 0 when discount is disabled
    useEffect(() => {
        if (!isDiscountVisible && cartDiscount !== 0) {
            setCartDiscount(0);
        }
    }, [isDiscountVisible, cartDiscount]);

    const normalizeProductToQuickPick = useCallback(
        (product: ProductRecord): PosProduct | null => {
            if (!product) {
                return null;
            }

            const isVisible = Boolean(product.show_in_pos);
            if (!isVisible) {
                return null;
            }

            const barcode = product.barcode || '';
            if (!barcode) {
                return null;
            }

            const normalized: PosProduct = {
                id: product.id,
                type: 'product',
                name: product.name,
                image_url: product.image_url ?? null,
                cost_price: product.cost_price === null || product.cost_price === undefined ? null : Number(product.cost_price),
                barcode,
                secondary_barcode: product.secondary_barcode || undefined,
                sell_price:
                    typeof product.sell_price === 'number'
                        ? product.sell_price
                        : Number(product.sell_price ?? 0),
                stock:
                    typeof product.stock === 'number'
                        ? product.stock
                        : Number(product.stock ?? 0),
                per_carton: typeof product.per_carton === 'number' ? product.per_carton : null,
            };

            return normalized;
        },
        [],
    );

    const loadQuickPickProducts = useCallback(async () => {
        setQuickPickLoading(true);

        const perPage = 120;
        let page = 1;
        const aggregatedProducts = new Map<number, PosProduct>();

        const resolveTranslation = (key: string, fallback: string) => {
            const translated = t(key);
            return translated === key ? fallback : translated;
        };

        try {
            let hasMore = true;

            while (hasMore) {
                const response = await productService.getPosVisibleProducts(perPage, page);

                if (!response.success || !response.data) {
                    throw new Error(response.message || 'Failed to load POS products');
                }

                const payload = response.data as
                    | ProductRecord[]
                    | {
                          data?: ProductRecord[];
                          current_page?: number;
                          last_page?: number;
                      };

                let pageProducts: ProductRecord[] = [];
                let currentPage = page;
                let lastPage = page;

                if (Array.isArray(payload)) {
                    pageProducts = payload;
                    hasMore = false;
                } else if (payload && typeof payload === 'object') {
                    if (Array.isArray(payload.data)) {
                        pageProducts = payload.data;
                    }

                    if (typeof payload.current_page === 'number') {
                        currentPage = payload.current_page;
                    }

                    if (typeof payload.last_page === 'number') {
                        lastPage = payload.last_page;
                    }

                    if (!Array.isArray(payload.data) || currentPage >= lastPage) {
                        hasMore = false;
                    } else {
                        page += 1;
                    }
                } else {
                    hasMore = false;
                }

                if (pageProducts.length === 0) {
                    continue;
                }

                pageProducts.forEach((product) => {
                    const normalized = normalizeProductToQuickPick(product);
                    if (!normalized) {
                        return;
                    }

                    aggregatedProducts.set(normalized.id, normalized);
                });
            }

            setQuickPickProducts(Array.from(aggregatedProducts.values()));
        } catch (error) {
            console.error('Failed to load POS products', error);
            const description =
                error instanceof Error
                    ? error.message
                    : resolveTranslation(
                          'point_of_sale.product_load_failed_desc',
                          'Please try again or refresh the cache.',
                      );

            toast({
                type: 'error',
                title: resolveTranslation(
                    'point_of_sale.product_load_failed',
                    'Unable to load products',
                ),
                description,
            });
        } finally {
            setQuickPickLoading(false);
        }
    }, [normalizeProductToQuickPick, t, toast]);

    useEffect(() => {
        void loadQuickPickProducts();
    }, [loadQuickPickProducts]);

    // Subscribe to product visibility changes and reload products
    useEffect(() => {
        const unsubscribe = posVisibilitySyncService.subscribe(() => {
            // Reload all products when visibility changes
            void loadQuickPickProducts();
        });

        return () => {
            unsubscribe();
        };
    }, [loadQuickPickProducts]);

    // Load all products at startup (called once)
    const loadProductCache = useCallback(async () => {
        setCacheLoading(true);
        try {
            const response = await posService.getAllProductsCache();
            
            if (response.success) {
                // Store all products array for name search
                setAllProducts(response.data);
                
                // Build fast lookup map: barcode → products[] (supports duplicates)
                const lookupMap = new Map<string, PosProduct[]>();
                
                response.data.forEach(product => {
                    // Index by primary barcode
                    if (product.barcode) {
                        const key = product.barcode.toLowerCase();
                        if (!lookupMap.has(key)) {
                            lookupMap.set(key, []);
                        }
                        lookupMap.get(key)!.push(product);
                    }
                    
                    // Index by secondary barcode
                    if (product.secondary_barcode) {
                        const key = product.secondary_barcode.toLowerCase();
                        if (!lookupMap.has(key)) {
                            lookupMap.set(key, []);
                        }
                        lookupMap.get(key)!.push(product);
                    }
                    
                });
                
                setProductCache(lookupMap);
                setCacheLoaded(true);
                
                toast({
                    type: 'success',
                    title: t('point_of_sale.cache_loaded'),
                    description: `${response.count} products loaded`,
                    duration: 2000,
                });
            } else {
                // Handle API failure response
                setCacheLoaded(true); // Set to true to prevent infinite retries
                toast({
                    type: 'error',
                    title: t('point_of_sale.cache_failed'),
                    description: response.message || t('point_of_sale.cache_failed_desc'),
                    duration: 3000,
                });
            }
        } catch {
            // Handle network/exception errors
            setCacheLoaded(true); // Set to true to prevent infinite retries
            toast({
                type: 'error',
                title: t('point_of_sale.cache_failed'),
                description: t('point_of_sale.cache_failed_desc'),
                duration: 3000,
            });
        } finally {
            setCacheLoading(false);
        }
    }, [toast, t]);

    // Load cache on mount
    useEffect(() => {
        if (!cacheLoaded && !cacheLoading) {
            loadProductCache();
        }
    }, [cacheLoaded, cacheLoading, loadProductCache]);

    // Instant local barcode lookup (no API call) - returns multiple products for duplicates
    const searchProductByBarcode = useCallback((barcode: string): PosProduct[] => {
        if (!cacheLoaded || !barcode) return [];
        
        const searchKey = barcode.toLowerCase().trim();
        return productCache.get(searchKey) || [];
    }, [productCache, cacheLoaded]);

    // Instant local name search (no API call) - searches all products using contains
    const searchProductByName = useCallback((name: string): PosProduct[] => {
        if (!cacheLoaded || !name) return [];
        
        const searchTerm = name.toLowerCase().trim();
        if (!searchTerm) return [];
        
        // Filter products where name contains the search term (case-insensitive)
        return allProducts.filter(product => 
            product.type === 'product' && 
            product.name?.toLowerCase().includes(searchTerm)
        );
    }, [allProducts, cacheLoaded]);


    const buildStockIssueToastDescription = useCallback(
        (details: StockIssueDetail[] | undefined, defaultMessage?: string) => {
            if (!details?.length) {
                return defaultMessage ?? t('point_of_sale.insufficient_stock_desc');
            }

            return (
                <div className="space-y-3">
                    <p className="text-sm font-medium">
                        {t('point_of_sale.insufficient_stock_details_intro')}
                    </p>
                    <div className="rounded-md border border-red-200/70 bg-white/90 p-3 text-xs text-red-900 shadow-sm dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-100">
                        <ul className="space-y-2">
                            {details.map((item) => (
                                <li key={`${item.barcode ?? item.name}`}>
                                    <div className="text-sm font-semibold">{item.name}</div>
                                    <div className="mt-0.5 opacity-80">
                                        {item.barcode
                                            ? t('point_of_sale.insufficient_stock_details_barcode', {
                                                  barcode: item.barcode,
                                              })
                                            : t('point_of_sale.insufficient_stock_details_no_barcode')}
                                    </div>
                                    <div className="mt-0.5">
                                        {t('point_of_sale.insufficient_stock_details_quantity', {
                                            available: item.available,
                                            requested: item.requested,
                                        })}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <p className="text-xs opacity-80">
                        {t('point_of_sale.insufficient_stock_details_hint')}
                    </p>
                </div>
            );
        },
        [t],
    );


    const addItemToCart = (item: Partial<CartItem>) => {
        const itemWithId = {
            ...item,
            id:
                item.id ||
                `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
        };

        // Direct validation - simple and fast
        if (!itemWithId.id || !itemWithId.barcode || !itemWithId.name || !itemWithId.price || Number(itemWithId.price) <= 0) {
            toast({
                type: 'error',
                title: t('common.invalid_item'),
                description: t('common.invalid_item_desc'),
                duration: 2200,
            });
            focusBarcodeSearch();
            return;
        }

        // For scale products, validate weight
        if (itemWithId.isScaleProduct && (!itemWithId.weight || Number(itemWithId.weight) <= 0)) {
            toast({
                type: 'error',
                title: t('common.invalid_item'),
                description: 'Scale products must have valid weight',
                duration: 2200,
            });
            focusBarcodeSearch();
            return;
        }

        // For regular products, validate quantity
        if (!itemWithId.isScaleProduct && (!itemWithId.quantity || itemWithId.quantity <= 0)) {
            toast({
                type: 'error',
                title: t('common.invalid_item'),
                description: 'Products must have valid quantity',
                duration: 2200,
            });
            focusBarcodeSearch();
            return;
        }

        const basePrice = Number(itemWithId.price);
        const baseQuantity = Number(itemWithId.quantity || 1);
        const perCarton = Number(itemWithId.per_carton ?? 0);
        const isCartonMode = itemWithId.isCartonMode ?? false;
        const suppliedCartonQuantity = itemWithId.cartonQuantity;
        const resolvedCartonQuantity = isCartonMode
            ? suppliedCartonQuantity && suppliedCartonQuantity > 0
                ? suppliedCartonQuantity
                : perCarton > 0
                    ? Math.max(1, Math.round(baseQuantity / perCarton))
                    : undefined
            : undefined;
        const explicitCartonPrice = itemWithId.carton_price ?? null;
        const fallbackCartonPrice = perCarton > 0 ? basePrice * perCarton : null;
        const effectiveCartonPrice = explicitCartonPrice !== null && explicitCartonPrice !== undefined
            ? Number(explicitCartonPrice)
            : fallbackCartonPrice;

        // Calculate total immediately when adding item
        const itemTotal = itemWithId.isScaleProduct 
            ? basePrice * Number(itemWithId.weight || 0)
            : isCartonMode && perCarton > 0 && effectiveCartonPrice !== null && resolvedCartonQuantity
                ? Number(effectiveCartonPrice) * resolvedCartonQuantity
                : basePrice * baseQuantity;

        const newItem: CartItem = {
            id: itemWithId.id,
            image_url: itemWithId.image_url ?? null,
            cost_price: itemWithId.cost_price ?? null,
            barcode: itemWithId.barcode!,
            name: itemWithId.name!,
            price: itemWithId.price!,
            quantity: itemWithId.quantity ?? null,
            total: itemTotal, // Use calculated total
            isScaleProduct: itemWithId.isScaleProduct,
            weight: itemWithId.weight,
            productId: itemWithId.productId,
            scaleProductId: itemWithId.scaleProductId,
            cardId: itemWithId.cardId,
            productType: itemWithId.productType,
            originalPrice: itemWithId.price,
            calculatedAt: Date.now(),
            per_carton: itemWithId.per_carton, // Include carton information
            stock: itemWithId.stock, // Include stock information
            carton_price: itemWithId.carton_price ?? null,
            ...(isCartonMode
                ? {
                    isCartonMode: true,
                    cartonQuantity: resolvedCartonQuantity ?? 1,
                    displayQuantity: resolvedCartonQuantity ?? baseQuantity,
                }
                : {}),
            
            // Pre-build complete transaction item (zero-delay checkout)
            transactionItem: {
                product_id: itemWithId.productId,
                card_id: itemWithId.cardId,
                scale_product_id: itemWithId.scaleProductId,
                barcode: itemWithId.barcode!,
                name: itemWithId.name!,
                price: itemWithId.isScaleProduct
                    ? basePrice
                    : baseQuantity > 0
                        ? Number((itemTotal / baseQuantity).toFixed(2))
                        : basePrice,
                quantity: itemWithId.quantity ?? 1,
                weight: Number(itemWithId.weight || 0),
                total: itemTotal,
                is_scale_product: itemWithId.isScaleProduct || false,
            },
        };
        let addedNewItem = false;
        let mergedExisting = false;
        let updatedItemId: string | null = null;
        let notificationDescription = '';

        setCartItems((previousItems) => {
            // Scale products are always added as separate items, even if same product and weight
            const existingIndex = newItem.isScaleProduct 
                ? -1 // Always treat scale products as new items
                : previousItems.findIndex((cartItem) => {
                    if (cartItem.barcode !== newItem.barcode) {
                        return false;
                    }

                    if (
                        cartItem.productId &&
                        newItem.productId &&
                        cartItem.productId === newItem.productId
                    ) {
                        return true;
                    }

                    if (
                        cartItem.cardId &&
                        newItem.cardId &&
                        cartItem.cardId === newItem.cardId
                    ) {
                        return true;
                    }

                    return false;
                });

            if (existingIndex >= 0) {
                mergedExisting = true;
                updatedItemId = previousItems[existingIndex].id;
                try {
                    const updatedItems = previousItems.map((cartItem, index) => {
                        if (index !== existingIndex) {
                            return cartItem;
                        }

                        // Store old values for notification
                        const oldQuantity = cartItem.quantity || 0;
                        const oldWeight = cartItem.weight || 0;

                        // Direct merge logic - simple and fast
                        if (cartItem.isScaleProduct) {
                            // Scale products: add weights
                            const combinedWeight = Number(cartItem.weight || 0) + Number(newItem.weight || 0);
                            const newTotal = Number(cartItem.price) * combinedWeight;
                            
                            // Create notification description
                            notificationDescription = `${newItem.name} - Weight: ${oldWeight}kg → ${combinedWeight}kg`;
                            
                            return {
                                ...cartItem,
                                weight: combinedWeight,
                                name: `${cartItem.name.split(' (')[0]} (${combinedWeight}kg)`,
                                total: newTotal,
                                
                                // Rebuild transaction item for merged scale product
                                transactionItem: {
                                    ...cartItem.transactionItem!,
                                    weight: combinedWeight,
                                    total: newTotal,
                                },
                            };
                        } else {
                            // Regular products: add quantities
                            const combinedQuantity = (cartItem.quantity || 0) + (newItem.quantity || 0);
                            const newTotal = Number(cartItem.price) * combinedQuantity;
                            
                            // Create notification description
                            notificationDescription = `${newItem.name} - Quantity: ${oldQuantity} → ${combinedQuantity}`;
                            
                            return {
                                ...cartItem,
                                image_url: newItem.image_url ?? cartItem.image_url,
                                cost_price: newItem.cost_price,
                                quantity: combinedQuantity,
                                total: newTotal,
                                
                                // Rebuild transaction item for merged regular product
                                transactionItem: {
                                    ...cartItem.transactionItem!,
                                    quantity: combinedQuantity,
                                    total: newTotal,
                                },
                            };
                        }
                    });

                    // Move the updated item to the top (first position)
                    const updatedItem = updatedItems[existingIndex];
                    const otherItems = updatedItems.filter((_, index) => index !== existingIndex);
                    return [updatedItem, ...otherItems];
                } catch {
                    mergedExisting = false;
                    return previousItems;
                }
            }

            addedNewItem = true;
            updatedItemId = newItem.id;
            return [newItem, ...previousItems]; // Add new item at the beginning (top of list)
        });

        if (addedNewItem) {
            // Track the new item for scrolling
            setLastUpdatedItemId(updatedItemId);
            
            toast({
                type: 'success',
                title: t('point_of_sale.item_added'),
                description: `${newItem.name} ${t('point_of_sale.item_added_desc')}`,
                duration: 2000,
            });

            // Play add sound for new item
            playAddSound();

            requestAnimationFrame(() => {
                focusBarcodeSearch();
            });
        } else if (mergedExisting) {
            // Track the updated item for scrolling
            setLastUpdatedItemId(updatedItemId);
            
            // Show enhanced toast with quantity information
            toast({
                type: 'info',
                title: t('point_of_sale.item_updated'),
                description: notificationDescription,
                duration: 3000,
            });

            // Play increase sound for quantity update
            playIncreaseSound();

            focusBarcodeSearch();
        }
    };

    const addProductToCart = (product: PosProduct) => {
        const barcode =
            product.type === 'scale_product' && product.plu
                ? product.plu
                : product.barcode;

        const baseItem: Partial<CartItem> = {
            barcode,
            name: product.name,
            image_url: product.image_url ?? null,
            cost_price: product.cost_price === null || product.cost_price === undefined ? null : Number(product.cost_price),
            price: product.sell_price,
            quantity: 1,
            isScaleProduct: product.type === 'scale_product',
            productType: product.type,
            stock: product.stock,
            per_carton: product.per_carton,
            carton_price: product.carton_price ?? null,
        };

        if (product.type === 'product') {
            baseItem.productId = product.id;
        } else if (product.type === 'scale_product') {
            baseItem.scaleProductId = product.id;
            baseItem.quantity = null;
        }

        addItemToCart(baseItem);
    };

    const handleProductSelect = (product: PosProduct) => {
        addProductToCart(product);
        focusBarcodeSearch(0);
    };

    const handleScaleProductSelect = (product: ScaleProduct, weight: number) => {
        const productName =
            typeof product.name === 'string'
                ? product.name
                : t('point_of_sale.scale_product') || 'Scale product';

        addItemToCart({
            id: `scale_${product.id}_${Date.now()}`,
            barcode:
                ((product as unknown as Record<string, unknown>).barcode as string) ||
                product.plu,
            name: `${productName} (${weight}kg)`,
            price: product.sell_price,
            quantity: null,
            isScaleProduct: true,
            weight,
            scaleProductId: product.id,
            productType: 'scale_product',
        });
    };

    const handleCardSelect = (card: Card) => {
        let cardName = t('point_of_sale.card') || 'Card';
        if ('name' in card && typeof card.name === 'string') {
            cardName = card.name;
        } else if (
            'name_card' in card &&
            typeof card.name_card === 'object' &&
            card.name_card !== null &&
            'name' in card.name_card &&
            typeof card.name_card.name === 'string'
        ) {
            cardName = card.name_card.name;
        }

        addItemToCart({
            id: `card_${card.id}_${Date.now()}`,
            barcode: `CARD_${card.id}`,
            image_url: getItemImageUrl(card),
            cost_price: card.cost_price === null || card.cost_price === undefined ? null : Number(card.cost_price),
            name: cardName,
            price: Number(card.sell_price) || 0,
            quantity: 1,
            isScaleProduct: false,
            cardId: card.id,
            productType: 'card',
        });

        // Refresh name card cache to stay in sync with admin POS behavior
        void cardCacheService.getNameCardsWithCards(true);
    };


    const handleScale = () => {
        if (!SCALE_PRODUCTS_ENABLED) return;
        setScaleModalOpen(true);
    };

    const handleCards = () => {
        setCardsModalOpen(true);
    };

    const handleDiscountChange = (value: number) => {
        if (!isDiscountVisible) {
            return;
        }
        setCartDiscount(value);
    };

    const handleClearCart = useCallback(() => {
        setCartItems([]);
        setCartDiscount(0);
        clearCartFromStorage();

        toast({
            type: 'info',
            title: t('point_of_sale.cart_cleared'),
            description: t('point_of_sale.cart_cleared_desc'),
            duration: 2000,
        });

        focusBarcodeSearch();
    }, [focusBarcodeSearch, t, toast, clearCartFromStorage]);

    const handleRemoveCartItem = useCallback((itemId: string) => {
        setCartItems((prevItems) => {
            return prevItems.filter((item) => item.id !== itemId);
        });

        focusBarcodeSearch();
    }, [focusBarcodeSearch]);

    const handleUpdateItemQuantity = (itemId: string, quantity: number, cartonMode?: {
        isCartonMode?: boolean;
        cartonQuantity?: number;
        displayQuantity?: number;
    }) => {
        if (!Number.isFinite(quantity) || quantity < 1) {
            return;
        }

        // Find the target item to get old quantity
        const targetItem = cartItems.find(item => item.id === itemId);
        if (!targetItem) {
            return;
        }

        // Store old quantity for notification
        const oldQuantity = targetItem.quantity || 0;

        setCartItems((prevItems) => {
            const updatedItems = prevItems.map((item) => {
                if (item.id !== itemId) {
                    return item;
                }

                if (item.isScaleProduct) {
                    return item;
                }

                const updatedItem = {
                    ...item,
                    quantity,
                    calculatedAt: Date.now(),
                    ...(cartonMode && {
                        isCartonMode: cartonMode.isCartonMode,
                        cartonQuantity: cartonMode.cartonQuantity,
                        displayQuantity: cartonMode.displayQuantity,
                    }),
                };

                const perCartonUpdated = Number(updatedItem.per_carton ?? 0);
                const explicitCartonPriceUpdated = updatedItem.carton_price ?? null;
                const fallbackCartonPriceUpdated = perCartonUpdated > 0
                    ? Number(updatedItem.price) * perCartonUpdated
                    : null;
                const effectiveCartonPriceUpdated = explicitCartonPriceUpdated !== null && explicitCartonPriceUpdated !== undefined
                    ? Number(explicitCartonPriceUpdated)
                    : fallbackCartonPriceUpdated;

                if (!updatedItem.isCartonMode) {
                    updatedItem.cartonQuantity = undefined;
                    updatedItem.displayQuantity = undefined;
                } else {
                    const providedCartonQuantity = cartonMode?.cartonQuantity ?? updatedItem.cartonQuantity;
                    const resolvedCartonQuantity = providedCartonQuantity && providedCartonQuantity > 0
                        ? providedCartonQuantity
                        : perCartonUpdated > 0
                            ? Math.max(1, Math.round(quantity / perCartonUpdated))
                            : 1;
                    updatedItem.cartonQuantity = resolvedCartonQuantity;
                    if (updatedItem.displayQuantity === undefined && resolvedCartonQuantity) {
                        updatedItem.displayQuantity = resolvedCartonQuantity;
                    }
                }

                let updatedTotal: number;
                if (updatedItem.isScaleProduct) {
                    updatedTotal = Number(updatedItem.price) * Number(updatedItem.weight || 0);
                } else if (
                    updatedItem.isCartonMode &&
                    perCartonUpdated > 0 &&
                    effectiveCartonPriceUpdated !== null &&
                    updatedItem.cartonQuantity &&
                    updatedItem.cartonQuantity > 0
                ) {
                    updatedTotal = Number(effectiveCartonPriceUpdated) * updatedItem.cartonQuantity;
                } else {
                    updatedTotal = Number(updatedItem.price) * Number(updatedItem.quantity || 1);
                }

                updatedItem.total = updatedTotal;

                const effectiveQuantity = Number(updatedItem.quantity || 1);
                const recalculatedUnitPrice = !updatedItem.isScaleProduct && effectiveQuantity > 0
                    ? Number((updatedTotal / effectiveQuantity).toFixed(2))
                    : Number(updatedItem.price);

                return {
                    ...updatedItem,
                    transactionItem: {
                        ...(updatedItem.transactionItem ?? {
                            product_id: updatedItem.productId,
                            card_id: updatedItem.cardId,
                            scale_product_id: updatedItem.scaleProductId,
                            barcode: updatedItem.barcode,
                            name: updatedItem.name,
                            price: recalculatedUnitPrice,
                            quantity: updatedItem.isScaleProduct ? null : effectiveQuantity,
                            weight: Number(updatedItem.weight || 0),
                            total: updatedTotal,
                            is_scale_product: !!updatedItem.isScaleProduct,
                        }),
                        price: updatedItem.isScaleProduct ? Number(updatedItem.price) : recalculatedUnitPrice,
                        quantity: updatedItem.isScaleProduct ? updatedItem.transactionItem?.quantity ?? null : effectiveQuantity,
                        total: updatedTotal,
                    },
                };
            });

            // Move the updated item to the top (first position)
            const updatedItem = updatedItems.find(item => item.id === itemId);
            const otherItems = updatedItems.filter(item => item.id !== itemId);
            return updatedItem ? [updatedItem, ...otherItems] : updatedItems;
        });
        
        // Track the updated item for scrolling
        setLastUpdatedItemId(itemId);
        
        // Show enhanced notification with quantity change
        const description = `${targetItem.name} - Quantity: ${oldQuantity} → ${quantity}`;
        toast({
            type: 'info',
            title: t('point_of_sale.item_updated'),
            description: description,
            duration: 2500,
        });

        // Play increase sound for quantity update
        playIncreaseSound();
    };

    const performHold = useCallback((options?: Partial<HoldCartData>) => {
        try {
            const subtotal = cartSummary.subtotal;
            const currentHeldCarts = holdCartService.getAllHeldCarts();
            const holdNumber =
                options?.holdNumber ??
                computeNextHoldNumber(currentHeldCarts.map((cart) => cart.holdNumber));
            const customerName = options?.customerName ?? `Customer ${holdNumber}`;

            const holdData: HoldCartData = {
                holdNumber,
                customerName,
                customerPhone: options?.customerPhone,
                notes: options?.notes,
            };

            const discountForHold = isDiscountVisible ? cartDiscount : 0;
            holdCartService.holdCart(
                cartItems,
                subtotal,
                discountForHold,
                holdData,
            );

            setCartItems([]);
            setCartDiscount(0);
            checkHeldCarts();

            toast({
                type: 'success',
                title: t('point_of_sale.cart_held'),
                description: `${t('point_of_sale.cart_held_desc')} ${holdNumber}.`,
                duration: 3000,
            });

            focusBarcodeSearch();
        } catch {
            toast({
                type: 'error',
                title: t('point_of_sale.hold_failed'),
                description: t('point_of_sale.hold_failed_desc'),
                duration: 3000,
            });

            focusBarcodeSearch(120);
        }
    }, [
        cartItems,
        cartSummary,
        cartDiscount,
        isDiscountVisible,
        t,
        toast,
        focusBarcodeSearch,
        checkHeldCarts,
    ]);

    const handleHoldCart = useCallback(() => {
        if (cartItems.length === 0) {
            focusBarcodeSearch(0);
            return;
        }

        if (holdCartService.isHoldCapacityReached()) {
            setOverwriteModalOpen(true);
            return;
        }

        performHold();
    }, [cartItems, performHold, focusBarcodeSearch]);

    const handleRecallHeldCart = useCallback(() => {
        const heldCarts = holdCartService.getAllHeldCarts();

        if (heldCarts.length === 0) {
            toast({
                type: 'info',
                title: t('point_of_sale.no_held_carts'),
                description: t('point_of_sale.no_held_carts_desc'),
                duration: 3000,
            });
            focusBarcodeSearch(0);
            return;
        }

        setRecallCartModalOpen(true);
    }, [focusBarcodeSearch, t, toast]);

    const handleRecallCart = useCallback(
        (cartData: {
            cartItems: CartItem[];
            subtotal: number;
            discount: number;
            grandTotal: number;
        }) => {
            setRecallCartModalOpen(false);
            setCartItems(cartData.cartItems);
            setCartDiscount(
                isDiscountVisible ? cartData.discount : 0,
            );
            checkHeldCarts();

            toast({
                type: 'success',
                title: t('point_of_sale.cart_recalled'),
                description: `${t('point_of_sale.cart_recalled_desc')} ${cartData.cartItems.length} items.`,
                duration: 3000,
            });

            focusBarcodeSearch();
        },
        [checkHeldCarts, focusBarcodeSearch, isDiscountVisible, t, toast],
    );

    const handleOverwriteHold = useCallback(
        (cartId: string) => {
            const existingCart = holdCartService.getHeldCart(cartId);
            holdCartService.deleteHeldCart(cartId);
            performHold(
                existingCart
                    ? {
                          holdNumber: existingCart.holdNumber,
                          customerName: existingCart.customerName,
                          customerPhone: existingCart.customerPhone,
                          notes: existingCart.notes,
                      }
                    : undefined,
            );
            checkHeldCarts();
            setOverwriteModalOpen(false);
        },
        [performHold, checkHeldCarts],
    );

    const handleClearHeldCarts = useCallback(() => {
        const currentHeldCarts = holdCartService.getAllHeldCarts();

        if (currentHeldCarts.length === 0) {
            toast({
                type: 'info',
                title: t('point_of_sale.no_held_carts'),
                description: t('point_of_sale.no_held_carts_desc'),
                duration: 3000,
            });
            focusBarcodeSearch(0);
            return;
        }

        holdCartService.clearAllHeldCarts();
        checkHeldCarts();

        toast({
            type: 'success',
            title: t('point_of_sale.held_carts_cleared'),
            description: t('point_of_sale.held_carts_cleared_desc'),
            duration: 3000,
        });

        focusBarcodeSearch();
    }, [t, toast, checkHeldCarts, focusBarcodeSearch]);

    const handleUpdateItemPrice = (itemId: string, price: number): string | null => {
        const nextItems = cartItems.map(item => item.id === itemId ? withCartPrice(item, price) : item);
        const issue = cartPriceIssue(nextItems, (isDiscountVisible ? Math.min(cartDiscount, cartSummary.subtotal) : 0));
        if (issue) return issue.minimum === null ? t('cart_price.reload_required') : t('cart_price.cart_error', { name: issue.name, minimum: formatIQD(issue.minimum, { precision: 2 }) });
        setCartItems(nextItems);
        return null;
    };

    const handleCheckout = useCallback(async () => {
        if (cartItems.length === 0) {
            toast({
                type: 'warning',
                title: t('point_of_sale.empty_cart'),
                description: t('point_of_sale.empty_cart_desc'),
                duration: 3000,
            });
            focusBarcodeSearch(0);
            return;
        }

        const pricingIssue = cartPriceIssue(cartItems, (isDiscountVisible ? Math.min(cartDiscount, cartSummary.subtotal) : 0));
        if (pricingIssue) {
            toast({ type: 'error', title: t('cart_price.title'), description: pricingIssue.minimum === null ? t('cart_price.reload_required') : t('cart_price.cart_error', { name: pricingIssue.name, minimum: formatIQD(pricingIssue.minimum, { precision: 2 }) }) });
            return;
        }

        // Prevent double-submit
        if (isProcessingCheckoutRef.current) return;
        isProcessingCheckoutRef.current = true;

        // Store complete state for rollback
        const rollbackState = {
            cartItems: [...cartItems],
            cartDiscount: isDiscountVisible
                ? Math.min(cartDiscount, cartSummary.subtotal)
                : 0,
        };
        
        // Prepare transaction data
        const transactionData: CreateTransactionData = {
            items: cartItems.map(item => ({ ...item.transactionItem!, price_overridden: !!item.priceOverridden })),
            total_amount: Math.max(0, cartSummary.subtotal - rollbackState.cartDiscount),
            amount_paid: Math.max(0, cartSummary.subtotal - rollbackState.cartDiscount),
            change_due: 0,
            discount: rollbackState.cartDiscount,
        };
        
        // INSTANT: Clear cart immediately (optimistic)
        setCartItems([]);
        setCartDiscount(0);
        clearCartFromStorage();
        focusBarcodeSearch(50);
        
        // Show optimistic success
        toast({
            type: 'success',
            title: t('point_of_sale.transaction_completed'),
            description: t('point_of_sale.processing_transaction'),
            duration: 2000,
        });
        
        // BACKGROUND: Send to server (non-blocking)
        try {
            const response = await transactionService.createTransaction(transactionData);
            
            if (!response.success) {
                // Complete rollback on failure
                setCartItems(rollbackState.cartItems);
                setCartDiscount(rollbackState.cartDiscount);
                
                toast({
                    type: 'error',
                    title: t('point_of_sale.transaction_failed'),
                    description: buildStockIssueToastDescription(response.details, response.message),
                    duration: response.details?.length ? 7000 : 3000,
                });
            } else if (response.data && user) {
                // Play checkout sound only on successful transaction
                playCheckoutSound();
                
                // Print receipt after successful transaction
                try {
                    lastTransactionRef.current = response.data as Transaction;
                    // Persist last receipt transaction in localStorage
                    try {
                        localStorage.setItem(LAST_RECEIPT_KEY, JSON.stringify(lastTransactionRef.current));
                    } catch {
                        // Ignore localStorage errors
                    }
                    await receiptService.printReceipt(response.data, user);
                } catch (printError) {
                    console.warn('Receipt printing failed:', printError);
                    // Don't show error to user, receipt printing is non-critical
                }
                
                // Focus barcode search after successful checkout (similar to pressing Enter)
                // Use longer delay to ensure DOM is ready after all async operations
                focusBarcodeSearch(200);
            }
        } catch {
            // Complete rollback on error
            setCartItems(rollbackState.cartItems);
            setCartDiscount(rollbackState.cartDiscount);
            
            toast({
                type: 'error',
                title: t('point_of_sale.checkout_failed'),
                description: buildStockIssueToastDescription(undefined, t('point_of_sale.checkout_failed_desc')),
                duration: 3000,
            });
        } finally {
            isProcessingCheckoutRef.current = false;
        }
    }, [
        cartItems,
        cartSummary,
        cartDiscount,
        isDiscountVisible,
        t,
        toast,
        focusBarcodeSearch,
        playCheckoutSound,
        user,
        clearCartFromStorage,
        buildStockIssueToastDescription,
    ]);


    const shouldAllowShortcutFromActiveElement = useCallback(
        (activeElement: Element | null, shortcutKey?: string): boolean => {
            if (!activeElement) {
                return true;
            }

            if (!(activeElement instanceof HTMLInputElement)) {
                return !((activeElement as HTMLElement).isContentEditable ?? false);
            }

            const dataset = activeElement.dataset ?? {};
            if (dataset.allowShortcuts === 'true') {
                return true;
            }

            // Handle specific shortcuts
            if (shortcutKey === 'Tab' || shortcutKey === 'tab') {
                // Don't allow Tab when in quantity or discount inputs
                const isQuantityInput = activeElement.type === 'number' && activeElement.min === '1';
                const isDiscountInput = activeElement.dataset?.shortcutTarget === 'discount';
                if (isQuantityInput || isDiscountInput) {
                    return false;
                }
                return true;
            }

            if (shortcutKey === 'Enter') {
                // Allow Enter from most contexts, but block from barcode search
                const isBarcodeInput = activeElement.dataset?.shortcutTarget === 'barcode' || 
                                     activeElement.getAttribute('data-testid') === 'barcode-search' ||
                                     activeElement.placeholder?.toLowerCase().includes('barcode');
                if (isBarcodeInput) {
                    return false;
                }
                return true;
            }

            if (shortcutKey === 'ArrowUp' || shortcutKey === 'ArrowDown') {
                // Don't allow arrow keys when in barcode search
                const isBarcodeInput = activeElement.dataset?.shortcutTarget === 'barcode' || 
                                     activeElement.getAttribute('data-testid') === 'barcode-search' ||
                                     activeElement.placeholder?.toLowerCase().includes('barcode');
                if (isBarcodeInput) {
                    return false;
                }
                
                // Allow arrow keys from most contexts for quantity navigation
                if (activeElement instanceof HTMLInputElement) {
                    // Block from barcode inputs (already handled above)
                    // Allow from quantity inputs, discount inputs, and all other inputs
                    return true;
                }
                
                // Allow from non-input elements
                return true;
            }

            // Allow "C" (checkout) key from quantity and discount inputs
            if (shortcutKey === 'c' || shortcutKey === 'C') {
                return true;
            }

            // Don't allow shortcuts when typing in quantity inputs
            const isQuantityInput = 
                (activeElement.type === 'number' && activeElement.min === '1') ||
                activeElement.getAttribute('data-testid') === 'quantity-input' ||
                activeElement.dataset?.testid === 'quantity-input';
            if (isQuantityInput) {
                return false;
            }

            // Don't allow shortcuts when typing in discount inputs
            const isDiscountInput = activeElement.dataset?.shortcutTarget === 'discount';
            if (isDiscountInput) {
                return false;
            }

            const placeholder = activeElement.placeholder?.toLocaleLowerCase?.() ?? '';
            const translatedBarcodePlaceholder = t('point_of_sale.barcode_placeholder');
            const normalizedTranslatedBarcodePlaceholder =
                translatedBarcodePlaceholder &&
                translatedBarcodePlaceholder !== 'point_of_sale.barcode_placeholder'
                    ? translatedBarcodePlaceholder.toLocaleLowerCase()
                    : null;

            const allowedKeywords = ['barcode'];
            if (normalizedTranslatedBarcodePlaceholder) {
                allowedKeywords.push(normalizedTranslatedBarcodePlaceholder);
            }

            return allowedKeywords.some((keyword) => placeholder.includes(keyword));
        },
        [t],
    );

    const isDiscountInputElement = useCallback(
        (element: Element | null): element is HTMLInputElement => {
            if (!(element instanceof HTMLInputElement)) {
                return false;
            }

            if (element.dataset?.shortcutTarget === 'discount') {
                return true;
            }

            const placeholder = element.placeholder?.toLocaleLowerCase?.() ?? '';
            const keywords = ['discount'];

            const translatedLabel = t('point_of_sale.discount_label');
            const translatedPlaceholder = t('point_of_sale.discount_placeholder');

            [translatedLabel, translatedPlaceholder].forEach((value) => {
                if (
                    value &&
                    value !== 'point_of_sale.discount_label' &&
                    value !== 'point_of_sale.discount_placeholder'
                ) {
                    keywords.push(value.toLocaleLowerCase());
                }
            });

            return keywords.some((keyword) => placeholder.includes(keyword));
        },
        [t],
    );

    const findDiscountInput = useCallback((): HTMLInputElement | null => {
        const directMatch = document.querySelector(
            'input[data-shortcut-target="discount"]',
        );

        if (directMatch instanceof HTMLInputElement) {
            return directMatch;
        }

        const inputs = Array.from(document.querySelectorAll('input'));
        for (const input of inputs) {
            if (isDiscountInputElement(input)) {
                return input;
            }
        }

        return null;
    }, [isDiscountInputElement]);

    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (recallCartModalOpen || overwriteModalOpen || scaleModalOpen || cardsModalOpen) {
                return;
            }

            // Normalize the key for Kurdish/Arabic keyboards
            const normalizedKey = normalizeKeyboardShortcuts(event.key);

            const activeElement = document.activeElement;

            switch (normalizedKey) {

                case 'c':
                case 'C': {
                    if (!shouldAllowShortcutFromActiveElement(activeElement, normalizedKey)) {
                        return;
                    }

                    event.preventDefault();

                    if (isProcessingCheckoutRef.current) {
                        return;
                    }

                    if (cartItems.length === 0) {
                        toast({
                            type: 'warning',
                            title: t('point_of_sale.cart_empty') || 'Cart is empty',
                            duration: 2000,
                        });
                        return;
                    }

                    handleCheckout();
                    break;
                }

                case 'k':
                case 'K': {
                    if (!shouldAllowShortcutFromActiveElement(activeElement)) {
                        return;
                    }

                    event.preventDefault();
                    if (!cardsModalOpen) {
                        setCardsModalOpen(true);
                    }
                    break;
                }

                case 't':
                case 'T': {
                    if (!shouldAllowShortcutFromActiveElement(activeElement)) {
                        return;
                    }

                    event.preventDefault();
                    if (SCALE_PRODUCTS_ENABLED && !scaleModalOpen) {
                        setScaleModalOpen(true);
                    }
                    break;
                }

                case 'p':
                case 'P': {
                    if (!shouldAllowShortcutFromActiveElement(activeElement)) {
                        return;
                    }

                    event.preventDefault();
                    if (!previewOpen) {
                        handlePrintPreviousReceipt();
                    }
                    break;
                }

                case 'h':
                case 'H': {
                    if (!shouldAllowShortcutFromActiveElement(activeElement)) {
                        return;
                    }

                    event.preventDefault();
                    handleHoldCart();
                    break;
                }

                case 'b':
                case 'B': {
                    if (!shouldAllowShortcutFromActiveElement(activeElement)) {
                        return;
                    }

                    event.preventDefault();
                    handleRecallHeldCart();
                    break;
                }

                case 's':
                case 'S': {
                    if (!shouldAllowShortcutFromActiveElement(activeElement)) {
                        return;
                    }

                    event.preventDefault();
                    handleClearHeldCarts();
                    break;
                }

                case 'z':
                case 'Z': {
                    if (!shouldAllowShortcutFromActiveElement(activeElement)) {
                        return;
                    }

                    event.preventDefault();
                    const editableItems = cartItems.filter((item) => !item.isScaleProduct);

                    if (editableItems.length === 0) {
                        toast({
                            type: 'info',
                            title: t('point_of_sale.cart_already_empty') || 'Cart already empty',
                            duration: 2000,
                        });
                        return;
                    }

                    const targetItem = editableItems[0];

                    if (targetItem) {
                        handleRemoveCartItem(targetItem.id);
                    }
                    break;
                }

                case 'a':
                case 'A': {
                    if (!shouldAllowShortcutFromActiveElement(activeElement)) {
                        return;
                    }

                    event.preventDefault();

                    if (cartItems.length === 0) {
                        toast({
                            type: 'info',
                            title: t('point_of_sale.cart_already_empty') || 'Cart already empty',
                            duration: 2000,
                        });
                        return;
                    }

                    handleClearCart();
                    break;
                }

                case 'd':
                case 'D': {
                    if (!isDiscountVisible) {
                        toast({
                            type: 'info',
                            title:
                                t('point_of_sale.discount_disabled_title') ||
                                'Discount disabled',
                            duration: 2000,
                        });
                        break;
                    }
                    if (!shouldAllowShortcutFromActiveElement(activeElement)) {
                        return;
                    }

                    event.preventDefault();
                    const discountInput = findDiscountInput();

                    if (discountInput) {
                        discountInput.focus();
                        discountInput.select();
                    } else {
                        toast({
                            type: 'info',
                            title:
                                t('point_of_sale.discount_input_not_found') ||
                                'Discount input not found',
                            duration: 2000,
                        });
                    }
                    break;
                }

                case 'Tab':
                case 'tab': {
                    if (!shouldAllowShortcutFromActiveElement(activeElement, 'Tab')) {
                        break;
                    }

                    event.preventDefault();

                    // Focus on first quantity input in cart
                    const quantityInputs = document.querySelectorAll('[data-testid="cashier-shopping-cart"] [data-testid="quantity-input"]');
                    if (quantityInputs.length > 0) {
                        const firstInput = quantityInputs[0] as HTMLInputElement;
                        firstInput.focus();
                        firstInput.select();
                    }
                    break;
                }

                case 'Enter': {
                    if (!shouldAllowShortcutFromActiveElement(activeElement, 'Enter')) {
                        break;
                    }

                    event.preventDefault();

                    // Focus on barcode search input
                    const barcodeSearchInput = document.querySelector('[data-testid="barcode-search"]') as HTMLInputElement;
                    if (barcodeSearchInput) {
                        barcodeSearchInput.focus();
                        barcodeSearchInput.select();
                    }
                    break;
                }

                case 'ArrowUp': {
                    if (!shouldAllowShortcutFromActiveElement(activeElement, 'ArrowUp')) {
                        break;
                    }

                    // Check if we're in a quantity input - if so, let the input handler manage it
                    const currentFocused = document.activeElement as HTMLInputElement;
                    if (currentFocused && currentFocused.dataset.testid === 'quantity-input') {
                        break;
                    }

                    event.preventDefault();

                    // Navigate to previous quantity input (circular)
                    const quantityInputs = document.querySelectorAll('[data-testid="cashier-shopping-cart"] [data-testid="quantity-input"]');
                    
                    if (quantityInputs.length === 0) {
                        break;
                    }
                    
                    // Not in quantity input, focus on last quantity input
                    const lastInput = quantityInputs[quantityInputs.length - 1] as HTMLInputElement;
                    lastInput.focus();
                    lastInput.select();
                    break;
                }

                case 'ArrowDown': {
                    if (!shouldAllowShortcutFromActiveElement(activeElement, 'ArrowDown')) {
                        break;
                    }

                    // Check if we're in a quantity input - if so, let the input handler manage it
                    const currentFocused = document.activeElement as HTMLInputElement;
                    if (currentFocused && currentFocused.dataset.testid === 'quantity-input') {
                        break;
                    }

                    event.preventDefault();

                    // Navigate to next quantity input (circular)
                    const quantityInputs = document.querySelectorAll('[data-testid="cashier-shopping-cart"] [data-testid="quantity-input"]');
                    
                    if (quantityInputs.length === 0) {
                        break;
                    }
                    
                    // Not in quantity input, focus on first quantity input
                    const firstInput = quantityInputs[0] as HTMLInputElement;
                    firstInput.focus();
                    firstInput.select();
                    break;
                }

                default:
                    break;
            }
        },
        [
            cartItems,
            scaleModalOpen,
            cardsModalOpen,
            recallCartModalOpen,
            overwriteModalOpen,
            previewOpen,
            handleCheckout,
            handlePrintPreviousReceipt,
            handleHoldCart,
            handleRecallHeldCart,
            handleClearHeldCarts,
            handleClearCart,
            handleRemoveCartItem,
            shouldAllowShortcutFromActiveElement,
            findDiscountInput,
            isDiscountVisible,
            toast,
            t,
        ],
    );

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return (
        <CashierLayout>
            <Head title={t('navigation.point_of_sale')} />
            <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row">
                {/* Left Column - Main Section & Filters */}
                <div className="flex flex-1 flex-col gap-4 lg:gap-6 overflow-hidden p-4 lg:p-6">
                    {/* Search and Filter Section */}
                    <div className="w-full flex-shrink-0 rounded-md bg-card text-card-foreground shadow-[0_4px_8px_0_rgba(0,0,0,0.2),0_2px_4px_0_rgba(0,0,0,0.1)] dark:shadow-[0_4px_8px_0_rgba(0,0,0,0.4),0_2px_4px_0_rgba(0,0,0,0.3)]">
                        <div className="p-4 lg:p-6 relative">
                            {/* Filter Grid - Responsive columns */}
                            <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 ${SCALE_PRODUCTS_ENABLED ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} items-end gap-2 lg:gap-4`}>
                                {/* Barcode Search */}
                                <div className="space-y-2 rounded-md p-1 lg:p-2 transition-colors duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                    <div className="flex items-center gap-2">
                                        <Label className="text-xs lg:text-sm font-medium text-blue-600 dark:text-blue-400">
                                            {t('point_of_sale.barcode_search')}
                                        </Label>
                                        <Kbd className="bg-background text-foreground border border-border/50 px-1.5 py-0.5 text-xs font-mono">Enter</Kbd>
                                    </div>
                                    <BarcodeSearchFilter
                                        ref={barcodeSearchRef}
                                        onProductSelect={handleProductSelect}
                                        searchFunction={searchProductByBarcode}
                                        placeholder={t(
                                            'point_of_sale.barcode_placeholder',
                                        )}
                                        data-testid="barcode-search"
                                    />
                                </div>

                                {/* Name Search */}
                                <div className="space-y-2 rounded-md p-1 lg:p-2 transition-colors duration-200 hover:bg-green-50 dark:hover:bg-green-900/20">
                                    <Label className="text-xs lg:text-sm font-medium text-green-600 dark:text-green-400">
                                        {t('point_of_sale.name_search')}
                                    </Label>
                                    <NameSearchFilter
                                        onProductSelect={handleProductSelect}
                                        searchFunction={searchProductByName}
                                        placeholder={t(
                                            'point_of_sale.name_placeholder',
                                        )}
                                    />
                                </div>

                                {/* Scale Filter */}
                                {SCALE_PRODUCTS_ENABLED && (<div className="space-y-2 rounded-md p-1 lg:p-2 transition-colors duration-200 hover:bg-cyan-50 dark:hover:bg-cyan-900/20">
                                    <Label className="text-xs lg:text-sm font-medium text-cyan-600 dark:text-cyan-400">
                                        &nbsp;
                                    </Label>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleScale}
                                        className="flex h-9 lg:h-11 w-full items-center justify-center gap-1 lg:gap-2 !border-cyan-300 !bg-cyan-50 !text-cyan-700 hover:!border-cyan-500 hover:!bg-cyan-100 hover:!text-cyan-800 focus:!border-cyan-500 focus:!bg-cyan-100 focus:!ring-2 focus:!ring-cyan-200 focus:!outline-none dark:!border-cyan-600 dark:!bg-cyan-900/20 dark:!text-cyan-300 dark:hover:!border-cyan-500 dark:hover:!bg-cyan-900/30 dark:hover:!text-cyan-200 dark:focus:!border-cyan-500 dark:focus:!bg-cyan-900/30 dark:focus:!ring-2 dark:focus:!ring-cyan-400"
                                    >
                                        <Scale className="h-3 w-3 lg:h-4 lg:w-4" />
                                        <span className="text-xs lg:text-sm">{t('point_of_sale.scale')}</span>
                                        <Kbd className="bg-background text-foreground border border-border/50 px-1.5 py-0.5 text-xs font-mono">T</Kbd>
                                    </Button>
                                </div>)}

                                {/* Cards Filter */}
                                <div className="space-y-2 rounded-md p-1 lg:p-2 transition-colors duration-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                                    <Label className="text-xs lg:text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                        &nbsp;
                                    </Label>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCards}
                                        className="flex h-9 lg:h-11 w-full items-center justify-center gap-1 lg:gap-2 !border-emerald-300 !bg-emerald-50 !text-emerald-700 hover:!border-emerald-500 hover:!bg-emerald-100 hover:!text-emerald-800 focus:!border-emerald-500 focus:!bg-emerald-100 focus:!ring-2 focus:!ring-emerald-200 focus:!outline-none dark:!border-emerald-600 dark:!bg-emerald-900/20 dark:!text-emerald-300 dark:hover:!border-emerald-500 dark:hover:!bg-emerald-900/30 dark:hover:!text-emerald-200 dark:focus:!border-emerald-500 dark:focus:!bg-emerald-900/30 dark:focus:!ring-2 dark:focus:!ring-emerald-400"
                                    >
                                        <CreditCard className="h-3 w-3 lg:h-4 lg:w-4" />
                                        <span className="text-xs lg:text-sm">{t('point_of_sale.cards')}</span>
                                        <Kbd className="bg-background text-foreground border border-border/50 px-1.5 py-0.5 text-xs font-mono">K</Kbd>
                                    </Button>
                                </div>

                                {/* Previous Receipt */}
                                <div className="space-y-2 rounded-md p-1 lg:p-2 transition-colors duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                    <Label className="text-xs lg:text-sm font-medium text-blue-600 dark:text-blue-400">
                                        &nbsp;
                                    </Label>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={async () => {
                                            if (!lastTransactionRef.current || !user) {
                                                // Try to load from localStorage fallback
                                                try {
                                                    const saved = localStorage.getItem(LAST_RECEIPT_KEY);
                                                    if (saved) {
                                                        lastTransactionRef.current = JSON.parse(saved) as Transaction;
                                                    }
                                                } catch (e) {
                                                    console.warn('Failed to load last receipt from storage', e);
                                                }

                                            }
                                            if (!lastTransactionRef.current || !user) {
                                                toast({
                                                    title: t('point_of_sale.no_previous_receipt'),
                                                    description: t('point_of_sale.no_previous_receipt_desc'),
                                                    type: 'info',
                                                    duration: 2500,
                                                });
                                                return;
                                            }
                                            try {
                                                const html = await receiptService.getReceiptHTML(
                                                    lastTransactionRef.current,
                                                    user,
                                                );
                                                setPreviewHtml(html);
                                                setPreviewOpen(true);
                                            } catch (err) {
                                                console.warn('Previous receipt preview failed:', err);
                                            }
                                        }}
                                        className="flex h-9 lg:h-11 w-full items-center justify-center gap-1 lg:gap-2 !border-blue-300 !bg-blue-50 !text-blue-700 hover:!border-blue-500 hover:!bg-blue-100 hover:!text-blue-800 focus:!border-blue-500 focus:!bg-blue-100 focus:!ring-2 focus:!ring-blue-200 focus:!outline-none disabled:opacity-50 dark:!border-blue-600 dark:!bg-blue-900/20 dark:!text-blue-300 dark:hover:!border-blue-500 dark:hover:!bg-blue-900/30 dark:hover:!text-blue-200 dark:focus:!border-blue-500 dark:focus:!bg-blue-900/30 dark:focus:!ring-2 dark:focus:!ring-blue-400"
                                    >
                                        <Receipt className="h-3 w-3 lg:h-4 lg:w-4" />
                                        <span className="text-xs lg:text-sm">{t('point_of_sale.previous_receipt')}</span>
                                        <Kbd className="bg-background text-foreground border border-border/50 px-1.5 py-0.5 text-xs font-mono">P</Kbd>
                                    </Button>
                                </div>


                            </div>
                        </div>
                    </div>

            {/* Main Products Section */}
                    <div className="flex min-h-0 flex-1 rounded-md bg-card text-card-foreground shadow-[0_4px_8px_0_rgba(0,0,0,0.2),0_2px_4px_0_rgba(0,0,0,0.1)] dark:shadow-[0_4px_8px_0_rgba(0,0,0,0.4),0_2px_4px_0_rgba(0,0,0,0.3)]">
                        <CashierProductGrid
                            className="flex-1"
                            products={quickPickProducts}
                            onAddToCart={handleProductSelect}
                            showHeader={false}
                            isLoading={quickPickLoading}
                        />
            </div>

            <ReceiptPreviewModal
                isOpen={previewOpen}
                onClose={() => setPreviewOpen(false)}
                html={previewHtml}
                title={t('point_of_sale.previous_receipt')}
            />
                </div>

                {/* Right Column - Shopping Cart */}
                <div className="w-full lg:w-[675px] shrink-0">
                    <CashierShoppingCart
                        ref={cartRef}
                        items={cartItems}
                        discount={cartDiscount}
                        discountEnabled={isDiscountVisible}
                        onDiscountChange={handleDiscountChange}
                        onClearCart={handleClearCart}
                        onRemoveItem={handleRemoveCartItem}
                        onUpdateQuantity={handleUpdateItemQuantity}
                        onUpdatePrice={handleUpdateItemPrice}
                        onHold={handleHoldCart}
                        onRecall={handleRecallHeldCart}
                        onClearHold={handleClearHeldCarts}
                        heldCartsCount={heldCartsCount}
                        onCheckout={() => {
                            void handleCheckout();
                        }}
                        lastUpdatedItemId={lastUpdatedItemId}
                        onItemUpdated={() => setLastUpdatedItemId(null)}
                    />
                </div>
            </div>

            {/* Recall Cart Modal */}
            <Suspense fallback={null}>
                <RecallCartModal
                    isOpen={recallCartModalOpen}
                    onClose={() => {
                        setRecallCartModalOpen(false);
                        requestAnimationFrame(() => {
                            requestAnimationFrame(() => {
                                // Try multiple focus methods for reliability
                                setTimeout(() => {
                                    focusBarcodeSearch(0);
                                    
                                    // Also try direct DOM focus as fallback
                                    setTimeout(() => {
                                        const barcodeInput = document.querySelector('[data-testid="barcode-search"]') as HTMLInputElement;
                                        if (barcodeInput) {
                                            barcodeInput.focus();
                                            barcodeInput.select();
                                        }
                                    }, 100);
                                }, 200);
                            });
                        });
                    }}
                    onRecall={handleRecallCart}
                />
            </Suspense>

            {/* Overwrite Hold Modal */}
            <Suspense fallback={null}>
                <OverwriteHoldModal
                    isOpen={overwriteModalOpen}
                        onClose={() => {
                            setOverwriteModalOpen(false);
                            requestAnimationFrame(() => {
                                requestAnimationFrame(() => {
                                    // Try multiple focus methods for reliability
                                    setTimeout(() => {
                                        focusBarcodeSearch(0);
                                        
                                        // Also try direct DOM focus as fallback
                                        setTimeout(() => {
                                            const barcodeInput = document.querySelector('[data-testid="barcode-search"]') as HTMLInputElement;
                                            if (barcodeInput) {
                                                barcodeInput.focus();
                                                barcodeInput.select();
                                            }
                                        }, 100);
                                    }, 200);
                                });
                            });
                        }}
                    onOverwrite={handleOverwriteHold}
                />
            </Suspense>

            {/* Scale Modal */}
            {SCALE_PRODUCTS_ENABLED && (<Suspense fallback={null}>
                <ScaleModal
                    isOpen={scaleModalOpen}
                    onClose={() => {
                        setScaleModalOpen(false);
                        requestAnimationFrame(() => {
                            requestAnimationFrame(() => {
                                focusBarcodeSearch(180);
                            });
                        });
                    }}
                    onProductSelect={handleScaleProductSelect}
                />
            </Suspense>)}

            {/* Unified Cards Modal */}
            <Suspense fallback={null}>
                <UnifiedCardsModal
                    isOpen={cardsModalOpen}
                    onClose={() => {
                        setCardsModalOpen(false);
                        requestAnimationFrame(() => {
                            requestAnimationFrame(() => {
                                focusBarcodeSearch(180);
                            });
                        });
                    }}
                    onCardSelect={handleCardSelect}
                />
            </Suspense>
        </CashierLayout>
    );
}
