/**
 * Value extraction utilities for CSS declarations
 */

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
