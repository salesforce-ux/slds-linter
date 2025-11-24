import { findClosestColorHook, convertToHex, isValidColor } from '../../../../utils/color-lib-utils';
import { resolveColorPropertyToMatch } from '../../../../utils/property-matcher';
import { formatSuggestionHooks } from '../../../../utils/css-utils';
import { getCustomMapping } from '../../../../utils/custom-mapping-utils';
import type { HandlerContext, DeclarationHandler } from '../../../../types';

// Import shared utilities for common logic
import { 
  handleShorthandAutoFix, 
  forEachColorValue,
  type ReplacementInfo,
  type PositionInfo
} from '../../../../utils/hardcoded-shared-utils';


/**
 * Handle color declarations using CSS tree parsing
 * Supports shorthand properties like background, border, etc.  
 * Uses css-tree for reliable AST-based parsing + chroma-js validation
 */
export const handleColorDeclaration: DeclarationHandler = (node: any, context: HandlerContext) => {
  const cssProperty = node.property.toLowerCase();
  const valueText = context.sourceCode.getText(node.value);
  const replacements: ReplacementInfo[] = [];
  
  forEachColorValue(valueText, (colorValue, positionInfo) => {
    if (colorValue !== 'transparent' && isValidColor(colorValue)) {
      const replacement = createColorReplacement(colorValue, cssProperty, context, positionInfo, valueText);
      if (replacement) {
        replacements.push(replacement);
      }
    }
  });
  
  // Apply shorthand auto-fix once all values are processed
  handleShorthandAutoFix(node, context, valueText, replacements);
};


/**
 * Create color replacement info for shorthand auto-fix
 * Returns replacement data or null if no valid replacement
 */
function createColorReplacement(
  colorValue: string,
  cssProperty: string,
  context: HandlerContext,
  positionInfo: PositionInfo,
  originalValueText?: string
): ReplacementInfo | null {
  if (!positionInfo?.start) {
    return null;
  }

  const hexValue = convertToHex(colorValue);
  if (!hexValue) {
    return null;
  }

  // Use position information directly from CSS tree (already 0-based offsets)
  const start = positionInfo.start.offset;
  const end = positionInfo.end.offset;
  
  // Extract the original value from the CSS text to preserve spacing
  const originalValue = originalValueText ? originalValueText.substring(start, end) : colorValue;

  // Check custom mapping first
  const customHook = getCustomMapping(cssProperty, colorValue, context.options?.customMapping);
  let closestHooks: string[] = [];
  
  if (customHook) {
    // Use custom mapping if available
    closestHooks = [customHook];
  } else {
    // Otherwise, find closest hooks from metadata
    const propToMatch = resolveColorPropertyToMatch(cssProperty);
    closestHooks = findClosestColorHook(hexValue, context.valueToStylinghook, propToMatch);
  }

  let replacement = originalValue;
  let paletteHook = null;
  // Apply preferPaletteHook filter if enabled
  if (context.options?.preferPaletteHook && closestHooks.length > 1) {
    paletteHook = closestHooks.filter(hook => hook.includes('-palette-'))[0];
  }
  if(paletteHook){
    replacement = `var(${paletteHook}, ${colorValue})`;
  } else if(closestHooks.length === 1){
    replacement = `var(${closestHooks[0]}, ${colorValue})`;
  }

  if (closestHooks.length > 0) {
    // Multiple hooks - format them for better readability
    return {
      start,
      end,
      replacement,  // Use original value to preserve spacing
      displayValue: formatSuggestionHooks(closestHooks),
      hasHook: true      
    };
  } else {
    // No hooks - keep original value
    return {
      start,
      end,
      replacement,  // Use original value to preserve spacing
      displayValue: originalValue,
      hasHook: false
    };
  }
}





