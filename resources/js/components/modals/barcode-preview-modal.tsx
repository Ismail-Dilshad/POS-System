import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/hooks/use-translation';
import { AlertCircle, Copy, Eye, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface BarcodePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    barcode: string;
    barcodeType: string;
}

export function BarcodePreviewModal({
    isOpen,
    onClose,
    barcode,
    barcodeType,
}: BarcodePreviewModalProps) {
    const { t } = useTranslation();
    const [barcodeSvg, setBarcodeSvg] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateBarcode = useCallback(async () => {
        let isCancelled = false;

        try {
            setLoading(true);
            setError(null);

            if (!isCancelled) {
                try {
                    // Dynamic import of JsBarcode (same as print config)
                    const JsBarcode = (await import('jsbarcode')).default;
                    const canvas = document.createElement('canvas');
                    
                    JsBarcode(canvas, barcode, {
                        format: barcodeType.toUpperCase(),
                        width: 2.5,
                        height: 100,
                        displayValue: true,
                        fontSize: 14,
                        textMargin: 10,
                        margin: 10,
                        background: "#ffffff",
                        lineColor: "#000000"
                    });
                    
                    const dataURL = canvas.toDataURL();
                    if (!isCancelled) {
                        setBarcodeSvg(dataURL);
                    }
                } catch (barcodeError) {
                    console.warn('JsBarcode failed, using fallback:', barcodeError);
                    // Fallback to simple text representation
                    const fallbackSvg = `<svg width="400" height="120" xmlns="https://www.w3.org/2000/svg">
                        <rect width="400" height="120" fill="white" stroke="black" stroke-width="2"/>
                        <text x="200" y="60" text-anchor="middle" font-family="monospace" font-size="16">${barcode}</text>
                    </svg>`;
                    if (!isCancelled) {
                        setBarcodeSvg(fallbackSvg);
                    }
                }
            }
        } catch (err) {
            if (!isCancelled) {
                console.error('Barcode generation error:', err);
                setError(t('barcode_preview.errors.generate_failed'));
            }
        } finally {
            if (!isCancelled) {
                setLoading(false);
            }
        }

        return () => {
            isCancelled = true;
        };
    }, [barcode, barcodeType, t]);

    // Generate barcode when modal opens or barcode changes
    useEffect(() => {
        if (isOpen && barcode) {
            generateBarcode();
        }
    }, [isOpen, barcode, barcodeType, generateBarcode]);

    const copyBarcode = () => {
        navigator.clipboard.writeText(barcode);
    // You could add a toast notification here
    };

    const barcodeTypeInfo = {
        name: barcodeType.toUpperCase(),
        description: `${barcodeType} barcode format`,
        example: barcode,
        length: barcode.length,
        pattern: new RegExp(`.{${barcode.length}}`),
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="max-h-[80vh] overflow-y-auto [&>button]:hidden"
                style={{
                    zIndex: 10000,
                    maxWidth: '50vw',
                    width: '600px',
                }}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        {t('barcode_preview.title')}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Barcode Information */}
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="space-y-1">
                            <Label className="text-xs font-medium">
                                {t('barcode_preview.labels.type')}
                            </Label>
                            <div className="rounded-md border border-input bg-muted p-2">
                                <div className="text-sm font-medium">
                                    {barcodeTypeInfo.name}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-medium">
                                {t('barcode_preview.labels.value')}
                            </Label>
                            <div className="flex items-center gap-2 rounded-md border border-input bg-muted p-2">
                                <div className="flex-1 font-mono text-sm">
                                    {barcode}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                    onClick={copyBarcode}
                                >
                                    <Copy className="mr-1 h-3 w-3" />
                                    {t('barcode_preview.buttons.copy')}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Barcode Visualization */}
                    <div className="space-y-1">
                        <Label className="text-xs font-medium">
                            {t('barcode_preview.labels.preview')}
                        </Label>
                        <div className="rounded-md border border-input bg-white p-4">
                            {loading ? (
                                <div className="flex h-24 items-center justify-center">
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    <span className="ml-2 text-xs text-muted-foreground">
                                        {t('barcode_preview.status.generating')}
                                    </span>
                                </div>
                            ) : error ? (
                                <div className="flex h-24 items-center justify-center text-destructive">
                                    <AlertCircle className="mr-2 h-4 w-4" />
                                    <span className="text-xs">{error}</span>
                                </div>
                            ) : barcodeSvg ? (
                                <div className="flex justify-center">
                                    <img 
                                        src={barcodeSvg} 
                                        alt={`Barcode: ${barcode}`} 
                                        className="max-w-full border border-gray-200"
                                        style={{ maxWidth: '100%', height: 'auto' }}
                                    />
                                </div>
                            ) : (
                                <div className="flex h-24 items-center justify-center text-xs text-muted-foreground">
                                    {t('barcode_preview.messages.empty')}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        {t('common.close')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
