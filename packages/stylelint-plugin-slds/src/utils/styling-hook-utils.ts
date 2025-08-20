import type { ValueToStylingHookEntry, ValueToStylingHooksMapping } from '@salesforce-ux/sds-metadata';
import { ParsedUnitValue, parseUnitValue, toAlternateUnitValue } from './value-utils';


function isValueMatch(valueToMatch: ParsedUnitValue, sldsValue: ParsedUnitValue): boolean {
  if (!valueToMatch || !sldsValue) {
    return false;
  }

  // For line-height values, compare numbers with a small tolerance
  if (valueToMatch.unit === 'unitless' || sldsValue.unit === 'unitless') {
    const tolerance = 0.001; // Allow small floating point differences
    return Math.abs(valueToMatch.number - sldsValue.number) < tolerance;
  }

  // For other values, compare both unit and number
  return valueToMatch.unit === sldsValue.unit && valueToMatch.number === sldsValue.number;
}

export function getStylingHooksForDensityValue(
  value: string,
  supportedStylinghooks: ValueToStylingHooksMapping,
  cssProperty: string
): string[] {
  if (!value || !cssProperty) {
    throw new Error('Value and cssProperty are required');
  }

  const valueToMatch = parseUnitValue(value);
  if (!valueToMatch) {
    throw new Error('Invalid value format');
  }

  const alternateValue = toAlternateUnitValue(valueToMatch.number, valueToMatch.unit);
  const matchedHooks = [];

  for (const [sldsValue, hooks] of Object.entries(supportedStylinghooks)) {
    const parsedValue = parseUnitValue(sldsValue);
    if (!parsedValue) {
      continue;
    }

    // Compare values using isValueMatch
    if (isValueMatch(valueToMatch, parsedValue)) {
      hooks
        .filter((hook: ValueToStylingHookEntry) => hook.properties.includes(cssProperty))
        .forEach((hook) => matchedHooks.push(hook.name));
      continue;
    }

    // Try alternate value (px to rem or rem to px)
    if (alternateValue && isValueMatch(alternateValue, parsedValue)) {
      hooks
        .filter((hook: ValueToStylingHookEntry) => hook.properties.includes(cssProperty))
        .forEach((hook) => matchedHooks.push(hook.name));
    }
  }
  return matchedHooks;
}