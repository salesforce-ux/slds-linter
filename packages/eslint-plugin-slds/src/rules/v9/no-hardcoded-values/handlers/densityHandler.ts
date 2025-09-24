import { getStylingHooksForDensityValue } from '../../../../utils/styling-hook-utils';
import { resolvePropertyToMatch } from '../../../../utils/property-matcher';
import { formatSuggestionHooks } from '../../../../utils/css-utils';
import type { ParsedUnitValue } from '../../../../utils/value-utils';
import type { HandlerContext, DeclarationHandler } from '../../../../types';



// Import shared utilities for common logic
import { 
  handleShorthandAutoFix, 
  forEachDensityValue,
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
  const replacements: ReplacementInfo[] = [];
  
  forEachDensityValue(valueText, cssProperty, (parsedDimension, positionInfo) => {
    if (parsedDimension) {
      const replacement = createDimensionReplacement(parsedDimension, cssProperty, context, positionInfo);
      if (replacement) {
        replacements.push(replacement);
      }
    }
  });
  
  // Apply shorthand auto-fix once all values are processed
  handleShorthandAutoFix(node, context, valueText, replacements);
};



/**
 * Create dimension replacement info for shorthand auto-fix
 * Returns replacement data or null if no valid replacement
 */
function createDimensionReplacement(
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

  // Use position information directly from CSS tree (already 0-based offsets)
  const start = positionInfo.start.offset;
  const end = positionInfo.end.offset;

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
      displayValue: formatSuggestionHooks(closestHooks),
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



