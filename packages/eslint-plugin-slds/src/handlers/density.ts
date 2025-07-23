/**
 * Density CSS handler for ESLint plugin
 */
import type { ValueToStylingHooksMapping } from '@salesforce-ux/sds-metadata';
import valueParser from 'postcss-value-parser';
import {
  getStylingHooksForDensityValue,
  reportMatchingHooksESLint,
  type ESLintReportFunction
} from 'slds-shared-utils';
import { createCSSValueFixFactory } from '../utils/fix-factories';
import { createESLintMessages } from '../utils/eslint-adapters';

/**
 * Density Handler for CSS spacing/sizing properties
 */
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

  const fixFactory = createCSSValueFixFactory(
    decl, 
    node, 
    `var(${closestHooks[0]}, ${node.value})`
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
} 