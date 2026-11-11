import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

export interface DeleteAllConfirmationModalProps {
    isOpen: boolean;
    title: string;
    description: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
    onConfirm: (password: string) => Promise<void>;
    onClose: () => void;
    isLoading?: boolean;
}

export function DeleteAllConfirmationModal({
    isOpen,
    title,
    description,
    confirmButtonText,
    cancelButtonText,
    onConfirm,
    onClose,
    isLoading = false,
}: DeleteAllConfirmationModalProps) {
    const { t } = useTranslation();
    const [password, setPassword] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    // Reset password when modal closes
    useEffect(() => {
        if (!isOpen) {
            setPassword('');
            setIsDeleting(false);
        }
    }, [isOpen]);

    const handleConfirm = useCallback(async () => {
        if (isDeleting || isLoading || !password.trim()) return;

        setIsDeleting(true);
        try {
            await onConfirm(password);
            setPassword('');
        } catch (error) {
            console.error('Delete failed:', error);
        } finally {
            setIsDeleting(false);
        }
    }, [isDeleting, isLoading, password, onConfirm]);

    // Handle keyboard events
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Enter' && !isDeleting && !isLoading && password.trim()) {
                event.preventDefault();
                handleConfirm();
            }
            if (event.key === 'Escape' && !isDeleting && !isLoading) {
                event.preventDefault();
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isDeleting, isLoading, password, handleConfirm, onClose]);

    const handleClose = () => {
        if (isDeleting || isLoading) return;
        onClose();
    };

    const resolvedConfirmText = confirmButtonText ?? t('common.delete');
    const resolvedCancelText = cancelButtonText ?? t('common.cancel');

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent
                className="w-[420px] max-w-[90vw] p-0 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border-0 dark:border dark:border-gray-800 overflow-hidden"
                style={{ zIndex: 10002 }}
            >
                <DialogHeader className="p-6 pb-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="relative w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                            {title}
                        </DialogTitle>
                    </div>
                </DialogHeader>

                <div className="px-6 pb-6 space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                        {description}
                    </p>

                    <div className="space-y-2">
                        <Label htmlFor="delete-password" className="text-sm font-medium">
                            {t('settings.password_required')}
                        </Label>
                        <Input
                            id="delete-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={t('settings.password_placeholder')}
                            className="w-full"
                            disabled={isDeleting || isLoading}
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-2 pt-2">
                        <Button
                            variant="outline"
                            onClick={handleClose}
                            disabled={isDeleting || isLoading}
                            className="flex-1"
                        >
                            {resolvedCancelText}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirm}
                            disabled={isDeleting || isLoading || !password.trim()}
                            className="flex-1 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                        >
                            {isDeleting || isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t('common.deleting') || 'Deleting...'}
                                </>
                            ) : (
                                resolvedConfirmText
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

