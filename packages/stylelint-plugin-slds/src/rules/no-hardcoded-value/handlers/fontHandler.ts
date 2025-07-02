import { Declaration } from "postcss";
import valueParser from "postcss-value-parser";
import type { ValueToStylingHooksMapping } from "@salesforce-ux/sds-metadata";
import stylelint from "stylelint";
import { MessagesObj, reportMatchingHooks } from "../../../utils/report-utils";
import { handleDensityPropForNode } from "./densityHandler";
import { FontValue, isKnownFontWeight, parseFont } from "../../../utils/fontValueParser";
import { isFunctionNode } from "../../../utils/decl-utils";
import { normalizeCssValue } from '../../../utils/value-utils';
import { getFullValueFromNode } from '../../../utils/density-utils';

export function handleFontProps(
    decl: Declaration,
    parsedValue: valueParser.ParsedValue,
    cssValueStartIndex: number,
    supportedStylinghooks: ValueToStylingHooksMapping,
    cssProperty: string,
    reportProps: Partial<stylelint.Problem>,
    messages: MessagesObj,
    customReportMatchingHooks?: typeof reportMatchingHooks
) {
    let fontValue: FontValue = {};

    if (cssProperty === 'font-weight') {
        fontValue = {
            'font-weight': decl.value
        }
    } else if (cssProperty === 'font-size') {
        fontValue = {
            'font-size': decl.value
        }
    } else if (cssProperty === 'font') {
        fontValue = parseFont(decl.value);
    }

    for (let [key, value] of Object.entries(fontValue)) {
        const node = !!value && parsedValue.nodes.find(node => node.type === 'word' && node.value === value);
        const isValidNode = node && !isFunctionNode(node);
        if (!isValidNode) {
            continue;
        }
        if (key === 'font-weight' && isKnownFontWeight(value)) {
            let cssValue = node.value === 'normal' ? '400' : getFullValueFromNode(node);
            const normalizedNode = { ...node, value: getFullValueFromNode(node) };
            console.log('[fontHandler] Passing customReportMatchingHooks to handleDensityPropForNode');
            handleDensityPropForNode(decl, normalizedNode, normalizedNode.value, cssValueStartIndex, supportedStylinghooks, key, reportProps, messages, customReportMatchingHooks);
        } else if (key === 'font-size') {
            console.log('[fontHandler] Passing customReportMatchingHooks to handleDensityPropForNode');
            const normalizedNode = { ...node, value: getFullValueFromNode(node) };
            handleDensityPropForNode(decl, normalizedNode, normalizedNode.value, cssValueStartIndex, supportedStylinghooks, key, reportProps, messages, customReportMatchingHooks);
        }
    }
}