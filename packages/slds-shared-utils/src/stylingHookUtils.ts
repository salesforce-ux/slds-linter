import type { ValueToStylingHooksMapping } from '@salesforce-ux/sds-metadata';
import { matchesCssProperty } from './propertyMatcher';
import { addOnlyUnique } from './util';
import { toAlternateUnitValue } from './valueUtils';

export interface Hook {
  name: string;
  properties: string[];
}

export const findExactMatchStylingHook = (
  cssValue: string,
  supportedStylinghooks: ValueToStylingHooksMapping,
  cssProperty: string
): string[] => {
  let matchedHooks: string[] = [];
  if (cssValue in supportedStylinghooks) {
    const hooks = supportedStylinghooks[cssValue] || [];
    matchedHooks = hooks
      .filter((hook: Hook) => {
        return matchesCssProperty(hook.properties, cssProperty);
      })
      .map((hook) => hook.name);
  }
  return matchedHooks;
};

export function getStylingHooksForDensityValue(
  value: string,
  supportedStylinghooks: ValueToStylingHooksMapping,
  cssProperty: string
): string[] {  
    const alternateValue = toAlternateUnitValue(value);
    let closestHooks = findExactMatchStylingHook(
      value,
      supportedStylinghooks,
      cssProperty
    );

    const alternateHooks = alternateValue ? findExactMatchStylingHook(
      alternateValue,
      supportedStylinghooks,
      cssProperty
    ) : [];

    return addOnlyUnique(closestHooks, alternateHooks);
} 