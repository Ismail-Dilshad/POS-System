import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

export interface DeleteModalProps {
    isOpen: boolean;
    title: string;
    description: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
    onConfirm: () => Promise<void> | void;
    onClose: () => void;
    isLoading?: boolean;
    warning?: string;
    isDeleteDisabled?: boolean;
}

export function DeleteModal({
    isOpen,
    title,
    description,
    confirmButtonText,
    cancelButtonText,
    onConfirm,
    onClose,
    isLoading = false,
    warning,
    isDeleteDisabled = false,
}: DeleteModalProps) {
    const { t } = useTranslation();
    const [isDeleting, setIsDeleting] = useState(false);
    const resolvedConfirmText = confirmButtonText ?? t('common.delete');
    const resolvedCancelText = cancelButtonText ?? t('common.cancel');
    const deletingLabel = t('ui_components.delete_modal.deleting');
    const cannotDeleteLabel = t('ui_components.delete_modal.cannot_delete');

    // Reset deleting state when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setIsDeleting(false);
        }
    }, [isOpen]);

    const handleConfirm = useCallback(async () => {
        if (isDeleting || isLoading || isDeleteDisabled) return;

        setIsDeleting(true);
        try {
            await onConfirm();
        } catch (error) {
            console.error('Delete failed:', error);
        } finally {
            setIsDeleting(false);
        }
    }, [isDeleting, isLoading, isDeleteDisabled, onConfirm]);

    // Handle keyboard events
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Enter' && !isDeleting && !isLoading && !isDeleteDisabled) {
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
    }, [isOpen, isDeleting, isLoading, isDeleteDisabled, handleConfirm, onClose]);

    const handleClose = () => {
        if (isDeleting || isLoading) return;
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent
                className="w-[400px] max-w-[90vw] p-0 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border-0 dark:border dark:border-gray-800 overflow-hidden"
                style={{ zIndex: 10002 }}
                hideClose
            >
                <VisuallyHidden>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </VisuallyHidden>

                {/* Content */}
                <div className="p-6">
                    {/* Icon - positioned in top left with pulse animation */}
                    <div className="mb-4">
                        <div className="relative w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                            {/* Animated pulse rings */}
                            <div className="absolute inset-0 rounded-full bg-red-200 dark:bg-red-800/50 animate-ping"></div>
                            <div className="absolute inset-0 rounded-full bg-red-200 dark:bg-red-800/50 animate-ping animation-delay-300"></div>

                            {/* Main icon */}
                            <div className="relative z-10">
                                <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
                            </div>
                        </div>
                    </div>

                    {/* Title */}
                    <h2
                        className="text-lg font-semibold text-gray-900 dark:text-white mb-2"
                    >
                        {title}
                    </h2>

                    {/* Description */}
                    <p
                        className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4"
                    >
                        {description}
                    </p>

                    {/* Warning message if item is in use */}
                    {warning && (
                        <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border-0 amber-200 dark:border-amber-800/50 rounded-lg">
                            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">{cannotDeleteLabel}</p>
                                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">{warning}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer with full-width buttons */}
                <div className="px-6 pb-6">
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={handleClose}
                            disabled={isDeleting || isLoading}
                            className="flex-1 h-10 text-sm font-medium border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
                        >
                            {resolvedCancelText}
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={isDeleting || isLoading || isDeleteDisabled}
                            className={`flex-1 h-10 text-sm font-medium rounded-md ${
                                isDeleteDisabled
                                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600'
                                    : 'bg-red-600 hover:bg-red-700 text-white'
                            }`}
                        >
                            {isDeleting || isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    {deletingLabel}
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

