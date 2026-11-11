import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useTranslation } from '@/hooks/use-translation';
import { Info } from 'lucide-react';
import { useMemo } from 'react';

interface CashierShortcutsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface ShortcutDefinition {
    id: ShortcutId;
    keys: string[];
}

interface ShortcutItem extends ShortcutDefinition {
    title: string;
    description: string;
}

type ShortcutId =
    | 'fullscreen'
    | 'checkout'
    | 'cards'
    | 'scale'
    | 'hold'
    | 'recall'
    | 'clear_holds'
    | 'discount'
    | 'remove_last'
    | 'clear_cart'
    | 'barcode_search'
    | 'quantity_focus'
    | 'quantity_nav_up'
    | 'quantity_nav_down';

const SHORTCUT_DEFINITIONS: ShortcutDefinition[] = [
    { id: 'fullscreen', keys: ['F11'] },
    { id: 'checkout', keys: ['C'] },
    { id: 'cards', keys: ['K'] },
    { id: 'scale', keys: ['T'] },
    { id: 'hold', keys: ['H'] },
    { id: 'recall', keys: ['B'] },
    { id: 'clear_holds', keys: ['S'] },
    { id: 'discount', keys: ['D'] },
    { id: 'remove_last', keys: ['Z'] },
    { id: 'clear_cart', keys: ['A'] },
    { id: 'barcode_search', keys: ['Enter'] },
    { id: 'quantity_focus', keys: ['Tab'] },
    { id: 'quantity_nav_up', keys: ['↑'] },
    { id: 'quantity_nav_down', keys: ['↓'] },
];

const FALLBACK_SHORTCUT_CONTENT: Record<ShortcutId, { title: string; description: string }> = {
    fullscreen: {
        title: 'Toggle fullscreen',
        description: 'Enter or exit fullscreen view for distraction-free checkout.',
    },
    checkout: {
        title: 'Complete checkout',
        description: 'Process the current cart and complete the transaction.',
    },
    cards: {
        title: 'Open cards modal',
        description: 'Open the customer cards / loyalty modal.',
    },
    scale: {
        title: 'Open scale modal',
        description: 'Launch the scale modal to weigh and add scale products.',
    },
    hold: {
        title: 'Hold current cart',
        description: 'Place the active cart on hold so you can serve the next customer.',
    },
    recall: {
        title: 'Recall held cart',
        description: 'Open the recall modal to resume a previously held cart.',
    },
    clear_holds: {
        title: 'Clear all held carts',
        description: 'Remove every held cart from the queue.',
    },
    discount: {
        title: 'Focus discount input',
        description: 'Jump directly to the discount field and select its current value.',
    },
    remove_last: {
        title: 'Remove last edited item',
        description: 'Remove the most recently edited non-scale item from the cart.',
    },
    clear_cart: {
        title: 'Clear entire cart',
        description: 'Empty the current cart instantly.',
    },
    barcode_search: {
        title: 'Focus barcode search',
        description: 'Jump to barcode search input.',
    },
    quantity_focus: {
        title: 'Focus last quantity',
        description: 'Jump to last quantity input in cart.',
    },
    quantity_nav_up: {
        title: 'Navigate up',
        description: 'Move to previous quantity input.',
    },
    quantity_nav_down: {
        title: 'Navigate down',
        description: 'Move to next quantity input.',
    },
};

const ShortcutKey = ({ label }: { label: string }) => (
    <kbd className="flex items-center justify-center rounded-md border border-border/30 bg-muted/50 px-2 py-1 text-xs font-semibold text-foreground/70 transition-all duration-150 hover:bg-muted/70 hover:scale-105 select-none">
        {label}
    </kbd>
);

export function CashierShortcutsDialog({ open, onOpenChange }: CashierShortcutsDialogProps) {
    const { t } = useTranslation();

    const shortcuts = useMemo<ShortcutItem[]>(
        () =>
            SHORTCUT_DEFINITIONS.map<ShortcutItem>(({ id, keys }) => ({
                id,
                keys,
                title: t(`point_of_sale.shortcuts.${id}.title`, FALLBACK_SHORTCUT_CONTENT[id].title),
                description: t(
                    `point_of_sale.shortcuts.${id}.description`,
                    FALLBACK_SHORTCUT_CONTENT[id].description,
                ),
            })),
        [t],
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl">
                <DialogHeader className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-3">
                            <Info className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-semibold text-foreground select-none">
                                {t(
                                    'point_of_sale.shortcuts.help.title',
                                    'Keyboard Shortcuts',
                                )}
                            </DialogTitle>
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
                    {shortcuts.map((shortcut) => (
                        <div
                            key={shortcut.id}
                            className="group flex items-center gap-3 rounded-xl border border-border/20 bg-gradient-to-r from-card/40 to-card/60 p-4 transition-all duration-200 hover:border-primary/30 hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/10 hover:shadow-sm select-none"
                        >
                            {/* Keys */}
                            <div className="flex gap-1.5">
                                {shortcut.keys.map((key) => (
                                    <ShortcutKey key={key} label={key} />
                                ))}
                            </div>
                            
                            {/* Title */}
                            <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors duration-200 select-none">
                                {shortcut.title}
                            </span>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
