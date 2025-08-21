import { isValidColor } from './color-lib-utils';
import { shouldSkipValue, isDimensionValue } from './valueExtractors';

export interface BoxShadowValue {
    offsetX?: string;
    offsetY?: string;
    blurRadius?: string;
    spreadRadius?: string;
    color?: string;
    inset?: boolean;
}

interface ShadowParts {
    lengthParts: string[];
    colorParts: string[];
    inset: boolean;
}

/**
 * CSS AST-based parsing approach that maintains parity with Stylelint implementation
 * while leveraging ESLint's CSS AST core logic for robust value parsing
 */

// Enhanced length value detection using CSS AST patterns
function isLengthValue(value: string): boolean {
    // Check if it's a basic dimension value
    if (isDimensionValue(value)) {
        return true;
    }
    
    // Check for CSS variables that match spacing/sizing patterns
    if (value.trim().startsWith('var(')) {
        return /var\(\s*--[^)]*?(spacing|sizing|length|width|height|radius)[^)]*?\s*\)/.test(value);
    }
    
    // Check for CSS math functions (calc, min, max, clamp)
    if (/^(calc|min|max|clamp)\s*\(/.test(value.trim())) {
        return true;
    }
    
    // Fallback to basic regex for edge cases
    return /^-?\d*\.?\d+(px|rem|em|%|ch|ex|vw|vh|vmin|vmax|cm|mm|in|pt|pc)?$/.test(value.trim());
}

// Enhanced color value detection using CSS AST patterns  
function isColorValue(value: string): boolean {
    // Use existing color validation for standard colors
    if (isValidColor(value)) {
        return true;
    }
    
    // Check for SLDS color CSS variables
    if (value.trim().startsWith('var(')) {
        return /var\(\s*--[^)]*?color[^)]*?\s*\)/.test(value);
    }
    
    return false;
}

// Check for inset keyword using CSS AST patterns
function isInsetKeyword(value: string): boolean {
    return value.trim().toLowerCase() === 'inset';
}

// Enhanced shadow parsing using CSS AST core logic
function extractShadowParts(shadowString: string): ShadowParts[] {
    const shadows: ShadowParts[] = [];
    
    // Split by comma for multiple shadows, handling nested functions properly
    const shadowStrings = splitRespectingFunctions(shadowString, ',');
    
    for (const shadow of shadowStrings) {
        const shadowParts: ShadowParts = {
            lengthParts: [],
            colorParts: [],
            inset: false
        };
        
        // Split by spaces while respecting function boundaries
        const parts = splitRespectingFunctions(shadow.trim(), /\s+/);
        
        for (const part of parts) {
            const trimmedPart = part.trim();
            if (!trimmedPart) continue;
            
            if (isInsetKeyword(trimmedPart)) {
                shadowParts.inset = true;
            } else if (isLengthValue(trimmedPart)) {
                shadowParts.lengthParts.push(trimmedPart);
            } else if (isColorValue(trimmedPart)) {
                shadowParts.colorParts.push(trimmedPart);
            }
        }
        
        shadows.push(shadowParts);
    }
    
    return shadows;
}

// Utility function to split strings while respecting function boundaries
function splitRespectingFunctions(input: string, delimiter: string | RegExp): string[] {
    const result: string[] = [];
    let current = '';
    let depth = 0;
    let inQuotes = false;
    let quoteChar = '';
    
    for (let i = 0; i < input.length; i++) {
        const char = input[i];
        const nextChar = input[i + 1];
        
        // Handle quotes
        if ((char === '"' || char === "'") && !inQuotes) {
            inQuotes = true;
            quoteChar = char;
        } else if (char === quoteChar && inQuotes) {
            inQuotes = false;
            quoteChar = '';
        }
        
        // Handle function depth
        if (!inQuotes) {
            if (char === '(') {
                depth++;
            } else if (char === ')') {
                depth--;
            }
        }
        
        // Check for delimiter
        const isDelimiter = typeof delimiter === 'string' 
            ? char === delimiter 
            : delimiter.test(char);
            
        if (isDelimiter && depth === 0 && !inQuotes) {
            if (current.trim()) {
                result.push(current.trim());
            }
            current = '';
            
            // Skip consecutive spaces
            if (delimiter instanceof RegExp && /\s/.test(char)) {
                while (i + 1 < input.length && /\s/.test(input[i + 1])) {
                    i++;
                }
            }
        } else {
            current += char;
        }
    }
    
    if (current.trim()) {
        result.push(current.trim());
    }
    
    return result;
}

