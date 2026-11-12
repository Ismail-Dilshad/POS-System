import { ItemThumbnail } from '@/components/layout/item-thumbnail';
import { DuplicateBarcodeModal } from '@/components/modals/duplicate-barcode-modal';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/hooks/use-translation';
import { posService, type PosProduct } from '@/services/utils/posService';
import { normalizeToEnglishNumbers } from '@/utils/keyboard-normalization';
import { CheckCircle, Loader2, Search, Zap } from 'lucide-react';
import {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from 'react';

interface BarcodeSearchFilterProps {
    onProductSelect?: (product: PosProduct) => void;
    searchFunction?: (barcode: string) => PosProduct[];
    placeholder?: string;
    className?: string;
    autoFocus?: boolean;
    onErrorStateChange?: (hasError: boolean) => void;
}

export interface BarcodeSearchFilterRef {
    focus: () => void;
}

export const BarcodeSearchFilter = forwardRef<
    BarcodeSearchFilterRef,
    BarcodeSearchFilterProps
>(
    (
        {
            onProductSelect,
            searchFunction,
            placeholder = 'Search by barcode...',
            className = '',
            autoFocus = true,
            onErrorStateChange,
        },
        ref,
    ) => {
        const { t } = useTranslation();
        const [searchTerm, setSearchTerm] = useState('');
        const [dropdownOpen, setDropdownOpen] = useState(false);
        const [products, setProducts] = useState<PosProduct[]>([]);
        const [loading, setLoading] = useState(false);
        const [cached, setCached] = useState(false);
        const [scanSuccess, setScanSuccess] = useState(false);
        const [scanError, setScanError] = useState(false);
        const [lastScanned, setLastScanned] = useState('');
        const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
        const [duplicateProducts, setDuplicateProducts] = useState<
            PosProduct[]
        >([]);
        const [duplicateBarcode, setDuplicateBarcode] = useState('');
        const searchRef = useRef<HTMLDivElement>(null);
        const inputRef = useRef<HTMLInputElement>(null);
        const timeoutRef = useRef<number | null>(null);
        const lastScannedBarcodeRef = useRef<string>('');
        const isProcessingRef = useRef<boolean>(false);

        // Expose focus method to parent
        useImperativeHandle(ref, () => ({
            focus: () => {
                inputRef.current?.focus();
            },
        }));
        // Ensure autofocus on mount when requested
        useEffect(() => {
            if (autoFocus) {
                inputRef.current?.focus();
            }
        }, [autoFocus]);

        // Simple scanner detection - accepts any alphanumeric input
        const isBarcodeScanner = useCallback((input: string): boolean => {
            const trimmedInput = input.trim();

            // Must be alphanumeric with no spaces, tabs, or newlines
            return /^[0-9A-Za-z]+$/.test(trimmedInput) &&
                !trimmedInput.includes(' ') &&
                !trimmedInput.includes('\t') &&
                !trimmedInput.includes('\n');
        }, []);

        // Handle product selection with duplicate prevention
        const handleProductSelect = useCallback(
            (product: PosProduct, updateSearchTerm: boolean = true) => {
                // Add product to cart
                onProductSelect?.(product);

                // Update UI state only if requested (not for auto-add from scanning)
                if (updateSearchTerm) {
                    setSearchTerm(posService.getPrimaryBarcode(product));
                }
                setDropdownOpen(false);

                // Reset processing flag after a delay
                setTimeout(() => {
                    isProcessingRef.current = false;
                }, 500);
            },
            [onProductSelect],
        );

        // Ultra-fast error sound with multiple audio instances
        const errorAudioRefs = useRef<HTMLAudioElement[]>([]);
        const currentAudioIndex = useRef(0);
        
        // Initialize multiple audio instances for instant playback
        useEffect(() => {
            try {
                // Create 3 audio instances for rapid-fire playback
                for (let i = 0; i < 3; i++) {
                    const audio = new Audio('/audio/sounds/error-scan.mp3');
                    audio.volume = 1.0;
                    audio.preload = 'auto';
                    audio.load();
                    errorAudioRefs.current.push(audio);
                }
            } catch {
                // Silent fail
            }
        }, []);

        // Ultra-fast error sound playback with rotation
        const playErrorSound = useCallback(() => {
            if (errorAudioRefs.current.length > 0) {
                try {
                    const audio = errorAudioRefs.current[currentAudioIndex.current];
                    audio.currentTime = 0;
                    audio.play().catch(() => {});
                    
                    // Rotate to next audio instance for rapid consecutive plays
                    currentAudioIndex.current = (currentAudioIndex.current + 1) % errorAudioRefs.current.length;
                } catch {
                    // Silent fail
                }
            }
        }, []);

        // Complete state reset function with tracking cleanup
        const resetSearchState = useCallback(() => {
            setSearchTerm('');
            setProducts([]);
            setDropdownOpen(false);
            setCached(false);
            setScanSuccess(false);
            setScanError(false);
            setLastScanned('');
            setDuplicateModalOpen(false);
            setDuplicateProducts([]);
            setDuplicateBarcode('');
            setLoading(false);
            isProcessingRef.current = false;
            lastScannedBarcodeRef.current = '';
        }, []);

        // Load products with local search (instant)
        // Simple search for normal products only
        const loadProducts = useCallback(
            (search: string) => {
                // Normalize search term to English numbers
                const normalizedSearch = normalizeToEnglishNumbers(search.trim());
                
                if (!normalizedSearch) {
                    setProducts([]);
                    setCached(false);
                    setScanSuccess(false);
                    setLastScanned('');
                    return;
                }

                setLoading(false);
                try {
                    // Get products from search function
                    const allProducts = searchFunction ? searchFunction(normalizedSearch) : [];
                    
                    // Only show normal products (no scale products)
                    const normalProducts = allProducts.filter(product => product.type !== 'scale_product');
                    
                    setProducts(normalProducts);
                    setCached(true);

                    // Show duplicate modal if multiple products found
                    if (normalProducts.length > 1) {
                        setDuplicateProducts(normalProducts);
                        setDuplicateBarcode(normalizedSearch);
                        setDuplicateModalOpen(true);
                        setDropdownOpen(false);
                    }
                } catch (error) {
                    console.error('Failed to load products:', error);
                    setProducts([]);
                    setCached(false);
                } finally {
                    setLoading(false);
                }
            },
            [searchFunction],
        );

        // Simple debounced search
        useEffect(() => {
            // Clear existing timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            // Use scanner detection for timing
            const isScannerInput = isBarcodeScanner(searchTerm);
            const delay = isScannerInput ? 150 : 200; // 150ms for scanner, 200ms for manual typing

            timeoutRef.current = setTimeout(() => {
                if (dropdownOpen || isScannerInput) {
                    loadProducts(searchTerm);
                }
            }, delay);

            return () => {
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }
            };
        }, [searchTerm, dropdownOpen, isBarcodeScanner, loadProducts]);

        // Click outside handler
        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (
                    searchRef.current &&
                    !searchRef.current.contains(event.target as Node)
                ) {
                    setDropdownOpen(false);
                }
            };

            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }, []);

        // Handle input focus with complete reset and tracking cleanup
        const handleInputFocus = useCallback(() => {
            resetSearchState();
            setDropdownOpen(true);
            // Clear the last scanned barcode when focusing
            lastScannedBarcodeRef.current = '';
        }, [resetSearchState]);

        // Handle paste events to limit pasted content
        const handlePaste = useCallback(
            (e: React.ClipboardEvent) => {
                const pastedText = e.clipboardData.getData('text');
                const normalizedPastedText = normalizeToEnglishNumbers(pastedText);
                
                // No character limitations - accept any length barcode
                e.preventDefault();
                setSearchTerm(normalizedPastedText);
            },
            [],
        );

        // Handle input change with proper state management and tracking cleanup
        const handleInputChange = useCallback(
            (e: React.ChangeEvent<HTMLInputElement>) => {
                const value = e.target.value;
                // Normalize to English numbers before processing
                const normalizedValue = normalizeToEnglishNumbers(value);
                
                // No character limitations - accept any length barcode
                setSearchTerm(normalizedValue);

                // Reset states when input is cleared
                if (normalizedValue === '') {
                    setProducts([]);
                    setCached(false);
                    setScanSuccess(false);
                    setScanError(false);
                    setLastScanned('');
                    setDuplicateModalOpen(false);
                    setDuplicateProducts([]);
                    setDuplicateBarcode('');
                    lastScannedBarcodeRef.current = '';
                    isProcessingRef.current = false;
                }
            },
            [],
        );

        // Handle duplicate modal close
        const handleDuplicateModalClose = useCallback(() => {
            setDuplicateModalOpen(false);
            setDuplicateProducts([]);
            setDuplicateBarcode('');
            // Focus back to input
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }, []);

        // Handle duplicate product selection
        const handleDuplicateProductSelect = useCallback(
            (product: PosProduct) => {
                handleProductSelect(product);
                handleDuplicateModalClose();
            },
            [handleProductSelect, handleDuplicateModalClose],
        );

        // Handle keydown events
        const handleKeyDown = useCallback(
            (e: React.KeyboardEvent) => {
                // Handle Tab - allow it to bubble up for navigation
                if (e.key === 'Tab') {
                    return; // Let the event bubble up
                }

                // Barcode characters belong to this input, not POS letter shortcuts.
                // Keep the default input behavior so short codes such as C5 are entered intact.
                if (
                    e.key.length === 1 &&
                    !e.ctrlKey &&
                    !e.metaKey &&
                    !e.altKey
                ) {
                    e.stopPropagation();
                    return;
                }

                // Handle Enter - process search and prevent global handler interference
                if (e.key === 'Enter') {
                    const currentSearchTerm = searchTerm.trim();
                    if (currentSearchTerm) {
                        // Prevent default and stop propagation to avoid global handler interference
                        e.preventDefault();
                        e.stopPropagation();

                        // Use the search function directly to get fresh results
                        const searchResults = searchFunction ? searchFunction(currentSearchTerm) : [];
                        const normalProducts = searchResults.filter(product => product.type !== 'scale_product');
                        
                        if (normalProducts.length === 1) {
                            // Single product found - add to cart
                            handleProductSelect(normalProducts[0], false);
                            
                            // Show success feedback
                            setScanSuccess(true);
                            setLastScanned(
                                normalProducts[0].name ||
                                    posService.getPrimaryBarcode(normalProducts[0]),
                            );

                            // Clear input immediately after successful scan
                            resetSearchState();
                            
                            // Reset success indicator after showing it
                            setTimeout(() => {
                                setScanSuccess(false);
                                setLastScanned('');
                            }, 2000);
                        } else if (normalProducts.length === 0) {
                            // No products found - play error sound and show visual feedback
                            playErrorSound();
                            setScanError(true);
                            
                            // Clear input after showing error feedback
                            setTimeout(() => {
                                resetSearchState();
                            }, 500); // Visible error feedback
                        } else if (normalProducts.length > 1) {
                            // Multiple products - show duplicate selection modal
                            setDuplicateProducts(normalProducts);
                            setDuplicateBarcode(currentSearchTerm);
                            setDuplicateModalOpen(true);
                            setDropdownOpen(false);
                        }
                    } else {
                        // Empty search term - allow event to bubble up so global handler can focus the input
                        return;
                    }
                    return; // Event handled, don't bubble up
                }

                // No character limitations for barcode scanners
            },
            [handleProductSelect, searchTerm, searchFunction, playErrorSound, resetSearchState],
        );

        // Notify parent component of error state changes
        useEffect(() => {
            onErrorStateChange?.(scanError);
        }, [scanError, onErrorStateChange]);

        // Cleanup on unmount
        useEffect(() => {
            return () => {
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }
            };
        }, []);

        return (
            <div ref={searchRef} className={`relative border border-blue-200 rounded-md hover:border-blue-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 dark:border-blue-800 dark:hover:border-blue-700 dark:focus-within:border-blue-500 dark:focus-within:ring-blue-500/30 ${className}`}>
                {/* Success Feedback */}
                {scanSuccess && (
                    <div className="absolute -top-12 right-0 left-0 z-50 flex items-center gap-2 rounded-md border border-blue-200 bg-blue-100 p-2 text-sm font-medium text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                        <CheckCircle className="h-4 w-4" />{t('point_of_sale.barcode_product_added', { productName: lastScanned })}
                    </div>
                )}

                <div className="relative">
                    <Input
                        ref={inputRef}
                        placeholder={placeholder}
                        value={searchTerm}
                        onChange={handleInputChange}
                        onFocus={handleInputFocus}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                        className="h-11 pr-16 !border-0 !focus:ring-0 !placeholder:text-blue-500/70 !text-foreground !bg-transparent !shadow-[0_0_0_1px_rgba(59,130,246,0.3)] hover:!shadow-[0_0_0_1px_rgba(59,130,246,0.5)] focus:!shadow-[0_0_0_1px_rgba(59,130,246,0.7)] dark:!shadow-[0_0_0_1px_rgba(59,130,246,0.4)] dark:hover:!shadow-[0_0_0_1px_rgba(59,130,246,0.6)] dark:focus:!shadow-[0_0_0_1px_rgba(59,130,246,0.8)]"
                        autoComplete="off"
                        data-allow-shortcuts="true"
                        data-testid="barcode-search"
                        autoFocus={autoFocus}
                    />
                    <div className="absolute top-1/2 right-3 flex -translate-y-1/2 transform items-center gap-1">
                        {cached && <Zap className="h-3 w-3 text-blue-500" />}
                        <Search className="h-4 w-4 text-blue-500" />
                    </div>
                </div>

                {/* Products Dropdown */}
                {dropdownOpen && (
                    <div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-md border border-blue-200 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] dark:border-blue-800 dark:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.3),0_2px_4px_-1px_rgba(0,0,0,0.2)] bg-popover">
                        {loading ? (
                            <div className="p-3 text-center text-sm text-muted-foreground">
                                <Loader2 className="mx-auto mb-1 h-4 w-4 animate-spin text-blue-500" />
                                {cached
                                    ? t('point_of_sale.loading_from_cache')
                                    : t('point_of_sale.searching')}
                            </div>
                        ) : products.length > 0 ? (
                            <>
                                {cached && (
                                    <div className="flex items-center gap-1 border-b border-border bg-blue-50 px-3 py-1 text-xs text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                        <Zap className="h-3 w-3" />
                                        {t('point_of_sale.cached_results_fast_lookup')}
                                    </div>
                                )}
                                {products.map((product) => (
                                    <button
                                        key={`${product.type}_${product.id}`}
                                        type="button"
                                        className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-blue-50 hover:text-foreground focus:bg-blue-50 focus:text-foreground dark:hover:bg-blue-900/20 dark:hover:text-foreground dark:focus:bg-blue-900/20 dark:focus:text-foreground"
                                        onClick={() =>
                                            handleProductSelect(product)
                                        }
                                    >
                                        <div className="flex items-center gap-2">
                                            <ItemThumbnail url={product.image_url} name={product.name} className="size-10" />
                                            <span className="font-mono font-medium">
                                                {posService.getPrimaryBarcode(
                                                    product,
                                                )}
                                            </span>
                                            {product.secondary_barcode && (
                                                <span className="font-mono text-xs text-muted-foreground">
                                                    •{' '}
                                                    {product.secondary_barcode}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </>
                        ) : searchTerm.trim() ? (
                            <div className="p-3 text-center text-sm text-muted-foreground">
                                {t('point_of_sale.no_products_found')}
                            </div>
                        ) : (
                            <div className="p-3 text-center text-sm text-muted-foreground">
                                {t('point_of_sale.start_typing_barcode')}
                            </div>
                        )}
                    </div>
                )}

                {/* Duplicate Barcode Selection Modal */}
                <DuplicateBarcodeModal
                    isOpen={duplicateModalOpen}
                    onClose={handleDuplicateModalClose}
                    onProductSelect={handleDuplicateProductSelect}
                    products={duplicateProducts}
                    barcode={duplicateBarcode}
                />

                {/* Red Overlay for Error Feedback */}
                {scanError && (
                    <div className="fixed inset-0 z-[9999] bg-red-500/30 dark:bg-red-600/40 pointer-events-none animate-pulse" 
                         style={{ animation: 'pulse 0.5s ease-in-out' }} />
                )}
            </div>
        );
    },
);
