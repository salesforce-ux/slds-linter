/**
 * @fileoverview Shared reporting utilities for stylelint and ESLint plugins
 * 
 * This module provides platform-specific reporting functions that implement
 * a consistent conditional fix pattern across both stylelint and ESLint plugins.
 * Auto-fixes are only applied when there's exactly one suggestion to avoid ambiguity.
 */

// Shared interface for both stylelint and ESLint message handlers
export interface MessagesObj {
  rejected: (oldValue: string, newValue: string) => string;
  suggested: (oldValue: string) => string;
}

// Simple type definitions for ESLint reporting
export interface ESLintReportFunction {
  (descriptor: {
    node: any;
    message: string;
    index?: number;
    endIndex?: number;
    fix?: any;
    [key: string]: any;
  }): void;
}

/**
 * Simple ESLint reporting utility with conditional fix pattern.
 * Only applies auto-fix when there's exactly one suggestion to avoid ambiguity.
 */
export function reportMatchingHooksESLint(config: {
  node: any;
  suggestions: string[];
  cssValue: string;
  cssValueStartIndex: number;
  messages: MessagesObj;
  reportFn: ESLintReportFunction;
  fixFactory?: () => any;
  reportProps?: Record<string, unknown>;
}): void {
  const { 
    node, 
    suggestions, 
    cssValue, 
    cssValueStartIndex, 
    messages, 
    reportFn, 
    fixFactory, 
    reportProps = {} 
  } = config;
  
  // ESLint v9 pattern: only provide fix when there's exactly one suggestion
  const fix = (suggestions.length === 1 && fixFactory) ? fixFactory() : null;

  const message = suggestions.length > 0 
    ? messages.rejected(cssValue, suggestions.join(', '))
    : messages.suggested(cssValue);

  reportFn({
    node,
    message,
    index: cssValueStartIndex,
    endIndex: cssValueStartIndex + cssValue.length,
    fix,
    ...reportProps
  });
}

/**
 * Simple stylelint reporting utility with conditional fix pattern.
 * Only applies auto-fix when there's exactly one suggestion to avoid ambiguity.
 * Updated to return plain text messages (not JSON) per PR #224.
 */
export function reportMatchingHooksStylelint(config: {
  valueNode: any;
  suggestions: string[];
  offsetIndex: number;
  reportProps: any;
  messages: MessagesObj;
  stylelintUtils: any;
  generateSuggestionsList: (suggestions: string[]) => string;
  fixFactory?: () => any;
}): void {
  const { 
    valueNode, 
    suggestions, 
    offsetIndex, 
    reportProps, 
    messages, 
    stylelintUtils, 
    generateSuggestionsList,
    fixFactory
  } = config;
  
  let index = offsetIndex;
  const value = valueNode.value;
  let endIndex = offsetIndex + valueNode.value.length;
  
  if ('sourceIndex' in valueNode && 'sourceEndIndex' in valueNode) {
    index = valueNode.sourceIndex + offsetIndex;
    endIndex = valueNode.sourceEndIndex + offsetIndex;
  }

  const reportData = {
    node: valueNode,
    index,
    endIndex,
    ...reportProps,
  };

  if (suggestions.length > 0) {
    stylelintUtils.report({
      message: messages.rejected(value, generateSuggestionsList(suggestions)),
      ...reportData,
      fix: suggestions.length === 1 ? fixFactory?.() : null,
    });
  } else {
    stylelintUtils.report({
      message: messages.suggested(value),
      ...reportData,
    });
  }
} 