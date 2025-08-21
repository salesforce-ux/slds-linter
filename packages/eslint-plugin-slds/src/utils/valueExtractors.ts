/**
 * Value extraction utilities for CSS declarations
 */

/**
 * Extract color value from CSS value string using simple regex
 */
export function extractColorValue(cssValue: string): string | null {
  if (!cssValue) return null;
  
  // Match hex colors
  const hexMatch = cssValue.match(/#([a-fA-F0-9]{3,6})\b/);
  if (hexMatch) {
    return hexMatch[0];
  }
  
  // Match named colors
  const namedColors = ['red', 'green', 'blue', 'black', 'white', 'gray', 'grey', 'orange', 'yellow', 'purple', 'pink', 'brown'];
  for (const color of namedColors) {
    if (cssValue.toLowerCase().includes(color)) {
      return color;
    }
  }
  
  return null;
}

/**
 * Extract dimension value from CSS value string using simple regex
 */
export function extractDimensionValue(cssValue: string): string | null {
  if (!cssValue) return null;
  
  // Match dimension values like 16px, 1rem, 0.5em, etc.
  const dimensionMatch = cssValue.match(/(-?\d*\.?\d+)(px|rem|em|%)?/);
  if (dimensionMatch) {
    const number = dimensionMatch[1];
    const unit = dimensionMatch[2] || '';
    return number + unit;
  }
  
  // Match font-weight values
  const fontWeights = ['normal', 'bold', 'bolder', 'lighter', '100', '200', '300', '400', '500', '600', '700', '800', '900'];
  for (const weight of fontWeights) {
    if (cssValue.toLowerCase().includes(weight)) {
      return weight;
    }
  }
  
  return null;
}

/**
 * Check if a value is a valid dimension
 */
export function isDimensionValue(value: string): boolean {
  // Check if it's a dimension value (number + unit or just number)
  const dimensionRegex = /^-?(\d+(\.\d+)?|\.\d+)(px|em|rem|%|ch|ex|vw|vh|vmin|vmax|cm|mm|in|pt|pc)?$/;
  return dimensionRegex.test(value) && !isZeroValue(value);
}

/**
 * Check if a value is zero (which should be ignored)
 */
export function isZeroValue(value: string): boolean {
  // Handle zero values which should be ignored
  return /^0(\.0+)?(px|em|rem|%|ch|ex|vw|vh|vmin|vmax|cm|mm|in|pt|pc)?$/.test(value);
}

/**
 * Check if a CSS value should be skipped (variables, functions, etc.)
 */
export function shouldSkipValue(cssValue: string): boolean {
  if (!cssValue) return true;
  
  const trimmedValue = cssValue.trim();
  return trimmedValue.startsWith('var(') || 
         trimmedValue === 'var' ||
         trimmedValue.includes('color-mix(');
}
