import { getStylingHooksForDensityValue } from '../../../../utils/styling-hook-utils';
import { resolvePropertyToMatch } from '../../../../utils/property-matcher';
import type { ParsedUnitValue } from '../../../../utils/value-utils';
import type { HandlerContext, DeclarationHandler } from '../../../../types';

// Import shared utilities for common logic
import { 
  handleShorthandAutoFix, 
  forEachValueWithPosition, 
  forEachValue,
  countValues,
  type ReplacementInfo,
  type PositionInfo
} from '../../../../utils/hardcoded-shared-utils';

/**
 * Handle font declarations including shorthand property
 * Follows the same pattern as colorHandler and densityHandler
 */
export const handleFontDeclaration: DeclarationHandler = (node: any, context: HandlerContext) => {
  const cssProperty = node.property.toLowerCase();
  const valueText = context.sourceCode.getText(node.value);
  
  // Detect shorthand by property name (font shorthand always needs special handling)
  const isShorthand = cssProperty === 'font';
  
  if (isShorthand) {
    // Handle font shorthand - collect all replacements first
    const replacements: ReplacementInfo[] = [];
    
    forEachFontValueWithPosition(valueText, (fontValue, positionInfo) => {
      const result = getFontReplacement(fontValue, cssProperty, context, positionInfo);
      if (result) {
        replacements.push(result);
      }
    });
    
    // Apply shorthand auto-fix if any font values have hooks
    handleShorthandAutoFix(node, context, valueText, replacements);
  } else {
    // Handle individual properties - use simpler approach like color handler
    forEachFontValue(valueText, cssProperty, (fontValue) => {
      handleIndividualFontValue(fontValue, cssProperty, node, context);
    });
  }
};

/**
 * Extract font-related values from CSS AST node (simplified like density handler)
 * Returns parsed font value for font-size and font-weight properties only
 */
function extractFontValue(node: any): ParsedUnitValue | null {
  if (!node) return null;
  
  switch (node.type) {
    case 'Dimension':
      // Font-size: 16px, 1rem, etc.
      const numValue = Number(node.value);
      if (numValue <= 0) return null; // Skip zero/negative values
      
      const unit = node.unit.toLowerCase();
      if (unit !== 'px' && unit !== 'rem') return null; // Only support px and rem for font-size
      
      return {
        number: numValue,
        unit: unit as 'px' | 'rem'
      };
      
    case 'Number':
      // Font-weight: 400, 700, etc. or line-height values
      const numberValue = Number(node.value);
      if (numberValue <= 0) return null; // Skip zero/negative values
      
      // Font-weight typically ranges from 100-900
      // Line-height is typically 1.0-3.0, so we need to distinguish
      if (numberValue >= 100 && numberValue <= 900) {
        return {
          number: numberValue,
          unit: null
        };
      } else if (numberValue >= 1 && numberValue <= 3) {
        // This looks like a line-height value - skip it
        return null;
      }
      
      // Could also be font-size as unitless value (rare but possible)
      if (numberValue >= 6 && numberValue <= 100) {
        return {
          number: numberValue,
          unit: null
        };
      }
      
      return null;
      
    case 'Identifier':
      // Font-weight keywords: normal, bold, etc.
      const namedValue = node.name.toLowerCase();
      
      if (namedValue === 'normal') {
        return { number: 400, unit: null };
      } else if (namedValue === 'bold') {
        return { number: 700, unit: null };
      }
      
      // Skip other keywords (font-family names, font-style values, etc.)
      return null;
  }
  
  return null;
}

/**
 * Filter font values for specific properties (like density handler pattern)
 */
