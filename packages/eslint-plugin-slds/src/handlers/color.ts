/**
 * Color CSS handler for ESLint plugin
 */
import type { ValueToStylingHooksMapping } from '@salesforce-ux/sds-metadata';
import valueParser from 'postcss-value-parser';
import {
  findClosestColorHook,
  convertToHex,
  forEachColorValue,
  reportMatchingHooksESLint,
  type ESLintReportFunction
} from 'slds-shared-utils';
import { createCSSValueFixFactory } from '../utils/fix-factories';
import { createESLintMessages } from '../utils/eslint-adapters';

/**
 * Color Handler for CSS color properties
 */
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

    const fixFactory = createCSSValueFixFactory(
      decl, 
      node, 
      `var(${closestHooks[0]}, ${hexValue})`
    );

    reportMatchingHooksESLint({
      node,
      suggestions: closestHooks,
      cssValue: node.value,
      cssValueStartIndex,
      messages: createESLintMessages(messages),
      reportFn: reportFn as ESLintReportFunction,
      fixFactory,
      reportProps
    });
  });
} 