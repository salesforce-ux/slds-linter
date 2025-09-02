import { findClosestColorHook, convertToHex, isValidColor } from '../../../../utils/color-lib-utils';
import { resolvePropertyToMatch } from '../../../../utils/property-matcher';
import type { HandlerContext, DeclarationHandler } from '../../../../types';

// Import @eslint/css-tree for ESLint-compatible CSS value parsing
import { generate } from '@eslint/css-tree';

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
  
  // Process all color values and apply shorthand auto-fix
  processColorValues(valueText, cssProperty, context, node);
};

/**
 * Extract color value from CSS AST node
 */
function extractColorValue(node: any): string | null {
  let colorValue: string | null = null;
  
  switch (node.type) {
    case 'Hash':
      colorValue = `#${node.value}`;
      break;
    case 'Identifier':
      colorValue = node.name;
      break;
    case 'Function':
      // Only extract color functions
      if (isCssColorFunction(node.name)) {
        colorValue = generate(node);
      }
      break;
  }
  
  return colorValue && isValidColor(colorValue) ? colorValue : null;
}

/**
 * Check if node should be skipped during traversal
 */
function shouldSkipColorNode(node: any): boolean {
  return node.type === 'Function' && isCssFunction(node.name);
}

/**
 * Process all color values in CSS and apply shorthand auto-fix
 */
function processColorValues(
  valueText: string,
  cssProperty: string,
  context: HandlerContext,
  node: any
): void {
  const replacements: ReplacementInfo[] = [];
  
  forEachValue(valueText, extractColorValue, shouldSkipColorNode, (colorValue, positionInfo) => {
    if (colorValue !== 'transparent' && isValidColor(colorValue)) {
      const result = getColorReplacement(colorValue, cssProperty, context, positionInfo, valueText);
      if (result) {
        replacements.push(result);
      }
    }
  });
  
  // Apply shorthand auto-fix once all values are processed
  handleShorthandAutoFix(node, context, valueText, replacements);
}



/**
 * Get color replacement info for shorthand auto-fix
 * Returns replacement data or null if no valid replacement
 */
function getColorReplacement(
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





