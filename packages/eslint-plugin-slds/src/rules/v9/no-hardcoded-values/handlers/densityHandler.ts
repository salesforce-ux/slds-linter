import { isTargetProperty } from '../../../../utils/css-utils';
import { getStylingHooksForDensityValue } from '../../../../utils/styling-hook-utils';
import { resolvePropertyToMatch } from '../../../../utils/property-matcher';
import { extractDimensionValue, shouldSkipValue, isDimensionValue } from '../../../../utils/valueExtractors';
import type { HandlerContext, DeclarationHandler } from '../../../../utils/types';

/**
 * Handle density/sizing declarations using pure CSS AST traversal
 */
export const handleDensityDeclaration: DeclarationHandler = (node: any, context: HandlerContext) => {
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

  // Simple dimension value extraction from CSS AST
  const dimensionValue = extractDimensionValue(cssValue);
  if (dimensionValue) {
    handleSingleDimensionValue(dimensionValue, cssProperty, node, context);
  }
};

/**
 * Handle a single dimension value using CSS AST
 */
function handleSingleDimensionValue(
  dimensionValue: string, 
  cssProperty: string, 
  declarationNode: any, 
  context: HandlerContext
) {
  if (!dimensionValue || !isDimensionValue(dimensionValue)) {
    return;
  }

  const propToMatch = resolvePropertyToMatch(cssProperty);
  const closestHooks = getStylingHooksForDensityValue(dimensionValue, context.valueToStylinghook, propToMatch);

  if (closestHooks.length > 0) {
    // Create ESLint fix for single suggestions only
    const fix = closestHooks.length === 1 ? (fixer: any) => {
      return fixer.replaceText(declarationNode.value, `var(${closestHooks[0]}, ${dimensionValue})`);
    } : undefined;

    context.reportFn({
      node: declarationNode.value,
      messageId: 'hardcodedValue',
      data: {
        oldValue: dimensionValue,
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
        oldValue: dimensionValue
      }
    });
  }
}
