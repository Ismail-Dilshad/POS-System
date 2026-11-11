/**
 * Barcode generation service for creating real, standard barcodes
 * Supports: EAN-13, EAN-8, UPC-A, Code 128, Code 39, and Custom formats
 * Also provides SVG rendering for barcode visualization
 */

export type BarcodeType = 'ean13' | 'ean8' | 'upc' | 'code128' | 'code39' | 'custom';

export interface BarcodeGenerationResult {
    success: boolean;
    barcode?: string;
    error?: string;
}

export interface BarcodeValidationResult {
    success: boolean;
    error?: string;
}

export interface BarcodeSVGResult {
    success: boolean;
    svg?: string;
    error?: string;
}

export interface BarcodeTypeInfo {
    type: BarcodeType;
    name: string;
    description: string;
    example: string;
    length: number;
    pattern: RegExp;
}

class BarcodeService {
    /**
     * Generate EAN-13 barcode (13 digits)
     * Format: 12 data digits + 1 check digit
     */
    private generateEAN13(): string {
        const digits = [];
        for (let i = 0; i < 12; i++) {
            digits.push(Math.floor(Math.random() * 10));
        }

        // Calculate check digit
        let sum = 0;
        for (let i = 0; i < 12; i++) {
            sum += digits[i] * (i % 2 === 0 ? 1 : 3);
        }
        const checkDigit = (10 - (sum % 10)) % 10;
        digits.push(checkDigit);

        return digits.join('');
    }

    /**
     * Generate EAN-8 barcode (8 digits)
     * Format: 7 data digits + 1 check digit
     */
    private generateEAN8(): string {
        const digits = [];
        for (let i = 0; i < 7; i++) {
            digits.push(Math.floor(Math.random() * 10));
        }

        // Calculate check digit
        let sum = 0;
        for (let i = 0; i < 7; i++) {
            sum += digits[i] * (i % 2 === 0 ? 3 : 1);
        }
        const checkDigit = (10 - (sum % 10)) % 10;
        digits.push(checkDigit);

        return digits.join('');
    }

    /**
     * Generate UPC-A barcode (12 digits)
     * Format: 11 data digits + 1 check digit
     */
    private generateUPCA(): string {
        const digits = [];
        for (let i = 0; i < 11; i++) {
            digits.push(Math.floor(Math.random() * 10));
        }

        // Calculate check digit
        let sum = 0;
        for (let i = 0; i < 11; i++) {
            sum += digits[i] * (i % 2 === 0 ? 3 : 1);
        }
        const checkDigit = (10 - (sum % 10)) % 10;
        digits.push(checkDigit);

        return digits.join('');
    }

    /**
     * Generate Code 128 barcode
     * Alphanumeric format with mixed case letters and numbers
     */
    private generateCode128(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 10; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Generate Code 39 barcode
     * Alphanumeric format with uppercase letters, numbers, and some special chars
     */
    private generateCode39(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-*.$/+%';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Generate custom barcode
     * Mixed alphanumeric format
     */
    private generateCustom(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 12; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Generate barcode based on type
     */
    async generateBarcode(type: BarcodeType): Promise<BarcodeGenerationResult> {
        try {
            let barcode: string;

            switch (type) {
                case 'ean13':
                    barcode = this.generateEAN13();
                    break;
                case 'ean8':
                    barcode = this.generateEAN8();
                    break;
                case 'upc':
                    barcode = this.generateUPCA();
                    break;
                case 'code128':
                    barcode = this.generateCode128();
                    break;
                case 'code39':
                    barcode = this.generateCode39();
                    break;
                case 'custom':
                    barcode = this.generateCustom();
                    break;
                default:
                    return {
                        success: false,
                        error: `Unsupported barcode type: ${type}`,
                    };
            }

            return {
                success: true,
                barcode,
            };
        } catch (error) {
            return {
                success: false,
                error: `Failed to generate barcode: ${error}`,
            };
        }
    }

    /**
     * Validate barcode format based on type
     */
    validateBarcode(barcode: string, type: BarcodeType): boolean {
        switch (type) {
            case 'ean13':
                return /^\d{13}$/.test(barcode);
            case 'ean8':
                return /^\d{8}$/.test(barcode);
            case 'upc':
                return /^\d{12}$/.test(barcode);
            case 'code128':
                return /^[A-Z0-9]{6,15}$/.test(barcode);
            case 'code39':
                return /^[A-Z0-9-. $/+%]{6,15}$/.test(barcode);
            case 'custom':
                return barcode.length >= 6 && barcode.length <= 20;
            default:
                return false;
        }
    }

    /**
     * Get barcode type information
     */
    getBarcodeTypeInfo(type: BarcodeType): BarcodeTypeInfo | null {
        const types: Record<BarcodeType, BarcodeTypeInfo> = {
            ean13: {
                type: 'ean13',
                name: 'EAN-13',
                description: 'European Article Number (13 digits)',
                example: '1234567890123',
                length: 13,
                pattern: /^\d{13}$/,
            },
            ean8: {
                type: 'ean8',
                name: 'EAN-8',
                description: 'European Article Number (8 digits)',
                example: '12345670',
                length: 8,
                pattern: /^\d{8}$/,
            },
            upc: {
                type: 'upc',
                name: 'UPC-A',
                description: 'Universal Product Code (12 digits)',
                example: '012345678905',
                length: 12,
                pattern: /^\d{12}$/,
            },
            code128: {
                type: 'code128',
                name: 'Code 128',
                description: 'Alphanumeric barcode with high density',
                example: 'ABC12345',
                length: 0,
                pattern: /^[A-Z0-9]{6,15}$/,
            },
            code39: {
                type: 'code39',
                name: 'Code 39',
                description: 'Alphanumeric barcode with special characters',
                example: 'CODE39',
                length: 0,
                pattern: /^[A-Z0-9-. $/+%]{6,15}$/,
            },
            custom: {
                type: 'custom',
                name: 'Custom',
                description: 'Custom barcode format',
                example: 'CUSTOM123',
                length: 0,
                pattern: /^.{6,20}$/,
            },
        };

        return types[type] || null;
    }

    /**
     * Get all available barcode types
     */
    getAllBarcodeTypes(): BarcodeTypeInfo[] {
        return [
            this.getBarcodeTypeInfo('ean13')!,
            this.getBarcodeTypeInfo('ean8')!,
            this.getBarcodeTypeInfo('upc')!,
            this.getBarcodeTypeInfo('code128')!,
            this.getBarcodeTypeInfo('code39')!,
            this.getBarcodeTypeInfo('custom')!,
        ];
    }
}

export const barcodeService = new BarcodeService();