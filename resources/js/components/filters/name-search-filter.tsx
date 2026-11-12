import { ItemThumbnail } from '@/components/layout/item-thumbnail';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/hooks/use-translation';
import { type PosProduct } from '@/services/utils/posService';
import { Search, Zap } from 'lucide-react';
import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';

interface NameSearchFilterProps {
    onProductSelect?: (product: PosProduct) => void;
    searchFunction?: (name: string) => PosProduct[];
    placeholder?: string;
    className?: string;
    autoFocus?: boolean;
}

export const NameSearchFilter = forwardRef<
    HTMLInputElement,
    NameSearchFilterProps
>(
    (
        {
            onProductSelect,
            searchFunction,
            placeholder = 'Search by product name...',
            className = '',
            autoFocus = false,
        },
        ref,
    ) => {
        const { t } = useTranslation();
        const [searchTerm, setSearchTerm] = useState('');
        const [dropdownOpen, setDropdownOpen] = useState(false);
        const [products, setProducts] = useState<PosProduct[]>([]);
        const [cached, setCached] = useState(false);
        const searchRef = useRef<HTMLDivElement>(null);

        // Load products based on name search (browser Map - instant)
        const loadProducts = useCallback((search: string) => {
            if (!search.trim()) {
                setProducts([]);
                setCached(false);
                return;
            }

            if (!searchFunction) {
                setProducts([]);
                setCached(false);
                return;
            }

            // Instant search using browser Map (no API call)
            const results = searchFunction(search.trim());
            const normalProducts = results.filter(
                (product) => product.type !== 'scale_product',
            );
            setProducts(normalProducts);
            setCached(true); // Always cached since it's from browser Map
        }, [searchFunction]);

        // Debounced search (instant with browser Map)
        useEffect(() => {
            const timeoutId = setTimeout(() => {
                if (dropdownOpen) {
                    loadProducts(searchTerm);
                }
            }, 50); // Very fast since it's local Map lookup
            return () => clearTimeout(timeoutId);
        }, [searchTerm, dropdownOpen, searchFunction, loadProducts]);

        // Handle product selection
        const handleProductSelect = (product: PosProduct) => {
            // Add product to cart
            onProductSelect?.(product);

            // Clear the search input after adding to cart
            setSearchTerm('');
            setDropdownOpen(false);
        };

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

        // Handle input focus
        const handleInputFocus = () => {
            // Clear any existing search state for a fresh start
            setSearchTerm('');
            setProducts([]);
            setCached(false);
            setDropdownOpen(true);
        };

        // Handle Enter key
        const handleKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' && products.length === 1) {
                handleProductSelect(products[0]);
            }
        };

        // Auto-focus on mount
        useEffect(() => {
            if (autoFocus && ref && 'current' in ref && ref.current) {
                ref.current.focus();
            }
        }, [autoFocus, ref]);

        return (
            <div ref={searchRef} className={`relative border border-green-200 rounded-md hover:border-green-300 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-500/20 dark:border-green-800 dark:hover:border-green-700 dark:focus-within:border-green-500 dark:focus-within:ring-green-500/30 ${className}`}>
                <div className="relative">
                    <Input
                        ref={ref}
                        placeholder={placeholder}
                        value={searchTerm}
                        onChange={(e) => {
                            const value = e.target.value;
                            setSearchTerm(value);

                            // Reset states when input is cleared
                            if (value === '') {
                                setProducts([]);
                                setCached(false);
                            }
                        }}
                        onFocus={handleInputFocus}
                        onKeyDown={handleKeyDown}
                        className="h-11 pr-16 !border-0 !focus:ring-0 !placeholder:text-green-500/70 !text-foreground !bg-transparent !shadow-[0_0_0_1px_rgba(34,197,94,0.3)] hover:!shadow-[0_0_0_1px_rgba(34,197,94,0.5)] focus:!shadow-[0_0_0_1px_rgba(34,197,94,0.7)] dark:!shadow-[0_0_0_1px_rgba(34,197,94,0.4)] dark:hover:!shadow-[0_0_0_1px_rgba(34,197,94,0.6)] dark:focus:!shadow-[0_0_0_1px_rgba(34,197,94,0.8)] !outline-none !ring-0 !ring-offset-0 !transition-none"
                        style={{
                            '--tw-placeholder-color': '#22c55e',
                            '--tw-placeholder-opacity': '1'
                        } as React.CSSProperties}
                        autoComplete="off"
                    />
                    <div className="absolute top-1/2 right-3 flex -translate-y-1/2 transform items-center gap-1">
                        {cached && <Zap className="h-3 w-3 text-green-500" />}
                        <Search className="h-4 w-4 text-green-500" />
                    </div>
                </div>

                {/* Products Dropdown */}
                {dropdownOpen && (
                    <div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-md border border-green-200 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] dark:border-green-800 dark:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.3),0_2px_4px_-1px_rgba(0,0,0,0.2)] bg-popover">
                        {products.length > 0 ? (
                            <>
                                {cached && (
                                    <div className="flex items-center gap-1 border-b border-border bg-green-50 px-3 py-1 text-xs text-green-700 dark:bg-green-950 dark:text-green-300">
                                        <Zap className="h-3 w-3" />
                                        {t('point_of_sale.cached_results_fast_lookup')}
                                    </div>
                                )}
                                {products.map((product) => (
                                    <button
                                        key={`${product.type}_${product.id}`}
                                        type="button"
                                        className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-green-50 hover:text-foreground focus:bg-green-50 focus:text-foreground dark:hover:bg-green-900/20 dark:hover:text-foreground dark:focus:bg-green-900/20 dark:focus:text-foreground"
                                        onClick={() =>
                                            handleProductSelect(product)
                                        }
                                    >
                                        <div className="flex items-center gap-2">
                                            <ItemThumbnail url={product.image_url} name={product.name} className="size-10" />
                                            <span className="font-medium">
                                                {product.name}
                                            </span>
                                            {product.type ===
                                                'scale_product' && (
                                                <span className="rounded bg-primary/10 px-1 text-xs text-primary dark:bg-primary/90 dark:text-primary/30">
                                                    {t('point_of_sale.scale_badge')}
                                                </span>
                                            )}
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
                                {t('point_of_sale.start_typing_name')}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    },
);

NameSearchFilter.displayName = 'NameSearchFilter';
