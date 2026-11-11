import { Badge } from '@/components/ui/badge';
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
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useTranslation } from '@/hooks/use-translation';
import { formatCurrency } from '@/lib/currency';
import {
    BARCODE_MODULE_SCALE,
    DEFAULT_LABEL_SIZE,
    DEFAULT_LABEL_KEY,
    LABEL_SIZES,
    MIN_BARCODE_HEIGHT,
    MIN_FONT_SIZE,
    MIN_MODULE_WIDTH,
    barcodeLabelService,
    type BarcodeFormat,
} from '@/services/utils/barcodeLabelService';
import { Eye, EyeOff, Loader2, Printer, Settings } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface Product {
    id: number;
    name: string;
    barcode: string;
    sell_price: number;
    barcode_type?: string | null;
}

interface PrintConfiguration {
    quantityPerProduct?: number;
    includeProductName: boolean;
    includePrice: boolean;
    labelSize?: string;
}

const PREVIEW_SCALE = 0.65;
const PREVIEW_BARCODE_SCALE = BARCODE_MODULE_SCALE;

/**
 * Detect barcode format for display purposes
 */
const detectBarcodeFormat = (barcode: string, explicitType?: string | null): BarcodeFormat => {
    return barcodeLabelService.detectBarcodeFormat(barcode, explicitType);
};

/**
 * Get human-readable format name
 */
const getFormatDisplayName = (format: BarcodeFormat): string => {
    const formatNames: Record<BarcodeFormat, string> = {
        'EAN13': 'EAN-13',
        'EAN8': 'EAN-8',
        'UPC': 'UPC-A',
        'CODE39': 'Code 39',
        'CODE128': 'Code 128',
    };
    return formatNames[format] || format;
};

const computePreviewMetrics = (barcode: string, barcodeType?: string | null) => {
    const format = detectBarcodeFormat(barcode, barcodeType);
    const length = barcode.length;
    const labelSize = DEFAULT_LABEL_SIZE;
    const isTinyLabel = labelSize.widthMm <= 30;
    const isSmallLabel = labelSize.widthMm <= 40 && !isTinyLabel;
    const isLargeLabel = labelSize.widthMm >= 50 || labelSize.heightMm >= 32;

    let baseWidth: number;
    switch (format) {
        case 'EAN13':
        case 'UPC':
            baseWidth = isTinyLabel ? 0.9 : isSmallLabel ? 1.1 : isLargeLabel ? 1.4 : 1.25;
            break;
        case 'EAN8':
            baseWidth = isTinyLabel ? 1.1 : isSmallLabel ? 1.35 : isLargeLabel ? 1.7 : 1.5;
            break;
        case 'CODE39':
            if (length <= 6) baseWidth = isTinyLabel ? 1.1 : isSmallLabel ? 1.4 : isLargeLabel ? 1.8 : 1.55;
            else if (length <= 10) baseWidth = isTinyLabel ? 0.8 : isSmallLabel ? 1.0 : isLargeLabel ? 1.3 : 1.15;
            else baseWidth = isTinyLabel ? 0.55 : isSmallLabel ? 0.7 : isLargeLabel ? 0.95 : 0.85;
            break;
        case 'CODE128':
        default:
            if (length <= 6) baseWidth = isTinyLabel ? 1.2 : isSmallLabel ? 1.5 : isLargeLabel ? 1.95 : 1.7;
            else if (length <= 10) baseWidth = isTinyLabel ? 0.9 : isSmallLabel ? 1.15 : isLargeLabel ? 1.5 : 1.35;
            else if (length <= 14) baseWidth = isTinyLabel ? 0.65 : isSmallLabel ? 0.85 : isLargeLabel ? 1.15 : 1.0;
            else baseWidth = isTinyLabel ? 0.5 : isSmallLabel ? 0.65 : isLargeLabel ? 0.9 : 0.8;
            break;
    }

    const usableHeightMm = Math.max(6, labelSize.heightMm - (isTinyLabel ? 6 : isSmallLabel ? 7 : 8));
    const mmToPx = usableHeightMm * 3.7795;
    const minHeight = isTinyLabel ? 18 : isSmallLabel ? 24 : 28;
    const maxHeight = isTinyLabel ? 32 : isSmallLabel ? 42 : (labelSize.heightMm >= 32 ? 58 : 50);
    const baseHeight = Math.max(minHeight, Math.min(maxHeight, Math.round(mmToPx)));

    const baseFontSize = isTinyLabel ? 8 : isSmallLabel ? 10 : 12;
    const baseTextMargin = isTinyLabel ? 0.5 : isSmallLabel ? 1 : 1.5;
    const baseMargin = isTinyLabel ? 1.5 : isSmallLabel ? 2.5 : 3;

    const scaledWidth = Math.max(MIN_MODULE_WIDTH, Number((baseWidth * PREVIEW_BARCODE_SCALE).toFixed(3)));
    const scaledHeight = Math.max(MIN_BARCODE_HEIGHT, Math.round(baseHeight * PREVIEW_BARCODE_SCALE));
    const scaledFontSize = Math.max(MIN_FONT_SIZE, Number((baseFontSize * PREVIEW_BARCODE_SCALE).toFixed(2)));

    return {
        format,
        width: scaledWidth,
        height: scaledHeight,
        fontSize: scaledFontSize,
        textMargin: baseTextMargin * PREVIEW_BARCODE_SCALE,
        margin: baseMargin * PREVIEW_BARCODE_SCALE,
    };
};

