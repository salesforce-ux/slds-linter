/**
 * CSS utility functions for ESLint rule processing
 * Provides common CSS property and value analysis functionality
 */

/**
 * Checks if a CSS property should be targeted for SLDS linting
 * Based on the original stylelint implementation's isTargetProperty
 */
export function isTargetProperty(property: string, propertyTargets: string[] = []): boolean {
  return property.startsWith('--sds-') 
    || property.startsWith('--slds-') 
    || property.startsWith('--lwc-') 
    || propertyTargets.length === 0
    || propertyTargets.includes(property);
}