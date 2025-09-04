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
 */
export const handleBoxShadowDeclaration: DeclarationHandler = (node: any, context: HandlerContext) => {
  const cssProperty = node.property.toLowerCase();
  const valueText = context.sourceCode.getText(node.value);
  
  // Skip if the value contains CSS variables
  if (containsCssVariable(valueText)) {
    return;
  }
  
  // Box-shadow uses complete value matching, not individual value extraction
  const replacements: ReplacementInfo[] = [];
  
  // Parse and find matching hooks for the complete box-shadow value
  const parsedCssValue = parseAndValidateBoxShadow(valueText);
  if (parsedCssValue) {
    const shadowHooks = getBoxShadowHooks(context.valueToStylinghook);
    const closestHooks = findMatchingBoxShadowHooks(parsedCssValue, shadowHooks);
    
    // Create position info for the entire box-shadow value
    // hardcoded position is needed for string manipulation, not error reporting
    const positionInfo: PositionInfo = {
      start: { offset: 0, line: 1, column: 1 },
      end: { offset: valueText.length, line: 1, column: valueText.length + 1 }
    };
    
    const replacement = createBoxShadowReplacement(
      valueText,
      closestHooks,
      context,
      positionInfo
    );
    
    if (replacement) {
      replacements.push(replacement);
    }
  }
  
  // Apply shorthand auto-fix once processing is complete
  handleShorthandAutoFix(node, context, valueText, replacements);
};


/**
 * Extract box-shadow hook entries from styling hooks mapping
 */
function getBoxShadowHooks(supportedStylinghooks: ValueToStylingHooksMapping): Array<[string, string[]]> {
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
 * Find matching hooks for a parsed box-shadow value
 */
function findMatchingBoxShadowHooks(
  parsedCssValue: BoxShadowValue[], 
  shadowHooks: Array<[string, string[]]>
): string[] {
  // Try to find a matching hook for the complete box-shadow value
  for (const [shadowHookValue, closestHooks] of shadowHooks) {
    const parsedHookValue = parseAndValidateBoxShadow(shadowHookValue);
    
    if (parsedHookValue && isBoxShadowMatch(parsedCssValue, parsedHookValue)) {
      return closestHooks;
    }
  }
  
  return []; // No matching hooks found
}

/**
 * Create box-shadow replacement info for shorthand auto-fix
 * Returns replacement data or null if no valid replacement
 */
function createBoxShadowReplacement(
  originalValue: string,
  hooks: string[],
  context: HandlerContext,
  positionInfo: PositionInfo
): ReplacementInfo | null {
  if (!positionInfo?.start) {
    return null;
  }

  // Use position information directly from CSS tree (already 0-based offsets)
  const start = positionInfo.start.offset;
  const end = positionInfo.end.offset;

  if (hooks.length === 1) {
    // Has a single hook replacement - should provide autofix
    return {
      start,
      end,
      replacement: `var(${hooks[0]}, ${originalValue})`,
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
