/**
 * Check if a CSS property should be targeted for linting based on prefixes or explicit targets
 * @param property - The CSS property name to check
 * @param propertyTargets - Array of specific properties to target (empty means target all)
 * @returns true if the property should be targeted
 */
export function isTargetProperty(property: string, propertyTargets: string[] = []): boolean {
  if (typeof property !== 'string') return false;
  return property.startsWith('--sds-')
    || property.startsWith('--slds-')
    || property.startsWith('--lwc-')
    || propertyTargets.length === 0
    || propertyTargets.includes(property);
}