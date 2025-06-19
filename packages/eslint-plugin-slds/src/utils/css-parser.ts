/**
 * Shared CSS parsing utilities for ESLint rules
 * This provides consistent parsing logic for ESLint rules
 */

/**
 * Check if a CSS variable name starts with --slds-
 */
export function isSldsCssVariable(cssVar: string): boolean {
  return cssVar.startsWith('--slds-');
}

/**
 * Check if a CSS variable name starts with --sds-
 */
export function isSdsCssVariable(cssVar: string): boolean {
  return cssVar.startsWith('--sds-');
}

/**
 * Check if a CSS variable name starts with --lwc-
 */
export function isLwcCssVariable(cssVar: string): boolean {
  return cssVar.startsWith('--lwc-');
}

/**
 * Check if a CSS property matches target properties
 */
export function isTargetProperty(property: string, propertyTargets: string[] = []): boolean {
  return (
    property.startsWith('--sds-') ||
    property.startsWith('--slds-') ||
    property.startsWith('--lwc-') ||
    propertyTargets.length === 0 ||
    propertyTargets.includes(property)
  );
} 