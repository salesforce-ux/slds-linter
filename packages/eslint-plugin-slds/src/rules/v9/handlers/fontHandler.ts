import type { ValueToStylingHooksMapping } from '@salesforce-ux/sds-metadata';
import valueParser from 'postcss-value-parser';
import { FontValue, isKnownFontWeight, parseFont } from '../../../utils/fontValueParser';
import { isFunctionNode } from '../../../utils/decl-utils';
import { handleDensityPropForNode } from './densityHandler';

/**
 * Font Handler for ESLint - processes font properties and delegates to density handler
 * Migrated from the Stylelint implementation with ESLint-specific processing
 */
export function handleFontProps(
  decl: any,
  parsedValue: valueParser.ParsedValue,
  cssValueStartIndex: number,
  supportedStylinghooks: ValueToStylingHooksMapping,
  cssProperty: string,
  reportProps: any,
  messages: any,
  reportFn: Function
) {

  let fontValue: FontValue = {};

  // Parse font values based on property type
  if (cssProperty === 'font-weight') {
    fontValue = {
      'font-weight': decl.value.value
    };
  } else if (cssProperty === 'font-size') {
    fontValue = {
      'font-size': decl.value.value
    };
  } else if (cssProperty === 'font') {
    fontValue = parseFont(decl.value.value);
  }

  // Process each font value component
  for (let [key, value] of Object.entries(fontValue)) {
    const node = !!value && parsedValue.nodes.find(node => node.type === 'word' && node.value === value);
    const isValidNode = node && !isFunctionNode(node);
    
    if (!isValidNode) {
      continue;
    }

    if (key === 'font-weight' && isKnownFontWeight(value)) {
      // Normalize 'normal' font-weight to '400'
      let cssValue = node.value === 'normal' ? '400' : node.value;
      handleDensityPropForNode(
        decl,
        node,
        cssValue,
        cssValueStartIndex,
        supportedStylinghooks,
        key,
        reportProps,
        messages,
        reportFn
      );
    } else if (key === 'font-size') {
      handleDensityPropForNode(
        decl,
        node,
        node.value,
        cssValueStartIndex,
        supportedStylinghooks,
        key,
        reportProps,
        messages,
        reportFn
      );
    }
  }
}
