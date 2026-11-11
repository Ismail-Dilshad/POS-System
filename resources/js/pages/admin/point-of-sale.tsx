import {
    BarcodeSearchFilter,
    type BarcodeSearchFilterRef,
} from '@/components/filters/barcode-search-filter';
import { NameSearchFilter } from '@/components/filters/name-search-filter';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import admin from '@/routes/admin';
import { type Card } from '@/services/business/cardService';
import { cardCacheService } from '@/services/business/cardCacheService';
// Direct calculations - no service needed
import { holdCartService } from '@/services/utils/holdCartService';
import { discountVisibilityService } from '@/services/utils/discountVisibilityService';
import { posService, type PosProduct } from '@/services/utils/posService';
import { type ScaleProduct } from '@/services/business/scaleProductService';
import {
    transactionService,
    type CreateTransactionData,
    type Transaction,
    type StockIssueDetail,
} from '@/services/business/transactionService';
import { receiptService } from '@/services/utils/receiptService';
import { ReceiptPreviewModal } from '@/components/modals/receipt-preview-modal';
import { type BreadcrumbItem, type User } from '@/types';
import { CartItem } from '@/types/cart';
import { normalizeKeyboardShortcuts } from '@/utils/keyboard-normalization';
import { Head, usePage } from '@inertiajs/react';
import { CreditCard, Receipt, Scale } from 'lucide-react';
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ShoppingCartTableRef } from '@/components/layout/shopping-cart-table';

const ShoppingCartTable = lazy(() =>
    import('@/components/layout/shopping-cart-table').then((module) => ({
        default: module.ShoppingCartTable,
    })),
);

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

const ClearAllHoldsModal = lazy(() =>
    import('@/components/modals/clear-all-holds-modal').then((module) => ({
        default: module.ClearAllHoldsModal,
    })),
);

