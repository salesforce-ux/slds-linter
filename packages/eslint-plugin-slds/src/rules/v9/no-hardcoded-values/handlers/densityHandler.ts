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
  countValues,
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
  
  // Get the raw CSS value as string and parse with css-tree
  const valueText = context.sourceCode.getText(node.value);
  
  // Detect shorthand by counting dimension tokens
  const isShorthand = countDimensionTokens(valueText) > 1;
  
  // Unified approach: single function handles both shorthand and single values
  forEachDimensionValue(valueText, cssProperty, (parsedDimension, positionInfo) => {
    if (parsedDimension) {
      if (!isShorthand) {
        // For single values, handle immediately
        handleDimensionValue(parsedDimension, cssProperty, node, positionInfo, false, context);
      }
      // For shorthand, the function handles auto-fix internally
    }
  }, isShorthand ? { 
    shorthand: { context, node } 
  } : undefined);
};

/**
 * Extract dimension token from CSS AST node (for counting purposes)
 */
function extractDimensionToken(node: any): boolean | null {
  // Return true for dimensions and numbers (including zeros) to count them
  return node.type === 'Dimension' || node.type === 'Number' ? true : null;
}

/**
 * Check if node should be skipped during dimension traversal
 * Skip CSS functions like calc(), var(), and also color functions 
 * since percentages in color functions should be handled by the color handler
 */
function shouldSkipDimensionNode(node: any): boolean {
  return node.type === 'Function' && (isCssFunction(node.name) || isCssColorFunction(node.name));
}

/**
 * Count all dimension tokens in CSS value (including zeros and invalid values)
 * Used to detect shorthand properties for auto-fix logic
 */
function countDimensionTokens(valueText: string): number {
  return countValues(valueText, extractDimensionToken, shouldSkipDimensionNode);
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
 * Unified function to iterate over dimension values in CSS
 * Supports both simple iteration and shorthand auto-fix through options
 */
function forEachDimensionValue(
  valueText: string, 
  cssProperty: string, 
  callback: (parsedDimension: ParsedUnitValue, positionInfo?: PositionInfo) => void,
  options?: { 
    withPositions?: boolean;
    shorthand?: {
      context: HandlerContext;
      node: any;
    };
  }
): void {
  if (options?.shorthand) {
    // Shorthand mode: collect replacements and apply auto-fix
    const replacements: ReplacementInfo[] = [];
    
    forEachValue(valueText, extractDimensionValue(cssProperty), shouldSkipDimensionNode, (parsedDimension, positionInfo) => {
      if (parsedDimension) {
        const result = getDimensionReplacement(parsedDimension, cssProperty, options.shorthand!.context, positionInfo!);
        if (result) {
          replacements.push(result);
        }
      }
      // Call original callback for any additional processing
      callback(parsedDimension, positionInfo);
    }, { withPositions: true });
    
    // Apply shorthand auto-fix once all values are processed
    handleShorthandAutoFix(options.shorthand.node, options.shorthand.context, valueText, replacements);
  } else {
    // Normal mode: process each value immediately
    forEachValue(valueText, extractDimensionValue(cssProperty), shouldSkipDimensionNode, callback, { withPositions: options?.withPositions });
  }
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



/**
 * Handle dimension value using parsed CSS AST data and report issues
 * Used for single-value properties (non-shorthand)
 */
function handleDimensionValue(
  parsedDimension: ParsedUnitValue, 
  cssProperty: string, 
  declarationNode: any, 
  positionInfo: PositionInfo,
  isShorthand: boolean,
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

  // Create a more specific location node if position info is available
  let reportNode = declarationNode.value;
  
  if (positionInfo?.start) {
    // Calculate the actual column position based on css-tree position info
    const valueStartColumn = declarationNode.value.loc.start.column;
    const dimensionColumn = valueStartColumn + (positionInfo.start.column - 1);
    
    // Create a virtual node with corrected position for better error reporting
    reportNode = {
      ...declarationNode.value,
      loc: {
        ...declarationNode.value.loc,
        start: {
          ...declarationNode.value.loc.start,
          column: dimensionColumn
        },
        end: {
          ...declarationNode.value.loc.end,
          column: dimensionColumn + rawValue.length
        }
      }
    };
  }

  if (closestHooks.length > 0) {
    // Auto-fix for single-value properties only
    const fix = closestHooks.length === 1 ? (fixer: any) => {
      return fixer.replaceText(declarationNode.value, `var(${closestHooks[0]}, ${rawValue})`);
    } : undefined;

    context.context.report({
      node: reportNode,
      messageId: 'hardcodedValue',
      data: {
        oldValue: rawValue,
        newValue: closestHooks.join(', ')
      },
      fix
    });
  } else {
    // No suggestions available
    context.context.report({
      node: reportNode,
      messageId: 'noReplacement',
      data: {
        oldValue: rawValue
      }
    });
  }
}
