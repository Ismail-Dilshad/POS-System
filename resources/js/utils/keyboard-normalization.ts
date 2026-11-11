/**
 * Keyboard shortcut normalization for Kurdish and Arabic layouts
 * Handles conversion of Arabic script characters to English shortcuts
 */

// Normalize keyboard shortcuts for Kurdish and Arabic layouts
export const normalizeKeyboardShortcuts = (key: string): string => {
    // Handle special keys first (Enter, Tab, Arrow keys, etc.)
    const specialKeys = ['Enter', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Delete', 'Escape', 'Space'];
    if (specialKeys.includes(key)) {
        return key;
    }

    // Kurdish keyboard mapping (Kurdish QWERTY layout)
    const kurdishMap: { [key: string]: string } = {
        // Kurdish specific mappings
        'ج': 'c', 'چ': 'c', // C key variations (Checkout)
        'ک': 'k', 'ك': 'k', // K key variations (Cards)
        'ت': 't', 'ط': 't', // T key variations (Scale)
        'ح': 'h', 'ه': 'h', // H key variations (Hold)
        'ب': 'b', 'پ': 'b', // B key variations (Recall)
        'س': 's', 'ص': 's', // S key variations (Clear held carts)
        'ز': 'z', 'ذ': 'z', // Z key variations (Focus search)
        'خ': 'x', 'غ': 'x', // X key variations (Clear cart)
        'د': 'd', 'ض': 'd', // D key variations (Discount)
    };

    // Arabic keyboard mapping (Arabic QWERTY layout)
    const arabicMap: { [key: string]: string } = {
        // Arabic specific mappings
        'ج': 'c', 'ح': 'c', // C key variations (Checkout)
        'ك': 'k', 'ق': 'k', // K key variations (Cards)
        'ت': 't', 'ط': 't', // T key variations (Scale)
        'ه': 'h', // H key variations (Hold)
        'لا': 'b', // B key variations (Recall)
        'س': 's', 'ص': 's', // S key variations (Clear held carts)
        'ز': 'z', 'ذ': 'z', // Z key variations (Focus search)
        'خ': 'x', 'غ': 'x', // X key variations (Clear cart)
        'د': 'd', 'ض': 'd', // D key variations (Discount)
    };

    // Check Kurdish mappings first
    if (kurdishMap[key]) {
        return kurdishMap[key];
    }
    
    // Check Arabic mappings
    if (arabicMap[key]) {
        return arabicMap[key];
    }
    
    // Return original key if no mapping found
    return key;
};

/**
 * Check if a key is a normalized shortcut
 */
export const isShortcutKey = (key: string): boolean => {
    const normalizedKey = normalizeKeyboardShortcuts(key).toLowerCase();
    return ['c', 'k', 't', 'h', 'b', 's', 'z', 'x', 'd'].includes(normalizedKey);
};

/**
 * Get the normalized shortcut key
 */
export const getNormalizedShortcut = (key: string): string => {
    return normalizeKeyboardShortcuts(key).toLowerCase();
};

/**
 * Normalize Arabic and Kurdish numbers to English format (0-9)
 * Single shared function for both Arabic and Kurdish number systems
 */
export const normalizeToEnglishNumbers = (input: string): string => {
    // Arabic-Indic digits (Arabic keyboards)
    const arabicDigitMap: { [key: string]: string } = {
        '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
        '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
    };

    // Combine both maps
    const digitMap = { ...arabicDigitMap};
    
    return input.replace(/[٠١٢٣٤٥٦٧٨٩]/g, (match) => digitMap[match] || match);
};
