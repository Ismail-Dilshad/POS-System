import JsBarcode from 'jsbarcode';
import { formatCurrency } from '@/lib/currency';

export interface BarcodeProduct {
    id: number;
    name: string;
    barcode: string;
    sell_price: number;
    barcode_type?: string | null;
}

export interface PrintOptions {
    quantity?: number;
    includeProductName?: boolean;
    includePrice?: boolean;
    labelSize?: string;
}

export interface LabelSize {
    widthMm: number;
    heightMm: number;
}

interface PrintConfiguration {
    labelSize: LabelSize;
    quantity: number;
    includeProductName: boolean;
    includePrice: boolean;
}

// Standard barcode formats supported
export type BarcodeFormat = 'EAN13' | 'EAN8' | 'UPC' | 'CODE39' | 'CODE128';

// Label sizes - range from compact to large for good print quality
export const LABEL_SIZES: Record<string, LabelSize> = {
    '30x20': { widthMm: 30, heightMm: 20 },  // Small - compact thermal labels
    '38x25': { widthMm: 38, heightMm: 25 },  // Medium-small
    '40x25': { widthMm: 40, heightMm: 25 },  // Medium
    '50x30': { widthMm: 50, heightMm: 30 },  // Standard (good balance)
    '54x32': { widthMm: 54, heightMm: 32 },  // Large
    '60x36': { widthMm: 60, heightMm: 36 },  // Extra large
};

export const DEFAULT_LABEL_KEY = '50x30';
export const DEFAULT_LABEL_SIZE = LABEL_SIZES[DEFAULT_LABEL_KEY];

// Scale for clear, readable barcodes (higher = bigger bars and text)
export const BARCODE_MODULE_SCALE = 0.95;
export const MIN_MODULE_WIDTH = 0.5;
export const MIN_BARCODE_HEIGHT = 28;
export const MIN_FONT_SIZE = 10;

class BarcodeLabelService {
    private isPrinting = false;
    private iframe: HTMLIFrameElement | null = null;
    private cleanupTimer: number | null = null;

    async print(products: BarcodeProduct[], options: PrintOptions): Promise<void> {
        if (this.isPrinting) {
            throw new Error('A print job is already in progress.');
        }

        if (typeof window === 'undefined') {
            throw new Error('Printing is only available in the browser environment.');
        }

        if (!products || products.length === 0) {
            throw new Error('Select at least one product to print.');
        }

        const configuration: PrintConfiguration = {
            labelSize: this.resolveLabelSize(options.labelSize),
            quantity: this.clampQuantity(options.quantity ?? 1),
            includeProductName: Boolean(options.includeProductName),
            includePrice: Boolean(options.includePrice),
        };

        this.isPrinting = true;

        try {
            this.cleanup();

            const html = this.buildPrintDocument(products, configuration);
            const iframe = this.ensureIframe();
            const doc = iframe.contentDocument;

            if (!doc) {
                throw new Error('Unable to access the print frame.');
            }

            doc.open();
            doc.write(html);
            doc.close();

            await this.waitForIframeReady(iframe);
            this.schedulePrint(iframe);
        } catch (error) {
            this.cleanup();
            throw error;
        } finally {
            this.isPrinting = false;
        }
    }

