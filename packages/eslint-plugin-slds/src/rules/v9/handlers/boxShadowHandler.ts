import type { ValueToStylingHooksMapping } from '@salesforce-ux/sds-metadata';
import { parseBoxShadowValue, isBoxShadowMatch, BoxShadowValue } from '../../../utils/boxShadowValueParser';

/**
 * Box Shadow Handler for ESLint - handles complex box-shadow value parsing and matching
 * Migrated from the Stylelint implementation with ESLint-specific reporting
 */
export function handleBoxShadow(
  decl: any,
  cssValue: string,
  cssValueStartIndex: number,
  supportedStylinghooks: ValueToStylingHooksMapping,
  reportProps: any,
  messages: any,
  reportFn: Function
) {
  const shadowHooks = getShadowValueToHookEntries(supportedStylinghooks);
  const parsedCssValue = parseBoxShadowValue(cssValue);
  
  if (!parsedCssValue || parsedCssValue.length === 0) {
    return;
  }

  // Filter out empty shadow objects
  const validShadows = parsedCssValue.filter((shadow) => Object.entries(shadow).length > 0);
  if (validShadows.length === 0) {
    return;
  }

  // Find matching hook
  for (const [shadowValue, hookNames] of shadowHooks) {
    const parsedHookValue = parseBoxShadowValue(shadowValue);
    if (parsedHookValue && isBoxShadowMatch(validShadows, parsedHookValue)) {
      if (hookNames.length > 0) {
        const suggestions = hookNames;
        
        // ESLint fix function
        const fix = suggestions.length === 1 ? (fixer: any) => {
          const eslintNode = decl.__eslintNode;
          if (!eslintNode || !eslintNode.value || !eslintNode.value.loc) return null;
          
          const valueStart = eslintNode.value.loc.start.offset;
          const valueEnd = eslintNode.value.loc.end.offset;
          return fixer.replaceTextRange(
            [valueStart, valueEnd],
            `var(${suggestions[0]}, ${cssValue})`
          );
        } : null;

        const message = suggestions.length > 0 
          ? messages.hardcodedValue
              .replace('{{oldValue}}', cssValue)
              .replace('{{newValue}}', suggestions.join(', '))
          : messages.noReplacement.replace('{{oldValue}}', cssValue);

        reportFn({
          ...reportProps,
          message,
          fix
        });
      }
      return;
    }
  }
}

/**
 * Extract shadow values and their corresponding hooks from the styling hooks mapping
 */
function getShadowValueToHookEntries(supportedStylinghooks: ValueToStylingHooksMapping): Array<[string, string[]]> {
  return Object.entries(supportedStylinghooks)
    .filter(([_, value]) => value.some((hook) => hook.properties.includes('box-shadow')))
    .map(([key, value]) => [key, value.map((hook) => hook.name)]);
}
