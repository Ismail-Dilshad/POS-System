import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';
import type { PosProduct } from '@/services/utils/posService';
import { useTranslation } from '@/hooks/use-translation';
import { Image as ImageIcon, Loader2 } from 'lucide-react';
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';

type ProductGridVariant = 'featured' | 'compact';

export interface CashierProductGridRef {
    focusFirstCard: () => void;
}

interface CashierProductGridProps {
    products: PosProduct[];
    onAddToCart: (product: PosProduct) => void;
    title?: string;
    description?: string;
    variant?: ProductGridVariant;
    className?: string;
    showHeader?: boolean;
    isLoading?: boolean;
}

export const CashierProductGrid = forwardRef<
    CashierProductGridRef,
    CashierProductGridProps
>(
    (
        {
            products,
            onAddToCart,
            title = 'Featured products',
            description = 'Tap a product to instantly add it to the cart.',
            variant = 'featured',
            className,
            showHeader = true,
            isLoading = false,
        },
        ref,
    ) => {
        const { t } = useTranslation();
        const buttonRefs = useRef<HTMLButtonElement[]>([]);

        useImperativeHandle(ref, () => ({
            focusFirstCard: () => {
                if (buttonRefs.current[0]) {
                    buttonRefs.current[0].focus();
                }
            },
        }));

        const normalProducts = useMemo(
            () => products.filter((product) => product.type === 'product'),
            [products],
        );

        return (
            <Card
                className={cn(
                    'relative min-h-0 flex-1 overflow-hidden shadow-[0_12px_30px_-12px_rgba(74,108,247,0.35)] dark:shadow-[0_12px_30px_-12px_rgba(10,10,10,0.65)]',
                    className,
                )}
            >
                {showHeader ? (
                    <CardHeader className="gap-2 pb-2">
                        <div className="flex items-center justify-between gap-4">
                            <div className="space-y-0.5">
                                <CardTitle className="text-lg font-semibold">
                                    {title}
                                </CardTitle>
                                <CardDescription className="text-xs leading-relaxed">
                                    {description}
                                </CardDescription>
                            </div>
                            <Badge
                                variant="secondary"
                                className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                            >
                                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-blue-500" />
                                Mock data
                            </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-1 text-xs font-medium text-muted-foreground">
                            <span className="rounded-full bg-background/70 px-2 py-0.5 shadow-sm">
                                {normalProducts.length} products
                            </span>
                            <span className="rounded-full bg-background/70 px-2 py-0.5 shadow-sm">
                                Normal items only
                            </span>
                        </div>
                    </CardHeader>
                ) : null}
                <CardContent
                    className={cn(
                        'flex min-h-0 flex-1 flex-col overflow-hidden pb-0',
                        !showHeader && 'pt-2',
                    )}
                >
                    {isLoading && normalProducts.length === 0 ? (
                        <div className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-dashed border-muted-foreground/40 bg-muted/10 text-center text-sm text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            {t('cashier.loading_products')}
                        </div>
                    ) : normalProducts.length === 0 ? (
                        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-muted-foreground/40 bg-muted/10 text-center text-sm text-muted-foreground">
                            {t('cashier.no_normal_products')}
                        </div>
                    ) : (
                        <ScrollArea className="h-full pr-2">
                            <div
                                className={cn(
                                    'grid gap-2 pb-4 pt-2',
                                    variant === 'featured'
                                        ? 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7'
                                        : 'grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7',
                                )}
                            >
                                {normalProducts.map((product, index) => (
                                    <button
                                        key={`featured-product-${product.id}`}
                                        ref={(element) => {
                                            if (element) {
                                                buttonRefs.current[index] = element;
                                            }
                                        }}
                                        type="button"
                                        aria-label={`Add ${product.name} to cart`}
                                        onClick={() => onAddToCart(product)}
                                        className="group relative flex aspect-square w-full flex-col overflow-hidden rounded-2xl border border-border/40 bg-card text-left shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                                    >
                                        <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-muted/40">
                                            <span className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-primary/15 opacity-70 transition-opacity duration-150 group-hover:opacity-85" />
                                            <ImageIcon className="relative h-8 w-8 text-primary/25 transition-transform duration-150 group-hover:scale-105 group-hover:text-primary/30" />
                                        </div>
                                        <div className="flex flex-col gap-1 bg-background px-2 py-2">
                                            <p className="truncate text-sm font-semibold text-foreground">
                                                {product.name}
                                            </p>
                                            <span className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                {product.barcode ?? '—'}
                                            </span>
                                            <span className="text-sm font-semibold text-primary">
                                                {formatCurrency(product.sell_price)}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>
        );
    },
);

CashierProductGrid.displayName = 'CashierProductGrid';