    /**
     * Detect the appropriate barcode format based on the barcode value
     * Supports: EAN-13, EAN-8, UPC-A, CODE39, CODE128
     */
    detectBarcodeFormat(barcode: string, explicitType?: string | null): BarcodeFormat {
        // If explicit type is provided, validate and use it
        if (explicitType) {
            const normalizedType = explicitType.toUpperCase().replace(/[^A-Z0-9]/g, '');
            if (['EAN13', 'EAN8', 'UPC', 'UPCA', 'CODE39', 'CODE128'].includes(normalizedType)) {
                if (normalizedType === 'UPCA') return 'UPC';
                return normalizedType as BarcodeFormat;
            }
        }

        const cleanBarcode = barcode.trim();
        const isNumericOnly = /^\d+$/.test(cleanBarcode);

        // EAN-13: 13 numeric digits (most common international barcode)
        if (isNumericOnly && cleanBarcode.length === 13) {
            return 'EAN13';
        }

        // EAN-8: 8 numeric digits (compact version of EAN-13)
        if (isNumericOnly && cleanBarcode.length === 8) {
            return 'EAN8';
        }

        // UPC-A: 12 numeric digits (US/Canada standard)
        if (isNumericOnly && cleanBarcode.length === 12) {
            return 'UPC';
        }

        // CODE39: Alphanumeric (A-Z, 0-9, space, and special chars: - . $ / + %)
        // Used in automotive, defense, and healthcare industries
        if (/^[A-Z0-9\s\-.$/+%]+$/i.test(cleanBarcode) && cleanBarcode.length <= 20) {
            return 'CODE39';
        }

        // Default to CODE128: Supports all ASCII characters, most versatile
        return 'CODE128';
    }

    /**
     * Validate if the barcode value is valid for the detected format
     */
    private validateBarcode(barcode: string, format: BarcodeFormat): boolean {
        const cleanBarcode = barcode.trim();

        switch (format) {
            case 'EAN13':
                return /^\d{13}$/.test(cleanBarcode);
            case 'EAN8':
                return /^\d{8}$/.test(cleanBarcode);
            case 'UPC':
                return /^\d{12}$/.test(cleanBarcode);
            case 'CODE39':
                return /^[A-Z0-9\s\-.$/+%]+$/i.test(cleanBarcode);
            case 'CODE128':
                return cleanBarcode.length > 0;
            default:
                return false;
        }
    }

    private clampQuantity(value: number): number {
        if (!Number.isFinite(value)) {
            return 1;
        }
        return Math.min(100, Math.max(1, Math.round(value)));
    }

    private resolveLabelSize(labelKey?: string): LabelSize {
        if (labelKey && LABEL_SIZES[labelKey]) {
            return LABEL_SIZES[labelKey];
        }
        return LABEL_SIZES[DEFAULT_LABEL_KEY];
    }

