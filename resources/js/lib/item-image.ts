// Inventory rows, POS products and cards expose their images at different levels.
export function getItemImageUrl(item: unknown): string | null {
    if (!item || typeof item !== 'object') return null;
    const record = item as Record<string, unknown>;
    const imageData = record.image_data as { data_url?: unknown } | undefined;
    const direct = record.image_url || imageData?.data_url;
    if (typeof direct === 'string' && direct.trim()) {
        const url = direct.trim();
        return /^(?:https?:\/\/|data:image\/|blob:|\/)/i.test(url) ? url : `/${url}`;
    }
    for (const nested of [record.name_card, record.nameCard, record.original_data]) {
        if (nested && nested !== item) {
            const url = getItemImageUrl(nested);
            if (url) return url;
        }
    }
    return null;
}
