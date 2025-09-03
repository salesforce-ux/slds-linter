import { findClosestColorHook, convertToHex, isValidColor, extractColorValue } from '../../../../utils/color-lib-utils';
import { resolvePropertyToMatch } from '../../../../utils/property-matcher';
import type { HandlerContext, DeclarationHandler } from '../../../../types';

// Import CSS function utilities for consistent function detection
import { isCssFunction, isCssColorFunction } from '../../../../utils/css-functions';

// Import shared utilities for common logic
import { 
  handleShorthandAutoFix, 
  forEachValue,
  type ReplacementInfo,
  type PositionInfo
} from '../../../../utils/hardcoded-shared-utils';

/**
 * Handle color declarations using CSS tree parsing
 * Supports shorthand properties like background, border, etc.  
 * Uses css-tree for reliable AST-based parsing + chroma-js validation
 */
export const handleColorDeclaration: DeclarationHandler = (node: any, context: HandlerContext) => {
  const cssProperty = node.property.toLowerCase();
  const valueText = context.sourceCode.getText(node.value);
  const replacements: ReplacementInfo[] = [];
  
  forEachValue(valueText, extractColorValue, shouldSkipColorNode, (colorValue, positionInfo) => {
    if (colorValue !== 'transparent' && isValidColor(colorValue)) {
      const replacement = createColorReplacement(colorValue, cssProperty, context, positionInfo, valueText);
      if (replacement) {
        replacements.push(replacement);
      }
    }
  });
  
  // Apply shorthand auto-fix once all values are processed
  handleShorthandAutoFix(node, context, valueText, replacements);
};



/**
 * Check if node should be skipped during traversal
 */
function shouldSkipColorNode(node: any): boolean {
  return node.type === 'Function' && isCssFunction(node.name);
}





/**
 * Create color replacement info for shorthand auto-fix
 * Returns replacement data or null if no valid replacement
 */
function createColorReplacement(
  colorValue: string,
  cssProperty: string,
  context: HandlerContext,
  positionInfo: PositionInfo,
  originalValueText?: string
): ReplacementInfo | null {
  if (!positionInfo?.start) {
    return null;
  }

  const hexValue = convertToHex(colorValue);
  if (!hexValue) {
    return null;
  }

  const propToMatch = resolvePropertyToMatch(cssProperty);
  const closestHooks = findClosestColorHook(hexValue, context.valueToStylinghook, propToMatch);

  // Use position information directly from CSS tree (already 0-based offsets)
  const start = positionInfo.start.offset;
  const end = positionInfo.end.offset;
  
  // Extract the original value from the CSS text to preserve spacing
  const originalValue = originalValueText ? originalValueText.substring(start, end) : colorValue;

  if (closestHooks.length === 1) {
    // Has a single hook replacement - should provide autofix
    return {
      start,
      end,
      replacement: `var(${closestHooks[0]}, ${colorValue})`,
      displayValue: closestHooks[0],
      hasHook: true
    };
  } else if (closestHooks.length > 1) {
    // Multiple hooks - still has hooks, but no auto-fix
    return {
      start,
      end,
      replacement: originalValue,  // Use original value to preserve spacing
      displayValue: closestHooks.join(', '),
      hasHook: true  // ← THE FIX: Multiple hooks still means "has hooks"
    };
  } else {
    // No hooks - keep original value
    return {
      start,
      end,
      replacement: originalValue,  // Use original value to preserve spacing
      displayValue: originalValue,
      hasHook: false
    };
  }
}