    private buildPrintDocument(products: BarcodeProduct[], config: PrintConfiguration): string {
        const labels = products.flatMap((product) =>
            Array.from({ length: config.quantity }, () => this.renderLabel(product, config)),
        );

        const { widthMm, heightMm } = config.labelSize;
        const isTinyLabel = widthMm <= 30;
        const isSmallLabel = widthMm <= 40 && !isTinyLabel;

        return `<!DOCTYPE html>
<html lang="ku" dir="rtl">
<head>
    <meta charset="utf-8" />
    <title>Barcode Labels</title>
    <link rel="preload" href="/fonts/Rabar_021.woff2" as="font" type="font/woff2" crossorigin>
    <style>
        @font-face {
            font-family: 'Rabar';
            src: url('/fonts/Rabar_021.eot');
            src: url('/fonts/Rabar_021.eot?#iefix') format('embedded-opentype'),
                 url('/fonts/Rabar_021.woff2') format('woff2'),
                 url('/fonts/Rabar_021.woff') format('woff'),
                 url('/fonts/Rabar_021.ttf') format('truetype');
            font-display: swap;
            font-weight: normal;
            font-style: normal;
        }
        
        @font-face {
            font-family: 'KurdishFont';
            src: url('/fonts/Rabar_021.eot');
            src: url('/fonts/Rabar_021.eot?#iefix') format('embedded-opentype'),
                 url('/fonts/Rabar_021.woff2') format('woff2'),
                 url('/fonts/Rabar_021.woff') format('woff'),
                 url('/fonts/Rabar_021.ttf') format('truetype');
            font-display: swap;
            font-weight: normal;
            font-style: normal;
        }
        
        @page {
            size: ${widthMm}mm ${heightMm}mm;
            margin: 0;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            margin: 0;
            padding: 0;
            width: ${widthMm}mm;
            min-height: ${heightMm}mm;
            font-family: 'KurdishFont', 'Rabar', 'Noto Sans Arabic', 'Segoe UI', 'Arial Unicode MS', 'Arial', sans-serif;
            background: #ffffff;
            direction: rtl;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .label {
            width: ${widthMm}mm;
            height: ${heightMm}mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: ${isTinyLabel ? '0.3mm 0.5mm' : isSmallLabel ? '0.4mm 0.6mm' : '0.5mm 0.8mm'};
            box-sizing: border-box;
            page-break-after: always;
            overflow: hidden;
            gap: ${isTinyLabel ? '0.2mm' : isSmallLabel ? '0.25mm' : '0.35mm'};
        }

        .label:last-of-type {
            page-break-after: auto;
        }

        .label-name {
            font-size: ${isTinyLabel ? '6px' : isSmallLabel ? '7px' : '8px'};
            font-weight: 600;
            text-align: center;
            line-height: 1.1;
            max-height: ${isTinyLabel ? '2.5mm' : isSmallLabel ? '3mm' : '3.5mm'};
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            width: 100%;
            font-family: 'KurdishFont', 'Rabar', 'Noto Sans Arabic', 'Segoe UI', 'Arial Unicode MS', 'Arial', sans-serif;
        }

        .label-price {
            font-size: ${isTinyLabel ? '5.5px' : isSmallLabel ? '6.5px' : '7.5px'};
            font-weight: 500;
            font-family: 'KurdishFont', 'Rabar', 'Noto Sans Arabic', 'Segoe UI', 'Arial Unicode MS', 'Arial', sans-serif;
        }

        .label-barcode {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: ${isTinyLabel ? '0.1mm 0.3mm' : isSmallLabel ? '0.15mm 0.4mm' : '0.2mm 0.5mm'};
            flex: 1;
            min-height: 0;
        }

        .label-barcode svg {
            width: 100%;
            max-width: 100%;
            height: auto;
            flex-shrink: 0;
            shape-rendering: crispEdges;
            text-rendering: optimizeLegibility;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .label-fallback {
            font-size: ${isTinyLabel ? '6px' : isSmallLabel ? '7px' : '8px'};
            font-family: 'Courier New', monospace;
            font-weight: 600;
            width: 100%;
            text-align: center;
        }
    </style>
</head>
<body>
    ${labels.join('')}
</body>
</html>`;
    }

    private ensureIframe(): HTMLIFrameElement {
        if (!this.iframe) {
            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed';
            iframe.style.left = '-9999px';
            iframe.style.top = '-9999px';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = '0';
            iframe.style.visibility = 'hidden';
            iframe.setAttribute('aria-hidden', 'true');
            iframe.setAttribute('tabindex', '-1');
            document.body.appendChild(iframe);
            this.iframe = iframe;
        }

        return this.iframe;
    }

    private waitForIframeReady(iframe: HTMLIFrameElement): Promise<void> {
        return new Promise((resolve) => {
            const checkReady = () => {
                if (iframe.contentDocument?.readyState === 'complete') {
                    resolve();
                } else {
                    requestAnimationFrame(checkReady);
                }
            };

            requestAnimationFrame(checkReady);
        });
    }

