/**
 * Centralized Cart Type Definitions
 * Single source of truth for all cart-related types across the application
 */

export interface CartItem {
    id: string;
    barcode: string;
    name: string;
    price: number | string; // Allow both for API flexibility, will be normalized
    quantity: number | null; // null for scale products (sold by weight)
    total: number; // Calculated field - should not be trusted, always recalculate
    isScaleProduct?: boolean; // Optional flag for scale products
    weight?: number | string; // Weight in kg for scale products, allow both types
    stock?: number; // Available stock for stock validation
    per_carton?: number | null; // Items per carton for bulk tracking
    carton_price?: number | null; // Optional carton-level price for display

    // Carton mode functionality
    isCartonMode?: boolean; // Whether this item is in carton mode
    cartonQuantity?: number; // Number of cartons (when in carton mode)
    displayQuantity?: number; // The quantity to display (either unit qty or carton qty)

    // Product identification for duplicate barcode handling
    productId?: number; // The actual database product ID
    scaleProductId?: number; // For scale products
    cardId?: number; // For card products

    // Optional metadata for better debugging
    productType?: 'product' | 'scale_product' | 'card';
    originalPrice?: number | string; // Keep original for debugging
    calculatedAt?: number; // Timestamp when total was calculated

    // Pre-built transaction item (complete, ready to send - zero-delay checkout)
    transactionItem?: {
        product_id?: number;
        card_id?: number;
        scale_product_id?: number;
        barcode: string;
        name: string;
        price: number;
        quantity: number | null;
        weight?: number;
        total: number;
        is_scale_product: boolean;
    };
}

export interface CartSummary {
    itemsCount: number;
    subtotal: number;
    discount: number;
    discountAmount: number;
    grandTotal: number;
    hasItems: boolean;
    hasScaleProducts: boolean;
    hasRegularProducts: boolean;
    hasCardProducts: boolean;
}

