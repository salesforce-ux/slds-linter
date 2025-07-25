/**
 * Font CSS handler for ESLint plugin - Clean handler with extracted parsing utilities
 */
import type { ValueToStylingHooksMapping } from '@salesforce-ux/sds-metadata';
import valueParser from 'postcss-value-parser';
import {
  isKnownFontWeight,
  getStylingHooksForDensityValue,
  reportMatchingHooksESLint,
  type ESLintReportFunction,
  isFunctionNode
} from 'slds-shared-utils';
import { createCSSValueFixFactory } from '../utils/fix-factories';
import { createESLintMessages } from '../utils/eslint-adapters';
import { parseESLintCSSFont, type ParsedFontProperties } from '../utils/eslint-font-parser';

/**
 * Normalize font-weight values (convert 'normal' to '400')
 */
function normalizeFontWeightValue(value: string): string {
    return value === 'normal' ? '400' : value;
}

/**
 * Find a valid font node in parsed value
 */
function findValidFontNode(
    parsedValue: valueParser.ParsedValue, 
    targetValue: string
): valueParser.Node | null {
    const node = parsedValue.nodes.find(node => 
        node.type === 'word' && node.value === targetValue
    );
    return node && !isFunctionNode(node) ? node : null;
}

/**
 * Process and report font property violations
 */
function processFontPropertyValue(
    decl: any,
    node: valueParser.Node,
    cssValue: string,
    fontProperty: string,
    supportedStylinghooks: ValueToStylingHooksMapping,
    messages: any,
    reportFn: Function,
    reportProps: Partial<any>
): void {
    const closestHooks = getStylingHooksForDensityValue(cssValue, supportedStylinghooks, fontProperty);
    
    if (closestHooks.length > 0) {
        const fixFactory = createCSSValueFixFactory(
            decl, 
            node, 
            `var(${closestHooks[0]}, ${node.value})`
        );

        reportMatchingHooksESLint({
            node,
            suggestions: closestHooks,
            cssValue: node.value,
            cssValueStartIndex: 0,
            messages: createESLintMessages(messages),
            reportFn: reportFn as ESLintReportFunction,
            fixFactory,
            reportProps
        });
    }
}

/**
 * Validate font-weight specific requirements
 */
function isValidFontWeightNode(node: valueParser.Node, fontProperty: string): boolean {
    return fontProperty !== 'font-weight' || isKnownFontWeight(node.value);
}

/**
 * Enhanced Font Handler for CSS font properties with robust ESLint CSS v9 parsing
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
    if (cssProperty === 'font-size') {
        handleSingleFontProperty(decl, parsedValue, 'font-size', supportedStylinghooks, messages, reportFn, reportProps);
    } else if (cssProperty === 'font-weight') {
        handleSingleFontProperty(decl, parsedValue, 'font-weight', supportedStylinghooks, messages, reportFn, reportProps);
    } else if (cssProperty === 'font') {
        handleFontShorthandESLint(decl, parsedValue, supportedStylinghooks, messages, reportFn, reportProps);
    }
}

/**
 * Handle individual font properties (font-size, font-weight)
 */
function handleSingleFontProperty(
    decl: any,
    parsedValue: valueParser.ParsedValue,
    fontProperty: string,
    supportedStylinghooks: ValueToStylingHooksMapping,
    messages: any,
    reportFn: Function,
    reportProps: Partial<any>
) {
    parsedValue.walk((node: valueParser.Node) => {
        if (isFunctionNode(node)) {
            return false; // Skip CSS functions
        }
        
        if (node.type === 'word' && isValidFontWeightNode(node, fontProperty)) {
            let cssValue = node.value;
            
            // Normalize font-weight values
            if (fontProperty === 'font-weight') {
                cssValue = normalizeFontWeightValue(cssValue);
            }
            
            processFontPropertyValue(
                decl, node, cssValue, fontProperty, 
                supportedStylinghooks, messages, reportFn, reportProps
            );
        }
    });
}

/**
 * Handle font shorthand property using enhanced ESLint CSS parsing
 */
function handleFontShorthandESLint(
    decl: any,
    parsedValue: valueParser.ParsedValue,
    supportedStylinghooks: ValueToStylingHooksMapping,
    messages: any,
    reportFn: Function,
    reportProps: Partial<any>
) {
    // Use enhanced ESLint CSS font parser from utils
    const fontProperties = parseESLintCSSFont(decl);
    
    // Handle font-size from shorthand
    if (fontProperties['font-size']) {
        const sizeNode = findValidFontNode(parsedValue, fontProperties['font-size']);
        if (sizeNode) {
            processFontPropertyValue(
                decl, sizeNode, fontProperties['font-size'], 'font-size',
                supportedStylinghooks, messages, reportFn, reportProps
            );
        }
    }
    
    // Handle font-weight from shorthand
    if (fontProperties['font-weight'] && isKnownFontWeight(fontProperties['font-weight'])) {
        const weightNode = findValidFontNode(parsedValue, fontProperties['font-weight']);
        if (weightNode) {
            const normalizedValue = normalizeFontWeightValue(fontProperties['font-weight']);
            processFontPropertyValue(
                decl, weightNode, normalizedValue, 'font-weight',
                supportedStylinghooks, messages, reportFn, reportProps
            );
        }
    }
} 