import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/hooks/use-translation';
import { minimumSalePrice } from '@/lib/cart-pricing';
import { formatIQD } from '@/lib/currency';
import type { CartItem } from '@/types/cart';
import { normalizeToEnglishNumbers } from '@/utils/keyboard-normalization';
import { Pencil } from 'lucide-react';
import { useId, useState } from 'react';

export function CartPriceEditor({ item, onChange }: {
    item: CartItem;
    onChange?: (itemId: string, price: number) => string | null;
}) {
    const { t } = useTranslation();
    const id = useId();
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState('');
    const [error, setError] = useState<string | null>(null);
    const minimum = minimumSalePrice(item.cost_price);
    const displayedPrice = item.isCartonMode && item.per_carton && item.carton_price !== null && item.carton_price !== undefined
        ? Number((item.carton_price / item.per_carton).toFixed(2)) : Number(item.price);
    const save = () => {
        const price = Number(normalizeToEnglishNumbers(draft.trim()));
        if (!draft.trim() || !Number.isFinite(price) || price <= 0 || minimum === null || price < minimum || Math.abs(price * 100 - Math.round(price * 100)) > 1e-6) {
            setError(t('cart_price.minimum_error', { minimum: formatIQD(minimum, { precision: 2 }) }));
            return;
        }
        const message = onChange?.(item.id, price);
        if (message) { setError(message); return; }
        setOpen(false);
    };
    return (
        <>
            <Button type="button" variant="ghost" size="sm" className="h-auto max-w-full gap-1 px-1 py-1 font-semibold tabular-nums" disabled={!onChange || minimum === null}
                title={minimum === null ? t('cart_price.reload_required') : t('cart_price.title')}
                aria-label={`${t('cart_price.title')}: ${item.name}`}
                onClick={() => { setDraft(String(displayedPrice)); setError(null); setOpen(true); }}>
                {formatIQD(displayedPrice, { precision: displayedPrice % 1 ? 2 : 0 })} <Pencil className="size-3 shrink-0" />
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md" onKeyDown={(event) => event.stopPropagation()}>
                    <DialogHeader><DialogTitle>{t('cart_price.title')}</DialogTitle></DialogHeader>
                    <p className="break-words font-medium">{item.name}</p>
                    <div className="space-y-2">
                        <Label htmlFor={id}>{t('cart_price.unit_price')}</Label>
                        <Input id={id} value={draft} inputMode="decimal" autoFocus className="h-12 text-lg" aria-invalid={!!error} aria-describedby={`${id}-hint`}
                            onFocus={(event) => event.target.select()}
                            onChange={(event) => { setDraft(event.target.value); setError(null); }}
                            onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); save(); } }} />
                        <p id={`${id}-hint`} className="text-sm text-muted-foreground">{t('cart_price.minimum_hint', { minimum: formatIQD(minimum, { precision: 2 }) })}</p>
                        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
                        <Button type="button" onClick={save}>{t('cart_price.apply')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
