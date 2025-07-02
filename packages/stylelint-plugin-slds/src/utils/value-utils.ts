import valueParser from 'postcss-value-parser';
import { convertToHex, isValidColor } from './color-lib-utils';


/**
 * Checks if a value is a CSS global value.
 *
 * CSS global values are special keywords that can be used for any CSS property and have a universal meaning:
 * - initial: Resets the property to its initial value as defined by the CSS specification.
 * - inherit: Inherits the value from the parent element.
 * - unset: Acts as inherit if the property is inheritable, otherwise acts as initial.
 * - revert: Rolls back the property to the value established by the user-agent or user styles.
 * - revert-layer: Rolls back the property to the value established by the previous cascade layer.
 *
 * All CSS properties accept these global values, including but not limited to:
 *   - color
 *   - background
 *   - font-size
 *   - margin
 *   - padding
 *   - border
 *   - display
 *   - position
 *   - z-index
 *   - and many more
 *
 * These values are part of the CSS standard and are not considered violations, even if a rule would otherwise flag a value as invalid or non-design-token. They are always allowed for any property.
 *
 * @param value The CSS value to check.
 * @returns True if the value is a CSS global value, false otherwise.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/initial
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/inherit
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/unset
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/revert
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/revert-layer
 */
export function isGlobalValue(value: string): boolean {
    return value === 'initial' || value === 'inherit' || value === 'unset' || value === 'revert' || value === 'revert-layer';
  }



export function toAlternateUnitValue(value: string): string {
    const parsedValue = valueParser.unit(value);
    const unitType = parsedValue && parsedValue.unit;
    const numberVal = parsedValue ? Number(parsedValue.number) : 0;
    let alternateValue = null;
    if (unitType === 'px') {
      let floatValue = parseFloat(`${numberVal / 16}`);
      if (!isNaN(floatValue)) {
        alternateValue = `${parseFloat(floatValue.toFixed(4))}rem`;
      }
    } else if (unitType === 'rem') {
      const intValue = parseInt(`${numberVal * 16}`);
      if (!isNaN(intValue)) {
        alternateValue = `${intValue}px`;
      }
    }
    return alternateValue;
}

/**
 * General utility to normalize a CSS value for reporting:
 * - For numbers, ensures a unit is present (default px)
 * - For colors, returns hex value
 * - Otherwise, returns as is
 */
export function normalizeCssValue(value: string | undefined): string {
  if (!value) return '';
  // Try color normalization first
  if (isValidColor(value)) {
    const hex = convertToHex(value);
    return hex || value;
  }
  // Length normalization
  if (value === '0') return '0px';
  if (/^-?\d+(\.\d+)?(px|em|rem|ch|ex|vh|vw|vmin|vmax|%)$/.test(value)) {
    return value;
  }
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return value + 'px';
  }
  return value;
}