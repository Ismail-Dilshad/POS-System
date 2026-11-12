import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { ImageOff } from 'lucide-react';
import { useState } from 'react';

export function ItemThumbnail({
    url,
    name,
    className,
}: {
    url?: string | null;
    name: string;
    className?: string;
}) {
    const { t } = useTranslation();
    const [failedUrl, setFailedUrl] = useState<string | null>(null);
    return (
        <div className={cn('flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/30', className)}>
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
