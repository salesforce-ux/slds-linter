/**
 * Check if any of the hook properties match the provided cssProperty using wildcard matching.
 * @param hookProperties - Array of property patterns (can contain wildcards like `*`)
 * @param cssProperty - The CSS property to be checked
 * @returns true if a match is found, otherwise false
 */
export function matchesCssProperty(
  hookProperties: string[],
  cssProperty: string
): boolean {
  return hookProperties.some((propertyPattern: string) => {
    const regexPattern = new RegExp(
      '^' + propertyPattern.replace(/\*/g, '.*') + '$'
    );
    return regexPattern.test(cssProperty);
  });
}

/**
 * Checks if a property is a target property for SLDS linting
 * @param property - CSS property name to check
 * @param propertyTargets - Optional array of specific properties to target
 * @returns true if property should be linted
 */
export function isTargetProperty(property: string, propertyTargets: string[] = []): boolean {
    return property.startsWith('--sds-')
    || property.startsWith('--slds-')
    || property.startsWith('--lwc-')
    || propertyTargets.length === 0
    || propertyTargets.includes(property);
}

export const colorProperties = [
  'color',
  'fill',
  'background',
  'background-color',
  'stroke',
  'border*-color',
  'outline-color',
];

export const densificationProperties = [
  'border*',
  'margin*',
  'padding*',
  'width',
  'height',
  'top',
  'right',
  'left',
  'bottom'
]; 