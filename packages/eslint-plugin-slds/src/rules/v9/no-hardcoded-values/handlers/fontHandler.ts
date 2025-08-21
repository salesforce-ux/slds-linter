import { isTargetProperty } from '../../../../utils/css-utils';
import { getStylingHooksForDensityValue } from '../../../../utils/styling-hook-utils';
import { resolvePropertyToMatch } from '../../../../utils/property-matcher';
import { shouldSkipValue } from '../../../../utils/valueExtractors';
import { 
  parseFont, 
  isKnownFontWeight, 
  extractFontValue,
  validateFontFamily,
  FontValue 
} from '../../../../utils/fontValueParser';
import type { HandlerContext, DeclarationHandler } from '../../../../utils/types';

/**
 * Enhanced font shorthand handler maintaining parity with Stylelint implementation
 * Leverages CSS AST core logic for robust font property parsing
 * Based on: https://github.com/eslint/css/blob/main/src/rules/font-family-fallbacks.js
 */
export const handleFontShorthand: DeclarationHandler = (node: any, context: HandlerContext) => {
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

  // Parse the font shorthand value
  const fontValue = parseFont(cssValue);
  
  // Process each component of the font shorthand
  processFontComponents(fontValue, cssProperty, node, context, cssValue);
};

/**
 * Process individual font components extracted from shorthand
 */
function processFontComponents(
  fontValue: FontValue,
  cssProperty: string,
  declarationNode: any,
  context: HandlerContext,
  originalValue: string
) {
  // Handle font-size from shorthand
  if (fontValue['font-size']) {
    handleFontSizeValue(fontValue['font-size'], 'font-size', declarationNode, context);
  }
  
  // Handle font-weight from shorthand
  if (fontValue['font-weight'] && isKnownFontWeight(fontValue['font-weight'])) {
    // Normalize 'normal' to '400' for consistency
    const normalizedWeight = fontValue['font-weight'] === 'normal' ? '400' : fontValue['font-weight'];
    handleFontWeightValue(normalizedWeight, 'font-weight', declarationNode, context);
  }
  
  // Handle font-family validation (following ESLint CSS plugin pattern)
  if (fontValue['font-family']) {
    handleFontFamilyValidation(fontValue['font-family'], declarationNode, context);
  }
  
  // Handle line-height if present
  if (fontValue['line-height']) {
    handleFontSizeValue(fontValue['line-height'], 'line-height', declarationNode, context);
  }
}

/**
 * Handle font-size values using density handler pattern
 */
function handleFontSizeValue(
  fontSize: string,
  property: string,
  declarationNode: any,
  context: HandlerContext
) {
  if (shouldSkipValue(fontSize)) {
    return;
  }

  const propToMatch = resolvePropertyToMatch(property);
  const closestHooks = getStylingHooksForDensityValue(fontSize, context.valueToStylinghook, propToMatch);

  if (closestHooks.length > 0) {
    // Create ESLint fix for single suggestions only
    const fix = closestHooks.length === 1 ? (fixer: any) => {
      return fixer.replaceText(declarationNode.value, `var(${closestHooks[0]}, ${fontSize})`);
    } : undefined;

    context.reportFn({
      node: declarationNode.value,
      messageId: 'hardcodedValue',
      data: {
        oldValue: fontSize,
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
        oldValue: fontSize
      }
    });
  }
}

/**
 * Handle font-weight values using density handler pattern
 */
function handleFontWeightValue(
  fontWeight: string,
  property: string,
  declarationNode: any,
  context: HandlerContext
) {
  if (shouldSkipValue(fontWeight)) {
    return;
  }

  const propToMatch = resolvePropertyToMatch(property);
  const closestHooks = getStylingHooksForDensityValue(fontWeight, context.valueToStylinghook, propToMatch);

  if (closestHooks.length > 0) {
    // Create ESLint fix for single suggestions only
    const fix = closestHooks.length === 1 ? (fixer: any) => {
      return fixer.replaceText(declarationNode.value, `var(${closestHooks[0]}, ${fontWeight})`);
    } : undefined;

    context.reportFn({
      node: declarationNode.value,
      messageId: 'hardcodedValue',
      data: {
        oldValue: fontWeight,
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
        oldValue: fontWeight
      }
    });
  }
}

/**
 * Handle font-family validation following ESLint CSS plugin patterns
 * Based on: https://github.com/eslint/css/blob/main/src/rules/font-family-fallbacks.js
 */
function handleFontFamilyValidation(
  fontFamily: string,
  declarationNode: any,
  context: HandlerContext
) {
  const validation = validateFontFamily(fontFamily);
  
  if (!validation.isValid && !validation.hasGenericFallback) {
    // Report missing generic family fallback
    context.reportFn({
      node: declarationNode.value,
      messageId: 'fontFamilyFallback',
      data: {
        fontFamily: fontFamily
      }
    });
  }
}