function extractFontValueForProperty(cssProperty: string) {
  return (node: any): ParsedUnitValue | null => {
    const fontValue = extractFontValue(node);
    if (!fontValue) return null;
    
    // For individual properties, validate the value makes sense for that property
    if (cssProperty === 'font-size') {
      // Font-size should have units or be reasonable unitless values
      return fontValue.unit || (fontValue.number >= 6 && fontValue.number <= 100) ? fontValue : null;
    } else if (cssProperty === 'font-weight') {
      // Font-weight should be unitless and in valid range
      return !fontValue.unit && fontValue.number >= 100 && fontValue.number <= 900 ? fontValue : null;
    }
    
    return fontValue; // For shorthand, accept all valid font values
  };
}

/**
 * Check if node should be skipped during font traversal (like other handlers)
 */
function shouldSkipFontNode(node: any): boolean {
  // Skip CSS functions like var(), calc(), etc.
  return node.type === 'Function';
}

/**
 * Count font-related values in CSS value (reuse shared-utils pattern)
 */
function countFontValues(valueText: string): number {
  return countValues(valueText, extractFontValue, shouldSkipFontNode);
}

/**
 * Iterate over font values with position tracking (for shorthand)
 */
function forEachFontValueWithPosition(
  valueText: string, 
  callback: (fontValue: ParsedUnitValue, positionInfo?: PositionInfo) => void
): void {
  forEachValueWithPosition(valueText, extractFontValue, shouldSkipFontNode, callback);
}

/**
 * Iterate over font values for specific property (for individual properties)
 */
function forEachFontValue(
  valueText: string, 
  cssProperty: string,
  callback: (fontValue: ParsedUnitValue) => void
): void {
  forEachValue(valueText, extractFontValueForProperty(cssProperty), shouldSkipFontNode, callback);
}

/**
 * Get font replacement info for shorthand auto-fix (follows density pattern)
 */
function getFontReplacement(
  fontValue: ParsedUnitValue,
  cssProperty: string,
  context: HandlerContext,
  positionInfo?: PositionInfo
): ReplacementInfo | null {
  if (!fontValue || !positionInfo?.start) {
    return null;
  }

  const rawValue = fontValue.unit 
    ? `${fontValue.number}${fontValue.unit}`
    : fontValue.number.toString();

  // Determine the actual CSS property for hook matching
  let propToMatch: string;
  if (fontValue.unit) {
    // Has units, likely font-size
    propToMatch = resolvePropertyToMatch('font-size');
  } else if (fontValue.number >= 100 && fontValue.number <= 900) {
    // Unitless in font-weight range
    propToMatch = resolvePropertyToMatch('font-weight');
  } else {
    // Unitless font-size
    propToMatch = resolvePropertyToMatch('font-size');
  }

  const closestHooks = getStylingHooksForDensityValue(fontValue, context.valueToStylinghook, propToMatch);

  // Calculate position within the CSS value (handle keyword length correctly)
  const originalValueLength = positionInfo.end ? (positionInfo.end.column - positionInfo.start.column) : rawValue.length;
  const start = positionInfo.start.column - 1; // css-tree uses 1-based columns
  const end = start + originalValueLength;

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
 * Handle individual font value and report issues (simplified like color handler)
 */
function handleIndividualFontValue(
  fontValue: ParsedUnitValue, 
  cssProperty: string, 
  declarationNode: any, 
  context: HandlerContext
) {
  if (!fontValue) {
    return;
  }

  // Reconstruct raw value from parsed data for reporting
  const rawValue = fontValue.unit 
    ? `${fontValue.number}${fontValue.unit}`
    : fontValue.number.toString();

  const propToMatch = resolvePropertyToMatch(cssProperty);
  const closestHooks = getStylingHooksForDensityValue(fontValue, context.valueToStylinghook, propToMatch);

  if (closestHooks.length > 0) {
    // Auto-fix for single suggestions only (like color handler)
    const fix = closestHooks.length === 1 ? (fixer: any) => {
      return fixer.replaceText(declarationNode.value, `var(${closestHooks[0]}, ${rawValue})`);
    } : undefined;

    context.context.report({
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
    context.context.report({
      node: declarationNode.value,
      messageId: 'noReplacement',
      data: {
        oldValue: rawValue
      }
    });
  }
}