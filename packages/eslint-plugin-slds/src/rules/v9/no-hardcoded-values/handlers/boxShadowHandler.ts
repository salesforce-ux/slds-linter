import type { HandlerContext, DeclarationHandler } from '../../../../types';
import type { ValueToStylingHooksMapping } from '@salesforce-ux/sds-metadata';
import { parseBoxShadowValue, isBoxShadowMatch, type BoxShadowValue } from '../../../../utils/boxShadowValueParser';
import { formatSuggestionHooks } from '../../../../utils/css-utils';
import { getCustomMapping } from '../../../../utils/custom-mapping-utils';

// Import shared utilities for common logic
import { 
  handleShorthandAutoFix, 
  type ReplacementInfo,
  type PositionInfo
} from '../../../../utils/hardcoded-shared-utils';

/**
 * Convert CSS value to parsed box-shadow values, filtering out empty ones
 */
function toBoxShadowValue(cssValue: string): BoxShadowValue[] | null {
  const parsedCssValue = parseBoxShadowValue(cssValue).filter((shadow) => Object.keys(shadow).length > 0);
  if (parsedCssValue.length === 0) {
    return null;
  }
  return parsedCssValue;
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
 * Report box-shadow violation with hooks and apply auto-fix
 */
function reportBoxShadowViolation(
  node: any,
  context: HandlerContext,
  valueText: string,
  hooks: string[]
): void {
  const positionInfo: PositionInfo = {
    start: { offset: 0, line: 1, column: 1 },
    end: { offset: valueText.length, line: 1, column: valueText.length + 1 }
  };
  
  const replacement = createBoxShadowReplacement(
    valueText,
    hooks,
    context,
    positionInfo
  );
  
  if (replacement) {
    const replacements: ReplacementInfo[] = [replacement];
    handleShorthandAutoFix(node, context, valueText, replacements);
  }
}

/**
 * Handle box-shadow declarations using CSS tree parsing
 */
export const handleBoxShadowDeclaration: DeclarationHandler = (node: any, context: HandlerContext) => {
  const cssProperty = node.property.toLowerCase();
  const valueText = context.sourceCode.getText(node.value);
  
  // Check custom mapping first
  const customHook = getCustomMapping(cssProperty, valueText, context.options?.customMapping);
  if (customHook) {
    reportBoxShadowViolation(node, context, valueText, [customHook]);
    return;
  }

  const shadowHooks = shadowValueToHookEntries(context.valueToStylinghook);
  const parsedCssValue = toBoxShadowValue(valueText);
  if (!parsedCssValue) {
    return;
  }

  // Look for matching hooks in metadata
  for (const [shadow, closestHooks] of shadowHooks) {
    const parsedValueHook = toBoxShadowValue(shadow);
    if (parsedValueHook && isBoxShadowMatch(parsedCssValue, parsedValueHook)) {
      if (closestHooks.length > 0) {
        reportBoxShadowViolation(node, context, valueText, closestHooks);
      }
      return;
    }
  }
  
  // If no hooks found, silently ignore - don't report any violations
};


/**
 * Create box-shadow replacement info for shorthand auto-fix
 * Only called when hooks are available (hooks.length > 0)
 * Returns replacement data or null if invalid position info
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
  } else {
    // Multiple hooks - still has hooks, but no auto-fix
    return {
      start,
      end,
      replacement: originalValue,
      displayValue: formatSuggestionHooks(hooks),
      hasHook: true
    };
  }
}
