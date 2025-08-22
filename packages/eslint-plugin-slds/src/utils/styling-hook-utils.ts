import type { ValueToStylingHookEntry, ValueToStylingHooksMapping } from '@salesforce-ux/sds-metadata';
import { ParsedUnitValue, parseUnitValue, toAlternateUnitValue } from './value-utils';

function isValueMatch(valueToMatch: ParsedUnitValue, sldsValue: ParsedUnitValue): boolean {
  if (!valueToMatch || !sldsValue) {
    return false;
  }
  return valueToMatch.unit == sldsValue.unit && valueToMatch.number === sldsValue.number;
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
  
  const alternateValue = toAlternateUnitValue(parsedValue.number, parsedValue.unit);
  const matchedHooks = [];

  for (const [sldsValue, hooks] of Object.entries(supportedStylinghooks)) {
    // parsing SLDS metadata values
    const parsedSldsValue = parseUnitValue(sldsValue);
    if (isValueMatch(parsedValue, parsedSldsValue) || (alternateValue && isValueMatch(alternateValue, parsedSldsValue))) {
      hooks
        .filter((hook: ValueToStylingHookEntry) => hook.properties.includes(cssProperty))
        .forEach((hook) => matchedHooks.push(hook.name));
    }
  }
  return matchedHooks;
}