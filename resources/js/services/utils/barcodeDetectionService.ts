/**
 * Barcode Detection Service
 * Handles automatic barcode type detection and validation
 */

export type BarcodeType = 'ean13' | 'ean8' | 'upc' | 'code128' | 'code39' | 'custom';

export interface BarcodeTypeInfo {
    type: BarcodeType;
    name: string;
    description: string;
    example: string;
    length: number;
    pattern: RegExp;
}

export interface BarcodeDetectionResult {
    success: boolean;
    detectedType?: BarcodeType;
    confidence?: number;
    error?: string;
    suggestions?: string[];
}

const BARCODE_TYPES: BarcodeTypeInfo[] = [
    {
        type: 'ean13',
        name: 'EAN-13',
        description: 'European Article Number (13 digits)',
        example: '1234567890123',
        length: 13,
        pattern: /^\d{13}$/,
    },
    {
        type: 'ean8',
        name: 'EAN-8',
        description: 'European Article Number (8 digits)',
        example: '12345670',
        length: 8,
        pattern: /^\d{8}$/,
    },
    {
        type: 'upc',
        name: 'UPC-A',
        description: 'Universal Product Code (12 digits)',
        example: '012345678905',
        length: 12,
        pattern: /^\d{12}$/,
    },
    {
        type: 'code128',
        name: 'Code 128',
        description: 'High-density alphanumeric barcode',
        example: 'ABC12345',
        length: 0,
        pattern: /^[A-Za-z0-9\s-.]+$/,
    },
    {
        type: 'code39',
        name: 'Code 39',
        description: 'Alphanumeric barcode with special characters',
        example: 'CODE39',
        length: 0,
        pattern: /^[A-Z0-9\s-.]+$/,
    },
    {
        type: 'custom',
        name: 'Custom',
        description: 'Custom barcode format',
        example: 'CUSTOM123',
        length: 0,
        pattern: /^.{6,20}$/,
    },
];

class BarcodeDetectionService {
    /**
     * Auto-detect barcode type based on input
     */
    detectBarcodeType(barcode: string): BarcodeDetectionResult {
        if (!barcode || barcode.trim().length === 0) {
            return {
                success: false,
                error: 'No barcode provided',
                suggestions: ['Enter a valid barcode'],
            };
        }

        const trimmedBarcode = barcode.trim();
        const results: Array<{ type: BarcodeTypeInfo; confidence: number }> = [];

        // Check each barcode type
        for (const barcodeType of BARCODE_TYPES) {
            let confidence = 0;

            // Length-based confidence for fixed-length barcodes
            if (barcodeType.length > 0) {
                if (trimmedBarcode.length === barcodeType.length) {
                    confidence += 50; // Length matches
                } else {
                    // Calculate length difference penalty
                    const lengthDiff = Math.abs(trimmedBarcode.length - barcodeType.length);
                    confidence -= lengthDiff * 5;
                }
            }

            // Pattern-based confidence
            if (barcodeType.pattern.test(trimmedBarcode)) {
                confidence += 40; // Pattern matches
            }

            // Special validation for EAN-13
            if (barcodeType.type === 'ean13' && trimmedBarcode.length === 13) {
                if (this.validateEAN13(trimmedBarcode)) {
                    confidence += 20;
                }
            }

            // Special validation for UPC-A
            if (barcodeType.type === 'upc' && trimmedBarcode.length === 12) {
                if (this.validateUPC(trimmedBarcode)) {
                    confidence += 20;
                }
            }

            // Special validation for EAN-8
            if (barcodeType.type === 'ean8' && trimmedBarcode.length === 8) {
                if (this.validateEAN8(trimmedBarcode)) {
                    confidence += 20;
                }
            }

            if (confidence > 0) {
                results.push({ type: barcodeType, confidence });
            }
        }

        // Sort by confidence
        results.sort((a, b) => b.confidence - a.confidence);

        if (results.length > 0) {
            return {
                success: true,
                detectedType: results[0].type.type,
                confidence: results[0].confidence,
            };
        }

        return {
            success: false,
            error: 'No valid barcode type detected',
            suggestions: ['Try entering a valid barcode format'],
        };
    }

