/**
 * Font CSS handler for ESLint plugin
 */
import type { ValueToStylingHooksMapping } from '@salesforce-ux/sds-metadata';
import valueParser from 'postcss-value-parser';
import {
  FontValue,
  isKnownFontWeight,
  parseFont,
  isFunctionNode
} from 'slds-shared-utils';
import { handleDensityPropForNode } from './density';

/**
 * Font Handler for CSS font properties
 */
export function handleFontProps(
    decl: any,
    parsedValue: valueParser.ParsedValue,
    cssValueStartIndex: number,
    supportedStylinghooks: ValueToStylingHooksMapping,
    cssProperty: string,
    reportProps: Partial<any>,
    messages: any,
    reportFn: Function
) {
    let fontValue: FontValue = {};
    if (cssProperty === 'font-weight') {
        fontValue = {
            'font-weight': decl.value.value
        }
    } else if (cssProperty === 'font-size') {
        fontValue = {
            'font-size': decl.value.value
        }
    } else if (cssProperty === 'font') {
        fontValue = parseFont(decl.value.value);
    }
    for (let [key, value] of Object.entries(fontValue)) {
        const node = !!value && parsedValue.nodes.find(node => node.type === 'word' && node.value === value);
        const isValidNode = node && !isFunctionNode(node);
        if (!isValidNode) {
            continue;
        }
        if (key === 'font-weight' && isKnownFontWeight(value)) {
            let cssValue = node.value === 'normal' ? '400' : node.value;
            handleDensityPropForNode(decl, node, cssValue, cssValueStartIndex, supportedStylinghooks, key, reportProps, messages, reportFn);
        } else if (key === 'font-size') {
            handleDensityPropForNode(decl, node, node.value, cssValueStartIndex, supportedStylinghooks, key, reportProps, messages, reportFn);
        }
    }
} 