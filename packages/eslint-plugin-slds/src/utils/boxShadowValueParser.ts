// Simplified box shadow parsing without postcss-value-parser
import { isValidColor } from './color-lib-utils';

export interface BoxShadowValue {
    offsetX?: string;
    offsetY?: string;
    blurRadius?: string;
    spreadRadius?: string;
    color?: string;
    inset?: boolean;
}

// Simple regex-based box shadow parsing
function isLengthValue(value: string): boolean {
    // Match dimension values like 1px, 0.5rem, 0, etc.
    return /^-?\d*\.?\d+(px|rem|em|%)?$/.test(value.trim());
}

function parseSimpleBoxShadow(value: string): BoxShadowValue[] {
    if (!value || value.trim() === 'none') return [];
    
    // Split by comma for multiple shadows
    const shadows = value.split(',').map(shadow => shadow.trim());
    
    return shadows.map(shadowStr => {
        const shadow: BoxShadowValue = {};
        const parts = shadowStr.trim().split(/\s+/);
        
        let lengthIndex = 0;
        
        for (const part of parts) {
            if (part === 'inset') {
                shadow.inset = true;
            } else if (isValidColor(part)) {
                shadow.color = part;
            } else if (isLengthValue(part)) {
                // Assign length values in order: offsetX, offsetY, blurRadius, spreadRadius
                if (lengthIndex === 0) shadow.offsetX = part;
                else if (lengthIndex === 1) shadow.offsetY = part;
                else if (lengthIndex === 2) shadow.blurRadius = part;
                else if (lengthIndex === 3) shadow.spreadRadius = part;
                lengthIndex++;
            }
        }
        
        return shadow;
    });
}

export function parseBoxShadowValue(value: string): BoxShadowValue[] {
    return parseSimpleBoxShadow(value);
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

// Simple length normalization
function normalizeLength(value: string | undefined): string {
    if (!value) return '';
    if (value === '0') return '0px';
    return value;
}