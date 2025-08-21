import { isTargetProperty } from '../../../../utils/css-utils';
import { findClosestColorHook, convertToHex } from '../../../../utils/color-lib-utils';
import { resolvePropertyToMatch } from '../../../../utils/property-matcher';
import { extractColorValue, shouldSkipValue } from '../../../../utils/valueExtractors';
import type { HandlerContext, DeclarationHandler } from '../../../../utils/types';

/**
 * Handle color declarations using pure CSS AST traversal
 */
export const handleColorDeclaration: DeclarationHandler = (node: any, context: HandlerContext) => {
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

  // Simple color value extraction from CSS AST
  const colorValue = extractColorValue(cssValue);
  if (colorValue) {
    handleSingleColorValue(colorValue, cssProperty, node, context);
  }
};

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
