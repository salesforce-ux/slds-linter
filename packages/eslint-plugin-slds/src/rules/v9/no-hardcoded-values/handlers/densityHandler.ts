import { isTargetProperty } from '../../../../utils/css-utils';
import { getStylingHooksForDensityValue } from '../../../../utils/styling-hook-utils';
import { resolvePropertyToMatch } from '../../../../utils/property-matcher';
import { shouldSkipValue } from '../../../../utils/valueExtractors';
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

  // Extract dimension value directly from CSS AST
  const dimensionValue = extractDimensionFromAST(node.value);
  if (dimensionValue) {
    handleSingleDimensionValue(dimensionValue, cssProperty, node, context);
  }
};

/**
 * Extract dimension value directly from CSS AST nodes
 * Uses structured AST access instead of regex parsing
 */
function extractDimensionFromAST(valueNode: any): string | null {
  if (!valueNode) return null;
  
  switch (valueNode.type) {
    case 'Dimension':
      // Dimensions with units: 16px, 1rem, 0.875rem, etc.
      if (Number(valueNode.value) === 0) {
        return null;
      }
      return `${valueNode.value}${valueNode.unit}`;
      
    case 'Number':
      // Numbers without units: 400 (font-weight), 1.5 (line-height)
      if (Number(valueNode.value) === 0) {
        return null;
      }
      return valueNode.value.toString();
      
    case 'Identifier':
      // Named font-weight values: normal, bold, bolder, lighter
      const namedValue = valueNode.name.toLowerCase();
      const fontWeightValues = ['normal', 'bold', 'bolder', 'lighter'];
      return fontWeightValues.includes(namedValue) ? namedValue : null;
      
    case 'Value':
      // Value wrapper - extract from first child (typical structure)
      if (valueNode.children?.[0]) {
        return extractDimensionFromAST(valueNode.children[0]);
      }
      break;
  }
  
  return null;
}

/**
 * Handle a single dimension value using CSS AST
 */
function handleSingleDimensionValue(
  dimensionValue: string, 
  cssProperty: string, 
  declarationNode: any, 
  context: HandlerContext
) {
  if (!dimensionValue) {
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
