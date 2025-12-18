import { getStylingHooksForDensityValue } from '../../../../utils/styling-hook-utils';
import { formatSuggestionHooks } from '../../../../utils/css-utils';
import { getCustomMapping } from '../../../../utils/custom-mapping-utils';
import type { ParsedUnitValue } from '../../../../utils/value-utils';
import type { HandlerContext, DeclarationHandler } from '../../../../types';

// Import shared utilities for common logic
import { 
  handleShorthandAutoFix, 
  forEachFontValue,
  isKnownFontWeight,
  type ReplacementInfo,
  type PositionInfo
} from '../../../../utils/hardcoded-shared-utils';

/**
 * Handle font declarations including shorthand property
 * Uses css-tree for reliable AST-based parsing
 */
export const handleFontDeclaration: DeclarationHandler = (node: any, context: HandlerContext) => {
  const cssProperty = node.property.toLowerCase();
  const valueText = context.sourceCode.getText(node.value);
  const replacements: ReplacementInfo[] = [];
  
  forEachFontValue(valueText, (fontValue, positionInfo) => {
    if (fontValue && isValidFontValue(fontValue, cssProperty)) {
      const replacement = createFontReplacement(fontValue, cssProperty, context, positionInfo);
      if (replacement) {
        replacements.push(replacement);
      }
    }
  });
  
  // Apply shorthand auto-fix once all values are processed
  handleShorthandAutoFix(node, context, valueText, replacements);
};

/**
 * Validate font value based on property type or value characteristics for shorthand
 * Only accepts what we explicitly handle in createFontReplacement
 */
function isValidFontValue(fontValue: ParsedUnitValue, cssProperty: string): boolean {
  if (cssProperty === 'font-size') {
    // Font-size: must have units (unitless font-size values are generally invalid in CSS)
    return !!fontValue.unit;
  } else if (cssProperty === 'font-weight') {
    // Font-weight: must be unitless and a known font-weight value
    return !fontValue.unit && isKnownFontWeight(fontValue.value);
  } else if (cssProperty === 'font') {
    // Font shorthand: determine validation based on value characteristics
    if (!fontValue.unit && isKnownFontWeight(fontValue.value)) {
      // This is a font-weight value
      return true;
    } else if (fontValue.unit) {
      // font-size
      return true;
    } else {
      // Unitless value that's not a known font-weight - invalid
      return false;
    }
  }
  
  // For other font properties, reject extracted values
  return false;
}

function createFontReplacement(
  fontValue: ParsedUnitValue,
  cssProperty: string,
  context: HandlerContext,
  positionInfo: PositionInfo
): ReplacementInfo | null {
  if (!positionInfo?.start) {
    return null;
  }

  const rawValue = fontValue.unit 
    ? `${fontValue.value}${fontValue.unit}`
    : fontValue.value.toString();

  // Font-specific property resolution
  // Font-weight: unitless known font-weight values, otherwise font-size
  const propToMatch = (!fontValue.unit && isKnownFontWeight(fontValue.value)) 
    ? 'font-weight'
    : 'font-size';

  // Check custom mapping first
  const customHook = getCustomMapping(propToMatch, rawValue, context.options?.customMapping);
  let closestHooks: string[] = [];
  
  if (customHook) {
    // Use custom mapping if available
    closestHooks = [customHook];
  } else {
    // Otherwise, find hooks from metadata
    closestHooks = getStylingHooksForDensityValue(fontValue, context.valueToStylinghook, propToMatch);
  }

  // Use position information directly from CSS tree (already 0-based offsets)
  const start = positionInfo.start.offset;
  const end = positionInfo.end.offset;

  if (closestHooks.length === 1) {
    // Has a single hook replacement - should provide autofix
    return {
      start,
      end,
      replacement: `var(${closestHooks[0]}, ${rawValue})`,
      displayValue: closestHooks[0],
      hasHook: true,
      isNumeric: true
    };
  } else if (closestHooks.length > 1) {
    // Multiple hooks - still has hooks, but no auto-fix
    return {
      start,
      end,
      replacement: rawValue,
      displayValue: formatSuggestionHooks(closestHooks),
      hasHook: true,
      isNumeric: true
    };
  } else {
    // No hooks - keep original value
    return {
      start,
      end,
      replacement: rawValue,
      displayValue: rawValue,
      hasHook: false,
      isNumeric: true
    };
  }
}