interface PrintConfigurationModalProps {
    isOpen: boolean;
    onClose: () => void;
    products: Product[];
    onConfirm: (config: PrintConfiguration) => void | Promise<void>;
    loading?: boolean;
    errorMessage?: string | null;
    onClearError?: () => void;
}

const DEFAULT_CONFIG: PrintConfiguration = {
    quantityPerProduct: 1,
    includeProductName: false,
    includePrice: false,
    labelSize: DEFAULT_LABEL_KEY,
};

const clampQuantity = (value: number): number => {
    if (!Number.isFinite(value)) {
        return 1;
    }
    return Math.min(100, Math.max(1, Math.round(value)));
};

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

const BarcodePreview = ({ product, t }: { product: Product; t: TranslateFn }) => {
    const [barcodeSvg, setBarcodeSvg] = useState<string>('');
    const [detectedFormat, setDetectedFormat] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isCancelled = false;

        const generateBarcode = async () => {
            try {
                setLoading(true);
                setError(null);

                // Detect the barcode format
                const metrics = computePreviewMetrics(product.barcode, product.barcode_type);
                const format = metrics.format;
                setDetectedFormat(getFormatDisplayName(format));

                // Generate real barcode using JsBarcode
                if (!isCancelled) {
                    try {
                        const JsBarcode = (await import('jsbarcode')).default;
                        const canvas = document.createElement('canvas');

                        const scale = window.devicePixelRatio || 1;
                        const baseCanvasWidth = 280;
                        const baseCanvasHeight = 100;
                        canvas.width = Math.round(baseCanvasWidth * scale);
                        canvas.height = Math.round(baseCanvasHeight * scale);

                        const context = canvas.getContext('2d');
                        if (context) {
                            context.scale(scale, scale);
                        }

                        JsBarcode(canvas, product.barcode, {
                            format,
                            width: metrics.width,
                            height: metrics.height,
                            displayValue: true,
                            fontSize: metrics.fontSize,
                            font: 'monospace',
                            textMargin: metrics.textMargin,
                            margin: metrics.margin,
                            background: '#ffffff',
                            lineColor: '#000000',
                        });

                        const dataURL = canvas.toDataURL('image/png', 1);
                        setBarcodeSvg(dataURL);
                    } catch (firstError) {
                        // Try CODE128 as fallback
                        try {
                            const JsBarcode = (await import('jsbarcode')).default;
                            const canvas = document.createElement('canvas');
                            const scale = window.devicePixelRatio || 1;
                            canvas.width = Math.round(280 * scale);
                            canvas.height = Math.round(100 * scale);
                            const context = canvas.getContext('2d');
                            if (context) context.scale(scale, scale);

                            JsBarcode(canvas, product.barcode, {
                                format: 'CODE128',
                                width: metrics.width,
                                height: metrics.height,
                                displayValue: true,
                                fontSize: metrics.fontSize,
                                font: 'monospace',
                                textMargin: metrics.textMargin,
                                margin: metrics.margin,
                                background: '#ffffff',
                                lineColor: '#000000',
                            });

                            setDetectedFormat('Code 128');
                            const dataURL = canvas.toDataURL('image/png', 1);
                            setBarcodeSvg(dataURL);
                        } catch {
                            console.warn('JsBarcode failed for all formats:', firstError);
                            const fallbackSvg = `<svg width="180" height="60" xmlns="http://www.w3.org/2000/svg">
                                <rect width="180" height="60" fill="white" stroke="black" stroke-width="1"/>
                                <text x="90" y="35" text-anchor="middle" font-family="monospace" font-size="11">${product.barcode}</text>
                            </svg>`;
                            setBarcodeSvg(fallbackSvg);
                        }
                    }
                }
            } catch {
                if (!isCancelled) {
                    setError(t('print_configuration_modal.error_messages.print_failed_desc'));
                }
            } finally {
                if (!isCancelled) {
                    setLoading(false);
                }
            }
        };

        generateBarcode();

        return () => {
            isCancelled = true;
        };
    }, [product.barcode, product.barcode_type, t]);

    // Smaller preview size for compact labels
    const labelWidthPx = DEFAULT_LABEL_SIZE.widthMm * 3.7795;
    const barcodeSize = labelWidthPx * PREVIEW_SCALE;

    if (loading) {
        return (
            <div className="flex h-14 items-center justify-center">
                <Loader2 className="h-3 w-3 animate-spin text-gray-500" />
                <span className="ml-2 text-xs text-gray-500">
                    {t('print_configuration_modal.loading')}
                </span>
            </div>
        );
    }

    if (error || !barcodeSvg) {
        return (
            <div className="flex h-14 items-center justify-center text-xs text-gray-500">
                {error || t('print_configuration_modal.no_products_selected')}
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-1">
            {detectedFormat && (
                <span className="text-[9px] font-medium text-blue-600 dark:text-blue-400">
                    {detectedFormat}
                </span>
            )}
            <div
                className="max-w-full"
                style={{
                    maxWidth: `${barcodeSize}px`,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '3px',
                    background: 'white',
                }}
            >
                <img
                    src={barcodeSvg}
                    alt={t('print_configuration_modal.barcode_alt', { barcode: product.barcode })}
                    style={{
                        maxWidth: '100%',
                        height: 'auto',
                        imageRendering: 'crisp-edges',
                    }}
                />
            </div>
        </div>
    );
};

