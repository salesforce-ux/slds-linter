/**
 * Font Value Parser for ESLint Plugin
 * Simplified implementation focusing on CSS AST-based parsing without postcss-value-parser dependency
 * Maintains compatibility with the existing Stylelint implementation patterns
 */

import { isGlobalValue } from './value-utils';

// Font constants based on CSS specification
const FONT_STYLES = ['normal', 'italic', 'oblique'];
const FONT_VARIANTS = ['normal', 'small-caps'];
const FONT_WEIGHTS = [
  'normal', 'bold', 'bolder', 'lighter',
  '100', '200', '300', '400', '500', '600', '700', '800', '900'
];

export interface FontValue {
  'font-family'?: string;
  'font-size'?: string;
  'line-height'?: string;
  'font-style'?: string;
  'font-weight'?: string;
  'font-variant'?: string;
}

/**
 * Check if a value is a known font weight
 */
export function isKnownFontWeight(value: string): boolean {
  return FONT_WEIGHTS.includes(value.toLowerCase());
}

/**
 * Check if a value is a known font style
 */
export function isKnownFontStyle(value: string): boolean {
  return FONT_STYLES.includes(value.toLowerCase());
}

/**
 * Check if a value is a known font variant
 */
export function isKnownFontVariant(value: string): boolean {
  return FONT_VARIANTS.includes(value.toLowerCase());
}

/**
 * Check if a value is a dimension (for font-size, line-height)
 */
export function isDimensionValue(value: string): boolean {
  // Check if it's a dimension value (number + unit or just number)
  const dimensionRegex = /^-?(\d+(\.\d+)?|\.\d+)(px|em|rem|%|ch|ex|vw|vh|vmin|vmax|cm|mm|in|pt|pc)?$/;
  return dimensionRegex.test(value) && !isZeroValue(value);
}

/**
 * Check if a value is zero (which should be ignored)
 */
function isZeroValue(value: string): boolean {
  return /^0(\.0+)?(px|em|rem|%|ch|ex|vw|vh|vmin|vmax|cm|mm|in|pt|pc)?$/.test(value);
}

/**
 * Check if a CSS value should be skipped (variables, functions, etc.)
 */
function shouldSkipValue(cssValue: string): boolean {
  if (!cssValue) return true;
  
  const trimmedValue = cssValue.trim();
  return trimmedValue.startsWith('var(') || 
         trimmedValue === 'var' ||
         trimmedValue.includes('var(') ||
         trimmedValue.includes('calc(') ||
         trimmedValue.includes('color-mix(');
}

/**
 * Simple font string parsing using string splitting
 * Handles most common font shorthand patterns without complex AST traversal
 */
function splitFontValue(fontString: string): string[] {
  const parts: string[] = [];
  let current = '';
  let depth = 0;
  let inQuotes = false;
  let quoteChar = '';
  
  for (let i = 0; i < fontString.length; i++) {
    const char = fontString[i];
    
    // Handle quotes
    if ((char === '"' || char === "'") && !inQuotes) {
      inQuotes = true;
      quoteChar = char;
      current += char;
    } else if (char === quoteChar && inQuotes) {
      inQuotes = false;
      quoteChar = '';
      current += char;
    } else if (inQuotes) {
      current += char;
    } else {
      // Handle function depth
      if (char === '(') {
        depth++;
        current += char;
      } else if (char === ')') {
        depth--;
        current += char;
      } else if (char === '/' && depth === 0) {
        // Font-size/line-height separator
        if (current.trim()) {
          parts.push(current.trim());
        }
        parts.push('/');
        current = '';
      } else if (char === ',' && depth === 0) {
        // Font family separator
        if (current.trim()) {
          parts.push(current.trim());
        }
        parts.push(',');
        current = '';
      } else if (/\s/.test(char) && depth === 0) {
        // Space separator (but not inside functions)
        if (current.trim()) {
          parts.push(current.trim());
        }
        current = '';
      } else {
        current += char;
      }
    }
  }
  
  if (current.trim()) {
    parts.push(current.trim());
  }
  
  return parts;
}

/**
 * Parse CSS font shorthand into structured components
 * Following CSS specification: [ [ font-style || font-variant || font-weight ]? font-size [ / line-height ]? font-family ]
 */
export function parseFont(value: string): FontValue {
  if (!value || shouldSkipValue(value) || isGlobalValue(value)) {
    return {};
  }
  
  const parts = splitFontValue(value.trim());
  const result: FontValue = {};
  let fontFamilyParts: string[] = [];
  let foundSlash = false;
  let collectingFamily = false;
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    
    if (part === '/') {
      foundSlash = true;
      continue;
    }
    
    if (part === ',' || collectingFamily) {
      // Everything from first comma onwards is font-family
      collectingFamily = true;
      if (part !== ',') {
        fontFamilyParts.push(part);
      }
      continue;
    }
    
    if (foundSlash && !result['line-height']) {
      // Next part after slash is line-height
      result['line-height'] = part;
      foundSlash = false;
    } else if (isKnownFontStyle(part) && !result['font-style']) {
      result['font-style'] = part;
    } else if (isKnownFontVariant(part) && !result['font-variant']) {
      result['font-variant'] = part;
    } else if (isKnownFontWeight(part) && !result['font-weight']) {
      result['font-weight'] = part;
    } else if (isDimensionValue(part) && !result['font-size']) {
      // Font-size is required and comes before font-family
      result['font-size'] = part;
    } else if (!result['font-size']) {
      // Could be font-size if it's a number or special keyword
      if (/^\d/.test(part) || ['xx-small', 'x-small', 'small', 'medium', 'large', 'x-large', 'xx-large', 'smaller', 'larger'].includes(part)) {
        result['font-size'] = part;
      }
    } else {
      // Everything else goes to font-family
      collectingFamily = true;
      fontFamilyParts.push(part);
    }
  }
  
  if (fontFamilyParts.length > 0) {
    result['font-family'] = fontFamilyParts.join(' ');
  }
  
  return result;
}

/**
 * Check if a property should be handled by font processing
 */
export function isFontProperty(property: string): boolean {
  const prop = property.toLowerCase();
  return prop === 'font' || prop === 'font-size' || prop === 'font-weight' || 
         prop === 'font-family' || prop === 'font-style' || prop === 'font-variant';
}

/**
 * Extract font-related values from CSS declarations for linting
 */
export function extractFontValue(cssValue: string, property: string): string | null {
  if (!cssValue || shouldSkipValue(cssValue) || isGlobalValue(cssValue)) {
    return null;
  }
  
  const prop = property.toLowerCase();
  
  if (prop === 'font-size' || prop === 'font-weight') {
    // Simple extraction for individual properties
    return cssValue.trim();
  } else if (prop === 'font') {
    // Extract specific values from shorthand
    const parsed = parseFont(cssValue);
    return parsed['font-size'] || parsed['font-weight'] || null;
  }
  
  return null;
}