export function parseBoxShadowValue(value: string): BoxShadowValue[] {
    // Handle edge cases
    if (!value || value.trim() === 'none' || shouldSkipValue(value)) {
        return [];
    }
    
    const shadows = extractShadowParts(value);
    
    return shadows.map((shadow) => {
        /**
         * CSS box-shadow syntax (maintaining parity with Stylelint):
         * Two, three, or four <length> values:
         *   - If only two values: <offset-x> and <offset-y> 
         *   - If third value: <blur-radius>
         *   - If fourth value: <spread-radius>
         * Optionally, the inset keyword
         * Optionally, a <color> value
         */
        const shadowValue: BoxShadowValue = {};
        
        // Map length parts to shadow properties in order
        const lengthProperties = ['offsetX', 'offsetY', 'blurRadius', 'spreadRadius'] as const;
        lengthProperties.forEach((property, index) => {
            if (shadow.lengthParts.length > index) {
                shadowValue[property] = shadow.lengthParts[index];
            }
        });
        
        // Set color (use first color found)
        if (shadow.colorParts.length > 0) {
            shadowValue.color = shadow.colorParts[0];
        }
        
        // Set inset flag
        if (shadow.inset) {
            shadowValue.inset = shadow.inset;
        }
        
        return shadowValue;
    });
}



export function isBoxShadowMatch(parsedCssValue: BoxShadowValue[], parsedValueHook: BoxShadowValue[]): boolean {
    // If the number of shadows doesn't match, they're not equal
    if (parsedCssValue.length !== parsedValueHook.length) {
        return false;
    }

    // Compare each shadow in the array
    for (let i = 0; i < parsedCssValue.length; i++) {
        const cssShadow = parsedCssValue[i];
        const hookShadow = parsedValueHook[i];

        if(cssShadow.color !== hookShadow.color ||
            cssShadow.inset !== hookShadow.inset){
            return false;
        }

        // Compare length properties using a loop  
        const lengthProps = ['offsetX', 'offsetY', 'blurRadius', 'spreadRadius'] as const;
        for (const prop of lengthProps) {
            if (normalizeLength(cssShadow[prop]) !== normalizeLength(hookShadow[prop])) {
                return false;
            }
        }
    }

    return true;
}

// Enhanced length normalization maintaining parity with Stylelint
function normalizeLength(value: string | undefined): string {
    if (!value) return '';
    
    const trimmedValue = value.trim();
    if (!trimmedValue) return '';
    
    // Handle zero values - normalize to 0px for consistency
    if (/^0(\.0+)?$/.test(trimmedValue)) {
        return '0px';
    }
    
    // Handle unitless zero with decimal
    if (/^0(\.0+)?(px|em|rem|%|ch|ex|vw|vh|vmin|vmax|cm|mm|in|pt|pc)$/.test(trimmedValue)) {
        return '0px';
    }
    
    // For CSS variables and functions, return as-is
    if (trimmedValue.startsWith('var(') || /^(calc|min|max|clamp)\s*\(/.test(trimmedValue)) {
        return trimmedValue;
    }
    
    // For regular length values, ensure they have units if they're pure numbers
    const numberMatch = trimmedValue.match(/^(-?\d*\.?\d+)(.*)$/);
    if (numberMatch) {
        const [, number, unit] = numberMatch;
        if (!unit && number !== '0') {
            // Add 'px' as default unit for unitless non-zero values
            return `${number}px`;
        }
    }
    
    return trimmedValue;
}