export function PrintConfigurationModal({
    isOpen,
    onClose,
    products,
    onConfirm,
    loading = false,
    errorMessage = null,
    onClearError,
}: PrintConfigurationModalProps) {
    const { t } = useTranslation();
    const [config, setConfig] = useState<PrintConfiguration>(DEFAULT_CONFIG);
    const [previewMode, setPreviewMode] = useState(false);
    const [quantityInput, setQuantityInput] = useState<string>(String(DEFAULT_CONFIG.quantityPerProduct));
    const [localError, setLocalError] = useState<string | null>(null);

    const clearErrors = useCallback(() => {
        setLocalError(null);
        onClearError?.();
    }, [onClearError]);

    const handleOpenChange = useCallback((openState: boolean) => {
        if (!openState) {
            clearErrors();
            onClose();
        }
    }, [clearErrors, onClose]);

    const handleCancel = useCallback(() => {
        clearErrors();
        onClose();
    }, [clearErrors, onClose]);

    const isPrintDisabled = useMemo(() => {
        return loading || products.length === 0;
    }, [loading, products.length]);

    const activeError = localError || errorMessage || null;

    useEffect(() => {
        if (isOpen) {
            setConfig(DEFAULT_CONFIG);
            setQuantityInput(String(DEFAULT_CONFIG.quantityPerProduct));
            clearErrors();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const handleConfigChange = useCallback(
        (key: keyof PrintConfiguration, value: string | number | boolean) => {
            clearErrors();
            setConfig((prev) => ({ ...prev, [key]: value }));
        },
        [clearErrors],
    );

    const handleConfirm = useCallback(() => {
        clearErrors();

        if (products.length === 0) {
            setLocalError(t('print_configuration_modal.error_messages.no_products_selected'));
            return;
        }

        const quantity = clampQuantity(Number(quantityInput || config.quantityPerProduct || 1));
        setQuantityInput(String(quantity));
        const nextConfig: PrintConfiguration = {
            ...config,
            quantityPerProduct: quantity,
        };

        setConfig(nextConfig);
        void onConfirm(nextConfig);
    }, [clearErrors, config, onConfirm, products.length, quantityInput, t]);

    const handlePreview = useCallback(() => {
        setPreviewMode(!previewMode);
        clearErrors();
    }, [previewMode, clearErrors]);

    const currentQuantity = clampQuantity(Number(config.quantityPerProduct || 1));
    const totalBarcodes = products.length * currentQuantity;
    const estimatedPages = Math.max(1, Math.ceil(totalBarcodes));

    const handleQuantityChange = useCallback((value: string) => {
        if (!/^\d*$/.test(value)) {
            return;
        }
        setQuantityInput(value);
        clearErrors();

        if (value === '') {
            return;
        }

        const nextQuantity = clampQuantity(Number(value));
        handleConfigChange('quantityPerProduct', nextQuantity);
    }, [clearErrors, handleConfigChange]);

    const handleQuantityBlur = useCallback(() => {
        const nextQuantity = clampQuantity(Number(quantityInput || config.quantityPerProduct || 1));
        setQuantityInput(String(nextQuantity));
        handleConfigChange('quantityPerProduct', nextQuantity);
    }, [config.quantityPerProduct, handleConfigChange, quantityInput]);

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent
                className="max-h-[90vh] overflow-y-auto [&>button]:hidden"
                style={{
                    zIndex: 9999,
                    maxWidth: '75vw',
                    width: '800px',
                }}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        {t('print_configuration_modal.title')}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-foreground">
                            {t('print_configuration_modal.print_settings')}
                        </h3>

                        <div className="space-y-3">
                            <div className="space-y-2">
                                <Label className="text-sm">
                                    {t('print_configuration_modal.label_size')}
                                </Label>
                                <Select
                                    value={config.labelSize || DEFAULT_LABEL_KEY}
                                    onValueChange={(value) => handleConfigChange('labelSize', value)}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder={t('print_configuration_modal.select_label_size')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(LABEL_SIZES).map(([key, size]) => (
                                            <SelectItem key={key} value={key}>
                                                {size.widthMm} × {size.heightMm} mm
                                                {key === '30x20' && ' (Small)'}
                                                {key === '38x25' && ' (Medium-small)'}
                                                {key === '40x25' && ' (Medium)'}
                                                {key === '50x30' && ' (Default)'}
                                                {key === '54x32' && ' (Large)'}
                                                {key === '60x36' && ' (Extra large)'}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm">
                                    {t('print_configuration_modal.quantity_per_product')}
                                </Label>
                                <Input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={quantityInput}
                                    onChange={(event) => handleQuantityChange(event.target.value)}
                                    onBlur={handleQuantityBlur}
                                    className="w-full"
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center space-x-3">
                                    <Switch
                                        id="includeProductName"
                                        checked={config.includeProductName}
                                        onCheckedChange={(checked) =>
                                            handleConfigChange(
                                                'includeProductName',
                                                checked,
                                            )
                                        }
                                    />
                                    <Label
                                        htmlFor="includeProductName"
                                        className="text-sm"
                                    >
                                        {t('print_configuration_modal.include_product_name')}
                                    </Label>
                                </div>

                                <div className="flex items-center space-x-3">
                                    <Switch
                                        id="includePrice"
                                        checked={config.includePrice}
                                        onCheckedChange={(checked) =>
                                            handleConfigChange(
                                                'includePrice',
                                                checked,
                                            )
                                        }
                                    />
                                    <Label
                                        htmlFor="includePrice"
                                        className="text-sm"
                                    >
                                        {t('print_configuration_modal.include_price')}
                                    </Label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Print Summary */}
                    <div className="rounded-lg bg-muted/50 p-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-sm font-medium text-foreground">
                                    {t('print_configuration_modal.print_summary')}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    {t('print_configuration_modal.products_selected', { count: products.length })} ×{' '}
                                    {currentQuantity} {t('print_configuration_modal.copies')} ={' '}
                                    {totalBarcodes}{' '}
                                    {t('print_configuration_modal.total_barcodes')}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {t('print_configuration_modal.estimated_pages', { pages: estimatedPages })}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handlePreview}
                                    className="h-8 px-3"
                                >
                                    {previewMode ? (
                                        <>
                                            <EyeOff className="mr-2 h-4 w-4" />
                                            {t('print_configuration_modal.hide_preview')}
                                        </>
                                    ) : (
                                        <>
                                            <Eye className="mr-2 h-4 w-4" />
                                            {t('print_configuration_modal.preview')}
                                        </>
                                    )}
                                </Button>
                                <Badge
                                    variant="secondary"
                                    className="bg-primary/10 text-primary"
                                >
                                    {t('print_configuration_modal.products_selected', { count: products.length })}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {activeError && (
                        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
                            {activeError}
                        </div>
                    )}

                    {/* Preview Section */}
                    {previewMode && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-foreground">
                                {t('print_configuration_modal.print_preview')}
                            </h3>
                            <div className="rounded-lg border bg-muted/30 p-4">
                                <div className="grid max-h-96 grid-cols-1 gap-3 overflow-y-auto md:grid-cols-2">
                                    {products.map((product) => (
                                        <div
                                            key={product.id}
                                            className="rounded-md bg-white p-2 shadow-sm"
                                        >
                                            <div className="space-y-2 text-center">
                                                {/* Barcode Preview */}
                                                <div className="mb-2 flex justify-center">
                                                    <BarcodePreview
                                                        product={product}
                                                        t={t}
                                                    />
                                                </div>

                                                {/* Product Info */}
                                                {config.includeProductName && (
                                                    <div className="truncate text-sm font-medium text-gray-900" style={{ fontFamily: "'KurdishFont', 'Rabar', 'Noto Sans Arabic', 'Segoe UI', 'Arial Unicode MS', 'Arial', sans-serif" }}>
                                                        {product.name}
                                                    </div>
                                                )}

                                                {config.includePrice && (
                                                    <div className="text-xs text-gray-600" style={{ fontFamily: "'KurdishFont', 'Rabar', 'Noto Sans Arabic', 'Segoe UI', 'Arial Unicode MS', 'Arial', sans-serif" }}>
                                                        {formatCurrency(
                                                            product.sell_price,
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleCancel}>
                        {t('print_configuration_modal.cancel')}
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isPrintDisabled}
                        className="bg-primary hover:bg-primary/90"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t('print_configuration_modal.printing')}
                            </>
                        ) : (
                            <>
                                <Printer className="mr-2 h-4 w-4" />
                                {t('print_configuration_modal.print_now')}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
