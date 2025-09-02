import { findClosestColorHook, convertToHex, isValidColor } from '../../../../utils/color-lib-utils';
import { resolvePropertyToMatch, isShorthandProperty } from '../../../../utils/property-matcher';
import type { HandlerContext, DeclarationHandler } from '../../../../types';

// Import @eslint/css-tree for ESLint-compatible CSS value parsing
import { generate } from '@eslint/css-tree';

// Import CSS function utilities for consistent function detection
import { isCssFunction, isCssColorFunction } from '../../../../utils/css-functions';

// Import shared utilities for common logic
import { 
  handleShorthandAutoFix, 
  forEachValue, 
  countValues,
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
  
  // Get the raw CSS value as string and parse with css-tree
  const valueText = context.sourceCode.getText(node.value);
  
  // Simplified shorthand detection
  const isShorthand = isShorthandProperty(cssProperty);
  const colorCount = countColorValues(valueText);

  if (isShorthand && colorCount > 0) {
    // Pure color shorthand: handle with auto-fix
    forEachColorValue(valueText, (colorValue, positionInfo) => {
      if (colorValue !== 'transparent') {
        // Shorthand auto-fix handled in forEachColorValue
      }
    }, { shorthand: { cssProperty, context, node } });
  } else {
    // Single value properties: handle immediately
    forEachColorValue(valueText, (colorValue, positionInfo) => {
      if (colorValue !== 'transparent') {
        handleColorValue(colorValue, cssProperty, node, context);
      }
    }, { withPositions: true });
  }
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
 * Count all color values in CSS value (excluding functions like var(), calc())
 * Used to detect shorthand properties for auto-fix logic
 */
function countColorValues(valueText: string): number {
  return countValues(valueText, extractColorValue, shouldSkipColorNode);
}

/**
 * Unified function to iterate over color values in CSS
 * Supports both simple iteration and shorthand auto-fix through options
 */
function forEachColorValue(
  valueText: string, 
  callback: (colorValue: string, positionInfo?: PositionInfo) => void | ReplacementInfo,
  options?: { 
    withPositions?: boolean;
    shorthand?: {
      cssProperty: string;
      context: HandlerContext;
      node: any;
    };
  }
): void {
  if (options?.shorthand) {
    // Shorthand mode: collect replacements and apply auto-fix
    const replacements: ReplacementInfo[] = [];
    
    forEachValue(valueText, extractColorValue, shouldSkipColorNode, (colorValue, positionInfo) => {
      if (colorValue !== 'transparent' && isValidColor(colorValue)) {
        const result = getColorReplacement(colorValue, options.shorthand!.cssProperty, options.shorthand!.context, positionInfo!, valueText);
        if (result) {
          replacements.push(result);
        }
      }
      // Call original callback for any additional processing
      callback(colorValue, positionInfo);
    }, { withPositions: true });
    
    // Apply shorthand auto-fix once all values are processed
    handleShorthandAutoFix(options.shorthand.node, options.shorthand.context, valueText, replacements);
  } else {
    // Normal mode: process each value immediately
    forEachValue(valueText, extractColorValue, shouldSkipColorNode, callback, { withPositions: options?.withPositions });
  }
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



/**
 * Handle validated color value and report issues
 * Used for single-value properties (non-shorthand)
 */
function handleColorValue(
  colorValue: string, 
  cssProperty: string, 
  declarationNode: any, 
  context: HandlerContext
) {
  // Skip if this is not actually a valid color (e.g., dimension values like "1px")
  if (!isValidColor(colorValue)) {
    return;
  }
  
  const hexValue = convertToHex(colorValue);
  if (!hexValue) {
    return;
  }

  const propToMatch = resolvePropertyToMatch(cssProperty);
  const closestHooks = findClosestColorHook(hexValue, context.valueToStylinghook, propToMatch);

  if (closestHooks.length > 0) {
    // Create ESLint fix for single suggestions only
    const fix = closestHooks.length === 1 ? (fixer: any) => {
      return fixer.replaceText(declarationNode.value, `var(${closestHooks[0]}, ${colorValue})`);
    } : undefined;

    context.context.report({
      node: declarationNode.value,
      messageId: 'hardcodedValue',
      data: {
        oldValue: colorValue,
        newValue: closestHooks.join(', ')
      },
      fix
    });
  } else {
    // No suggestions available
    context.context.report({
      node: declarationNode.value,
      messageId: 'noReplacement',
      data: {
        oldValue: colorValue
      }
    });
  }
}

