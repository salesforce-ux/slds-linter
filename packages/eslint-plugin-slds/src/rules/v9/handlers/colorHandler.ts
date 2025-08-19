import type { ValueToStylingHooksMapping } from '@salesforce-ux/sds-metadata';
import valueParser from 'postcss-value-parser';
import { findClosestColorHook, convertToHex } from '../../../utils/color-lib-utils';
import { forEachColorValue } from '../../../utils/color-utils';
import { resolvePropertyToMatch } from '../../../utils/property-matcher';

/**
 * Color Handler for ESLint - processes color values and suggests SLDS color hooks
 * Migrated from the Stylelint implementation with ESLint-specific fix generation
 */
export function handleColorProps(
  decl: any,
  parsedValue: valueParser.ParsedValue,
  cssValueStartIndex: number,
  supportedStylinghooks: ValueToStylingHooksMapping,
  cssProperty: string,
  reportProps: any,
  messages: any,
  reportFn: Function
) {
  forEachColorValue(parsedValue, (node) => {
    const hexValue = convertToHex(node.value);
    
    // Skip transparent and invalid colors
    if (node.value === 'transparent' || !hexValue) {
      return;
    }

    const propToMatch = resolvePropertyToMatch(cssProperty);
    const closestHooks = findClosestColorHook(
      hexValue,
      supportedStylinghooks,
      propToMatch
    );

    if (closestHooks.length > 0) {
      // Create ESLint fix for single suggestions only
      const fix = closestHooks.length === 1 ? (fixer: any) => {
        // Replace the specific color value within the CSS declaration
        return replaceColorValueInDeclaration(fixer, decl, node, closestHooks[0]);
      } : null;

      const message = messages.hardcodedValue
        .replace('{{oldValue}}', node.value)
        .replace('{{newValue}}', closestHooks.join(', '));

      reportFn({
        ...reportProps,
        message,
        fix
      });
    } else {
      // No suggestions available
      const message = messages.noReplacement.replace('{{oldValue}}', node.value);
      reportFn({
        ...reportProps,
        message
      });
    }
  });
}

/**
 * Replace a specific color value within a CSS declaration with a hook
 */
function replaceColorValueInDeclaration(fixer: any, decl: any, colorNode: valueParser.Node, hookName: string) {
  // For simple color values, replace the entire value
  const replacementValue = `var(${hookName}, ${colorNode.value})`;
  const eslintNode = decl.__eslintNode;
  
  if (!eslintNode || !eslintNode.value || !eslintNode.value.loc) return null;
  
  const valueStart = eslintNode.value.loc.start.offset;
  const valueEnd = eslintNode.value.loc.end.offset;
  return fixer.replaceTextRange([valueStart, valueEnd], replacementValue);
}
