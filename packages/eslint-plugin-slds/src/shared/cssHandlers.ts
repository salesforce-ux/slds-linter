// Shared CSS value handlers for ESLint plugin (decoupled from stylelint)
import type { ValueToStylingHooksMapping } from '@salesforce-ux/sds-metadata';
import valueParser from 'postcss-value-parser';
import { makeReportMatchingHooks } from './reportUtilsGeneric';
import { parseBoxShadowValue, isBoxShadowMatch, BoxShadowValue } from './boxShadowValueParser';
import { findClosestColorHook, convertToHex } from './colorLibUtils';
import { forEachColorValue } from './colorUtils';
import { getStylingHooksForDensityValue } from './stylingHookUtils';
import { FontValue, isKnownFontWeight, parseFont } from './fontValueParser';
import { isFunctionNode } from './declUtils';

// Helper to robustly get the range for fixer.replaceTextRange
function getNodeRange(node: any, declValueRange: [number, number]) {
  if (
    typeof node?.sourceIndex === 'number' &&
    typeof node?.sourceEndIndex === 'number' &&
    node.sourceEndIndex > node.sourceIndex
  ) {
    const start = declValueRange[0] + node.sourceIndex;
    const end = declValueRange[0] + node.sourceEndIndex;
    // Defensive: ensure start < end and within declValueRange
    if (start >= declValueRange[0] && end <= declValueRange[1] && start < end) {
      return [start, end];
    }
  }
  // Fallback to the full value range
  return declValueRange;
}

// Box Shadow Handler
export function handleBoxShadow(
  decl: any, // ESLint/PostCSS-like decl
  cssValue: string,
  cssValueStartIndex: number,
  supportedStylinghooks: ValueToStylingHooksMapping,
  reportProps: Partial<any>,
  messages: any,
  reportFn: Function
) {
  const reportMatchingHooks = makeReportMatchingHooks(reportFn);
  const shadowHooks = Object.entries(supportedStylinghooks).filter(([_, value]) => {
    return value.some((hook) => hook.properties.includes('box-shadow'));
  }).map(([key, value]) => [key, value.map((hook) => hook.name)]);
  const parsedCssValue = parseBoxShadowValue(decl.value.value);
  if(!parsedCssValue){
    return;
  }
  for(const [shadow, closestHooks] of shadowHooks){
    const parsedValueHook = parseBoxShadowValue(shadow as string);
    if (parsedValueHook && isBoxShadowMatch(parsedCssValue, parsedValueHook)) {
      const fix = (fixer: any, sourceCode: any) => {
        // Defensive: Only apply fix if range is valid
        const range = decl.value.range;
        if (!Array.isArray(range) || range.length !== 2 || range[0] === range[1]) {
          return null;
        }
        return fixer.replaceTextRange(
          range,
          `var(${closestHooks[0]}, ${decl.value.value})`
        );
      };
      if (closestHooks.length > 0) {
        reportMatchingHooks(
          decl,
          Array.isArray(closestHooks) ? closestHooks : [closestHooks],
          cssValueStartIndex,
          reportProps,
          messages,
          fix
        );
      }
      return;
    }
  }
}

// Color Handler
export function handleColorProps(
  decl: any,
  parsedValue: valueParser.ParsedValue,
  cssValueStartIndex: number,
  supportedStylinghooks: ValueToStylingHooksMapping,
  cssProperty: string,
  reportProps: Partial<any>,
  messages: any,
  reportFn: Function
) {
  const reportMatchingHooks = makeReportMatchingHooks(reportFn);
  forEachColorValue(parsedValue, (node) => {
    const hexValue = convertToHex(node.value);
    if (node.value === 'transparent' || !hexValue) {
      return;
    }
    const closestHooks = findClosestColorHook(
      hexValue,
      supportedStylinghooks,
      cssProperty
    );
    const fix = (fixer: any, sourceCode: any) => {
      // Defensive: Only apply fix if range is valid
      const range = getNodeRange(node, decl.value.range);
      if (!Array.isArray(range) || range.length !== 2 || range[0] === range[1]) {
        return null;
      }
      return fixer.replaceTextRange(
        range,
        `var(${closestHooks[0]}, ${hexValue})`
      );
    };
    reportMatchingHooks(
      node,
      Array.isArray(closestHooks) ? closestHooks : [closestHooks],
      cssValueStartIndex,
      reportProps,
      messages,
      fix
    );
  });
}

// Density Handler
export function handleDensityPropForNode(
  decl: any,
  node: valueParser.Node,
  cssValue: string,
  cssValueStartIndex: number,
  supportedStylinghooks: ValueToStylingHooksMapping,
  cssProperty: string,
  reportProps: Partial<any>,
  messages: any,
  reportFn: Function,
  skipNormalization?: boolean
) {
    const reportMatchingHooks = makeReportMatchingHooks(reportFn);
    const closestHooks = getStylingHooksForDensityValue(cssValue, supportedStylinghooks, cssProperty);
    let fix: any;
    if(closestHooks.length > 0){
      const replacementValue = `var(${closestHooks[0]}, ${node.value})`;
      fix =  (fixer: any, sourceCode: any) => {
        // Defensive: Only apply fix if range is valid
        const range = getNodeRange(node, decl.value.range);
        if (!Array.isArray(range) || range.length !== 2 || range[0] === range[1]) {
          return null;
        }
        return fixer.replaceTextRange(
          range,
          replacementValue
        );
      }
    }
    reportMatchingHooks(
      node,
      Array.isArray(closestHooks) ? closestHooks : [closestHooks],
      cssValueStartIndex,
      reportProps,
      messages,
      fix
    );
}

// Font Handler
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
    const reportMatchingHooks = makeReportMatchingHooks(reportFn);
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