export function itemImagePayload(
    data: Record<string, unknown>,
    image?: File | null,
    removeImage = false,
    update = false,
): Record<string, unknown> | FormData {
    if (!image && !removeImage) return data;
    const payload = new FormData();
    for (const [key, value] of Object.entries(data)) {
        if (value === undefined) continue;
        if (value === null) payload.append(key, '');
        else if (typeof value === 'boolean')
            payload.append(key, value ? '1' : '0');
        else if (typeof value === 'string' || typeof value === 'number')
            payload.append(key, String(value));
    }
    if (image) payload.append('image', image);
    if (removeImage) payload.append('remove_image', '1');
    if (update) payload.append('_method', 'PUT');
    return payload;
}
