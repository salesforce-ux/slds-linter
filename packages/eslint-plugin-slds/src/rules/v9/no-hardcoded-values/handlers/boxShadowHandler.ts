import type { HandlerContext, DeclarationHandler } from '../../../../types';
import type { ValueToStylingHooksMapping } from '@salesforce-ux/sds-metadata';
import { parseBoxShadowValue, isBoxShadowMatch, type BoxShadowValue } from '../../../../utils/boxShadowValueParser';

// Import shared utilities for common logic
import { 
  handleShorthandAutoFix, 
  type ReplacementInfo,
  type PositionInfo
} from '../../../../utils/hardcoded-shared-utils';

/**
 * Check if a CSS value contains CSS variables (var() functions)
 */
function containsCssVariable(valueText: string): boolean {
  return valueText.includes('var(');
}

/**
 * Handle box-shadow declarations using CSS tree parsing
 * Follows the same pattern as color and density handlers but with complete value matching
 */
export const handleBoxShadowDeclaration: DeclarationHandler = (node: any, context: HandlerContext) => {
  const cssProperty = node.property.toLowerCase();
  const valueText = context.sourceCode.getText(node.value);
  
  // Skip if the value contains CSS variables
  if (containsCssVariable(valueText)) {
    return;
  }
  
  // Box-shadow uses complete value matching, not individual value extraction
  handleBoxShadowProps(valueText, cssProperty, context, node);
};

/**
 * Replace box-shadow value with hook in CSS variable format
 */
function replaceBoxShadowWithHook(shadowValue: string, hook: string): string {
  return `var(${hook}, ${shadowValue})`;
}

/**
 * Extract box-shadow hook entries from styling hooks mapping
 */
function shadowValueToHookEntries(supportedStylinghooks: ValueToStylingHooksMapping): Array<[string, string[]]> {
  return Object.entries(supportedStylinghooks).filter(([key, value]) => {
    return value.some((hook) => hook.properties.includes('box-shadow'));
  }).map(([key, value]) => {
    return [key, value.map((hook) => hook.name)];
  });
}

/**
 * Parse and validate box-shadow value
 */
function parseAndValidateBoxShadow(cssValue: string): BoxShadowValue[] | null {
  const parsedCssValue = parseBoxShadowValue(cssValue).filter((shadow) => Object.keys(shadow).length > 0);
  if (parsedCssValue.length === 0) {
    return null;
  }
  return parsedCssValue;
}

/**
 * Handle box-shadow properties by finding and replacing complete values with hooks
 * Unlike other handlers, box-shadow matches complete values rather than individual components
 */
function handleBoxShadowProps(
  valueText: string,
  cssProperty: string,
  context: HandlerContext,
  declarationNode: any
): void {
  const shadowHooks = shadowValueToHookEntries(context.valueToStylinghook);
  const parsedCssValue = parseAndValidateBoxShadow(valueText);
  
  if (!parsedCssValue) {
    return; // No valid box-shadow values found
  }

  // Try to find a matching hook for the complete box-shadow value
  for (const [shadowHookValue, closestHooks] of shadowHooks) {
    const parsedHookValue = parseAndValidateBoxShadow(shadowHookValue);
    
    if (parsedHookValue && isBoxShadowMatch(parsedCssValue, parsedHookValue)) {
      // Found a matching hook - create replacement
      const replacement = createBoxShadowReplacement(
        valueText,
        closestHooks,
        declarationNode,
        context
      );
      
      if (replacement) {
        // Apply the replacement using shared auto-fix logic
        handleShorthandAutoFix(declarationNode, context, valueText, [replacement]);
      }
      return; // Exit after first match
    }
  }
  
  // No matching hooks found - report the value without replacement
  const noReplacementInfo = createBoxShadowReplacement(
    valueText,
    [], // No hooks
    declarationNode,
    context
  );
  
  if (noReplacementInfo) {
    handleShorthandAutoFix(declarationNode, context, valueText, [noReplacementInfo]);
  }
}

/**
 * Create box-shadow replacement info for shorthand auto-fix
 * Handles the complete box-shadow value as a single unit
 */
function createBoxShadowReplacement(
  originalValue: string,
  hooks: string[],
  declarationNode: any,
  context: HandlerContext
): ReplacementInfo | null {
  // For box-shadow, we replace the entire value
  const start = 0;
  const end = originalValue.length;

  if (hooks.length === 1) {
    // Has a single hook replacement
    return {
      start,
      end,
      replacement: replaceBoxShadowWithHook(originalValue, hooks[0]),
      displayValue: hooks[0],
      hasHook: true
    };
  } else if (hooks.length > 1) {
    // Multiple hooks - still has hooks, but no auto-fix
    return {
      start,
      end,
      replacement: originalValue,
      displayValue: hooks.join(', '),
      hasHook: true
    };
  } else {
    // No hooks - keep original value
    return {
      start,
      end,
      replacement: originalValue,
      displayValue: originalValue,
      hasHook: false
    };
  }
}
