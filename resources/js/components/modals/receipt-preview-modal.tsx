import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useTranslation } from '@/hooks/use-translation';
import { Printer, Receipt, X } from 'lucide-react';
import { useMemo, useCallback, useEffect, useRef } from 'react';

interface ReceiptPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    html: string | null;
    title?: string;
}

export function ReceiptPreviewModal({ isOpen, onClose, html, title }: ReceiptPreviewModalProps) {
    const { t } = useTranslation();
    const srcDoc = useMemo(() => html ?? '', [html]);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Handle modal close
    const handleClose = useCallback(() => {
        onClose();
        // Focus barcode search after modal closes
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const barcodeSearchInput = document.querySelector('[data-testid="barcode-search"]') as HTMLInputElement;
                if (barcodeSearchInput) {
                    barcodeSearchInput.focus();
                    barcodeSearchInput.select();
                }
            });
        });
    }, [onClose]);

    // Handle print receipt
    const handlePrint = useCallback(() => {
        if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.print();
            // Close modal after triggering print
            handleClose();
        }
    }, [handleClose]);

    // Handle Escape and Enter keys to close modal
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (isOpen && (event.key === 'Escape' || event.key === 'Enter')) {
                handleClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, handleClose]);

    // Focus close button when modal opens
    useEffect(() => {
        if (isOpen) {
            // Longer delay to ensure modal is fully rendered and button is available
            const timer = setTimeout(() => {
                // Try to focus the close button using querySelector as fallback
                const closeButton = document.querySelector('[data-receipt-close-button]') as HTMLButtonElement;
                if (closeButton) {
                    closeButton.focus();
                }
            }, 200);
            
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent
                className="max-h-[70vh] overflow-hidden sm:max-w-[420px] [&>button]:hidden p-0"
                style={{ position: 'fixed', zIndex: 99999, width: 420 }}
            >
                {/* Enhanced Header with Gradient */}
                <DialogHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-b border-blue-200/50 dark:border-blue-700/50 p-4 rounded-t-lg">
                    <DialogTitle className="flex items-center gap-3 text-blue-700 dark:text-blue-300">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Receipt className="h-4 w-4" />
                        </div>
                        <span className="font-semibold">
                            {title || t('receipt_preview.title', 'Receipt Preview')}
                        </span>
                    </DialogTitle>
                </DialogHeader>

                {/* Receipt Content with Better Styling */}
                <div className="p-4 bg-gray-50/50 dark:bg-gray-900/50">
                    <div className="relative">
                        {/* Receipt Paper Effect */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                            {/* Receipt Header Decoration */}
                            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-1"></div>
                            
                            {/* Receipt Content */}
                            <div className="p-4">
                                <iframe
                                    ref={iframeRef}
                                    title="receipt-preview"
                                    className="h-[45vh] w-full border-0 rounded"
                                    srcDoc={srcDoc}
                                    sandbox="allow-same-origin allow-scripts allow-modals allow-popups allow-forms"
                                />
                            </div>
                            
                            {/* Receipt Footer Decoration */}
                            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-1"></div>
                        </div>
                        
                        {/* Corner Decoration */}
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full opacity-60"></div>
                        <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-cyan-500 rounded-full opacity-60"></div>
                    </div>
                </div>

                {/* Enhanced Footer */}
                <DialogFooter className="bg-gray-50/80 dark:bg-gray-900/80 border-t border-gray-200/50 dark:border-gray-700/50 p-4 rounded-b-lg">
                    <div className="flex items-center justify-end w-full">
                        <div className="flex gap-2">
                            <Button 
                                variant="default"
                                size="sm"
                                onClick={handlePrint}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
                            >
                                <Printer className="h-3 w-3" />
                                {t('common.print')}
                            </Button>
                            <Button 
                                ref={closeButtonRef}
                                data-receipt-close-button
                                variant="outline" 
                                size="sm"
                                onClick={onClose}
                                className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                <X className="h-3 w-3" />
                                {t('common.close')}
                                <kbd className="ml-1 text-xs bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded">Enter</kbd>
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


