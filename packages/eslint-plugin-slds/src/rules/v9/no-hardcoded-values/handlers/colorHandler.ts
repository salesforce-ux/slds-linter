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
  forEachValueWithPosition, 
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
  
  // Detect shorthand by counting color values
  const isShorthand = countColorValues(valueText) > 1;
  
  // For shorthand properties, collect all replacements first
  if (isShorthand) {
    const replacements: ReplacementInfo[] = [];
    
    // Collect all potential replacements
    forEachColorValueWithPosition(valueText, (colorValue, positionInfo) => {
      if (colorValue !== 'transparent') {
        const result = getColorReplacement(colorValue, cssProperty, context, positionInfo);
        if (result) {
          replacements.push(result);
        }
      }
    });
    
    // Apply shorthand auto-fix if any colors have hooks
    handleShorthandAutoFix(node, context, valueText, replacements);
  } else {
    // Use original pattern for single values
    forEachColorValue(valueText, (colorValue) => {
      if (colorValue !== 'transparent') {
        handleColorValue(colorValue, cssProperty, node, context);
      }
    });
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
 * Iterate over color values in CSS using optimized css-tree traversal
 * Uses callback pattern to handle each color value as it's encountered
 * Uses this.skip to efficiently prevent traversing skip function children
 */
function forEachColorValue(valueText: string, callback: (colorValue: string) => void): void {
  forEachValue(valueText, extractColorValue, shouldSkipColorNode, callback);
}

/**
 * Iterate over color values in CSS with position tracking for shorthand auto-fix
 * Uses callback pattern to handle each color value with position info
 */
function forEachColorValueWithPosition(valueText: string, callback: (colorValue: string, positionInfo?: PositionInfo) => void): void {
  forEachValueWithPosition(valueText, extractColorValue, shouldSkipColorNode, callback);
}



/**
 * Get color replacement info for shorthand auto-fix
 * Returns replacement data or null if no valid replacement
 */
function getColorReplacement(
  colorValue: string,
  cssProperty: string,
  context: HandlerContext,
  positionInfo: PositionInfo
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

  // Calculate position within the CSS value
  const start = positionInfo.start.column - 1; // css-tree uses 1-based columns
  const end = start + colorValue.length;

  if (closestHooks.length === 1) {
    // Has a single hook replacement
    return {
      start,
      end,
      replacement: `var(${closestHooks[0]}, ${colorValue})`,
      displayValue: closestHooks[0],
      hasHook: true
    };
  } else {
    // No hook or multiple hooks - keep original value
    return {
      start,
      end,
      replacement: colorValue,
      displayValue: colorValue,
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
