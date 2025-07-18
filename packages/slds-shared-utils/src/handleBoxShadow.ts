import { ValueToStylingHooksMapping } from '@salesforce-ux/sds-metadata';
import { parseBoxShadowValue, isBoxShadowMatch, BoxShadowValue } from './boxShadowValueParser';

/**
 * Shared handler for box-shadow logic.
 * - Handles parsing, matching, and delegates reporting/fixing to plugin-specific callbacks.
 *
 * @param decl - The declaration node (plugin-specific)
 * @param cssValue - The CSS value string
 * @param cssValueStartIndex - Start index for value in source
 * @param supportedStylinghooks - Map of supported styling hooks
 * @param reportProps - Additional report properties
 * @param messages - Message object for reporting
 * @param reportFn - Plugin-specific reporting function
 * @param makeFix - Plugin-specific fix callback factory
 */
export function handleBoxShadowShared(
  decl: any,
  cssValue: string,
  cssValueStartIndex: number,
  supportedStylinghooks: ValueToStylingHooksMapping,
  reportProps: Partial<any>,
  messages: any,
  reportFn: Function,
  makeFix: (decl: any, closestHooks: string[], value: string) => any
) {
  const shadowHooks = Object.entries(supportedStylinghooks)
    .filter(([_, value]) => value.some((hook) => hook.properties.includes('box-shadow')))
    .map(([key, value]) => [key, value.map((hook) => hook.name)]);

  const parsedCssValue = parseBoxShadowValue(cssValue);
  if (!parsedCssValue) return;

  for (const [shadow, closestHooks] of shadowHooks) {
    const parsedValueHook = parseBoxShadowValue(shadow as string);
    if (parsedValueHook && isBoxShadowMatch(parsedCssValue, parsedValueHook)) {
      const fix = makeFix(decl, closestHooks as string[], cssValue);
      if ((closestHooks as string[]).length > 0) {
        reportFn(
          decl,
          Array.isArray(closestHooks) ? closestHooks : [closestHooks],
          cssValueStartIndex,
          reportProps,
          messages,
          fix
        );
      }
      return;
    }
  }
} 