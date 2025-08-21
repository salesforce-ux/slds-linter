import { isTargetProperty } from '../../../../utils/css-utils';
import { findClosestColorHook, convertToHex } from '../../../../utils/color-lib-utils';
import { resolvePropertyToMatch } from '../../../../utils/property-matcher';
import { shouldSkipValue } from '../../../../utils/valueExtractors';
import type { HandlerContext, DeclarationHandler } from '../../../../utils/types';

/**
 * Handle color declarations using CSS AST traversal
 */
export const handleColorDeclaration: DeclarationHandler = (node: any, context: HandlerContext) => {
  const cssProperty = node.property.toLowerCase();
  
  // Apply property targeting logic
  if (!isTargetProperty(cssProperty)) {
    return;
  }

  // Get the raw CSS value string for skip checks
  const cssValue = context.sourceCode.getText(node.value);
  
  // Skip CSS variables and function calls
  if (shouldSkipValue(cssValue)) {
    return;
  }

  // Extract color value directly from CSS AST
  const colorValue = extractColorFromAST(node.value);
  if (colorValue) {
    handleSingleColorValue(colorValue, cssProperty, node, context);
  }
};

/**
 * Extract color value directly from CSS AST nodes
 * Handles Value wrappers and direct Hash/Identifier nodes
 */
function extractColorFromAST(valueNode: any): string | null {
  if (!valueNode) return null;
  
  switch (valueNode.type) {
    case 'Hash':
      // Direct hex colors: #ff0000, #05628a
      return `#${valueNode.value}`;
      
    case 'Identifier':
      // Direct named colors: red, blue, etc. (skip transparent)
      const colorName = valueNode.name.toLowerCase();
      if (colorName === 'transparent') {
        return null;
      }
      
      return colorName;
      
    case 'Value':
      // Value wrapper - extract from first child (typical structure)
      if (valueNode.children?.[0]) {
        return extractColorFromAST(valueNode.children[0]);
      }
      break;
  }
  
  return null;
}

/**
 * Handle a single color value using CSS AST
 */
function handleSingleColorValue(
  colorValue: string, 
  cssProperty: string, 
  declarationNode: any, 
  context: HandlerContext
) {
  // Skip transparent and invalid colors
  if (!colorValue || colorValue === 'transparent') {
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

    context.reportFn({
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
    context.reportFn({
      node: declarationNode.value,
      messageId: 'noReplacement',
      data: {
        oldValue: colorValue
      }
    });
  }
}
