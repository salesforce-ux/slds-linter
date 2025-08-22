import { getStylingHooksForDensityValue } from '../../../../utils/styling-hook-utils';
import { resolvePropertyToMatch } from '../../../../utils/property-matcher';
import type { ParsedUnitValue } from '../../../../utils/value-utils';
import type { HandlerContext, DeclarationHandler } from '../../../../utils/types';

/**
 * Handle density/sizing declarations using CSS AST traversal
 * property filtering is handled by main rule's CSS AST selectors
 */
export const handleDensityDeclaration: DeclarationHandler = (node: any, context: HandlerContext) => {
  const cssProperty = node.property.toLowerCase();
  
  // Extract dimension value directly from CSS AST
  const parsedDimension = extractDimensionFromAST(node.value);
  if (parsedDimension) {
    handleSingleDimensionValue(parsedDimension, cssProperty, node, context);
  }
};

/**
 * Extract parsed dimension value directly from CSS AST nodes
 * Returns structured data with number and unit to eliminate regex parsing
 */
function extractDimensionFromAST(valueNode: any): ParsedUnitValue | null {
  if (!valueNode) return null;
  
  switch (valueNode.type) {
    case 'Dimension':
      // Dimensions: 16px, 1rem -> extract value and unit directly from AST
      const numValue = Number(valueNode.value);
      if (numValue === 0) return null; // Skip zero values
      
      const unit = valueNode.unit.toLowerCase();
      if (unit !== 'px' && unit !== 'rem') return null; // Only support px and rem
      
      return {
        number: numValue,
        unit: unit as 'px' | 'rem'
      };
      
    case 'Number':
      // Numbers: 400, 1.5 -> treat as unitless (font-weight, line-height, etc.)
      const numberValue = Number(valueNode.value);
      if (numberValue === 0) return null; // Skip zero values
      
      return {
        number: numberValue,
        unit: null
      };
      
    case 'Identifier':
      // Named values: normal, bold -> handle font-weight keywords
      const namedValue = valueNode.name.toLowerCase();
      const fontWeightMap: Record<string, number> = {
        'normal': 400,
        'bold': 700,
        'bolder': 900,
        'lighter': 300
      };
      
      if (fontWeightMap[namedValue]) {
        return {
          number: fontWeightMap[namedValue],
          unit: null, // Font weights are unitless but we need a unit for consistency
        };
      }
      return null;
      
    case 'Value':
      // Value wrapper - extract from first child
      return valueNode.children?.[0] ? extractDimensionFromAST(valueNode.children[0]) : null;
  }
  
  return null;
}

/**
 * Handle a single dimension value using parsed CSS AST data
 */
function handleSingleDimensionValue(
  parsedDimension: ParsedUnitValue, 
  cssProperty: string, 
  declarationNode: any, 
  context: HandlerContext
) {
  if (!parsedDimension) {
    return;
  }

  // Reconstruct raw value from parsed data for reporting
  const rawValue = parsedDimension.unit 
    ? `${parsedDimension.number}${parsedDimension.unit}`
    : parsedDimension.number.toString();

  const propToMatch = resolvePropertyToMatch(cssProperty);
  const closestHooks = getStylingHooksForDensityValue(parsedDimension, context.valueToStylinghook, propToMatch);

  if (closestHooks.length > 0) {
    // Create ESLint fix for single suggestions only
    const fix = closestHooks.length === 1 ? (fixer: any) => {
      return fixer.replaceText(declarationNode.value, `var(${closestHooks[0]}, ${rawValue})`);
    } : undefined;

    context.reportFn({
      node: declarationNode.value,
      messageId: 'hardcodedValue',
      data: {
        oldValue: rawValue,
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
        oldValue: rawValue
      }
    });
  }
}
