import { ItemThumbnail } from '@/components/layout/item-thumbnail';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/hooks/use-translation';
import { formatCurrency } from '@/lib/currency';
import { posService, type PosProduct } from '@/services/utils/posService';
import {
    AlertTriangle,
    ArrowRight,
    Barcode,
    CheckCircle,
    DollarSign,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

interface DuplicateBarcodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onProductSelect: (product: PosProduct) => void;
    products: PosProduct[];
    barcode: string;
}

export function DuplicateBarcodeModal({
    isOpen,
    onClose,
    onProductSelect,
    products,
    barcode,
}: DuplicateBarcodeModalProps) {
    const { t } = useTranslation();
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isSelecting, setIsSelecting] = useState(false);
    const productRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        productRefs.current = [];
    }, [products]);

    // Reset selection when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedIndex(0);
            setIsSelecting(false);
        }
    }, [isOpen]);

    // Handle product selection
    const handleSelectProduct = useCallback(
        async (product: PosProduct) => {
            if (isSelecting) return;

            setIsSelecting(true);
            try {
                onProductSelect(product);
                onClose();
            } catch (error) {
                console.error('Error selecting product:', error);
            } finally {
                setIsSelecting(false);
            }
        },
        [isSelecting, onProductSelect, onClose],
    );

    // Handle keyboard navigation
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (!isOpen) return;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex((prev) =>
                        Math.min(prev + 1, products.length - 1),
                    );
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex((prev) => Math.max(prev - 1, 0));
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (products[selectedIndex]) {
                        handleSelectProduct(products[selectedIndex]);
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    onClose();
                    break;
            }
        },
        [isOpen, selectedIndex, products, onClose, handleSelectProduct],
    );

    // Handle product click
    const handleProductClick = useCallback(
        (product: PosProduct, index: number) => {
            setSelectedIndex(index);
            handleSelectProduct(product);
        },
        [handleSelectProduct],
    );

    useEffect(() => {
        if (!isOpen) return;

        const selectedRef = productRefs.current[selectedIndex];
        if (selectedRef?.scrollIntoView) {
            selectedRef.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }, [selectedIndex, isOpen]);

    if (!isOpen || products.length === 0) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="max-h-[80vh] max-w-2xl p-0"
                onKeyDown={handleKeyDown}
            >
                <DialogHeader className="p-6 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/20">
                            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-semibold">
                                {t(
                                    'duplicate_barcode.title',
                                    'Duplicate Barcode Found',
                                )}
                            </DialogTitle>
                        </div>
                    </div>
                </DialogHeader>

                <div className="px-6 pb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Barcode className="h-4 w-4" />
                        <span className="font-mono font-medium">{barcode}</span>
                        <Badge variant="secondary" className="text-xs">
                            {products.length}{' '}
                            {products.length === 1 ? 'product' : 'products'}
                        </Badge>
                    </div>
                </div>

                <Separator />

                <ScrollArea className="max-h-96 px-6">
                    <div className="space-y-2 py-4">
                        {products.map((product, index) => (
                            <div
                                key={`${product.type}_${product.id}`}
                                ref={(element) => {
                                    productRefs.current[index] = element;
                                }}
                                className={`relative cursor-pointer rounded-lg border p-4 transition-all duration-200 ${
                                    selectedIndex === index
                                        ? 'border-primary bg-primary/5 shadow-md'
                                        : 'border-border hover:border-primary/50 hover:bg-accent/50'
                                } ${isSelecting ? 'pointer-events-none opacity-50' : ''} `}
                                onClick={() =>
                                    handleProductClick(product, index)
                                }
                            >
                                <div className="flex items-start justify-between">
                                    <div className="min-w-0 flex-1">
                                        <div className="mb-2 flex items-center gap-2">
                                              <ItemThumbnail url={product.image_url} name={product.name} className="size-10" />
                                            <h3 className="truncate text-sm font-medium">
                                                {product.name}
                                            </h3>
                                            {product.type ===
                                                'scale_product' && (
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs"
                                                >
                                                    SCALE
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Barcode className="h-3 w-3" />
                                                <span className="font-mono">
                                                    {posService.getPrimaryBarcode(
                                                        product,
                                                    )}
                                                </span>
                                            </div>

                                            {product.secondary_barcode && (
                                                <div className="flex items-center gap-1">
                                                    <Barcode className="h-3 w-3" />
                                                    <span className="font-mono">
                                                        {
                                                            product.secondary_barcode
                                                        }
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="ml-4 flex items-center gap-3">
                                        <div className="text-right">
                                            <div className="flex items-center gap-1 text-sm font-medium">
                                                <DollarSign className="h-3 w-3" />
                                                {formatCurrency(
                                                    product.sell_price,
                                                )}
                                            </div>
                                        </div>

                                        {selectedIndex === index && (
                                            <div className="flex items-center gap-1 text-primary">
                                                <CheckCircle className="h-4 w-4" />
                                                <ArrowRight className="h-3 w-3" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {selectedIndex === index && (
                                    <div className="pointer-events-none absolute inset-0 rounded-lg border-2 border-primary" />
                                )}
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                <Separator />

                <div className="p-6 pt-4">
                    <div className="flex items-center justify-end">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={onClose}
                                disabled={isSelecting}
                            >
                                {t('common.cancel', 'Cancel')}
                            </Button>
                            <Button
                                onClick={() =>
                                    handleSelectProduct(products[selectedIndex])
                                }
                                disabled={isSelecting}
                                className="min-w-[100px]"
                            >
                                {isSelecting ? (
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                                        {t('common.selecting', 'Selecting...')}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4" />
                                        {t('common.select', 'Select')}
                                    </div>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
