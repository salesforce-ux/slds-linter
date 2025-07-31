export enum ReplacementCategory {
    EMPTY = 'EMPTY',
    SLDS_TOKEN = 'SLDS_TOKEN',
    ARRAY = 'ARRAY',
    CSS_VALUE = 'CSS_VALUE',
    CSS_FUNCTION = 'CSS_FUNCTION',
    SPACE_SEPARATED = 'SPACE_SEPARATED'
}

import { containsCssFunction } from './css-functions';

/**
 * Categorizes a replacement value from lwc-to-slds.json
 * @param replacement - The replacement value to categorize (string or string[])
 * @returns The category of the replacement value
 */
export function categorizeReplacement(replacement: string | string[]): ReplacementCategory {
    if (Array.isArray(replacement)) {
        return ReplacementCategory.ARRAY;
    }

    
    if (replacement === '') {
        return ReplacementCategory.EMPTY;
    }

    // SLDS tokens (1:1 mapping) - starts with --slds- and no spaces
    if (replacement.startsWith('--slds-') && !replacement.includes(' ')) {
        return ReplacementCategory.SLDS_TOKEN;
    }

    if (containsCssFunction(replacement)) {
        return ReplacementCategory.CSS_FUNCTION;
    }

    if (replacement.includes(' ')) {
        return ReplacementCategory.SPACE_SEPARATED;
    }

    // CSS values - simple values like "transparent", "none", "0", etc.
    return ReplacementCategory.CSS_VALUE;
}
