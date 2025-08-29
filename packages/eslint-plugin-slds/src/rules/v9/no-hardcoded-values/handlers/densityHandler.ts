import { getStylingHooksForDensityValue } from '../../../../utils/styling-hook-utils';
import { resolvePropertyToMatch } from '../../../../utils/property-matcher';
import type { ParsedUnitValue } from '../../../../utils/value-utils';
import type { HandlerContext, DeclarationHandler } from '../../../../types';

// Import shared utilities for common logic
import { 
  handleShorthandAutoFix, 
  forEachValueWithPosition, 
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
  
  // For shorthand properties, collect all replacements first
  if (isShorthand) {
    const replacements: ReplacementInfo[] = [];
    
    // Collect all potential replacements
    forEachDimensionValue(valueText, cssProperty, (parsedDimension, positionInfo) => {
      const result = getDimensionReplacement(parsedDimension, cssProperty, context, positionInfo);
      if (result) {
        replacements.push(result);
      }
    });
    
    // Apply shorthand auto-fix if all dimensions have hooks
    handleShorthandAutoFix(node, context, valueText, replacements);
  } else {
    // Use original pattern for single values
    forEachDimensionValue(valueText, cssProperty, (parsedDimension, positionInfo) => {
      handleDimensionValue(parsedDimension, cssProperty, node, positionInfo, false, context);
    });
  }
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
 */
function shouldSkipDimensionNode(): boolean {
  // For dimension counting, we don't skip any nodes
  return false;
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
 * Iterate over dimension values in CSS using optimized css-tree traversal
 * Uses callback pattern to handle each dimension value as it's encountered
 * Supports shorthand properties like padding, margin, etc.
 */
function forEachDimensionValue(valueText: string, cssProperty: string, callback: (parsedDimension: ParsedUnitValue, positionInfo?: PositionInfo) => void): void {
  forEachValueWithPosition(valueText, extractDimensionValue(cssProperty), shouldSkipDimensionNode, callback);
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
      hasHook: true
    };
  } else {
    // No hook or multiple hooks - keep original value
    return {
      start,
      end,
      replacement: rawValue,
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
