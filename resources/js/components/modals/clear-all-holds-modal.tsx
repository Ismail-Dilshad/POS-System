import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useTranslation } from '@/hooks/use-translation';
import { useFocusManagement } from '@/hooks/use-focus-management';
import { holdCartService } from '@/services/utils/holdCartService';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface ClearAllHoldsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export function ClearAllHoldsModal({
    isOpen,
    onClose,
    onConfirm,
}: ClearAllHoldsModalProps) {
    const { t } = useTranslation();
    useFocusManagement(isOpen);
    const [heldCartsCount, setHeldCartsCount] = useState(0);

    useEffect(() => {
        if (isOpen) {
            const carts = holdCartService.getAllHeldCarts();
            setHeldCartsCount(carts.length);
        }
    }, [isOpen]);

    const handleConfirm = useCallback(() => {
        onConfirm();
        onClose();
    }, [onConfirm, onClose]);

    // Keyboard handler
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!isOpen) return;

        switch (e.key) {
            case 'Enter': {
                e.preventDefault();
                handleConfirm();
                break;
            }
            case 'Escape': {
                e.preventDefault();
                onClose();
                break;
            }
        }
    }, [isOpen, handleConfirm, onClose]);

    // Add keyboard event listener
    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, handleKeyDown]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <AlertTriangle className="h-5 w-5" />
                        {t('point_of_sale.clear_all_holds_modal.title')}
                    </DialogTitle>
                    <DialogDescription className="pt-2 text-base">
                        {t('point_of_sale.clear_all_holds_modal.description')}
                    </DialogDescription>
                </DialogHeader>

                <div className="my-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                        <div>
                            <p className="font-medium text-amber-800 dark:text-amber-200">
                                {t('point_of_sale.clear_all_holds_modal.warning_title')}
                            </p>
                            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                                {t('point_of_sale.clear_all_holds_modal.warning_message', { count: heldCartsCount })}
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex gap-3 sm:justify-end">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1 sm:flex-none border-gray-300 hover:border-gray-400 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-800"
                    >
                        <X className="mr-2 h-4 w-4" />
                        {t('point_of_sale.clear_all_holds_modal.cancel')}
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t('point_of_sale.clear_all_holds_modal.confirm')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
