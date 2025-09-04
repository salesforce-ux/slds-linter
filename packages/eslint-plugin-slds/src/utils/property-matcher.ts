///stylelint-sds/packages/stylelint-plugin-slds/src/utils/property-matcher.ts
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

// Directions & Corners
const DIRECTION_VALUES = '(?:top|right|bottom|left|inline|block|inline-start|inline-end|start|end|block-start|block-end)';
const CORNER_VALUES = '(?:top-left|top-right|bottom-right|bottom-left|start-start|start-end|end-start|end-end)';
const INSET_VALUES = '(?:inline|block|inline-start|inline-end|block-start|block-end)';


// Pre-compiled regex patterns for better performance
const BORDER_COLOR_REGEX = new RegExp(`^border(?:-${DIRECTION_VALUES})?-color$`);
const BORDER_WIDTH_REGEX = new RegExp(`^border(?:-${DIRECTION_VALUES})?-width$`);
const MARGIN_REGEX = new RegExp(`^margin(?:-${DIRECTION_VALUES})?$`);
const PADDING_REGEX = new RegExp(`^padding(?:-${DIRECTION_VALUES})?$`);
const BORDER_RADIUS_REGEX = new RegExp(`^border(?:-${CORNER_VALUES})?-radius$`);
const INSET_REGEX = new RegExp(`^inset(?:-${INSET_VALUES})?$`);

export function isBorderColorProperty(cssProperty: string): boolean {
  return BORDER_COLOR_REGEX.test(cssProperty);
}

export function isBorderWidthProperty(cssProperty: string): boolean {
  return BORDER_WIDTH_REGEX.test(cssProperty);
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

export const fontProperties = [
  'font',
  'font-size', 
  'font-weight'
];

export const colorProperties = [
  'color',
  'fill',
  'background',
  'background-color',
  'stroke',
  'border',
  'border*',
  'border*-color',
  'outline',
  'outline-color',
];

export const densificationProperties = [
  'border*',
  'margin*',
  'padding*',
  'width',
  'height',
  'min-width',
  'max-width',
  'min-height',
  'max-height',
  'inset',
  'top',
  'right',
  'left',
  'bottom',
  'outline',
  'outline-width',
  'line-height'
]; 

/**
 * Convert property patterns to CSS AST selector patterns
 * Handles wildcards (*) and creates proper ESLint CSS selector syntax
 */
export function toSelector(properties: string[]): string {
  const selectorParts = properties.map(prop => {
    if (prop.includes('*')) {
      // Convert wildcards to regex patterns for CSS AST selectors
      const regexPattern = prop.replace(/\*/g, '.*');
      return `Declaration[property=/${regexPattern}$/]`;
    } else {
      // Exact property match
      return `Declaration[property='${prop}']`;
    }
  });
  
  return selectorParts.join(', ');
}

export function resolvePropertyToMatch(cssProperty:string){
  const propertyToMatch = cssProperty.toLowerCase();
  if(propertyToMatch === 'outline' || propertyToMatch === 'outline-width' || isBorderWidthProperty(propertyToMatch)){
    return 'border-width';
  } else if(isMarginProperty(propertyToMatch)){
    return 'margin';
  } else if(isPaddingProperty(propertyToMatch)){
    return 'padding';
  } else if(isBorderRadius(propertyToMatch)){
    return 'border-radius';
  } else if(isDimensionProperty(propertyToMatch)){
    // Stylinghooks includes only width as property to match, for all other dimensions we need to match width
    return 'width';
  } else if(isInsetProperty(propertyToMatch)){
    // Stylinghooks includes only top/left/right/bottom as property to match, for all other insets we need to match top
    return 'top';
  } else if(cssProperty === 'background' || cssProperty === 'background-color'){
    return 'background-color';
  } else if(cssProperty === 'outline' || cssProperty === 'outline-color' || isBorderColorProperty(cssProperty)){
    return 'border-color';
  }
  return propertyToMatch;
}