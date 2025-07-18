import { Declaration } from "postcss";
import valueParser from "postcss-value-parser";
import type { ValueToStylingHooksMapping } from "@salesforce-ux/sds-metadata";
import stylelint from "stylelint";
import { FontValue, isKnownFontWeight, parseFont, isFunctionNode } from "slds-shared-utils";
import { MessagesObj } from "../../../utils/reportUtils";
import { handleDensityPropForNode } from "./densityHandler";

export function handleFontProps(
    decl: Declaration,
    parsedValue: valueParser.ParsedValue,
    cssValueStartIndex: number,
    supportedStylinghooks: ValueToStylingHooksMapping,
    cssProperty: string,
    reportProps: Partial<stylelint.Problem>,
    messages: MessagesObj
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
            let cssValue = node.value === 'normal' ? '400' : node.value;
            handleDensityPropForNode(decl, node, cssValue, cssValueStartIndex, supportedStylinghooks, key, reportProps, messages);
        } else if (key === 'font-size') {
            handleDensityPropForNode(decl, node, node.value, cssValueStartIndex, supportedStylinghooks, key, reportProps, messages);
        }
    }
}