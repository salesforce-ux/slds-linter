// Shared CSS value handlers for ESLint plugin (decoupled from stylelint)
import type { ValueToStylingHooksMapping } from '@salesforce-ux/sds-metadata';
import valueParser from 'postcss-value-parser';
import {
  findClosestColorHook,
  convertToHex,
  forEachColorValue,
  getStylingHooksForDensityValue,
  FontValue,
  isKnownFontWeight,
  parseFont,
  isFunctionNode,
  handleBoxShadowShared
} from 'slds-shared-utils';

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
  // Fallback to full decl range
  return declValueRange;
}

// Box Shadow Handler - now uses shared logic
export function handleBoxShadow(
  decl: any, // ESLint/PostCSS-like decl
  cssValue: string,
  cssValueStartIndex: number,
  supportedStylinghooks: ValueToStylingHooksMapping,
  reportProps: Partial<any>,
  messages: any,
  reportFn: Function
) {
  // ESLint-specific reporting function
  const eslintReportFn = (
    decl: any,
    closestHooks: string[],
    cssValueStartIndex: number,
    reportProps: any,
    messages: any,
    fix: any
  ) => {
    reportFn({
      node: decl,
      message: messages && messages.rejected ? 
        messages.rejected(cssValue, closestHooks.join(', ')) : 
        'Replace static value with SLDS styling hook.',
      index: cssValueStartIndex,
      endIndex: cssValueStartIndex + cssValue.length,
      fix: fix,
      ...reportProps
    });
  };

  // ESLint-specific fix factory
  const makeFix = (decl: any, closestHooks: string[], value: string) => {
    return (fixer: any, sourceCode: any) => {
      const range = decl.value.range;
      if (!Array.isArray(range) || range.length !== 2 || range[0] === range[1]) {
        return null;
      }
      return fixer.replaceTextRange(
        range,
        `var(${closestHooks[0]}, ${value})`
      );
    };
  };

  // Use shared box-shadow logic
  return handleBoxShadowShared(
    decl,
    cssValue,
    cssValueStartIndex,
    supportedStylinghooks,
    reportProps,
    messages,
    eslintReportFn,
    makeFix
  );
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
      const range = getNodeRange(node, decl.value.range);
      if (!Array.isArray(range) || range.length !== 2 || range[0] === range[1]) {
        return null;
      }
      return fixer.replaceTextRange(
        range,
        `var(${closestHooks[0]}, ${hexValue})`
      );
    };
    reportFn({
      node,
      message: messages && messages.rejected ? messages.rejected(node.value, Array.isArray(closestHooks) ? closestHooks.join(', ') : closestHooks) : 'Replace static value with SLDS styling hook.',
      index: cssValueStartIndex,
      endIndex: cssValueStartIndex + node.value.length,
      fix: typeof fix === 'function' ? fix : undefined,
      ...reportProps
    });
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
    const closestHooks = getStylingHooksForDensityValue(cssValue, supportedStylinghooks, cssProperty);
    let fix: any;
    if(closestHooks.length > 0){
      const replacementValue = `var(${closestHooks[0]}, ${node.value})`;
      fix =  (fixer: any, sourceCode: any) => {
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
    reportFn({
      node,
      message: messages && messages.rejected ? messages.rejected(node.value, Array.isArray(closestHooks) ? closestHooks.join(', ') : closestHooks) : 'Replace static value with SLDS styling hook.',
      index: cssValueStartIndex,
      endIndex: cssValueStartIndex + node.value.length,
      fix: typeof fix === 'function' ? fix : undefined,
      ...reportProps
    });
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