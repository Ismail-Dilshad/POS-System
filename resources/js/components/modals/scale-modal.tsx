import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/hooks/use-translation';
import { useFocusManagement } from '@/hooks/use-focus-management';
import {
    scaleProductService,
    type ScaleProduct,
} from '@/services/business/scaleProductService';
import React, { useState } from 'react';

interface ScaleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onProductSelect?: (product: ScaleProduct, weight: number) => void;
}

interface ParsedBarcodeData {
    scaleId: string;
    plu: string;
    weightInGrams: number;
    weightInKg: number;
    checkDigit: string;
    isValid: boolean;
    errorMessage?: string;
}

export const ScaleModal: React.FC<ScaleModalProps> = ({
    isOpen,
    onClose,
    onProductSelect,
}) => {
    const { t } = useTranslation();
    useFocusManagement(isOpen);
    const [barcode, setBarcode] = useState('');
    const [parsedData, setParsedData] = useState<ParsedBarcodeData | null>(
        null,
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Parse scale barcode format: SSPPPPWWWWWC (EAN-13)
    // SS = Scale ID (2 digits)
    // PPPPP = PLU (5 digits)
    // WWWWW = Weight in grams (5 digits)
    // C = EAN-13 checksum (1 digit)
    const parseScaleBarcode = (barcode: string): ParsedBarcodeData => {
        // Remove any spaces and ensure it's exactly 13 digits
        const cleanBarcode = barcode.replace(/\s/g, '');

        if (!/^\d{13}$/.test(cleanBarcode)) {
            return {
                scaleId: '',
                plu: '',
                weightInGrams: 0,
                weightInKg: 0,
                checkDigit: '',
                isValid: false,
                errorMessage: t(
                    'point_of_sale.scale_barcode_must_be_13_digits',
                ),
            };
        }

        const scaleId = cleanBarcode.substring(0, 2);
        const plu = cleanBarcode.substring(2, 7);
        const weightStr = cleanBarcode.substring(7, 12);
        const providedCheckDigit = cleanBarcode.substring(12, 13);

        // Validate scale ID (should not start with 0)
        if (scaleId.startsWith('0')) {
            return {
                scaleId,
                plu,
                weightInGrams: 0,
                weightInKg: 0,
                checkDigit: providedCheckDigit,
                isValid: false,
                errorMessage: t('point_of_sale.scale_id_cannot_start_with_0'),
            };
        }

        // We'll accept the provided checksum without strict validation
        // since different scale manufacturers may use different methods

        const weightInGrams = parseInt(weightStr, 10);
        const weightInKg = weightInGrams / 1000;

        // Validate weight is reasonable (0.001kg to 99.999kg)
        if (weightInKg <= 0 || weightInKg > 99.999) {
            return {
                scaleId,
                plu,
                weightInGrams,
                weightInKg,
                checkDigit: providedCheckDigit,
                isValid: false,
                errorMessage: t('point_of_sale.invalid_weight', {
                    weight: weightInKg,
                }),
            };
        }

        return {
            scaleId,
            plu,
            weightInGrams,
            weightInKg,
            checkDigit: providedCheckDigit,
            isValid: true,
        };
    };

    const handleBarcodeChange = async (value: string) => {
        setBarcode(value);
        setError(null);
        setParsedData(null);

        if (value.length === 13) {
            const parsed = parseScaleBarcode(value);
            setParsedData(parsed);

            if (parsed.isValid) {
                setLoading(true);
                try {
                    // Find scale product by scale_id and plu
                    const response =
                        await scaleProductService.findByScaleIdAndPlu(
                            parsed.scaleId,
                            parsed.plu,
                        );

                    if (response.success && response.data) {
                        // Product found, add to cart with the specified weight
                        if (onProductSelect) {
                            const scaleProduct = {
                                ...response.data,
                                type: 'scale_product',
                                barcode: value, // Use the full scale barcode
                            };
                            onProductSelect(scaleProduct, parsed.weightInKg);
                        }
                        onClose();
                        setBarcode('');
                        setParsedData(null);
                    } else {
                        setError(
                            t('point_of_sale.scale_product_not_found', {
                                scaleId: parsed.scaleId,
                                plu: parsed.plu,
                            }),
                        );
                    }
                } catch (err: unknown) {
                    setError(
                        (err as { message?: string }).message ||
                            t('point_of_sale.failed_to_find_scale_product'),
                    );
                } finally {
                    setLoading(false);
                }
            } else {
                setError(
                    parsed.errorMessage ||
                        t('point_of_sale.invalid_barcode_format'),
                );
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Manual submission if needed
        if (parsedData?.isValid && parsedData.weightInKg > 0) {
            handleBarcodeChange(barcode);
        }
    };

    const handleClose = () => {
        setBarcode('');
        setParsedData(null);
        setError(null);
        setLoading(false);
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
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-2xl w-full max-h-[90vh] overflow-y-auto border-cyan-200 shadow-[0_4px_8px_0_rgba(0,0,0,0.2),0_2px_4px_0_rgba(0,0,0,0.1)] dark:border-cyan-800 dark:shadow-[0_4px_8px_0_rgba(0,0,0,0.4),0_2px_4px_0_rgba(0,0,0,0.3)]">
                <DialogHeader className="border-b border-cyan-200 pb-4 dark:border-cyan-800">
                    <DialogTitle className="text-xl font-bold text-cyan-800 dark:text-cyan-200">
                        {t('point_of_sale.scale_scanner')}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 p-6">
                    <div className="space-y-3">
                        <Label htmlFor="barcode" className="text-base font-semibold text-cyan-700 dark:text-cyan-300">
                            {t('point_of_sale.scale_barcode')}
                        </Label>
                        <Input
                            id="barcode"
                            type="text"
                            value={barcode}
                            onChange={(e) =>
                                handleBarcodeChange(e.target.value)
                            }
                            placeholder={t(
                                'point_of_sale.scale_barcode_placeholder',
                            )}
                            autoFocus
                            maxLength={13}
                            className={`h-12 text-lg font-mono border-2 transition-all duration-200 !border-cyan-300 hover:!border-cyan-400 focus:!border-cyan-500 focus:!ring-cyan-500/20 focus:!outline-none !shadow-[0_0_0_1px_rgba(6,182,212,0.3)] hover:!shadow-[0_0_0_1px_rgba(6,182,212,0.5)] focus:!shadow-[0_0_0_1px_rgba(6,182,212,0.7)] dark:!shadow-[0_0_0_1px_rgba(6,182,212,0.4)] dark:hover:!shadow-[0_0_0_1px_rgba(6,182,212,0.6)] dark:focus:!shadow-[0_0_0_1px_rgba(6,182,212,0.8)] ${error ? '!border-red-500 !bg-red-50 dark:!bg-red-950/20' : parsedData?.isValid ? '!border-cyan-500 !bg-cyan-50 dark:!bg-cyan-950/20' : '!bg-white dark:!bg-gray-900'}`}
                        />
                    </div>

                    {/* Display parsed data */}
                    {parsedData && parsedData.isValid && (
                        <div className="rounded-lg border-2 border-cyan-300 bg-gradient-to-r from-cyan-50 to-cyan-100 p-6 shadow-lg dark:border-cyan-700 dark:from-cyan-950/30 dark:to-cyan-900/20">
                            <h4 className="mb-4 text-lg font-bold text-cyan-800 dark:text-cyan-200">
                                {t('point_of_sale.parsed_barcode_data')}
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <strong>
                                        {t('point_of_sale.scale_id')}
                                    </strong>{' '}
                                    {parsedData.scaleId}
                                </div>
                                <div>
                                    <strong>{t('point_of_sale.plu')}</strong>{' '}
                                    {parsedData.plu}
                                </div>
                                <div>
                                    <strong>{t('point_of_sale.weight')}</strong>{' '}
                                    {parsedData.weightInKg} kg (
                                    {parsedData.weightInGrams}g)
                                </div>
                                <div>
                                    <strong>
                                        {t('point_of_sale.checksum')}
                                    </strong>{' '}
                                    {parsedData.checkDigit}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Display error */}
                    {error && (
                        <div className="rounded-lg border-2 border-red-300 bg-gradient-to-r from-red-50 to-red-100 p-6 shadow-lg dark:border-red-700 dark:from-red-950/30 dark:to-red-900/20">
                            <p className="text-base font-medium text-red-800 dark:text-red-200">
                                {error}
                            </p>
                        </div>
                    )}

                    {/* Loading state */}
                    {loading && (
                        <div className="flex items-center justify-center py-8">
                            <div className="flex flex-col items-center space-y-4">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-200 border-t-cyan-500"></div>
                                <span className="text-base font-medium text-cyan-700 dark:text-cyan-300">
                                    {t('point_of_sale.looking_up_product')}
                                </span>
                            </div>
                        </div>
                    )}
                </form>
            </DialogContent>
        </Dialog>
    );
};
