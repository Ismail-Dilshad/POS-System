import type { CartItem } from '@/types/cart';

export const MINIMUM_PRICE_MARKUP = 0.2;

export function minimumSalePrice(cost: unknown): number | null {
    if (cost === null || cost === undefined || cost === '') return null;
    const value = Number(cost);
    return Number.isFinite(value) && value >= 0
        ? Math.max(0.01, Math.ceil(value * (1 + MINIMUM_PRICE_MARKUP) * 100 - 1e-7) / 100)
        : null;
}

export function withCartPrice(item: CartItem, price: number): CartItem {
    const units = item.isScaleProduct ? Number(item.weight || 0) : Number(item.quantity || 1);
    const total = Number((price * units).toFixed(2));
    return {
        ...item,
        price,
        priceOverridden: true,
        total,
        carton_price: item.per_carton ? Number((price * item.per_carton).toFixed(2)) : item.carton_price,
        transactionItem: {
            ...item.transactionItem,
            product_id: item.productId,
            card_id: item.cardId,
            scale_product_id: item.scaleProductId,
            barcode: item.barcode,
            name: item.name,
            price,
            quantity: item.isScaleProduct ? null : Number(item.quantity || 1),
            weight: Number(item.weight || 0),
            total,
            is_scale_product: !!item.isScaleProduct,
            price_overridden: true,
        },
    };
}

export function cartPriceIssue(items: CartItem[], discount: number): { name: string; minimum: number | null } | null {
    const subtotal = items.reduce((sum, item) => sum + Number(item.total || 0), 0);
    const ratio = subtotal > 0 ? Math.max(0, 1 - Math.max(0, discount) / subtotal) : 0;
    for (const item of items) {
        if (!item.priceOverridden) continue;
        const minimum = minimumSalePrice(item.cost_price);
        const units = item.isScaleProduct ? Number(item.weight || 0) : Number(item.quantity || 1);
        const effectivePrice = Math.min(Number(item.price), Number(item.total) / units) * ratio;
        if (minimum === null || !Number.isFinite(effectivePrice) || units <= 0 || effectivePrice + 1e-7 < minimum) {
            return { name: item.name, minimum };
        }
    }
    return null;
}
