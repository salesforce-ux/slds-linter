import { findClosestColorHook, convertToHex, isValidColor, hasAlphaChannel, transparentPercentage } from '../../../../utils/color-lib-utils';
import { resolveColorPropertyToMatch } from '../../../../utils/property-matcher';
import { formatSuggestionHooks } from '../../../../utils/css-utils';
import { getCustomMapping } from '../../../../utils/custom-mapping-utils';
import type { HandlerContext, DeclarationHandler, ContextSettings } from '../../../../types';

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
  const declNodePositionInfo:PositionInfo = node?.value?.loc || {start:{line:0, column:0}, end:{line:0, column:0}};
  
  forEachColorValue(valueText, (colorValue, positionInfo) => {
    if (colorValue !== 'transparent' && isValidColor(colorValue)) {
      const replacement = createColorReplacement(colorValue, cssProperty, context, positionInfo, valueText, declNodePositionInfo);
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
  originalValueText: string,
  declNodePositionInfo: PositionInfo
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
  let replacement = originalValue;
  let usageContext = null;

  if (customHook) {
    // Use custom mapping if available
    closestHooks = [customHook];
  } else {
    // Otherwise, find closest hooks from metadata
    const propToMatch = resolveColorPropertyToMatch(cssProperty);
    closestHooks = findClosestColorHook(hexValue, context.valueToStylinghook, propToMatch);
    const { contextIndex, serializeIssueContext, classifyIssue, deterministicOnly: settingsDeterministicOnly } = (context?.context?.settings ?? {}) as Partial<ContextSettings>;
    const allowSemiDeterministic = !(settingsDeterministicOnly ?? context.options?.deterministicOnly);
    const filename = context?.context?.physicalFilename || context?.context?.filename;
    if(contextIndex){
      const valueLineStart = declNodePositionInfo.start.line;
      const valueColumnStart = declNodePositionInfo.start.column + start;
      const issueWithContext = contextIndex.getIssue(filename, valueLineStart, valueColumnStart);
      if(issueWithContext){
        usageContext = `${serializeIssueContext(issueWithContext)}. `;
        const classification = classifyIssue(issueWithContext, closestHooks);
        const canAutoFix = classification?.tier === "deterministic" || (allowSemiDeterministic && classification?.tier === "semi-deterministic");
        const {selectedHook, matchingHooks} = classification;
        if(selectedHook && canAutoFix){
          replacement = createReplacementString(colorValue, selectedHook);
        }
        if(matchingHooks?.length>0){
          closestHooks = matchingHooks
        }
      }      
    }
  }

  // If no context was available, auto-fix only when there is exactly one candidate hook
  if(replacement === originalValue && closestHooks.length === 1){
    replacement = createReplacementString(colorValue, closestHooks[0]);
  }
  
  if (closestHooks.length > 0) {
    // Multiple hooks - format them for better readability
    return {
      start,
      end,
      replacement,  // Use original value to preserve spacing
      displayValue: formatSuggestionHooks(closestHooks),
      usageContext,
      hasHook: true      
    };
  } else {
    // No hooks - keep original value
    return {
      start,
      end,
      replacement,  // Use original value to preserve spacing
      displayValue: originalValue,
      usageContext,
      hasHook: false
    };
  }
}

function createReplacementString(colorValue: string, hook:string){
  let replacement: string= `var(${hook}, ${colorValue})`;
  if(hasAlphaChannel(colorValue)){
    const tp = transparentPercentage(colorValue);
    replacement = `color-mix(in oklab, ${replacement}, transparent ${tp}%)`;
  }
  return replacement;
}