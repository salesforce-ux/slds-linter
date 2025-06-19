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
  'left'
]; 