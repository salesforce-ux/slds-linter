import type { ValueToStylingHooksMapping } from '@salesforce-ux/sds-metadata';
import { matchesCssProperty } from './property-matcher';

// Define the structure of a hook
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