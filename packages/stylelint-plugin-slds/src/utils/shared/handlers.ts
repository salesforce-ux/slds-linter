import { parseBoxShadowValue, isBoxShadowMatch, BoxShadowValue } from '../boxShadowValueParser';
import { findClosestColorHook, convertToHex } from '../color-lib-utils';
import { forEachColorValue } from '../color-utils';
import { getStylingHooksForDensityValue } from '../styling-hook-utils';
import { getFullValueFromNode, isDensifyValue } from '../density-utils';
import { FontValue, isKnownFontWeight, parseFont } from '../fontValueParser';
import { isFunctionNode } from '../decl-utils';
import valueParser from 'postcss-value-parser';
// Import core logic for ESLint v9 wrappers from the correct handler files
import { handleBoxShadow as coreHandleBoxShadow } from '../../rules/no-hardcoded-value/handlers/boxShadowHandler';
import { handleColorProps as coreHandleColorProps } from '../../rules/no-hardcoded-value/handlers/colorHandler';
import { handleDensityPropForNode as coreHandleDensityPropForNode } from '../../rules/no-hardcoded-value/handlers/densityHandler';
import { handleFontProps as coreHandleFontProps } from '../../rules/no-hardcoded-value/handlers/fontHandler';

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

// ESLint v9 wrappers for custom behavior (if needed)
export function handleBoxShadowEslintV9(
  decl: any,
  cssValue: string,
  cssValueStartIndex: number,
  supportedStylinghooks: any,
  reportProps: Partial<any>,
  messages: GenericMessagesObj,
  customReportMatchingHooks: GenericReportFn
) {
  // Add custom ESLint v9 logic here if needed
  return coreHandleBoxShadow(
    decl,
    cssValue,
    cssValueStartIndex,
    supportedStylinghooks,
    reportProps,
    messages,
    customReportMatchingHooks
  );
}

export function handleColorPropsEslintV9(
  decl: any,
  parsedValue: valueParser.ParsedValue,
  cssValueStartIndex: number,
  supportedStylinghooks: any,
  cssProperty: string,
  reportProps: Partial<any>,
  messages: GenericMessagesObj,
  customReportMatchingHooks: GenericReportFn
) {
  // Add custom ESLint v9 logic here if needed
  return coreHandleColorProps(
    decl,
    parsedValue,
    cssValueStartIndex,
    supportedStylinghooks,
    cssProperty,
    reportProps,
    messages,
    customReportMatchingHooks
  );
}

export function handleDensityPropForNodeEslintV9(
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
  // Add custom ESLint v9 logic here if needed
  return coreHandleDensityPropForNode(
    decl,
    node,
    cssValue,
    cssValueStartIndex,
    supportedStylinghooks,
    cssProperty,
    reportProps,
    messages,
    customReportMatchingHooks,
    skipNormalization
  );
}

export function handleFontPropsEslintV9(
  decl: any,
  parsedValue: valueParser.ParsedValue,
  cssValueStartIndex: number,
  supportedStylinghooks: any,
  cssProperty: string,
  reportProps: Partial<any>,
  messages: GenericMessagesObj,
  customReportMatchingHooks: GenericReportFn
) {
  // Add custom ESLint v9 logic here if needed
  return coreHandleFontProps(
    decl,
    parsedValue,
    cssValueStartIndex,
    supportedStylinghooks,
    cssProperty,
    reportProps,
    messages,
    customReportMatchingHooks
  );
} 