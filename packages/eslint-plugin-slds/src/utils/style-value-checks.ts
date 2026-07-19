/**
 * Shared helpers for interpreting framework "style value" surfaces (React inline
 * style objects, CSS-in-JS declarations, Vue/Angular style bindings) so they can
 * be checked with the same detection logic as real CSS declarations.
 */

/**
 * React style properties that are rendered without a `px` unit when given a
 * number. Mirrors React's `isUnitlessNumber` list (common subset).
 */
const UNITLESS_PROPERTIES = new Set<string>([
  'animation-iteration-count',
  'aspect-ratio',
  'border-image-outset',
  'border-image-slice',
  'border-image-width',
  'box-flex',
  'box-flex-group',
  'box-ordinal-group',
  'column-count',
  'columns',
  'flex',
  'flex-grow',
  'flex-positive',
  'flex-shrink',
  'flex-negative',
  'flex-order',
  'grid-area',
  'grid-row',
  'grid-row-end',
  'grid-row-span',
  'grid-row-start',
  'grid-column',
  'grid-column-end',
  'grid-column-span',
  'grid-column-start',
  'font-weight',
  'line-clamp',
  'line-height',
  'opacity',
  'order',
  'orphans',
  'tab-size',
  'widows',
  'z-index',
  'zoom',
  'fill-opacity',
  'flood-opacity',
  'stop-opacity',
  'stroke-dasharray',
  'stroke-dashoffset',
  'stroke-miterlimit',
  'stroke-opacity',
  'stroke-width',
]);

/**
 * Convert a JS style object key (camelCase or already a custom property) to its
 * CSS property name.
 *   backgroundColor -> background-color
 *   WebkitTransform -> -webkit-transform
 *   --slds-c-foo     -> --slds-c-foo (unchanged)
 */
export function kebabCase(key: string): string {
  if (key.startsWith('--')) {
    return key;
  }
  return key
    .replace(/^([A-Z])/, (m) => '-' + m.toLowerCase())
    .replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
}

/**
 * Whether a CSS property ignores numeric px conversion under React semantics.
 */
export function isUnitlessProperty(cssProperty: string): boolean {
  return UNITLESS_PROPERTIES.has(cssProperty);
}

/**
 * Convert a React style-object numeric value into the CSS text React would emit.
 * Numbers become `<n>px` unless the property is unitless.
 */
export function reactNumberToCssValue(cssProperty: string, num: number): string {
  if (num === 0 || isUnitlessProperty(cssProperty)) {
    return String(num);
  }
  return `${num}px`;
}
