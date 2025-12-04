// Simplified value parsing

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

// Configurable list of allowed CSS units
export const ALLOWED_UNITS = ['px', 'em', 'rem', '%', 'ch'];

export type ParsedUnitValue = {
  unit: 'px' | 'rem' | '%' | 'em' | 'ch' | null;
  value: number | string;  // string for keyword values like 'bold', 'normal'
} | null;

export function parseUnitValue(valueStr: string): ParsedUnitValue {
  if (!valueStr) return null;
  
  // Create regex pattern from allowed units
  const unitsPattern = ALLOWED_UNITS.join('|');
  const regex = new RegExp(`^(-?\\d*\\.?\\d+)(${unitsPattern})?$`);
  const match = valueStr.match(regex);
  if (!match) return null;
  
  const numValue = parseFloat(match[1]);
  const unit = match[2] ? (match[2] as 'px' | 'rem' | '%' | 'em' | 'ch') : null; // Keep unitless values as null
  
  if (isNaN(numValue)) return null;
  
  return { value: numValue, unit };
}

export function toAlternateUnitValue(numberVal: number, unitType: 'px' | 'rem' | '%' | 'em' | 'ch' | null): ParsedUnitValue {
    if (unitType === 'px') {
      let floatValue = parseFloat(`${numberVal / 16}`);
      if (!isNaN(floatValue)) {
        return {
          unit: 'rem',
          value: parseFloat(floatValue.toFixed(4))
        }
      }
    } else if (unitType === 'rem') {
      const intValue = parseInt(`${numberVal * 16}`);
      if (!isNaN(intValue)) {
        return {
          unit: 'px',
          value: intValue
        }
      }
    }
    // For other units (%, em, ch) and unitless values, no alternate unit conversion available
    // These units are context-dependent and don't have standard conversion ratios
    return null;
}