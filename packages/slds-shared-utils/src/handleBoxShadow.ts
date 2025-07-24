import { ValueToStylingHooksMapping } from '@salesforce-ux/sds-metadata';
import { parseBoxShadowValue, isBoxShadowMatch } from './boxShadowValueParser';

/**
 * Shared handler for box-shadow logic.
 * Returns the matching hooks if found, otherwise undefined.
 */
export function findBoxShadowHooks(
  cssValue: string,
  supportedStylinghooks: ValueToStylingHooksMapping
): string[] | undefined {
  const shadowHooks = Object.entries(supportedStylinghooks)
    .filter(([_, value]) => value.some((hook) => hook.properties.includes('box-shadow')))
    .map(([key, value]) => [key, value.map((hook) => hook.name)]);

  const parsedCssValue = parseBoxShadowValue(cssValue);
  if (!parsedCssValue) return undefined;

  for (const [shadow, closestHooks] of shadowHooks) {
    const parsedValueHook = parseBoxShadowValue(shadow as string);
    if (parsedValueHook && isBoxShadowMatch(parsedCssValue, parsedValueHook)) {
      return closestHooks as string[];
    }
  }
  
  return undefined;
}

/**
 * Simple shared handler for box-shadow logic.
 * Handles parsing, matching, and delegates reporting to plugin-specific callback.
 */
export function handleBoxShadowShared(
  decl: any,
  cssValue: string,
  cssValueStartIndex: number,
  supportedStylinghooks: ValueToStylingHooksMapping,
  reportProps: any,
  messages: any,
  reportFn: Function,
  makeFix: (decl: any, closestHooks: string[], value: string) => any
) {
  const closestHooks = findBoxShadowHooks(cssValue, supportedStylinghooks);
  
  if (closestHooks && closestHooks.length > 0) {
    const fix = makeFix(decl, closestHooks, cssValue);
    reportFn(decl, closestHooks, cssValueStartIndex, reportProps, messages, fix);
  }
} 