    /**
     * Validate EAN-13 checksum
     */
    private validateEAN13(barcode: string): boolean {
        if (barcode.length !== 13) return false;

        let sum = 0;
        for (let i = 0; i < 12; i++) {
            const digit = parseInt(barcode[i]);
            sum += i % 2 === 0 ? digit : digit * 3;
        }
        const checkDigit = (10 - (sum % 10)) % 10;
        return checkDigit === parseInt(barcode[12]);
    }

    /**
     * Validate UPC-A checksum
     */
    private validateUPC(barcode: string): boolean {
        if (barcode.length !== 12) return false;

        let sum = 0;
        for (let i = 0; i < 11; i++) {
            const digit = parseInt(barcode[i]);
            sum += i % 2 === 0 ? digit * 3 : digit;
        }
        const checkDigit = (10 - (sum % 10)) % 10;
        return checkDigit === parseInt(barcode[11]);
    }

    /**
     * Validate EAN-8 checksum
     */
    private validateEAN8(barcode: string): boolean {
        if (barcode.length !== 8) return false;

        let sum = 0;
        for (let i = 0; i < 7; i++) {
            const digit = parseInt(barcode[i]);
            sum += i % 2 === 0 ? digit * 3 : digit;
        }
        const checkDigit = (10 - (sum % 10)) % 10;
        return checkDigit === parseInt(barcode[7]);
    }

    /**
     * Get barcode type information
     */
    getBarcodeTypeInfo(type: string): BarcodeTypeInfo | null {
        return BARCODE_TYPES.find((t) => t.type === type) || null;
    }

    /**
     * Get all available barcode types
     */
    getAllBarcodeTypes(): BarcodeTypeInfo[] {
        return BARCODE_TYPES;
    }

    /**
     * Validate if barcode matches specific type
     */
    validateBarcodeForType(barcode: string, type: string): boolean {
        const barcodeType = this.getBarcodeTypeInfo(type);
        if (!barcodeType) return false;

        if (!barcodeType.pattern.test(barcode.trim())) {
            return false;
        }

        // Additional validation for specific types
        switch (type) {
            case 'ean13':
                return this.validateEAN13(barcode);
            case 'ean8':
                return this.validateEAN8(barcode);
            case 'upc':
                return this.validateUPC(barcode);
            default:
                return true;
        }
    }

    /**
     * Get suggestions for barcode format
     */
    getBarcodeSuggestions(barcode: string): string[] {
        const suggestions: string[] = [];
        const trimmedBarcode = barcode.trim();

        if (trimmedBarcode.length === 0) {
            suggestions.push('Enter a barcode number');
        } else if (trimmedBarcode.length < 6) {
            suggestions.push('Barcode is too short (minimum 6 characters)');
        } else if (trimmedBarcode.length > 20) {
            suggestions.push('Barcode is too long (maximum 20 characters)');
        } else {
            // Suggest common formats based on length
            if (trimmedBarcode.length === 13 && /^\d+$/.test(trimmedBarcode)) {
                suggestions.push('This looks like an EAN-13 barcode');
            } else if (trimmedBarcode.length === 12 && /^\d+$/.test(trimmedBarcode)) {
                suggestions.push('This looks like a UPC-A barcode');
            } else if (trimmedBarcode.length === 8 && /^\d+$/.test(trimmedBarcode)) {
                suggestions.push('This looks like an EAN-8 barcode');
            } else if (/^[A-Z0-9]+$/.test(trimmedBarcode)) {
                suggestions.push('This looks like a Code 128 or Code 39 barcode');
            } else {
                suggestions.push('This looks like a custom barcode format');
            }
        }

        return suggestions;
    }
}

export const barcodeDetectionService = new BarcodeDetectionService();