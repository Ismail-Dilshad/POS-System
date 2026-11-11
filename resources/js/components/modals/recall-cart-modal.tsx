import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useTranslation } from '@/hooks/use-translation';
import { useFocusManagement } from '@/hooks/use-focus-management';
import { holdCartService, type HeldCart } from '@/services/utils/holdCartService';
import { type CartItem } from '@/types/cart';
import { RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface RecallCartModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRecall: (cartData: {
        cartItems: CartItem[];
        subtotal: number;
        discount: number;
        grandTotal: number;
    }) => void;
}

export function RecallCartModal({
    isOpen,
    onClose,
    onRecall,
}: RecallCartModalProps) {
    const { t } = useTranslation();
    useFocusManagement(isOpen);
    const [heldCarts, setHeldCarts] = useState<HeldCart[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Keyboard navigation state
    const [selectedIndex, setSelectedIndex] = useState(0);
    const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

    useEffect(() => {
        if (isOpen) {
            loadHeldCarts();
            setSelectedIndex(0);
        }
    }, [isOpen]);

    // Update button refs when heldCarts change
    useEffect(() => {
        buttonRefs.current = buttonRefs.current.slice(0, heldCarts.length);
    }, [heldCarts.length]);

    // Scroll selected button into view
    const scrollToSelected = useCallback(() => {
        if (buttonRefs.current[selectedIndex]) {
            buttonRefs.current[selectedIndex]?.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
            });
        }
    }, [selectedIndex]);

    const loadHeldCarts = () => {
        const carts = holdCartService.getAllHeldCarts();
        setHeldCarts(carts);
    };

    const handleRecall = useCallback(async (cart: HeldCart) => {
        setLoading(true);
        try {
            const cartData = holdCartService.recallCart(cart.id);
            if (cartData) {
                // Remove the recalled cart from held carts
                holdCartService.deleteHeldCart(cart.id);
                // Refresh the list
                loadHeldCarts();
                onRecall(cartData);
                onClose();
            }
        } catch {
            // Error recalling cart
        } finally {
            setLoading(false);
        }
    }, [onRecall, onClose]);

    // Keyboard navigation handler
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!isOpen || loading || heldCarts.length === 0) {
            return;
        }

        const totalItems = heldCarts.length;
        const maxIndex = totalItems - 1;

        switch (e.key) {
            case 'ArrowUp': {
                e.preventDefault();
                const newIndex = selectedIndex - 1;
                if (newIndex >= 0) {
                    setSelectedIndex(newIndex);
                }
                break;
            }
            case 'ArrowDown': {
                e.preventDefault();
                const newIndex = selectedIndex + 1;
                if (newIndex <= maxIndex) {
                    setSelectedIndex(newIndex);
                }
                break;
            }
            case 'Enter': {
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < totalItems) {
                    const selectedCart = heldCarts[selectedIndex];
                    handleRecall(selectedCart);
                }
                break;
            }
            case 'Escape': {
                e.preventDefault();
                onClose();
                // Let parent handle focus management consistently with other modals
                break;
            }
        }
    }, [isOpen, loading, heldCarts, selectedIndex, onClose, handleRecall]);

    // Add keyboard event listener
    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, handleKeyDown]);

    // Scroll to selected item when selection changes
    useEffect(() => {
        if (isOpen) {
            scrollToSelected();
        }
    }, [selectedIndex, isOpen, scrollToSelected]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <RotateCcw className="h-5 w-5 text-orange-600" />
                        {t('point_of_sale.recall_cart')}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-2">
                    {heldCarts.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground">
                            <RotateCcw className="mx-auto mb-4 h-12 w-12 opacity-50" />
                            <p>{t('point_of_sale.no_held_carts')}</p>
                        </div>
                    ) : (
                        heldCarts.map((cart, index) => (
                            <Button
                                key={cart.id}
                                ref={(el) => { buttonRefs.current[index] = el; }}
                                variant="outline"
                                onClick={() => handleRecall(cart)}
                                disabled={loading}
                                className={`h-12 w-full justify-start text-left transition-all duration-200 ${
                                    selectedIndex === index
                                        ? 'border-primary bg-primary/10 shadow-lg ring-2 ring-primary/20'
                                        : 'hover:border-primary/50'
                                }`}
                            >
                                <RotateCcw className="mr-3 h-4 w-4" />
                                {cart.holdNumber}
                            </Button>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
