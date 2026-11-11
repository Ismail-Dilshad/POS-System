import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/hooks/use-translation';
import { useCallback, useEffect, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { DollarSign } from 'lucide-react';

interface Expense {
    price?: number;
    description?: string;
}

interface ExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit?: (data: { price: string; description: string }) => void;
    editExpense?: Expense;
}

export function ExpenseModal({
    isOpen,
    onClose,
    onSubmit,
    editExpense,
}: ExpenseModalProps) {
    const { t } = useTranslation();
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');

    // Initialize form data when modal opens
    useEffect(() => {
        if (isOpen) {
            if (editExpense) {
                // Edit mode - populate form with existing expense data
                setPrice(editExpense.price?.toString() || '');
                setDescription(editExpense.description || '');
            } else {
                // Add mode - reset form
                setPrice('');
                setDescription('');
            }
        }
    }, [isOpen, editExpense]);

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Remove commas and other non-numeric characters except decimal point
        const value = e.target.value.replace(/[^0-9.]/g, '');
        setPrice(value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate required fields
        const cleanPrice = price.replace(/[^0-9.]/g, '');
        const trimmedDescription = description.trim();

        if (!cleanPrice || !trimmedDescription) {
            return;
        }

        if (parseFloat(cleanPrice) <= 0) {
            return;
        }

        if (onSubmit) {
            onSubmit({ price: cleanPrice, description: trimmedDescription });
        }

        // Reset form
        setPrice('');
        setDescription('');
        onClose();
    };

    const handleClose = useCallback(() => {
        // Reset form
        setPrice('');
        setDescription('');
        onClose();
    }, [onClose]);

    // Handle keyboard events
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            // Escape key - close modal
            if (e.key === 'Escape') {
                e.preventDefault();
                handleClose();
            }

            // Enter key - submit form (only if not in textarea and form is valid)
            if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
                e.preventDefault();
                // Check if form is valid before submitting
                const cleanPrice = price.replace(/[^0-9.]/g, '');
                const trimmedDescription = description.trim();

                if (
                    cleanPrice &&
                    trimmedDescription &&
                    parseFloat(cleanPrice) > 0
                ) {
                    if (onSubmit) {
                        onSubmit({
                            price: cleanPrice,
                            description: trimmedDescription,
                        });
                    }
                    // Reset form
                    setPrice('');
                    setDescription('');
                    onClose();
                }
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, price, description, onSubmit, onClose, handleClose]);

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent
                className="flex max-h-[95vh] flex-col overflow-y-auto sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[60vw] [&>button]:hidden"
                style={{
                    zIndex: 9999,
                    maxWidth: '60vw',
                    width: '800px',
                    height: 'auto',
                    minHeight: '600px',
                    maxHeight: '95vh',
                }}
            >
                <DialogHeader className="border-b border-purple-200 pb-4 dark:border-purple-800">
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold text-purple-800 dark:text-purple-200">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                            <DollarSign className="h-4 w-4 text-white" />
                        </div>
                        {editExpense ? t('expense_modal.edit_title') : t('expense_modal.add_title')}
                    </DialogTitle>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit}
                    className="flex flex-1 flex-col space-y-6 p-6"
                >
                    <div className="space-y-3">
                        <Label htmlFor="price" className="text-sm font-medium text-purple-700 dark:text-purple-300">
                            {t('expense_modal.price_label')} <span className="text-purple-500">*</span>
                        </Label>
                        <Input
                            id="price"
                            type="text"
                            placeholder={t('expense_modal.price_placeholder')}
                            value={price}
                            onChange={handlePriceChange}
                            className="h-12 w-full text-base border-purple-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:border-purple-800 dark:focus:border-purple-600 dark:focus:ring-purple-800"
                            required
                        />
                    </div>

                    <div className="flex flex-1 flex-col space-y-3">
                        <Label
                            htmlFor="description"
                            className="text-sm font-medium text-purple-700 dark:text-purple-300"
                        >
                            {t('expense_modal.description_label')} <span className="text-purple-500">*</span>
                        </Label>
                        <Textarea
                            id="description"
                            placeholder={t('expense_modal.description_placeholder')}
                            value={description}
                            onChange={(
                                e: React.ChangeEvent<HTMLTextAreaElement>,
                            ) => setDescription(e.target.value)}
                            rows={8}
                            className="max-h-[400px] min-h-[200px] w-full flex-1 resize-y text-base border-purple-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:border-purple-800 dark:focus:border-purple-600 dark:focus:ring-purple-800"
                            required
                        />
                    </div>

                    <DialogFooter className="mt-6 flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            className="border-purple-300 bg-white text-purple-700 hover:border-purple-400 hover:bg-purple-50 hover:text-purple-800 focus:ring-2 focus:ring-purple-200 dark:border-purple-600 dark:bg-purple-900/10 dark:text-purple-300 dark:hover:border-purple-500 dark:hover:bg-purple-900/20 dark:hover:text-purple-200 dark:focus:ring-purple-800"
                        >
                            {t('expense_modal.cancel')}
                        </Button>
                        <Button 
                            type="submit"
                            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg hover:from-purple-700 hover:to-purple-800 hover:shadow-xl focus:ring-2 focus:ring-purple-200 focus:ring-offset-2 dark:from-purple-500 dark:to-purple-600 dark:hover:from-purple-600 dark:hover:to-purple-700 dark:focus:ring-purple-800"
                        >
                            {editExpense ? t('expense_modal.update_button') : t('expense_modal.add_button')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
