import { findClosestColorHook, convertToHex } from '../../../../utils/color-lib-utils';
import { resolvePropertyToMatch } from '../../../../utils/property-matcher';
import type { HandlerContext, DeclarationHandler } from '../../../../utils/types';

/**
 * Handle color declarations using CSS AST traversal
 * property filtering is handled by main rule's CSS AST selectors
 */
export const handleColorDeclaration: DeclarationHandler = (node: any, context: HandlerContext) => {
  const cssProperty = node.property.toLowerCase();
  
  // Extract color value directly from CSS AST
  const colorValue = extractColorFromAST(node.value);
  if (colorValue) {
    handleSingleColorValue(colorValue, cssProperty, node, context);
  }
};

/**
 * Extract color value directly from CSS AST nodes
 * Leverages structured AST data instead of string parsing
 */
function extractColorFromAST(valueNode: any): string | null {
  if (!valueNode) return null;
  
  switch (valueNode.type) {
    case 'Hash':
      // Hex colors: #05628a -> return "#05628a"
      return `#${valueNode.value}`;
      
    case 'Identifier':
      // Named colors: red -> return "red" (skip transparent)
      const colorName = valueNode.name.toLowerCase();
      return colorName === 'transparent' ? null : colorName;
      
    case 'Value':
      // Value wrapper - extract from first child
      return valueNode.children?.[0] ? extractColorFromAST(valueNode.children[0]) : null;
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
