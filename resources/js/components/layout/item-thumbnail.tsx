import { useTranslation } from '@/hooks/use-translation';
import { ImageOff } from 'lucide-react';
import { useState } from 'react';

export function ItemThumbnail({
    url,
    name,
}: {
    url?: string | null;
    name: string;
}) {
    const { t } = useTranslation();
    const [failedUrl, setFailedUrl] = useState<string | null>(null);
    return (
        <div className="flex size-12 items-center justify-center overflow-hidden rounded-md border bg-muted/30">
            {url && failedUrl !== url ? (
                <img
                    src={url}
                    alt={t('item_images.alt', { name })}
                    loading="lazy"
                    decoding="async"
                    className="size-full object-contain"
                    onError={() => setFailedUrl(url)}
                />
            ) : (
                <ImageOff
                    className="size-5 text-muted-foreground"
                    aria-label={t('item_images.empty')}
                />
            )}
        </div>
    );
}
