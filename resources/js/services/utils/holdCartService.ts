import { CartItem } from '@/types/cart';

interface HoldCartData {
    customerName: string;
    customerPhone?: string;
    notes?: string;
    holdNumber: string;
}

interface HeldCart {
    id: string;
    holdNumber: string;
    customerName: string;
    customerPhone?: string;
    notes?: string;
    cartItems: CartItem[];
    subtotal: number;
    discount: number;
    grandTotal: number;
    createdAt: string;
    updatedAt: string;
}

class HoldCartService {
    private readonly STORAGE_KEY = 'pos_held_carts';
    private readonly MAX_HOLD_CARTS = 3; // Maximum number of held carts

    /**
     * Hold a cart with customer information
     */
    holdCart(
        cartItems: CartItem[],
        subtotal: number,
        discount: number,
        holdData: HoldCartData,
    ): HeldCart {
        const heldCart: HeldCart = {
            id: `hold_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            holdNumber: holdData.holdNumber,
            customerName: holdData.customerName,
            customerPhone: holdData.customerPhone,
            notes: holdData.notes,
            cartItems: [...cartItems], // Deep copy
            subtotal,
            discount,
            grandTotal: subtotal - (subtotal * discount) / 100,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const heldCarts = this.getAllHeldCarts();

        // Add new cart to the beginning
        heldCarts.unshift(heldCart);

        // Keep only the most recent MAX_HOLD_CARTS
        if (heldCarts.length > this.MAX_HOLD_CARTS) {
            heldCarts.splice(this.MAX_HOLD_CARTS);
        }

        this.saveHeldCarts(heldCarts);

        return heldCart;
    }

    /**
     * Check if hold capacity is reached
     */
    isHoldCapacityReached(): boolean {
        const heldCarts = this.getAllHeldCarts();
        return heldCarts.length >= this.MAX_HOLD_CARTS;
    }

    /**
     * Get the oldest held cart (for overwrite confirmation)
     */
    getOldestHeldCart(): HeldCart | null {
        const heldCarts = this.getAllHeldCarts();
        if (heldCarts.length === 0) return null;

        return heldCarts.reduce((oldest, current) =>
            new Date(current.createdAt) < new Date(oldest.createdAt)
                ? current
                : oldest,
        );
    }

    /**
     * Get all held carts
     */
    getAllHeldCarts(): HeldCart[] {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading held carts:', error);
            return [];
        }
    }

    /**
     * Get a specific held cart by ID
     */
    getHeldCart(id: string): HeldCart | null {
        const heldCarts = this.getAllHeldCarts();
        return heldCarts.find((cart) => cart.id === id) || null;
    }

    /**
     * Get a held cart by hold number
     */
    getHeldCartByNumber(holdNumber: string): HeldCart | null {
        const heldCarts = this.getAllHeldCarts();
        return heldCarts.find((cart) => cart.holdNumber === holdNumber) || null;
    }

    /**
     * Recall a held cart (restore to current cart)
     */
    recallCart(id: string): {
        cartItems: CartItem[];
        subtotal: number;
        discount: number;
        grandTotal: number;
    } | null {
        const heldCart = this.getHeldCart(id);
        if (!heldCart) {
            return null;
        }

        return {
            cartItems: [...heldCart.cartItems], // Deep copy
            subtotal: heldCart.subtotal,
            discount: heldCart.discount,
            grandTotal: heldCart.grandTotal,
        };
    }

    /**
     * Delete a held cart
     */
    deleteHeldCart(id: string): boolean {
        const heldCarts = this.getAllHeldCarts();
        const filteredCarts = heldCarts.filter((cart) => cart.id !== id);

        if (filteredCarts.length === heldCarts.length) {
            return false; // Cart not found
        }

        this.saveHeldCarts(filteredCarts);
        return true;
    }

    /**
     * Clear all held carts
     */
    clearAllHeldCarts(): void {
        localStorage.removeItem(this.STORAGE_KEY);
    }

    /**
     * Get held cart statistics
     */
    getHeldCartStats(): {
        total: number;
        totalValue: number;
        oldestCart?: string;
        newestCart?: string;
    } {
        const heldCarts = this.getAllHeldCarts();

        if (heldCarts.length === 0) {
            return {
                total: 0,
                totalValue: 0,
            };
        }

        const totalValue = heldCarts.reduce(
            (sum, cart) => sum + cart.grandTotal,
            0,
        );
        const sortedCarts = heldCarts.sort(
            (a, b) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime(),
        );

        return {
            total: heldCarts.length,
            totalValue,
            oldestCart: sortedCarts[0]?.createdAt,
            newestCart: sortedCarts[sortedCarts.length - 1]?.createdAt,
        };
    }

    /**
     * Search held carts by customer name or hold number
     */
    searchHeldCarts(query: string): HeldCart[] {
        const heldCarts = this.getAllHeldCarts();
        const searchTerm = query.toLowerCase().trim();

        if (!searchTerm) {
            return heldCarts;
        }

        return heldCarts.filter(
            (cart) =>
                cart.customerName.toLowerCase().includes(searchTerm) ||
                cart.holdNumber.toLowerCase().includes(searchTerm) ||
                (cart.customerPhone && cart.customerPhone.includes(searchTerm)),
        );
    }

    /**
     * Save held carts to localStorage
     */
    private saveHeldCarts(heldCarts: HeldCart[]): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(heldCarts));
        } catch (error) {
            console.error('Error saving held carts:', error);
        }
    }
}

export const holdCartService = new HoldCartService();
export type { CartItem, HeldCart, HoldCartData };
