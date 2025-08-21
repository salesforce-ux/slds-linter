import { isTargetProperty } from '../../../../utils/css-utils';
import { parseBoxShadowValue, isBoxShadowMatch } from '../../../../utils/boxShadowValueParser';
import { shouldSkipValue } from '../../../../utils/valueExtractors';
import { getShadowValueToHookEntries } from '../../../../utils/shadowUtils';
import type { HandlerContext, DeclarationHandler } from '../../../../utils/types';

/**
 * Handle box-shadow values - keep complex parsing but simplify
 */
export const handleBoxShadowDeclaration: DeclarationHandler = (node: any, context: HandlerContext) => {
  const cssProperty = node.property.toLowerCase();
  const cssValue = context.sourceCode.getText(node.value);
  
  // Apply property targeting logic
  if (!isTargetProperty(cssProperty)) {
    return;
  }

  // Skip CSS variables and function calls
  if (shouldSkipValue(cssValue)) {
    return;
  }

  // Use existing box shadow parsing logic
  const shadowHooks = getShadowValueToHookEntries(context.valueToStylinghook);
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
          return fixer.replaceText(node.value, `var(${suggestions[0]}, ${cssValue})`);
        } : undefined;

        if (suggestions.length > 0) {
          context.reportFn({
            node: node.value,
            messageId: 'hardcodedValue',
            data: {
              oldValue: cssValue,
              newValue: suggestions.join(', ')
            },
            fix
          });
        } else {
          context.reportFn({
            node: node.value,
            messageId: 'noReplacement',
            data: {
              oldValue: cssValue
            }
          });
        }
      }
      return;
    }
  }
};
