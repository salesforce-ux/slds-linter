/** Check whether any hook property pattern matches a CSS property. */
export function matchesCssProperty(hookProperties: string[], cssProperty: string): boolean {
  return hookProperties.some(propertyPattern => {
    const regexPattern = new RegExp(`^${propertyPattern.replace(/\*/gu, '.*')}$`, 'u');
    return regexPattern.test(cssProperty);
  });
}

export const DIRECTION_VALUES = '(?:top|right|bottom|left|inline|block|inline-start|inline-end|start|end|block-start|block-end)';
export const CORNER_VALUES = '(?:top-left|top-right|bottom-right|bottom-left|start-start|start-end|end-start|end-end)';
export const INSET_VALUES = '(?:inline|block|inline-start|inline-end|block-start|block-end)';

const BORDER_COLOR_REGEX = new RegExp(`^border(?:-${DIRECTION_VALUES})?-color$`, 'u');
const BORDER_WIDTH_REGEX = new RegExp(`^border(?:-${DIRECTION_VALUES})?-width$`, 'u');
const MARGIN_REGEX = new RegExp(`^margin(?:-${DIRECTION_VALUES})?$`, 'u');
const PADDING_REGEX = new RegExp(`^padding(?:-${DIRECTION_VALUES})?$`, 'u');
const BORDER_RADIUS_REGEX = new RegExp(`^border(?:-${CORNER_VALUES})?-radius$`, 'u');
const INSET_REGEX = new RegExp(`^inset(?:-${INSET_VALUES})?$`, 'u');

export function isBorderColorProperty(cssProperty: string): boolean {
  return cssProperty === 'border' || BORDER_COLOR_REGEX.test(cssProperty);
}

export function isBorderWidthProperty(cssProperty: string): boolean {
  return cssProperty === 'border' || BORDER_WIDTH_REGEX.test(cssProperty);
}

export function isMarginProperty(cssProperty: string): boolean {
  return MARGIN_REGEX.test(cssProperty);
}

export function isPaddingProperty(cssProperty: string): boolean {
  return PADDING_REGEX.test(cssProperty);
}

export function isBorderRadius(cssProperty: string): boolean {
  return BORDER_RADIUS_REGEX.test(cssProperty);
}

export function isDimensionProperty(cssProperty: string): boolean {
  return ['width', 'height', 'min-width', 'max-width', 'min-height', 'max-height'].includes(cssProperty);
}

export function isInsetProperty(cssProperty: string): boolean {
  return INSET_REGEX.test(cssProperty);
}

export function isOutlineWidthProperty(cssProperty: string): boolean {
  return cssProperty === 'outline' || cssProperty === 'outline-width';
}

export const fontProperties = ['font', 'font-size', 'font-weight'];

export const colorProperties = [
  'color', 'fill', 'background', 'background-color', 'stroke', 'border', 'border*',
  'border*-color', 'outline', 'outline-color',
];

export const densificationProperties = [
  'border*', 'margin*', 'padding*', 'width', 'height', 'min-width', 'max-width',
  'min-height', 'max-height', 'inset', 'top', 'right', 'left', 'bottom', 'outline',
  'outline-width', 'line-height',
];

export function resolveDensityPropertyToMatch(cssProperty: string): string {
  const propertyToMatch = cssProperty.toLowerCase();
  if (isOutlineWidthProperty(propertyToMatch) || isBorderWidthProperty(propertyToMatch)) return 'border-width';
  if (isMarginProperty(propertyToMatch)) return 'margin';
  if (isPaddingProperty(propertyToMatch)) return 'padding';
  if (isBorderRadius(propertyToMatch)) return 'border-radius';
  if (isDimensionProperty(propertyToMatch)) return 'width';
  if (isInsetProperty(propertyToMatch)) return 'top';
  return propertyToMatch;
}

export function resolveColorPropertyToMatch(cssProperty: string): string {
  const propertyToMatch = cssProperty.toLowerCase();
  if (propertyToMatch === 'outline' || propertyToMatch === 'outline-color') return 'border-color';
  if (propertyToMatch === 'background' || propertyToMatch === 'background-color') return 'background-color';
  if (isBorderColorProperty(propertyToMatch)) return 'border-color';
  return propertyToMatch;
}
