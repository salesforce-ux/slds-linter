import type { ValueToStylingHookEntry, ValueToStylingHooksMapping } from '@salesforce-ux/sds-metadata';
import { ParsedUnitValue, parseUnitValue, toAlternateUnitValue } from './value-utils';

function isValueMatch(valueToMatch: ParsedUnitValue, sldsValue: ParsedUnitValue): boolean {
  if (!valueToMatch || !sldsValue) {
    return false;
  }
  return valueToMatch.unit == sldsValue.unit && valueToMatch.value === sldsValue.value;
}

/**
 * Check if a parsed value is a keyword (string) rather than a numeric value
 */
function isKeywordValue(parsedValue: ParsedUnitValue): parsedValue is { value: string; unit: null } {
  return parsedValue !== null && typeof parsedValue.value === 'string';
}

/**
 * Get styling hooks for a density value using structured data from CSS AST
 * Eliminates regex parsing by accepting pre-parsed dimension data
 */
export function getStylingHooksForDensityValue(
  parsedValue: ParsedUnitValue,
  supportedStylinghooks: ValueToStylingHooksMapping,
  cssProperty: string
): string[] {
  if (!parsedValue) return [];
  
  const matchedHooks: string[] = [];

  // Handle keyword values (e.g., 'bold', 'normal') with direct string match
  if (isKeywordValue(parsedValue)) {
    const keywordLower = parsedValue.value.toLowerCase();
    for (const [sldsValue, hooks] of Object.entries(supportedStylinghooks)) {
      if (sldsValue.toLowerCase() === keywordLower) {
        hooks
          .filter((hook: ValueToStylingHookEntry) => hook.properties.includes(cssProperty))
          .forEach((hook) => matchedHooks.push(hook.name));
      }
    }
    return matchedHooks;
  }

  // Handle numeric values with unit conversion
  const alternateValue = typeof parsedValue.value === 'number' 
    ? toAlternateUnitValue(parsedValue.value, parsedValue.unit)
    : null;

  for (const [sldsValue, hooks] of Object.entries(supportedStylinghooks)) {
    const parsedSldsValue = parseUnitValue(sldsValue);
    if (isValueMatch(parsedValue, parsedSldsValue) || (alternateValue && isValueMatch(alternateValue, parsedSldsValue))) {
      hooks
        .filter((hook: ValueToStylingHookEntry) => hook.properties.includes(cssProperty))
        .forEach((hook) => matchedHooks.push(hook.name));
    }
  }
  return matchedHooks;
}