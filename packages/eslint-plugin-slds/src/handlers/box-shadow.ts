/**
 * Box Shadow CSS handler for ESLint plugin
 */
import type { ValueToStylingHooksMapping } from '@salesforce-ux/sds-metadata';
import {
  handleBoxShadowShared,
  reportMatchingHooksESLint,
  type ESLintReportFunction
} from 'slds-shared-utils';
import { createFullValueFixFactory } from '../utils/fix-factories';
import { createESLintMessages } from '../utils/eslint-adapters';

/**
 * Box Shadow Handler - uses shared logic with proper ESLint context
 */
export function handleBoxShadow(
  decl: any, // ESLint/PostCSS-like decl
  cssValue: string,
  cssValueStartIndex: number,
  supportedStylinghooks: ValueToStylingHooksMapping,
  reportProps: Partial<any>,
  messages: any,
  reportFn: Function
) {
  // ESLint-specific reporting function that uses shared utilities directly
  const eslintReportFn = (
    decl: any,
    closestHooks: string[],
    cssValueStartIndex: number,
    reportProps: any,
    messages: any,
    fix: any
  ) => {
    const fixFactory = createFullValueFixFactory(
      decl, 
      `var(${closestHooks[0]}, ${decl.value.value})`
    );

    reportMatchingHooksESLint({
      node: decl,
      suggestions: closestHooks,
      cssValue,
      cssValueStartIndex,
      messages: createESLintMessages(messages),
      reportFn: reportFn as ESLintReportFunction,
      fixFactory,
      reportProps
    });
  };

  // ESLint-specific fix factory - kept for backward compatibility with shared handler
  const makeFix = (decl: any, closestHooks: string[], value: string) => {
    return createFullValueFixFactory(
      decl, 
      `var(${closestHooks[0]}, ${decl.value.value})`
    )();
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