    private schedulePrint(iframe: HTMLIFrameElement): void {
        const frameWindow = iframe.contentWindow;
        if (!frameWindow) {
            throw new Error('Unable to access the print frame window.');
        }

        if (this.cleanupTimer !== null) {
            window.clearTimeout(this.cleanupTimer);
            this.cleanupTimer = null;
        }

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                frameWindow.focus();
                frameWindow.print();

                this.cleanupTimer = window.setTimeout(() => {
                    this.cleanup();
                }, 600);
            });
        });
    }

    private cleanup(): void {
        if (this.cleanupTimer !== null) {
            window.clearTimeout(this.cleanupTimer);
            this.cleanupTimer = null;
        }

        if (this.iframe) {
            try {
                if (this.iframe.parentNode) {
                    this.iframe.parentNode.removeChild(this.iframe);
                } else {
                    this.iframe.remove();
                }
            } catch {
                // Ignore cleanup errors
            }
            this.iframe = null;
        }
    }

    private renderLabel(product: BarcodeProduct, config: PrintConfiguration): string {
        const barcodeMarkup = this.generateBarcodeMarkup(
            product.barcode,
            product.barcode_type,
            config.labelSize,
        );

        const nameMarkup = config.includeProductName
            ? `<div class="label-name">${this.escapeHtml(product.name)}</div>`
            : '';

        const priceMarkup = config.includePrice
            ? `<div class="label-price">${this.escapeHtml(formatCurrency(product.sell_price))}</div>`
            : '';

        return `
        <div class="label">
            ${nameMarkup}
            <div class="label-barcode">${barcodeMarkup}</div>
            ${priceMarkup}
        </div>`;
    }

    private generateBarcodeMarkup(
        barcode: string,
        barcodeType: string | null | undefined,
        labelSize: LabelSize,
    ): string {
        // Detect the appropriate format based on barcode value
        let format = this.detectBarcodeFormat(barcode, barcodeType);
        
        // Validate the barcode for the detected format
        if (!this.validateBarcode(barcode, format)) {
            // Fallback to CODE128 if validation fails (most permissive format)
            format = 'CODE128';
        }

        const metrics = this.computeBarcodeMetrics(barcode, labelSize, format);
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

        try {
            JsBarcode(svg, barcode, {
                format,
                width: metrics.width,
                height: metrics.height,
                margin: metrics.margin,
                displayValue: true,
                fontSize: metrics.fontSize,
                font: 'monospace',
                textMargin: metrics.textMargin,
                lineColor: '#000000',
                background: '#ffffff',
            });
            svg.setAttribute('shape-rendering', 'crispEdges');
            svg.setAttribute('text-rendering', 'optimizeLegibility');
            return svg.outerHTML;
        } catch (firstError) {
            // If the detected format fails, try CODE128 as fallback
            if (format !== 'CODE128') {
                try {
                    const fallbackMetrics = this.computeBarcodeMetrics(barcode, labelSize, 'CODE128');
                    JsBarcode(svg, barcode, {
                        format: 'CODE128',
                        width: fallbackMetrics.width,
                        height: fallbackMetrics.height,
                        margin: fallbackMetrics.margin,
                        displayValue: true,
                        fontSize: fallbackMetrics.fontSize,
                        font: 'monospace',
                        textMargin: fallbackMetrics.textMargin,
                        lineColor: '#000000',
                        background: '#ffffff',
                    });
                    svg.setAttribute('shape-rendering', 'crispEdges');
                    svg.setAttribute('text-rendering', 'optimizeLegibility');
                    return svg.outerHTML;
                } catch (fallbackError) {
                    console.warn('Barcode rendering failed for both formats:', { format, barcode, firstError, fallbackError });
                }
            }
            
            // Return text fallback if all rendering attempts fail
            return `<div class="label-fallback">${this.escapeHtml(barcode)}</div>`;
        }
    }

    private computeBarcodeMetrics(
        barcode: string,
        labelSize: LabelSize,
        format: BarcodeFormat,
    ): { width: number; height: number; fontSize: number; textMargin: number; margin: number } {
        const length = barcode.length;
        const isTinyLabel = labelSize.widthMm <= 30;
        const isSmallLabel = labelSize.widthMm <= 40 && !isTinyLabel;
        const isLargeLabel = labelSize.widthMm >= 50 || labelSize.heightMm >= 32;

        // Base width: larger values fill more of the label for better scan/read
        let baseWidth: number;

        switch (format) {
            case 'EAN13':
                baseWidth = isTinyLabel ? 0.9 : isSmallLabel ? 1.1 : isLargeLabel ? 1.4 : 1.25;
                break;
            case 'EAN8':
                baseWidth = isTinyLabel ? 1.1 : isSmallLabel ? 1.35 : isLargeLabel ? 1.7 : 1.5;
                break;
            case 'UPC':
                baseWidth = isTinyLabel ? 0.9 : isSmallLabel ? 1.1 : isLargeLabel ? 1.4 : 1.25;
                break;
            case 'CODE39':
                if (length <= 6) {
                    baseWidth = isTinyLabel ? 1.1 : isSmallLabel ? 1.4 : isLargeLabel ? 1.8 : 1.55;
                } else if (length <= 10) {
                    baseWidth = isTinyLabel ? 0.8 : isSmallLabel ? 1.0 : isLargeLabel ? 1.3 : 1.15;
                } else {
                    baseWidth = isTinyLabel ? 0.55 : isSmallLabel ? 0.7 : isLargeLabel ? 0.95 : 0.85;
                }
                break;
            case 'CODE128':
            default:
                if (length <= 6) {
                    baseWidth = isTinyLabel ? 1.2 : isSmallLabel ? 1.5 : isLargeLabel ? 1.95 : 1.7;
                } else if (length <= 10) {
                    baseWidth = isTinyLabel ? 0.9 : isSmallLabel ? 1.15 : isLargeLabel ? 1.5 : 1.35;
                } else if (length <= 14) {
                    baseWidth = isTinyLabel ? 0.65 : isSmallLabel ? 0.85 : isLargeLabel ? 1.15 : 1.0;
                } else {
                    baseWidth = isTinyLabel ? 0.5 : isSmallLabel ? 0.65 : isLargeLabel ? 0.9 : 0.8;
                }
                break;
        }

        // Height: use more of label height for clear bars
        const usableHeightMm = Math.max(6, labelSize.heightMm - (isTinyLabel ? 6 : isSmallLabel ? 7 : 8));
        const mmToPx = usableHeightMm * 3.7795;
        const minHeight = isTinyLabel ? 18 : isSmallLabel ? 24 : 28;
        const maxHeight = isTinyLabel ? 32 : isSmallLabel ? 42 : (labelSize.heightMm >= 32 ? 58 : 50);
        const baseHeight = Math.max(minHeight, Math.min(maxHeight, Math.round(mmToPx)));

        // Font size: 10–12px minimum for readable human‑readable numbers when printed
        const baseFontSize = isTinyLabel ? 8 : isSmallLabel ? 10 : 12;

        // Margins
        const baseTextMargin = isTinyLabel ? 0.5 : isSmallLabel ? 1 : 1.5;
        const baseMargin = isTinyLabel ? 1.5 : isSmallLabel ? 2.5 : 3;

        // Apply scaling
        const scaledWidth = Math.max(MIN_MODULE_WIDTH, Number((baseWidth * BARCODE_MODULE_SCALE).toFixed(3)));
        const scaledHeight = Math.max(MIN_BARCODE_HEIGHT, Math.round(baseHeight * BARCODE_MODULE_SCALE));
        const scaledFontSize = Math.max(MIN_FONT_SIZE, Number((baseFontSize * BARCODE_MODULE_SCALE).toFixed(2)));
        const scaledTextMargin = Number((baseTextMargin * BARCODE_MODULE_SCALE).toFixed(2));
        const scaledMargin = Number((baseMargin * BARCODE_MODULE_SCALE).toFixed(2));

        return {
            width: scaledWidth,
            height: scaledHeight,
            fontSize: scaledFontSize,
            textMargin: scaledTextMargin,
            margin: scaledMargin,
        };
    }

    private escapeHtml(value: string): string {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}

export const barcodeLabelService = new BarcodeLabelService();
