import { Declaration } from "postcss";
import valueParser from "postcss-value-parser";
import type { ValueToStylingHooksMapping } from "@salesforce-ux/sds-metadata";
import stylelint from "stylelint";
import { MessagesObj } from "../../../utils/report-utils";
import { handleDensityPropForNode } from "./densityHandler";
import { FontValue, isKnownFontWeight, parseFont } from "../../../utils/fontValueParser";
import { isFunctionNode } from "../../../utils/decl-utils";

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

    for (const [key, value] of Object.entries(fontValue)) {
        if (!value) {
            continue;
        }

        const node = parsedValue.nodes.find(node => node.type === 'word' && node.value === value);
        if (!node || isFunctionNode(node)) {
            continue;
        }

        if (key === 'font-weight' && isKnownFontWeight(value)) {
            const cssValue = node.value === 'normal' ? '400' : node.value;
            handleDensityPropForNode(decl, node, cssValue, cssValueStartIndex, supportedStylinghooks, key, reportProps, messages);
        } else if (key === 'font-size') {
            handleDensityPropForNode(decl, node, node.value, cssValueStartIndex, supportedStylinghooks, key, reportProps, messages);
        }
    }
}