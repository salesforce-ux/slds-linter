import { getStylingHooksForDensityValue } from '../../../../utils/styling-hook-utils';
import { resolvePropertyToMatch } from '../../../../utils/property-matcher';
import type { HandlerContext, DeclarationHandler } from '../../../../utils/types';

/**
 * Handle density/sizing declarations using CSS AST traversal
 * property filtering is handled by main rule's CSS AST selectors
 */
export const handleDensityDeclaration: DeclarationHandler = (node: any, context: HandlerContext) => {
  const cssProperty = node.property.toLowerCase();
  
  // Extract dimension value directly from CSS AST
  const dimensionValue = extractDimensionFromAST(node.value);
  if (dimensionValue) {
    handleSingleDimensionValue(dimensionValue, cssProperty, node, context);
  }
};

/**
 * Extract dimension value directly from CSS AST nodes
 * Leverages structured AST data instead of regex parsing
 */
function extractDimensionFromAST(valueNode: any): string | null {
  if (!valueNode) return null;
  
  switch (valueNode.type) {
    case 'Dimension':
      // Dimensions: 16px, 1rem -> return "16px", "1rem" (skip zero values)
      return Number(valueNode.value) === 0 ? null : `${valueNode.value}${valueNode.unit}`;
      
    case 'Number':
      // Numbers: 400, 1.5 -> return "400", "1.5" (skip zero values)
      return Number(valueNode.value) === 0 ? null : valueNode.value.toString();
      
    case 'Identifier':
      // Named values: normal, bold -> return if valid font-weight
      const namedValue = valueNode.name.toLowerCase();
      const fontWeightValues = ['normal', 'bold', 'bolder', 'lighter'];
      return fontWeightValues.includes(namedValue) ? namedValue : null;
      
    case 'Value':
      // Value wrapper - extract from first child
      return valueNode.children?.[0] ? extractDimensionFromAST(valueNode.children[0]) : null;
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
