import { getStylingHooksForDensityValue } from '../../../../utils/styling-hook-utils';
import { resolvePropertyToMatch } from '../../../../utils/property-matcher';
import type { ParsedUnitValue } from '../../../../utils/value-utils';
import type { HandlerContext, DeclarationHandler } from '../../../../types';

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
 * Handle density/sizing declarations using CSS tree parsing
 * Supports shorthand properties like padding, margin, etc.
 * Uses css-tree for reliable AST-based parsing
 */
export const handleDensityDeclaration: DeclarationHandler = (node: any, context: HandlerContext) => {
  const cssProperty = node.property.toLowerCase();
  const valueText = context.sourceCode.getText(node.value);
  
  // Process all dimension values and apply shorthand auto-fix
  processDimensionValues(valueText, cssProperty, context, node);
};

/**
 * Check if node should be skipped during dimension traversal
 * Skip CSS functions like calc(), var(), and also color functions 
 */
function shouldSkipDimensionNode(node: any): boolean {
  if (node.type === 'Function') {
    return isCssFunction(node.name) || isCssColorFunction(node.name);
  }
  return false;
}

/**
 * Extract dimension value from CSS AST node for processing
 */
function extractDimensionValue(cssProperty: string) {
  return (node: any): ParsedUnitValue | null => {
    return extractDimensionFromAST(node, cssProperty);
  };
}

/**
 * Process all dimension values in CSS and apply shorthand auto-fix
 */
function processDimensionValues(
  valueText: string,
  cssProperty: string,
  context: HandlerContext,
  node: any
): void {
  const replacements: ReplacementInfo[] = [];
  
  forEachValue(valueText, extractDimensionValue(cssProperty), shouldSkipDimensionNode, (parsedDimension, positionInfo) => {
    if (parsedDimension) {
      const result = getDimensionReplacement(parsedDimension, cssProperty, context, positionInfo);
      if (result) {
        replacements.push(result);
      }
    }
  });
  
  // Apply shorthand auto-fix once all values are processed
  handleShorthandAutoFix(node, context, valueText, replacements);
}

/**
 * Extract parsed dimension value directly from CSS AST nodes
 * Returns structured data with number and unit to eliminate regex parsing
 */
function extractDimensionFromAST(valueNode: any, cssProperty?: string): ParsedUnitValue | null {
  if (!valueNode) return null;
  
  
  switch (valueNode.type) {
    case 'Dimension':
      // Dimensions: 16px, 1rem -> extract value and unit directly from AST
      const numValue = Number(valueNode.value);
      if (numValue === 0) return null; // Skip zero values
      
      const unit = valueNode.unit.toLowerCase();
      if (unit !== 'px' && unit !== 'rem' && unit !== '%') return null; // Support px, rem, and % units
      
      return {
        number: numValue,
        unit: unit as 'px' | 'rem' | '%'
      };
      
    case 'Number':
      // Numbers: 400, 1.5 -> treat as unitless (font-weight, line-height, etc.)
      const numberValue = Number(valueNode.value);
      if (numberValue === 0) return null; // Skip zero values
      
      return {
        number: numberValue,
        unit: null
      };
      
    case 'Percentage':
      // Percentage values: 100%, 50% -> extract value and add % unit
      const percentValue = Number(valueNode.value);
      if (percentValue === 0) return null; // Skip zero values
      
      return {
        number: percentValue,
        unit: '%'
      };
      
    case 'Identifier':
      // Handle named values only for specific properties where we know the mapping
      const namedValue = valueNode.name.toLowerCase();
      
      // Only handle font-weight: normal → 400 conversion
      if (cssProperty === 'font-weight' && namedValue === 'normal') {
        return {
          number: 400,
          unit: null
        };
      }
      
      // For all other properties and unknown keywords, skip processing
      return null;
      
    case 'Value':
      // Value wrapper - extract from first child
      return valueNode.children?.[0] ? extractDimensionFromAST(valueNode.children[0], cssProperty) : null;
  }
  
  return null;
}

/**
 * Get dimension replacement info for shorthand auto-fix
 * Returns replacement data or null if no valid replacement
 */
function getDimensionReplacement(
  parsedDimension: ParsedUnitValue,
  cssProperty: string,
  context: HandlerContext,
  positionInfo: PositionInfo
): ReplacementInfo | null {
  if (!parsedDimension || !positionInfo?.start) {
    return null;
  }

  const rawValue = parsedDimension.unit 
    ? `${parsedDimension.number}${parsedDimension.unit}`
    : parsedDimension.number.toString();

  const propToMatch = resolvePropertyToMatch(cssProperty);
  const closestHooks = getStylingHooksForDensityValue(parsedDimension, context.valueToStylinghook, propToMatch);

  // Calculate position within the CSS value
  const start = positionInfo.start.column - 1; // css-tree uses 1-based columns
  const end = start + rawValue.length;

  if (closestHooks.length === 1) {
    // Has a single hook replacement
    return {
      start,
      end,
      replacement: `var(${closestHooks[0]}, ${rawValue})`,
      displayValue: closestHooks[0],
      hasHook: true
    };
  } else if (closestHooks.length > 1) {
    // Multiple hooks - still has hooks, but no auto-fix
    return {
      start,
      end,
      replacement: rawValue,
      displayValue: closestHooks.join(', '),
      hasHook: true
    };
  } else {
    // No hook or multiple hooks - keep original value
    return {
      start,
      end,
      replacement: rawValue,
      displayValue: rawValue,
      hasHook: false
    };
  }
}



