/**
 * Iraqi Dinar (IQD) Currency Formatter
 *
 * Provides comprehensive formatting for Iraqi currency with proper localization
 * and number formatting following Iraqi standards.
 */

export interface CurrencyOptions {
    showSymbol?: boolean;
    showCode?: boolean;
    compact?: boolean;
    precision?: number;
}

/**
 * Format a number as Iraqi Dinar currency
 *
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export function formatIQD(
    amount: number | string | null | undefined,
    options: CurrencyOptions = {},
): string {
    const {
        showSymbol = true,
        showCode = false,
        compact = false,
        precision = 0,
    } = options;

    // Handle null, undefined, or invalid values
    if (amount === null || amount === undefined || amount === '') {
        return showSymbol ? 'IQD 0' : '0';
    }

    // Convert to number if string
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    // Handle invalid numbers
    if (isNaN(numAmount)) {
        return showSymbol ? 'IQD 0' : '0';
    }

    // For very large numbers, use compact notation
    if (compact && Math.abs(numAmount) >= 1000000) {
        const millions = numAmount / 1000000;
        const formatted = millions.toLocaleString('en-US', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
        });

        if (showSymbol && showCode) {
            return `IQD ${formatted}M`;
        } else if (showSymbol) {
            return `IQD ${formatted}M`;
        } else if (showCode) {
            return `${formatted}M IQD`;
        }
        return `${formatted}M`;
    }

    // Format the number with proper thousands separators (Iraqi style: commas for thousands)
    const formatted = numAmount.toLocaleString('en-US', {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
    });

    // Apply currency symbol and code based on options
    if (showSymbol && showCode) {
        return `IQD ${formatted}`;
    } else if (showSymbol) {
        return `IQD ${formatted}`;
    } else if (showCode) {
        return `${formatted} IQD`;
    }

    return formatted;
}

/**
 * Format currency for display in tables and lists
 */
export function formatCurrency(
    amount: number | string | null | undefined,
): string {
    return formatIQD(amount, { showSymbol: true, precision: 0 });
}

/**
 * Format currency with compact notation for large amounts
 */
export function formatCurrencyCompact(
    amount: number | string | null | undefined,
): string {
    return formatIQD(amount, { showSymbol: true, compact: true, precision: 0 });
}

/**
 * Format currency with smart sizing - automatically uses compact format for very large numbers
 */
export function formatCurrencySmart(
    amount: number | string | null | undefined,
): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    // Use compact format for values over 100,000 to keep stats cards readable
    if (numAmount && Math.abs(numAmount) >= 100000) {
        return formatCurrencyCompact(amount);
    }

    return formatCurrency(amount);
}

/**
 * Format currency for stats cards with indicators above the number (K, M, B, T)
 */
export function formatCurrencyStats(
    amount: number | string | null | undefined,
): {
    display: string;
    full: string;
    isCompact: boolean;
    indicator: string;
} {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    // Handle null, undefined, or invalid values
    if (
        amount === null ||
        amount === undefined ||
        amount === '' ||
        numAmount === null ||
        numAmount === undefined ||
        isNaN(numAmount)
    ) {
        return {
            display: 'IQD 0',
            full: 'IQD 0',
            isCompact: false,
            indicator: '',
        };
    }

    const fullAmount = formatCurrency(numAmount);

    // Trillion (T) - 1,000,000,000,000+
    if (Math.abs(numAmount) >= 1000000000000) {
        const trillions = numAmount / 1000000000000;
        const formatted = trillions.toLocaleString('en-US', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
        });

        return {
            display: `IQD ${formatted}`,
            full: fullAmount,
            isCompact: true,
            indicator: 'T',
        };
    }

    // Billion (B) - 1,000,000,000+
    if (Math.abs(numAmount) >= 1000000000) {
        const billions = numAmount / 1000000000;
        const formatted = billions.toLocaleString('en-US', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
        });

        return {
            display: `IQD ${formatted}`,
            full: fullAmount,
            isCompact: true,
            indicator: 'B',
        };
    }

    // Million (M) - 1,000,000+
    if (Math.abs(numAmount) >= 1000000) {
        const millions = numAmount / 1000000;
        const formatted = millions.toLocaleString('en-US', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
        });

        return {
            display: `IQD ${formatted}`,
            full: fullAmount,
            isCompact: true,
            indicator: 'M',
        };
    }

    // Thousand (K) - 100,000+
    if (Math.abs(numAmount) >= 100000) {
        const thousands = numAmount / 1000;
        const formatted = thousands.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        });

        return {
            display: `IQD ${formatted}`,
            full: fullAmount,
            isCompact: true,
            indicator: 'K',
        };
    }

    return {
        display: fullAmount,
        full: fullAmount,
        isCompact: false,
        indicator: '',
    };
}

/**
 * Format currency for forms and inputs (no symbol)
 */
export function formatCurrencyInput(
    amount: number | string | null | undefined,
): string {
    return formatIQD(amount, { showSymbol: false, precision: 0 });
}

/**
 * Format currency with full details (symbol + code)
 */
export function formatCurrencyFull(
    amount: number | string | null | undefined,
): string {
    return formatIQD(amount, {
        showSymbol: true,
        showCode: true,
        precision: 0,
    });
}

/**
 * Format currency with decimals for precise amounts
 */
export function formatCurrencyPrecise(
    amount: number | string | null | undefined,
    decimals: number = 2,
): string {
    return formatIQD(amount, { showSymbol: true, precision: decimals });
}

/**
 * Parse a currency string back to number
 * Removes all non-numeric characters except decimal points
 */
export function parseCurrency(value: string): number {
    if (!value || typeof value !== 'string') {
        return 0;
    }

    // Remove currency symbols, letters, and extra spaces
    const cleaned = value
        .replace(/IQD/gi, '') // Remove currency code
        .replace(/[^\d.,-]/g, '') // Keep only digits, commas, dots, and minus
        .replace(/,/g, ''); // Remove thousands separators

    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
}

/**
 * Validate if a string represents a valid currency amount
 */
export function isValidCurrency(value: string): boolean {
    if (!value || typeof value !== 'string') {
        return false;
    }

    const parsed = parseCurrency(value);
    return !isNaN(parsed) && isFinite(parsed) && parsed >= 0;
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(): string {
    return 'IQD';
}

/**
 * Get currency code
 */
export function getCurrencyCode(): string {
    return 'IQD';
}

/**
 * Format profit margin as percentage
 */
export function formatProfitMargin(
    costPrice: number,
    sellPrice: number,
): string {
    if (!costPrice || costPrice <= 0 || !sellPrice || sellPrice <= 0) {
        return '0%';
    }

    const margin = ((sellPrice - costPrice) / costPrice) * 100;
    return `${margin.toFixed(1)}%`;
}

/**
 * Calculate profit amount
 */
export function calculateProfit(costPrice: number, sellPrice: number): number {
    if (!costPrice || costPrice <= 0 || !sellPrice || sellPrice <= 0) {
        return 0;
    }

    return sellPrice - costPrice;
}

/**
 * Format profit amount with currency
 */
export function formatProfit(costPrice: number, sellPrice: number): string {
    const profit = calculateProfit(costPrice, sellPrice);
    return formatCurrency(profit);
}