export default function PointOfSale() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const page = usePage();
    const { auth } = (page.props as Record<string, unknown>) || {};
    const user = (auth as { user: User })?.user;
    const barcodeSearchRef = useRef<BarcodeSearchFilterRef>(null);
    const cartTableRef = useRef<ShoppingCartTableRef>(null);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [discount, setDiscount] = useState<number>(0);
    const [isDiscountVisible, setIsDiscountVisible] = useState<boolean>(true);
    const [recallCartModalOpen, setRecallCartModalOpen] = useState(false);
    const [overwriteModalOpen, setOverwriteModalOpen] = useState(false);
    const [scaleModalOpen, setScaleModalOpen] = useState(false);
    const [cardsModalOpen, setCardsModalOpen] = useState(false);
    const [clearAllHoldsModalOpen, setClearAllHoldsModalOpen] = useState(false);
    const [hasHeldCarts, setHasHeldCarts] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewHtml, setPreviewHtml] = useState<string | null>(null);
    const [lastUpdatedItemId, setLastUpdatedItemId] = useState<string | null>(null);

    // Cart persistence constants
    const CART_STORAGE_KEY = 'pos:admin:cart';
    const DISCOUNT_STORAGE_KEY = 'pos:admin:discount';

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



    // Checkout debounce ref - more reliable than state for rapid key presses
    const isProcessingCheckoutRef = useRef(false);
    const lastTransactionRef = useRef<Transaction | null>(null);
    const LAST_RECEIPT_KEY = 'pos:admin:last_receipt';
    
    // Audio refs for checkout sound
    const checkoutAudioRefs = useRef<HTMLAudioElement[]>([]);
    const currentCheckoutAudioIndex = useRef(0);

    // Audio refs for quantity increase sound
    const increaseAudioRefs = useRef<HTMLAudioElement[]>([]);
    const currentIncreaseAudioIndex = useRef(0);

    // Audio refs for add item sound
    const addAudioRefs = useRef<HTMLAudioElement[]>([]);
    const currentAddAudioIndex = useRef(0);

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
            setDiscount(savedDiscount);
        }
    }, [loadCartFromStorage]);

    // Save cart to localStorage whenever cartItems or discount changes
    useEffect(() => {
        if (cartItems.length > 0 || discount > 0) {
            saveCartToStorage(cartItems, discount);
        }
    }, [cartItems, discount, saveCartToStorage]);

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

    const shouldAllowShortcutFromActiveElement = useCallback(
        (activeElement: Element | null, shortcutKey?: string): boolean => {
            if (!activeElement) {
                return true;
            }

            if (!(activeElement instanceof HTMLInputElement)) {
                return !((activeElement as HTMLElement).isContentEditable ?? false);
            }

            if (activeElement.dataset?.allowShortcuts === 'true') {
                return true;
            }

            // Special handling for Tab key - allow it from more contexts
            if (shortcutKey === 'Tab' || shortcutKey === 'tab') {
                // Don't allow Tab shortcut when already in quantity inputs
                const isQuantityInput =
                    activeElement.type === 'number' && activeElement.min === '1';
                if (isQuantityInput) {
                    return false;
                }
                
                // Don't allow Tab shortcut when in discount inputs
                const isDiscountInput = activeElement.dataset?.shortcutTarget === 'discount';
                if (isDiscountInput) {
                    return false;
                }
                
                // Allow Tab shortcut from most contexts (more permissive)
                // Only block it from specific input types that shouldn't trigger shortcuts
                if (activeElement instanceof HTMLInputElement) {
                    // Block from quantity inputs (already handled above)
                    // Block from discount inputs (already handled above)
                    // Allow from all other inputs
                    return true;
                }
                
                // Allow from non-input elements
                return true;
            }

            // Special handling for Enter key - allow it from more contexts
            if (shortcutKey === 'Enter') {
                // Don't allow Enter shortcut when already in barcode search
                const isBarcodeInput = activeElement.dataset?.shortcutTarget === 'barcode' || 
                                     activeElement.getAttribute('data-testid') === 'barcode-search' ||
                                     activeElement.placeholder?.toLowerCase().includes('barcode');
                if (isBarcodeInput) {
                    return false;
                }
                
                // Allow Enter shortcut from discount inputs and all other contexts
                if (activeElement instanceof HTMLInputElement) {
                    // Block from barcode inputs (already handled above)
                    // Allow from discount inputs and all other inputs
                    return true;
                }
                
                // Allow from non-input elements
                return true;
            }

            // Special handling for Arrow Up and Arrow Down - allow navigation between quantity inputs
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

            // For other shortcuts, use the original logic
            // Don't allow shortcuts when typing in quantity inputs
            const isQuantityInput =
                activeElement.type === 'number' && activeElement.min === '1';

            if (isQuantityInput) {
                return false; // Changed from true to false
            }

            // Don't allow shortcuts when typing in discount inputs
            const isDiscountInput = activeElement.dataset?.shortcutTarget === 'discount';
            if (isDiscountInput) {
                return false;
            }

            const placeholder = activeElement.placeholder?.toLocaleLowerCase?.() ?? '';
            const translatedBarcodePlaceholder = t('point_of_sale.barcode_placeholder');
            const normalizedTranslatedPlaceholder =
                translatedBarcodePlaceholder &&
                translatedBarcodePlaceholder !== 'point_of_sale.barcode_placeholder'
                    ? translatedBarcodePlaceholder.toLocaleLowerCase()
                    : null;

            const allowedKeywords = ['barcode'];

            if (normalizedTranslatedPlaceholder) {
                allowedKeywords.push(normalizedTranslatedPlaceholder);
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
        const attributeMatch = document.querySelector(
            'input[data-shortcut-target="discount"]',
        );

        if (attributeMatch instanceof HTMLInputElement) {
            return attributeMatch;
        }

        const inputs = Array.from(document.querySelectorAll('input'));
        for (const input of inputs) {
            if (isDiscountInputElement(input)) {
                return input;
            }
        }

        return null;
    }, [isDiscountInputElement]);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('navigation.admin') },
        { title: t('navigation.point_of_sale'), href: admin.pointOfSale.url() },
    ];

    // Check for held carts on component mount and when modals close
    const checkHeldCarts = useCallback(() => {
        const heldCarts = holdCartService.getAllHeldCarts();
        setHasHeldCarts(heldCarts.length > 0);
    }, []);

    // Check held carts on component mount and preload cards
    useEffect(() => {
        checkHeldCarts();
        // Preload cards with images for instant access
        cardCacheService.preloadCards();
    }, [checkHeldCarts]);

    useEffect(() => {
        const initialVisibility = discountVisibilityService.getVisibility();
        setIsDiscountVisible(initialVisibility);
        if (!initialVisibility) {
            setDiscount(0);
        }

        const unsubscribe = discountVisibilityService.subscribe((enabled) => {
            setIsDiscountVisible(enabled);
            if (!enabled) {
                setDiscount(0);
            }
        });

        discountVisibilityService.syncFromServer().catch(() => undefined);

        return () => {
            unsubscribe?.();
        };
    }, []);

    // Ensure discount is always 0 when discount is disabled
    useEffect(() => {
        if (!isDiscountVisible && discount !== 0) {
            setDiscount(0);
        }
    }, [isDiscountVisible, discount]);




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

        // Prevent double-submit
        if (isProcessingCheckoutRef.current) return;
        isProcessingCheckoutRef.current = true;

        // Store complete state for rollback
        const rollbackState = {
            cartItems: [...cartItems],
            discount: discount,
        };
        
        // Prepare transaction data
        const transactionData: CreateTransactionData = {
            items: cartItems.map(item => item.transactionItem!),
            total_amount: Math.max(0, cartSummary.subtotal - rollbackState.discount),
            amount_paid: Math.max(0, cartSummary.subtotal - rollbackState.discount),
            change_due: 0,
            discount: rollbackState.discount,
        };
        
        // INSTANT: Clear cart immediately (optimistic)
        setCartItems([]);
        setDiscount(0);
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
                setDiscount(rollbackState.discount);
                
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
                    } catch (e) {
                        console.warn('Failed to persist last receipt to storage', e);
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
            setDiscount(rollbackState.discount);
            
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
        discount,
        toast,
        t,
        focusBarcodeSearch,
        playCheckoutSound,
        user,
        clearCartFromStorage,
        buildStockIssueToastDescription,
    ]);


    const handlePrintPreviousReceipt = useCallback(async () => {
        if (!lastTransactionRef.current || !user) {
            // Try to load from localStorage fallback
            try {
                const saved = localStorage.getItem(LAST_RECEIPT_KEY);
                if (saved) {
                    lastTransactionRef.current = JSON.parse(saved) as Transaction;
                }
            } catch (e) {
                console.warn('Failed to read last receipt from storage', e);
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
        } catch {
            // silently ignore; printing is non-critical
        }
    }, [toast, t, user]);

    const handleProductSelect = (product: PosProduct) => {
        // Add product to cart
        addToCart(product);

        // Return focus to barcode search for rapid scanning
        focusBarcodeSearch(0);
    };

    /**
     * Robust function to add any item to cart using centralized validation and calculation
     */
    const addItemToCart = (item: Partial<CartItem>) => {
        // Generate unique ID if not provided
        const itemWithId = {
            ...item,
            id:
                item.id ||
                `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };

        // Direct validation - simple and fast
        if (!itemWithId.id || !itemWithId.barcode || !itemWithId.name || !itemWithId.price || Number(itemWithId.price) <= 0) {
            toast({
                type: 'error',
                title: t('common.invalid_item'),
                description: t('common.invalid_item_desc'),
                duration: 3000,
            });
            return;
        }

        // For scale products, validate weight
        if (itemWithId.isScaleProduct && (!itemWithId.weight || Number(itemWithId.weight) <= 0)) {
            toast({
                type: 'error',
                title: t('common.invalid_item'),
                description: 'Scale products must have valid weight',
                duration: 3000,
            });
            return;
        }

        // For regular products, validate quantity
        if (!itemWithId.isScaleProduct && (!itemWithId.quantity || itemWithId.quantity <= 0)) {
            toast({
                type: 'error',
                title: t('common.invalid_item'),
                description: 'Products must have valid quantity',
                duration: 3000,
            });
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

        // Check if item already exists (by barcode AND product ID for duplicate barcode handling)
        // Scale products are always added as separate items, even if same product and weight
        const existingItemIndex = newItem.isScaleProduct 
            ? -1 // Always treat scale products as new items
            : cartItems.findIndex((cartItem) => {
                // For products with same barcode but different IDs, treat as separate items
                if (cartItem.barcode === newItem.barcode) {
                    // Check by actual product IDs for accurate duplicate detection
                    return (
                        (cartItem.productId &&
                            newItem.productId &&
                            cartItem.productId === newItem.productId) ||
                        (cartItem.cardId &&
                            newItem.cardId &&
                            cartItem.cardId === newItem.cardId)
                    );
                }
                return false;
            });

        if (existingItemIndex >= 0) {
            // Item exists - merge using centralized logic
            let notificationDescription = '';
            
            setCartItems((prevItems) =>
                prevItems.map((cartItem, index) => {
                    if (index === existingItemIndex) {
                        // Store old values for notification
                        const oldQuantity = cartItem.quantity || 0;
                        const oldWeight = cartItem.weight || 0;
                        
                        // Direct merge logic - simple and fast
                        let mergedItem: CartItem;
                        
                        if (cartItem.isScaleProduct) {
                            // Scale products: add weights
                            const combinedWeight = Number(cartItem.weight || 0) + Number(newItem.weight || 0);
                            const newTotal = Number(cartItem.price) * combinedWeight;
                            mergedItem = {
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
                            
                            // Create notification description
                            notificationDescription = `${newItem.name} - Weight: ${oldWeight}kg → ${combinedWeight}kg`;
                        } else {
                            // Regular products: add quantities
                            const combinedQuantity = (cartItem.quantity || 0) + (newItem.quantity || 0);
                            const newTotal = Number(cartItem.price) * combinedQuantity;
                            mergedItem = {
                                ...cartItem,
                                quantity: combinedQuantity,
                                total: newTotal,
                                
                                // Rebuild transaction item for merged regular product
                                transactionItem: {
                                    ...cartItem.transactionItem!,
                                    quantity: combinedQuantity,
                                    total: newTotal,
                                },
                            };
                            
                            // Create notification description
                            notificationDescription = `${newItem.name} - Quantity: ${oldQuantity} → ${combinedQuantity}`;
                        }
                        
                        return mergedItem;
                    }
                    return cartItem;
                }),
            );
            
            // Track the updated item for scrolling
            setLastUpdatedItemId(cartItems[existingItemIndex].id);
            
            // Show enhanced toast with quantity information
            toast({
                type: 'info',
                title: t('point_of_sale.item_updated'),
                description: notificationDescription,
                duration: 3000,
            });

            // Play increase sound for quantity update
            playIncreaseSound();
        } else {
            // New item, add to cart at the beginning (top of list)
            setCartItems((prevItems) => [newItem, ...prevItems]);
            
            // Track the new item for scrolling
            setLastUpdatedItemId(newItem.id);
            
            toast({
                type: 'success',
                title: t('point_of_sale.item_added'),
                description: `${newItem.name} ${t('point_of_sale.item_added_desc')}`,
                duration: 2000,
            });

            // Play add sound for new item
            playAddSound();
        }

        // Item successfully added to cart
    };

    const addToCart = (product: PosProduct) => {
        const barcode =
            product.type === 'scale_product' && product.plu
                ? product.plu
                : product.barcode;

        // Product added to cart (no stock validation - checked at transaction)
        const cartItem: Partial<CartItem> = {
            id: `${product.type}_${product.id}_${Date.now()}`, // Unique ID based on type and product ID
            barcode: barcode,
            name: product.name,
            price: product.sell_price,
            quantity: 1,
            isScaleProduct: product.type === 'scale_product',
            productType: product.type,
            stock: product.stock, // Include stock information
            per_carton: product.per_carton, // Include carton information
            carton_price: product.carton_price ?? null,
        };


        // Add the appropriate product ID based on type
        if (product.type === 'product') {
            cartItem.productId = product.id;
        } else if (product.type === 'scale_product') {
            cartItem.scaleProductId = product.id;
        }

        addItemToCart(cartItem);
    };

    /**
     * Update quantity for regular products and cards (not scale products)
     * Scale products are sold by weight and cannot have quantity updated
     */
    const updateQuantity = (itemId: string, newQuantity: number, cartonMode?: {
        isCartonMode?: boolean;
        cartonQuantity?: number;
        displayQuantity?: number;
    }) => {
        // Validate quantity
        if (typeof newQuantity !== 'number' || newQuantity < 1) {
            return;
        }

        // Find the item first
        const targetItem = cartItems.find(item => item.id === itemId);

        if (!targetItem) {
            return;
        }

        // Scale products cannot have quantity updated
        if (targetItem.isScaleProduct) {
            return;
        }

        // Store old quantity for notification
        const oldQuantity = targetItem.quantity || 0;
        
        // Update the cart items (no stock validation - checked at transaction)
        setCartItems((items) =>
            items.map((item) => {
                if (item.id === itemId) {
                    // Update quantity and recalculate total
                    const updatedItem = {
                        ...item,
                        quantity: newQuantity,
                        calculatedAt: Date.now(),
                        // Update carton mode properties if provided
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
                    }

                    if (updatedItem.isCartonMode) {
                        const providedCartonQuantity = cartonMode?.cartonQuantity ?? updatedItem.cartonQuantity;
                        const resolvedCartonQuantity = providedCartonQuantity && providedCartonQuantity > 0
                            ? providedCartonQuantity
                            : perCartonUpdated > 0
                                ? Math.max(1, Math.round(newQuantity / perCartonUpdated))
                                : 1;
                        updatedItem.cartonQuantity = resolvedCartonQuantity;
                        if (!updatedItem.displayQuantity && resolvedCartonQuantity) {
                            updatedItem.displayQuantity = resolvedCartonQuantity;
                        }
                        if (!updatedItem.displayQuantity && !resolvedCartonQuantity) {
                            updatedItem.displayQuantity = newQuantity;
                        }
                    }

                    // Direct calculation with carton price support
                    if (updatedItem.isScaleProduct) {
                        updatedItem.total = Number(updatedItem.price) * Number(updatedItem.weight || 0);
                    } else if (
                        updatedItem.isCartonMode &&
                        perCartonUpdated > 0 &&
                        effectiveCartonPriceUpdated !== null &&
                        updatedItem.cartonQuantity &&
                        updatedItem.cartonQuantity > 0
                    ) {
                        updatedItem.total = Number(effectiveCartonPriceUpdated) * updatedItem.cartonQuantity;
                    } else {
                        updatedItem.total = Number(updatedItem.price) * Number(updatedItem.quantity || 1);
                    }

                    const effectiveQuantity = Number(updatedItem.quantity || 1);
                    const recalculatedUnitPrice = !updatedItem.isScaleProduct && effectiveQuantity > 0
                        ? Number((updatedItem.total / effectiveQuantity).toFixed(2))
                        : Number(updatedItem.price);

                    // Update transaction item for zero-delay checkout
                    updatedItem.transactionItem = {
                        ...(updatedItem.transactionItem ?? {
                            product_id: updatedItem.productId,
                            card_id: updatedItem.cardId,
                            scale_product_id: updatedItem.scaleProductId,
                            barcode: updatedItem.barcode,
                            name: updatedItem.name,
                            price: recalculatedUnitPrice,
                            quantity: updatedItem.isScaleProduct ? null : effectiveQuantity,
                            weight: Number(updatedItem.weight || 0),
                            total: updatedItem.total,
                            is_scale_product: !!updatedItem.isScaleProduct,
                        }),
                        price: updatedItem.isScaleProduct ? Number(updatedItem.price) : recalculatedUnitPrice,
                        quantity: updatedItem.isScaleProduct ? updatedItem.transactionItem?.quantity ?? null : effectiveQuantity,
                        total: updatedItem.total,
                    };

                    if (updatedItem.isScaleProduct) {
                        updatedItem.transactionItem.weight = Number(updatedItem.weight || 0);
                    }
                    
                    return updatedItem;
                }
                return item;
            }),
        );
        
        // Track the updated item for scrolling
        setLastUpdatedItemId(itemId);
        
        // Show enhanced notification with quantity change
        const description = `${targetItem.name} - Quantity: ${oldQuantity} → ${newQuantity}`;
        toast({
            type: 'info',
            title: t('point_of_sale.item_updated'),
            description: description,
            duration: 2500,
        });

        // Play increase sound for quantity update
        playIncreaseSound();
    };

    const removeItem = useCallback((itemId: string) => {
        setCartItems((items) => items.filter((item) => item.id !== itemId));

        // Refocus the search field after removing item
        setTimeout(() => {
            barcodeSearchRef.current?.focus();
        }, 100);
    }, []);


    // Show confirmation modal before clearing all holds
    const showClearHoldModal = useCallback(() => {
        const currentHeldCarts = holdCartService.getAllHeldCarts();
        if (currentHeldCarts.length > 0) {
            setClearAllHoldsModalOpen(true);
        } else {
            toast({
                type: 'info',
                title: t('point_of_sale.no_held_carts'),
                description: t('point_of_sale.no_held_carts_desc'),
                duration: 3000,
            });
        }
    }, [toast, t]);

    // Actually clear all holds (called after confirmation)
    const clearHold = useCallback(() => {
        holdCartService.clearAllHeldCarts();
        checkHeldCarts();
        toast({
            type: 'success',
            title: t('point_of_sale.held_carts_cleared'),
            description: t('point_of_sale.held_carts_cleared_desc'),
            duration: 3000,
        });

        focusBarcodeSearch(100);
    }, [checkHeldCarts, focusBarcodeSearch, toast, t]);

    const clearCurrentCart = useCallback(() => {
        setCartItems([]);
        setDiscount(0);
        clearCartFromStorage();
        toast({
            type: 'info',
            title: t('point_of_sale.cart_cleared'),
            description: t('point_of_sale.cart_cleared_desc'),
            duration: 2000,
        });

        focusBarcodeSearch(100);
    }, [focusBarcodeSearch, toast, t, clearCartFromStorage]);

    const handleRecall = () => {
        setRecallCartModalOpen(true);
    };

    const handleHold = () => {
        if (cartItems.length === 0) {
            focusBarcodeSearch(0);
            return;
        }

        // Check if hold capacity is reached
        if (holdCartService.isHoldCapacityReached()) {
            setOverwriteModalOpen(true);
        } else {
            // Direct hold without overwrite
            performHold();
        }
    };

    const handleDiscountChange = (newDiscount: number) => {
        setDiscount(newDiscount);
    };

    const handleDiscountToggleChange = (enabled: boolean) => {
        setIsDiscountVisible(enabled);
        void discountVisibilityService.setVisibility(enabled);
        
        // Visual feedback
        if (enabled) {
            toast({
                title: t('point_of_sale.discount_enabled_toast'),
                description: t('point_of_sale.discount_enabled_toast_desc'),
                type: 'success',
            });
        } else {
            toast({
                title: t('point_of_sale.discount_disabled_toast'),
                description: t('point_of_sale.discount_disabled_toast_desc'),
                type: 'info',
            });
        }
    };

    const performHold = useCallback(() => {
        try {
            const subtotal = cartSummary.subtotal;

            // Generate hold number based on current held carts count
            const currentHeldCarts = holdCartService.getAllHeldCarts();
            const holdNumber = `Hold ${currentHeldCarts.length + 1}`;

            const holdData = {
                customerName: `Customer ${holdNumber}`,
                holdNumber,
            };

            holdCartService.holdCart(cartItems, subtotal, discount, holdData);

            // Clear current cart after holding
            setCartItems([]);
            setDiscount(0);
            checkHeldCarts();

            toast({
                type: 'success',
                title: t('point_of_sale.cart_held'),
                description: `${t('point_of_sale.cart_held_desc')} ${holdNumber}.`,
                duration: 3000,
            });

            focusBarcodeSearch(100);
        } catch {
            toast({
                type: 'error',
                title: t('point_of_sale.hold_failed'),
                description: t('point_of_sale.hold_failed_desc'),
                duration: 3000,
            });

            focusBarcodeSearch(120);
        }
    }, [cartItems, cartSummary, checkHeldCarts, discount, focusBarcodeSearch, toast, t]);

    const handleRecallCart = (cartData: {
        cartItems: CartItem[];
        subtotal: number;
        discount: number;
        grandTotal: number;
    }) => {
        setCartItems(cartData.cartItems);
        setDiscount(cartData.discount);
        checkHeldCarts();
        toast({
            type: 'success',
            title: t('point_of_sale.cart_recalled'),
            description: `${t('point_of_sale.cart_recalled_desc')} ${cartData.cartItems.length} items.`,
            duration: 3000,
        });
        
        focusBarcodeSearch(120);
    };

    const handleOverwrite = (cartId: string) => {
        // Delete the selected cart first
        holdCartService.deleteHeldCart(cartId);
        // Then perform the hold
        performHold();
        checkHeldCarts();
    };

    const handleScale = () => {
        setScaleModalOpen(true);
    };

    const handleCards = () => {
        setCardsModalOpen(true);
    };

    // Keyboard navigation functions
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (
                recallCartModalOpen ||
                overwriteModalOpen ||
                scaleModalOpen ||
                cardsModalOpen
            ) {
                return;
            }

            // Normalize the key for Kurdish/Arabic keyboards
            const normalizedKey = normalizeKeyboardShortcuts(e.key);

            const activeElement = document.activeElement;
            const allowShortcut = shouldAllowShortcutFromActiveElement(activeElement, normalizedKey);

            switch (normalizedKey) {

                case 'c':
                case 'C': {
                    if (!allowShortcut) {
                        break;
                    }

                    e.preventDefault();

                    if (isProcessingCheckoutRef.current) {
                        return;
                    }

                    if (cartItems.length > 0) {
                        handleCheckout();
                    } else {
                        toast({
                            type: 'warning',
                            title: t('point_of_sale.empty_cart'),
                            description: t('point_of_sale.empty_cart_desc'),
                            duration: 3000,
                        });
                    }
                    break;
                }

                case 'k':
                case 'K': {
                    if (!allowShortcut) {
                        break;
                    }

                    e.preventDefault();

                    if (!cardsModalOpen) {
                        setCardsModalOpen(true);
                    }
                    break;
                }

                case 't':
                case 'T': {
                    if (!allowShortcut) {
                        break;
                    }

                    e.preventDefault();

                    if (!scaleModalOpen) {
                        setScaleModalOpen(true);
                    }
                    break;
                }

                case 'p':
                case 'P': {
                    if (!allowShortcut) {
                        break;
                    }

                    e.preventDefault();

                    if (!previewOpen) {
                        handlePrintPreviousReceipt();
                    }
                    break;
                }

                case 'h':
                case 'H': {
                    if (!allowShortcut) {
                        break;
                    }

                    e.preventDefault();

                    if (cartItems.length > 0) {
                        if (holdCartService.isHoldCapacityReached()) {
                            setOverwriteModalOpen(true);
                        } else {
                            performHold();
                        }
                    } else {
                        toast({
                            type: 'warning',
                            title: t('point_of_sale.empty_cart'),
                            description: t('point_of_sale.cannot_hold_empty_cart'),
                            duration: 3000,
                        });
                    }
                    break;
                }

                case 'b':
                case 'B': {
                    if (!allowShortcut) {
                        break;
                    }

                    e.preventDefault();

                    const currentHeldCarts = holdCartService.getAllHeldCarts();

                    if (currentHeldCarts.length > 0) {
                        setRecallCartModalOpen(true);
                    } else {
                        toast({
                            type: 'info',
                            title: t('point_of_sale.no_held_carts'),
                            description: t('point_of_sale.no_held_carts_desc'),
                            duration: 3000,
                        });
                    }
                    break;
                }

                case 's':
                case 'S': {
                    if (!allowShortcut) {
                        break;
                    }

                    e.preventDefault();
                    showClearHoldModal();
                    break;
                }


                case 'z':
                case 'Z': {
                    if (!allowShortcut) {
                        break;
                    }

                    e.preventDefault();

                    const editableItems = cartItems.filter(
                        (item) => !item.isScaleProduct,
                    );

                    if (editableItems.length === 0) {
                        toast({
                            type: 'info',
                            title: t('point_of_sale.cart_already_empty'),
                            description: t('point_of_sale.cart_already_empty_desc'),
                            duration: 2000,
                        });
                        return;
                    }

                    const targetItem = editableItems[0];

                    if (targetItem) {
                        removeItem(targetItem.id);
                    }

                    break;
                }

                case 'a':
                case 'A': {
                    if (!allowShortcut) {
                        break;
                    }

                    e.preventDefault();

                    if (cartItems.length > 0) {
                        clearCurrentCart();
                    } else {
                        toast({
                            type: 'info',
                            title: t('point_of_sale.cart_already_empty'),
                            description: t('point_of_sale.cart_already_empty_desc'),
                            duration: 2000,
                        });
                    }

                    break;
                }

                case 'd':
                case 'D': {
                    if (!allowShortcut) {
                        break;
                    }

                    e.preventDefault();

                    const discountInput = findDiscountInput();

                    if (discountInput) {
                        discountInput.focus();
                        discountInput.select();
                    } else {
                        toast({
                            type: 'info',
                            title: t('point_of_sale.discount_input_not_found'),
                            description: t('point_of_sale.discount_input_not_found_desc'),
                            duration: 2000,
                        });
                    }

                    break;
                }

                case 'Tab':
                case 'tab': {
                    if (!allowShortcut) {
                        break;
                    }

                    e.preventDefault();

                    // Direct approach: Find and focus the first quantity input
                    const quantityInputs = document.querySelectorAll('[data-testid="shopping-cart-table"] [data-testid="quantity-input"]');
                    const firstQuantityInput = quantityInputs[0];

                    if (firstQuantityInput) {
                        (firstQuantityInput as HTMLInputElement).focus();
                        (firstQuantityInput as HTMLInputElement).select();
                    } else {
                        // Fallback to the ref-based approach
                        if (cartTableRef.current) {
                            const editableItemsCount = cartTableRef.current.getEditableItemsCount();
                            if (editableItemsCount > 0) {
                                cartTableRef.current.focusItem(0);
                            }
                        }
                    }

                    break;
                }

                case 'Enter': {
                    if (!allowShortcut) {
                        break;
                    }

                    e.preventDefault();

                    // Direct approach: Find and focus the barcode search input
                    const barcodeSearchInput = document.querySelector('[data-testid="barcode-search"]');
                    
                    if (barcodeSearchInput) {
                        (barcodeSearchInput as HTMLInputElement).focus();
                        (barcodeSearchInput as HTMLInputElement).select();
                    } else {
                        // Fallback to ref-based approach
                        if (barcodeSearchRef.current) {
                            barcodeSearchRef.current.focus();
                        }
                    }

                    break;
                }

                case 'ArrowUp': {
                    if (!allowShortcut) {
                        break;
                    }

                    // Check if we're in a quantity input - if so, let the input handler manage it
                    const currentFocused = document.activeElement as HTMLInputElement;
                    if (currentFocused && currentFocused.dataset.testid === 'quantity-input') {
                        break;
                    }

                    e.preventDefault();

                    // Navigate to previous quantity input (circular)
                    const quantityInputs = document.querySelectorAll('[data-testid="shopping-cart-table"] [data-testid="quantity-input"]');
                    
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
                    if (!allowShortcut) {
                        break;
                    }

                    // Check if we're in a quantity input - if so, let the input handler manage it
                    const currentFocused = document.activeElement as HTMLInputElement;
                    if (currentFocused && currentFocused.dataset.testid === 'quantity-input') {
                        break;
                    }

                    e.preventDefault();

                    // Navigate to next quantity input (circular)
                    const quantityInputs = document.querySelectorAll('[data-testid="shopping-cart-table"] [data-testid="quantity-input"]');
                    
                    if (quantityInputs.length === 0) {
                        break;
                    }
                    
                    // Not in quantity input, focus on first quantity input
                    const firstInput = quantityInputs[0] as HTMLInputElement;
                    firstInput.focus();
                    firstInput.select();

                    break;
                }
            }
        },
        [
            recallCartModalOpen,
            overwriteModalOpen,
            scaleModalOpen,
            cardsModalOpen,
            previewOpen,
            cartItems,
            handleCheckout,
            handlePrintPreviousReceipt,
            performHold,
            showClearHoldModal,
            clearCurrentCart,
            removeItem,
            toast,
            t,
            shouldAllowShortcutFromActiveElement,
            findDiscountInput,
        ],
    );

    // Add keyboard event listener
    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('point_of_sale.title')} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-6">
                {/* Search and Filter Section */}
                <div className="w-full flex-shrink-0 rounded-md bg-card text-card-foreground shadow-[0_4px_8px_0_rgba(0,0,0,0.2),0_2px_4px_0_rgba(0,0,0,0.1)] dark:shadow-[0_4px_8px_0_rgba(0,0,0,0.4),0_2px_4px_0_rgba(0,0,0,0.3)]">
                    <div className="p-6 relative">
                        {/* Filter Grid - 5 columns, all equal size */}
                        <div className="grid grid-cols-5 items-end gap-4">
                            {/* Barcode Search */}
                            <div className="space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                        {t('point_of_sale.barcode_search')}
                                    </Label>
                                    <Kbd className="text-xs">Enter</Kbd>
                                </div>
                                <BarcodeSearchFilter
                                    ref={barcodeSearchRef}
                                    onProductSelect={handleProductSelect}
                                    searchFunction={searchProductByBarcode}
                                    placeholder={t(
                                        'point_of_sale.barcode_placeholder',
                                    )}
                                />
                            </div>

                            {/* Name Search */}
                            <div className="space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-green-50 dark:hover:bg-green-900/20">
                                <Label className="text-sm font-medium text-green-600 dark:text-green-400">
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
                            <div className="space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-cyan-50 dark:hover:bg-cyan-900/20">
                                <Label className="text-sm font-medium text-cyan-600 dark:text-cyan-400">
                                    &nbsp;
                                </Label>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleScale}
                                    className="flex h-11 w-full items-center justify-center gap-2 !border-cyan-300 !bg-cyan-50 !text-cyan-700 hover:!border-cyan-500 hover:!bg-cyan-100 hover:!text-cyan-800 focus:!border-cyan-500 focus:!bg-cyan-100 focus:!ring-2 focus:!ring-cyan-200 focus:!outline-none dark:!border-cyan-600 dark:!bg-cyan-900/20 dark:!text-cyan-300 dark:hover:!border-cyan-500 dark:hover:!bg-cyan-900/30 dark:hover:!text-cyan-200 dark:focus:!border-cyan-500 dark:focus:!bg-cyan-900/30 dark:focus:!ring-2 dark:focus:!ring-cyan-400"
                                >
                                    <Scale className="h-4 w-4" />
                                    {t('point_of_sale.scale')}
                                    <Kbd>T</Kbd>
                                </Button>
                            </div>

                            {/* Cards Filter */}
                            <div className="space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                                <Label className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                    &nbsp;
                                </Label>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCards}
                                    className="flex h-11 w-full items-center justify-center gap-2 !border-emerald-300 !bg-emerald-50 !text-emerald-700 hover:!border-emerald-500 hover:!bg-emerald-100 hover:!text-emerald-800 focus:!border-emerald-500 focus:!bg-emerald-100 focus:!ring-2 focus:!ring-emerald-200 focus:!outline-none dark:!border-emerald-600 dark:!bg-emerald-900/20 dark:!text-emerald-300 dark:hover:!border-emerald-500 dark:hover:!bg-emerald-900/30 dark:hover:!text-emerald-200 dark:focus:!border-emerald-500 dark:focus:!bg-emerald-900/30 dark:focus:!ring-2 dark:focus:!ring-emerald-400"
                                >
                                    <CreditCard className="h-4 w-4" />
                                    {t('point_of_sale.cards')}
                                    <Kbd>K</Kbd>
                                </Button>
                            </div>

                            {/* Previous Receipt */}
                            <div className="space-y-2 rounded-md p-2 transition-colors duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                <Label className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                    &nbsp;
                                </Label>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handlePrintPreviousReceipt}
                                    className="flex h-11 w-full items-center justify-center gap-2 !border-blue-300 !bg-blue-50 !text-blue-700 hover:!border-blue-500 hover:!bg-blue-100 hover:!text-blue-800 focus:!border-blue-500 focus:!bg-blue-100 focus:!ring-2 focus:!ring-blue-200 focus:!outline-none disabled:opacity-50 dark:!border-blue-600 dark:!bg-blue-900/20 dark:!text-blue-300 dark:hover:!border-blue-500 dark:hover:!bg-blue-900/30 dark:hover:!text-blue-200 dark:focus:!border-blue-500 dark:focus:!bg-blue-900/30 dark:focus:!ring-2 dark:focus:!ring-blue-400"
                                >
                                    <Receipt className="h-4 w-4" />
                                    {t('point_of_sale.previous_receipt')}
                                    <Kbd>P</Kbd>
                                </Button>
                            </div>


                        </div>
                    </div>
            </div>

                {/* Shopping Cart Section - Full Height */}
                <Suspense
                    fallback={
                        <div className="flex min-h-[200px] flex-1 items-center justify-center rounded-md border border-dashed border-muted-foreground/40 text-sm text-muted-foreground">
                            Loading cart…
                        </div>
                    }
                >
                    <ShoppingCartTable
                        ref={cartTableRef}
                        className="min-h-0 flex-1"
                        items={cartItems}
                        onUpdateQuantity={updateQuantity}
                        onRemoveItem={removeItem}
                        onClearCart={clearCurrentCart}
                        onClearHold={showClearHoldModal}
                        onRecall={handleRecall}
                        onHold={handleHold}
                        onCheckout={handleCheckout}
                        discount={discount}
                        discountEnabled={isDiscountVisible}
                        onDiscountChange={handleDiscountChange}
                        onDiscountToggleChange={handleDiscountToggleChange}
                        hasHeldCarts={hasHeldCarts}
                        lastUpdatedItemId={lastUpdatedItemId}
                        onItemUpdated={() => setLastUpdatedItemId(null)}
                    />
                </Suspense>

                {/* Recall Cart Modal */}
                <Suspense fallback={null}>
                    <RecallCartModal
                    isOpen={recallCartModalOpen}
                    onClose={() => {
                        setRecallCartModalOpen(false);
                        // Focus barcode search after modal fully closes and aria-hidden is removed
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
                            // Focus barcode search after modal fully closes and aria-hidden is removed
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
                        onOverwrite={handleOverwrite}
                    />
                </Suspense>

                {/* Scale Modal */}
                <Suspense fallback={null}>
                    <ScaleModal
                        isOpen={scaleModalOpen}
                        onClose={() => {
                            setScaleModalOpen(false);
                            // Focus barcode search after modal fully closes and aria-hidden is removed
                            requestAnimationFrame(() => {
                                requestAnimationFrame(() => {
                                    focusBarcodeSearch(180);
                                });
                            });
                        }}
                        onProductSelect={(
                            product: ScaleProduct,
                            weight: number,
                        ) => {
                            // Add scale product to cart with specific weight
                            addItemToCart({
                                id: `scale_${product.id}_${Date.now()}`, // Unique ID for scale products
                                barcode:
                                    ((product as unknown as Record<string, unknown>)
                                        .barcode as string) || product.plu, // Use barcode if available, otherwise use PLU
                                name: `${product.name} (${weight}kg)`,
                                price: product.sell_price, // Unit price per kg
                                quantity: null, // No quantity for scale products - sold by weight only
                                isScaleProduct: true, // Mark as scale product for different handling
                                weight: weight, // Store the actual weight
                                scaleProductId: product.id, // Include scale product ID for duplicate detection
                                productType: 'scale_product',
                            });
                        }}
                    />
                </Suspense>

                {/* Unified Cards Modal */}
                <Suspense fallback={null}>
                    <UnifiedCardsModal
                        isOpen={cardsModalOpen}
                        onClose={() => {
                            setCardsModalOpen(false);
                            // Focus barcode search after modal fully closes and aria-hidden is removed
                            requestAnimationFrame(() => {
                                requestAnimationFrame(() => {
                                    focusBarcodeSearch(180);
                                });
                            });
                        }}
                        onCardSelect={(card: Card) => {
                            // Handle card selection using standardized approach
                            addItemToCart({
                                id: `card_${card.id}_${Date.now()}`, // Unique ID for card products
                                barcode: `CARD_${card.id}`,
                                name: `${card.name_card?.name || 'Card'} - Card #${card.id}`,
                                price: card.sell_price, // Will be normalized in addItemToCart
                                quantity: 1,
                                isScaleProduct: false,
                                cardId: card.id, // Include card ID for duplicate detection
                                productType: 'card',
                            });
                            
                            // Smart cache refresh - ensure cache is updated with latest card data
                            // This will refresh the cache without a full reload
                            cardCacheService.getNameCardsWithCards(true);
                        }}
                    />
                </Suspense>

                {/* Clear All Holds Confirmation Modal */}
                <Suspense fallback={null}>
                    <ClearAllHoldsModal
                        isOpen={clearAllHoldsModalOpen}
                        onClose={() => {
                            setClearAllHoldsModalOpen(false);
                            // Focus barcode search after modal closes
                            requestAnimationFrame(() => {
                                requestAnimationFrame(() => {
                                    focusBarcodeSearch(100);
                                });
                            });
                        }}
                        onConfirm={clearHold}
                    />
                </Suspense>
            </div>
            <ReceiptPreviewModal
                isOpen={previewOpen}
                onClose={() => {
                    setPreviewOpen(false);
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            focusBarcodeSearch(150);
                        });
                    });
                }}
                html={previewHtml}
                title={t('point_of_sale.previous_receipt')}
            />
        </AppLayout>
    );
}