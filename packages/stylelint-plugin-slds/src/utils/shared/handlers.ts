import { parseBoxShadowValue, isBoxShadowMatch, BoxShadowValue } from '../boxShadowValueParser';
import { findClosestColorHook, convertToHex } from '../color-lib-utils';
import { forEachColorValue } from '../color-utils';
import { getStylingHooksForDensityValue } from '../styling-hook-utils';
import { getFullValueFromNode, isDensifyValue } from '../density-utils';
import { FontValue, isKnownFontWeight, parseFont } from '../fontValueParser';
import { isFunctionNode } from '../decl-utils';
import valueParser from 'postcss-value-parser';

// Generic types for reporting and messages
export type GenericMessagesObj = {
  rejected: (oldValue: string, newValue: string) => string;
  suggested: (oldValue: string) => string;
};

export type GenericReportFn = (
  valueNode: any,
  suggestions: string[],
  offsetIndex: number,
  props: Partial<any>,
  messages: GenericMessagesObj,
  fix?: Function
) => void;

function toBoxShadowValue(cssValue: string): BoxShadowValue[] | undefined {
  const parsedCssValue = parseBoxShadowValue(cssValue).filter((shadow) => Object.entries(shadow).length > 0);
  if(parsedCssValue.length == 0){
    return;
  }
  return parsedCssValue;
}

function shadowValueToHookEntries(supportedStylinghooks: any): Array<[string, string[]]> {
  return Object.entries(supportedStylinghooks).filter(([key, value]: any) => {
    return value.some((hook: any) => hook.properties.includes('box-shadow'));
  }).map(([key, value]: any) => {
    return [key, value.map((hook: any) => hook.name)];
  });
}

export function handleBoxShadow(
  decl: any,
  cssValue: string,
  cssValueStartIndex: number,
  supportedStylinghooks: any,
  reportProps: Partial<any>,
  messages: GenericMessagesObj,
  customReportMatchingHooks: GenericReportFn
) {
  const shadowHooks = shadowValueToHookEntries(supportedStylinghooks);
  const parsedCssValue = toBoxShadowValue(cssValue);
  if(!parsedCssValue){
    return;
  }
  for(const [shadow, closestHooks] of shadowHooks){
    const parsedValueHook = toBoxShadowValue(shadow);
    if (parsedValueHook && isBoxShadowMatch(parsedCssValue, parsedValueHook)) {
      const fix = () => {
        decl.value = `var(${closestHooks[0]}, ${cssValue})`;
      };
      if (closestHooks.length > 0) {
        customReportMatchingHooks(
          decl,
          closestHooks,
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

export function handleColorProps(
  decl: any,
  parsedValue: valueParser.ParsedValue,
  cssValueStartIndex: number,
  supportedStylinghooks: any,
  cssProperty: string,
  reportProps: Partial<any>,
  messages: GenericMessagesObj,
  customReportMatchingHooks: GenericReportFn
) {
  forEachColorValue(parsedValue, (node: any) => {
    const hexValue = convertToHex(node.value);
    if (node.value === 'transparent' || !hexValue) {
      return;
    }
    const closestHooks = findClosestColorHook(
      hexValue,
      supportedStylinghooks,
      cssProperty
    );
    const fix = () => {
      decl.value = decl.value.replace(
        valueParser.stringify(node),
        `var(${closestHooks[0]}, ${hexValue})`
      );
    };
    customReportMatchingHooks(
      { ...node, value: node.value },
      closestHooks,
      cssValueStartIndex,
      reportProps,
      messages,
      fix
    );
  });
}

export function handleDensityPropForNode(
  decl: any,
  node: valueParser.Node,
  cssValue: string,
  cssValueStartIndex: number,
  supportedStylinghooks: any,
  cssProperty: string,
  reportProps: Partial<any>,
  messages: GenericMessagesObj,
  customReportMatchingHooks: GenericReportFn,
  skipNormalization?: boolean
) {
  const closestHooks = getStylingHooksForDensityValue(cssValue, supportedStylinghooks, cssProperty);
  let fix: Function | undefined;
  if(closestHooks.length > 0){
    const replacementValue = `var(${closestHooks[0]}, ${node.value})`;
    fix =  () => {
      decl.value = decl.value.replace(valueParser.stringify(node),replacementValue);
    }
  }
  let reportValue;
  if (skipNormalization) {
    reportValue = cssValue;
  } else {
    reportValue = getFullValueFromNode(node);
  }
  const reportNode = { ...node, value: reportValue };
  customReportMatchingHooks(
    reportNode,
    closestHooks,
    cssValueStartIndex,
    reportProps,
    messages,
    fix
  );
}

export function handleFontProps(
  decl: any,
  parsedValue: valueParser.ParsedValue,
  cssValueStartIndex: number,
  supportedStylinghooks: any,
  cssProperty: string,
  reportProps: Partial<any>,
  messages: GenericMessagesObj,
  customReportMatchingHooks: GenericReportFn
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
      const normalizedNode = { ...node, value: getFullValueFromNode(node) };
      handleDensityPropForNode(decl, normalizedNode, normalizedNode.value, cssValueStartIndex, supportedStylinghooks, key, reportProps, messages, customReportMatchingHooks);
    } else if (key === 'font-size') {
      const normalizedNode = { ...node, value: getFullValueFromNode(node) };
      handleDensityPropForNode(decl, normalizedNode, normalizedNode.value, cssValueStartIndex, supportedStylinghooks, key, reportProps, messages, customReportMatchingHooks);
    }
  }
} 