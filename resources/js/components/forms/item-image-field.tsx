import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/hooks/use-translation';
import { ImagePlus } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

interface ItemImageFieldProps {
    value: File | null;
    existingUrl?: string | null;
    remove: boolean;
    disabled?: boolean;
    compact?: boolean;
    onChange: (file: File | null, remove: boolean) => void;
}

export function ItemImageField({
    value,
    existingUrl,
    remove,
    disabled,
    compact = false,
    onChange,
}: ItemImageFieldProps) {
    const { t } = useTranslation();
    const id = useId();
    const input = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    useEffect(() => {
        if (!value) {
            setPreview(null);
            return;
        }
        const url = URL.createObjectURL(value);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [value]);
    const url = preview || (!remove ? existingUrl : null);
    return (
        <div className={compact ? 'space-y-3 rounded-xl border bg-muted/20 p-4' : 'space-y-2'}>
            <Label htmlFor={id} className={compact ? 'text-base font-semibold' : undefined}>{t('item_images.label')}</Label>
            <p id={`${id}-help`} className="text-sm text-muted-foreground">
                {compact ? 'JPG / PNG / WebP · 2 MB' : t('item_images.help')}
            </p>
            <div className={compact ? 'flex flex-col gap-3' : 'flex flex-wrap items-center gap-3'}>
                {url && (
                    <img
                        src={url}
                        alt={t('item_images.preview')}
                        className={compact ? 'h-32 w-full rounded-lg border bg-background object-contain' : 'size-20 rounded-md border object-contain'}
                    />
                )}
                {compact && !url && (
                    <div className="flex h-32 w-full items-center justify-center rounded-lg border border-dashed bg-background">
                        <ImagePlus className="size-9 text-muted-foreground" aria-label={t('item_images.empty')} />
                    </div>
                )}
                <Input
                    ref={input}
                    id={id}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={disabled}
                    className={compact ? 'sr-only' : 'max-w-sm'}
                    aria-describedby={`${id}-help`}
                    aria-invalid={!!error}
                    onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        if (
                            !['image/jpeg', 'image/png', 'image/webp'].includes(
                                file.type,
                            ) ||
                            file.size > 2 * 1024 * 1024
                        ) {
                            setError(t('item_images.invalid'));
                            event.target.value = '';
                            return;
                        }
                        setError(null);
                        onChange(file, false);
                    }}
                />
                {compact && (
                    <Button type="button" variant="outline" disabled={disabled} className="h-11 w-full text-base" onClick={() => input.current?.click()}>
                        <ImagePlus className="mr-2 size-4" />
                        {t('common.select')}
                    </Button>
                )}
                {url && (
                    <Button
                        type="button"
                        variant="outline"
                        disabled={disabled}
                        className={compact ? 'h-11 w-full text-base' : undefined}
                        onClick={() => {
                            onChange(null, true);
                            setError(null);
                            if (input.current) input.current.value = '';
                        }}
                    >
                        {t('item_images.remove')}
                    </Button>
                )}
            </div>
            {error && (
                <p role="alert" className="text-sm text-destructive">
                    {error}
                </p>
            )}
        </div>
    );
}
