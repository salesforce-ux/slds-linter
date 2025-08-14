import type { ValueToStylingHookEntry, ValueToStylingHooksMapping } from '@salesforce-ux/sds-metadata';
import { ParsedUnitValue, parseUnitValue, toAlternateUnitValue } from './value-utils';


function isValueMatch(valueToMatch: ParsedUnitValue, sldsValue: ParsedUnitValue): boolean {
  if (!valueToMatch || !sldsValue) {
    return false;
  }
  return valueToMatch.unit === sldsValue.unit && valueToMatch.number === sldsValue.number;
}

export function getStylingHooksForDensityValue(
  value: string,
  supportedStylinghooks: ValueToStylingHooksMapping,
  cssProperty: string
): string[] {
  const valueToMatch = parseUnitValue(value);
  if (!valueToMatch) {
    return [];
  }
  const alternateValue = toAlternateUnitValue(valueToMatch.number, valueToMatch.unit);
  const matchedHooks = [];

  for (const [sldsValue, hooks] of Object.entries(supportedStylinghooks)) {
    const parsedValue = parseUnitValue(sldsValue);
    if (isValueMatch(valueToMatch, parsedValue) || isValueMatch(alternateValue, parsedValue)) {
      hooks
        .filter((hook: ValueToStylingHookEntry) => hook.properties.includes(cssProperty))
        .forEach((hook) => matchedHooks.push(hook.name));
    }
  }
  return matchedHooks;
}