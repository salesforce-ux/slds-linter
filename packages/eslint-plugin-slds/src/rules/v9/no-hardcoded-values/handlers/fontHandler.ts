import { getStylingHooksForDensityValue } from '../../../../utils/styling-hook-utils';
import { resolvePropertyToMatch } from '../../../../utils/property-matcher';
import { parseFont, isKnownFontWeight, FontValue } from '../../../../utils/fontValueParser';
import type { ParsedUnitValue } from '../../../../utils/value-utils';
import type { HandlerContext, DeclarationHandler } from '../../../../utils/types';

/**
 * Handle font shorthand declarations using CSS AST and simple string parsing
 * Maintains compatibility with density and color handler patterns
 */
export const handleFontShorthand: DeclarationHandler = (node: any, context: HandlerContext) => {
  const cssProperty = node.property.toLowerCase();
  
  // Get the raw font value from CSS AST
  const fontValue = context.sourceCode.getText(node.value);
  
  if (fontValue && cssProperty === 'font') {
    processFontShorthand(fontValue, node, context);
  }
};

/**
 * Process font shorthand value and extract individual components for linting
 */
function processFontShorthand(
  fontValue: string, 
  declarationNode: any, 
  context: HandlerContext
) {
  // Skip CSS variables and function calls
  if (shouldSkipValue(fontValue)) {
    return;
  }

  // Parse the font shorthand value
  const parsedFont = parseFont(fontValue);
  
  // Process each component of the font shorthand
  processFontComponents(parsedFont, declarationNode, context, fontValue);
}

/**
 * Process individual font components extracted from shorthand
 */
function processFontComponents(
  fontValue: FontValue,
  declarationNode: any,
  context: HandlerContext,
  originalValue: string
) {
  // Handle font-size from shorthand
  if (fontValue['font-size']) {
    const fontSize = fontValue['font-size'];
    const parsedSize = extractDimensionFromString(fontSize);
    if (parsedSize) {
      handleFontSizeValue(parsedSize, fontSize, 'font-size', declarationNode, context);
    }
  }
  
  // Handle font-weight from shorthand
  if (fontValue['font-weight'] && isKnownFontWeight(fontValue['font-weight'])) {
    // Normalize 'normal' to '400' for consistency
    const normalizedWeight = fontValue['font-weight'] === 'normal' ? '400' : fontValue['font-weight'];
    const parsedWeight = extractDimensionFromString(normalizedWeight);
    if (parsedWeight) {
      handleFontWeightValue(parsedWeight, normalizedWeight, 'font-weight', declarationNode, context);
    }
  }
  
  // Handle line-height if present (including unitless ratios like 1.25, 1.375, 1.5, 1.75)
  if (fontValue['line-height']) {
    const lineHeight = fontValue['line-height'];
    const parsedLineHeight = extractDimensionFromString(lineHeight);
    if (parsedLineHeight) {
      handleFontSizeValue(parsedLineHeight, lineHeight, 'line-height', declarationNode, context);
    }
  }
}

/**
 * Extract dimension value from string using simple parsing
 * Reuses the pattern from densityHandler but for strings instead of AST nodes
 */
function extractDimensionFromString(value: string): ParsedUnitValue | null {
  if (!value) return null;
  
  const trimmedValue = value.trim();
  
  // Handle font-weight keywords
  const fontWeightMap: Record<string, number> = {
    'normal': 400,
    'bold': 700,
    'bolder': 900,
    'lighter': 300
  };
  
  if (fontWeightMap[trimmedValue.toLowerCase()]) {
    return {
      number: fontWeightMap[trimmedValue.toLowerCase()],
      unit: null, // Font weights are unitless
    };
  }
  
  // Handle dimension values (16px, 1rem, etc.)
  const dimensionMatch = trimmedValue.match(/^(-?\d*\.?\d+)(px|rem)?$/);
  if (dimensionMatch) {
    const number = parseFloat(dimensionMatch[1]);
    const unit = (dimensionMatch[2] || null) as 'px' | 'rem' | null;
    
    if (number === 0) return null; // Skip zero values
    
    return { number, unit };
  }
  
  // Handle pure numbers (line-height, font-weight)
  const numberMatch = trimmedValue.match(/^-?\d*\.?\d+$/);
  if (numberMatch) {
    const number = parseFloat(numberMatch[0]);
    if (number === 0) return null; // Skip zero values
    
    return { number, unit: null };
  }
  
  return null;
}

/**
 * Handle font-size values using density handler pattern
 */
function handleFontSizeValue(
  parsedValue: ParsedUnitValue,
  originalValue: string,
  property: string,
  declarationNode: any,
  context: HandlerContext
) {
  if (!parsedValue) return;

  const propToMatch = resolvePropertyToMatch(property);
  const closestHooks = getStylingHooksForDensityValue(parsedValue, context.valueToStylinghook, propToMatch);

  if (closestHooks.length > 0) {
    // Don't provide auto-fix for font shorthand since it's complex to reconstruct the entire value
    const fix = undefined;

    context.reportFn({
      node: declarationNode.value,
      messageId: 'hardcodedValue',
      data: {
        oldValue: originalValue,
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
        oldValue: originalValue
      }
    });
  }
}

/**
 * Handle font-weight values using density handler pattern
 */
function handleFontWeightValue(
  parsedValue: ParsedUnitValue,
  originalValue: string,
  property: string,
  declarationNode: any,
  context: HandlerContext
) {
  if (!parsedValue) return;

  const propToMatch = resolvePropertyToMatch(property);
  const closestHooks = getStylingHooksForDensityValue(parsedValue, context.valueToStylinghook, propToMatch);

  if (closestHooks.length > 0) {
    // Don't provide auto-fix for font shorthand since it's complex to reconstruct the entire value
    const fix = undefined;

    context.reportFn({
      node: declarationNode.value,
      messageId: 'hardcodedValue',
      data: {
        oldValue: originalValue,
        newValue: closestHooks.join(', ')
      },
      fix
    });
  } else {
    // No suggestions available for font-weight
    context.reportFn({
      node: declarationNode.value,
      messageId: 'noReplacement',
      data: {
        oldValue: originalValue
      }
    });
  }
}

/**
 * Check if a CSS value should be skipped (variables, functions, etc.)
 */
function shouldSkipValue(cssValue: string): boolean {
  if (!cssValue) return true;
  
  const trimmedValue = cssValue.trim();
  return trimmedValue.startsWith('var(') || 
         trimmedValue === 'var' ||
         trimmedValue.includes('calc(') ||
         trimmedValue.includes('color-mix(');
}
