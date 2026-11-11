import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/hooks/use-translation';
import { useEffect, useId, useRef, useState } from 'react';

interface ItemImageFieldProps {
    value: File | null;
    existingUrl?: string | null;
    remove: boolean;
    disabled?: boolean;
    onChange: (file: File | null, remove: boolean) => void;
}

export function ItemImageField({
    value,
    existingUrl,
    remove,
    disabled,
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
        <div className="space-y-2">
            <Label htmlFor={id}>{t('item_images.label')}</Label>
            <p id={`${id}-help`} className="text-sm text-muted-foreground">
                {t('item_images.help')}
            </p>
            <div className="flex flex-wrap items-center gap-3">
                {url && (
                    <img
                        src={url}
                        alt={t('item_images.preview')}
                        className="size-20 rounded-md border object-contain"
                    />
                )}
                <Input
                    ref={input}
                    id={id}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={disabled}
                    className="max-w-sm"
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
                {url && (
                    <Button
                        type="button"
                        variant="outline"
                        disabled={disabled}
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
