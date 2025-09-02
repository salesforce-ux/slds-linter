import { getStylingHooksForDensityValue } from '../../../../utils/styling-hook-utils';
import { resolvePropertyToMatch } from '../../../../utils/property-matcher';
import type { ParsedUnitValue } from '../../../../utils/value-utils';
import type { HandlerContext, DeclarationHandler } from '../../../../types';

// Import shared utilities for common logic
import { 
  handleShorthandAutoFix, 
  forEachValue,
  type ReplacementInfo,
  type PositionInfo
} from '../../../../utils/hardcoded-shared-utils';

/**
 * Handle font declarations including shorthand property
 * font-size and font-weight are dimension-like values
 */
export const handleFontDeclaration: DeclarationHandler = (node: any, context: HandlerContext) => {
  const cssProperty = node.property.toLowerCase();
  const valueText = context.sourceCode.getText(node.value);
  
  // Process font values
  handleFontProps(valueText, cssProperty, context, node);
};

/**
 * Extract font-related values from CSS AST node
 * Simplified to focus only on font-specific validation while reusing dimension logic
 */
function extractFontValue(node: any, cssProperty: string): ParsedUnitValue | null {
  if (!node) return null;
  
  switch (node.type) {
    case 'Dimension':
      // Font-size: 16px, 1rem, etc. (same as density handler)
      const numValue = Number(node.value);
      if (numValue <= 0) return null; // Skip zero/negative values
      
      const unit = node.unit.toLowerCase();
      if (unit !== 'px' && unit !== 'rem' && unit !== '%') return null;
      
      return {
        number: numValue,
        unit: unit as 'px' | 'rem' | '%'
      };
      
    case 'Number':
      // Font-weight: 400, 700, etc. or unitless font-size
      const numberValue = Number(node.value);
      if (numberValue <= 0) {
        return null; // Skip zero/negative values
      } else if (numberValue >= 1 && numberValue <= 3) {
        // This looks like a line-height value - skip it
        return null;
      }
      
      return {
        number: numberValue,
        unit: null
      };
      
    case 'Identifier':
      // Font-weight keywords: normal, bold, etc.
      const namedValue = node.name.toLowerCase();
      
      if (namedValue === 'normal') {
        return { number: 400, unit: null };
      } else if (namedValue === 'bold') {
        return { number: 700, unit: null };
      }
      
      return null;
      
    case 'Percentage':
      // Percentage values for font-size
      const percentValue = Number(node.value);
      if (percentValue === 0) return null; // Skip zero values
      
      return {
        number: percentValue,
        unit: '%'
      };
      
    case 'Value':
      // Value wrapper - extract from first child
      return node.children?.[0] ? extractFontValue(node.children[0], cssProperty) : null;
  }
  
  return null;
}

/**
 * Extract font value with property-specific validation
 * Adds font-specific filtering on top of basic extraction
 */
function extractFontValueForProperty(cssProperty: string) {
  return (node: any): ParsedUnitValue | null => {
    const fontValue = extractFontValue(node, cssProperty);
    if (!fontValue) return null;
    
    // Add font-specific validation
    if (cssProperty === 'font-size') {
      // Font-size: must have units OR be reasonable unitless value
      return fontValue.unit || (fontValue.number >= 6 && fontValue.number <= 100) ? fontValue : null;
    } else if (cssProperty === 'font-weight') {
      // Font-weight: must be unitless and in valid range
      return !fontValue.unit && fontValue.number >= 100 && fontValue.number <= 900 ? fontValue : null;
    }
    
    // For font shorthand, accept all valid extracted values
    return fontValue;
  };
}

/**
 * Check if node should be skipped during font traversal
 */
function shouldSkipFontNode(node: any): boolean {
  return node.type === 'Function';
}

/**
 * Replace font value with hook in CSS variable format
 */
function replaceWithHook(fontValue: string, hook: string): string {
  return `var(${hook}, ${fontValue})`;
}

/**
 * Handle font properties by finding and replacing hardcoded values with hooks
 * Reuses the same pattern as density handler
 */
function handleFontProps(
  valueText: string,
  cssProperty: string,
  context: HandlerContext,
  declarationNode: any
): void {
  const replacements: ReplacementInfo[] = [];
  
  forEachValue(valueText, extractFontValueForProperty(cssProperty), shouldSkipFontNode, (fontValue, positionInfo) => {
    if (fontValue) {
      const replacement = createFontReplacement(fontValue, cssProperty, context, positionInfo);
      if (replacement) {
        replacements.push(replacement);
      }
    }
  });
  
  // Apply shorthand auto-fix once all values are processed
  handleShorthandAutoFix(declarationNode, context, valueText, replacements);
}

/**
 * Create font replacement info for shorthand auto-fix
 * Simplified to use font-specific property resolution
 */
function createFontReplacement(
  fontValue: ParsedUnitValue,
  cssProperty: string,
  context: HandlerContext,
  positionInfo: PositionInfo
): ReplacementInfo | null {
  if (!fontValue || !positionInfo?.start) {
    return null;
  }

  const rawValue = fontValue.unit 
    ? `${fontValue.number}${fontValue.unit}`
    : fontValue.number.toString();

  // Font-specific property resolution
  // Font-weight: unitless values in 100-900 range, otherwise font-size
  const propToMatch = (!fontValue.unit && fontValue.number >= 100 && fontValue.number <= 900) 
    ? resolvePropertyToMatch('font-weight')
    : resolvePropertyToMatch('font-size');

  const closestHooks = getStylingHooksForDensityValue(fontValue, context.valueToStylinghook, propToMatch);

  const start = positionInfo.start.offset;
  const end = positionInfo.end.offset;

  if (closestHooks.length === 1) {
    return {
      start,
      end,
      replacement: replaceWithHook(rawValue, closestHooks[0]),
      displayValue: closestHooks[0],
      hasHook: true
    };
  } else if (closestHooks.length > 1) {
    return {
      start,
      end,
      replacement: rawValue,
      displayValue: closestHooks.join(', '),
      hasHook: true
    };
  } else {
    return {
      start,
      end,
      replacement: rawValue,
      displayValue: rawValue,
      hasHook: false
    };
  }
}

