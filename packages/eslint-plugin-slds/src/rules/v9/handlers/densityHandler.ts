import type { ValueToStylingHooksMapping } from '@salesforce-ux/sds-metadata';
import valueParser from 'postcss-value-parser';
import { getStylingHooksForDensityValue } from '../../../utils/styling-hook-utils';
import { resolvePropertyToMatch } from '../../../utils/property-matcher';

/**
 * Density Handler for ESLint - processes spacing/sizing values and suggests SLDS density hooks
 * Migrated from the Stylelint implementation with ESLint-specific fix generation
 */
export function handleDensityPropForNode(
  decl: any,
  node: valueParser.Node,
  cssValue: string,
  cssValueStartIndex: number,
  supportedStylinghooks: ValueToStylingHooksMapping,
  cssProperty: string,
  reportProps: any,
  messages: any,
  reportFn: Function
) {
  const propToMatch = resolvePropertyToMatch(cssProperty);
  const closestHooks = getStylingHooksForDensityValue(cssValue, supportedStylinghooks, propToMatch);

  if (closestHooks.length > 0) {
    // Create ESLint fix for single suggestions only
    const fix = closestHooks.length === 1 ? (fixer: any) => {
      return replaceDensityValueInDeclaration(fixer, decl, node, closestHooks[0]);
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
}

/**
 * Replace a specific density value within a CSS declaration with a hook
 */
function replaceDensityValueInDeclaration(fixer: any, decl: any, valueNode: valueParser.Node, hookName: string) {
  const replacementValue = `var(${hookName}, ${valueNode.value})`;
  const eslintNode = decl.__eslintNode;
  
  // Use the ESLint CSS node's loc property for positioning
  if (eslintNode && eslintNode.value && eslintNode.value.loc) {
    const valueStart = eslintNode.value.loc.start.offset;
    const valueEnd = eslintNode.value.loc.end.offset;
    return fixer.replaceTextRange([valueStart, valueEnd], replacementValue);
  }
  
  return null;
}
