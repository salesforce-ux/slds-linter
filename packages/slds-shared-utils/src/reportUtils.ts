/**
 * @fileoverview Shared reporting utilities for stylelint and ESLint plugins
 * 
 * This module provides platform-specific reporting functions that implement
 * a consistent conditional fix pattern across both stylelint and ESLint plugins.
 * Auto-fixes are only applied when there's exactly one suggestion to avoid ambiguity.
 */

// Type definitions using stylelint's official types
export interface StylelintUtils {
  report: (problem: any) => void; // Using any to avoid stylelint dependency in shared utils
}

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

export interface ReportConfig {
  node: any;
  cssValue: string;
  suggestions: string[];
  offsetIndex: number;
  messages: {
    rejected: (oldValue: string, newValue: string) => string;
    suggested?: (oldValue: string) => string;
  };
}

export interface PluginReporter {
  report: (config: {
    node: any;
    message: string;
    index?: number;
    endIndex?: number;
    fix?: any;
    [key: string]: any;
  }) => void;
}

// Shared interface for both stylelint and ESLint message handlers
export interface MessagesObj {
  rejected: (oldValue: string, newValue: string) => string;
  suggested: (oldValue: string) => string;
}

// Platform-specific configuration interfaces
export interface StylelintReportConfig {
  valueNode: any; // ValueParser.Node when we have proper postcss-value-parser types
  suggestions: string[];
  offsetIndex: number;
  reportProps: any; // Will be Partial<stylelint.Problem> when used
  messages: MessagesObj;
  stylelintUtils: StylelintUtils;
  generateSuggestionsList: (suggestions: string[]) => string;
  fixFactory?: () => any;
}

export interface ESLintReportConfig {
  node: any;
  suggestions: string[];
  cssValue: string;
  cssValueStartIndex: number;
  messages: MessagesObj;
  reportFn: ESLintReportFunction;
  fixFactory?: () => any;
  reportProps?: Record<string, unknown>;
}

/**
 * Generic report utility that implements the conditional fix pattern:
 * Only applies auto-fix when there's exactly one suggestion to avoid ambiguity.
 * 
 * Used by both stylelint and ESLint plugins.
 */
export function reportWithConditionalFix(
  config: ReportConfig,
  fixFactory: () => any,
  pluginReporter: PluginReporter,
  additionalProps: Record<string, any> = {}
): void {
  const { node, cssValue, suggestions, offsetIndex, messages } = config;
  
  // Apply fix only when there's exactly one unambiguous suggestion
  const fix = suggestions.length === 1 ? fixFactory() : null;
  
  const message = suggestions.length > 0 
    ? messages.rejected(cssValue, suggestions.join(', '))
    : messages.suggested?.(cssValue) || `No suggestions found for: ${cssValue}`;

  pluginReporter.report({
    node,
    message,
    index: offsetIndex,
    endIndex: offsetIndex + cssValue.length,
    fix,
    ...additionalProps
  });
}

/**
 * Validation helper for stylelint configuration
 */
function validateStylelintConfig(config: StylelintReportConfig): void {
  if (!config.valueNode) {
    throw new Error('StylelintReportConfig: valueNode is required');
  }
  if (!config.stylelintUtils) {
    throw new Error('StylelintReportConfig: stylelintUtils is required');
  }
  if (!config.generateSuggestionsList) {
    throw new Error('StylelintReportConfig: generateSuggestionsList function is required');
  }
  if (!Array.isArray(config.suggestions)) {
    throw new TypeError('StylelintReportConfig: suggestions must be an array');
  }
}

/**
 * Validation helper for ESLint configuration
 */
function validateESLintConfig(config: ESLintReportConfig): void {
  if (!config.node) {
    throw new Error('ESLintReportConfig: node is required');
  }
  if (!config.cssValue) {
    throw new Error('ESLintReportConfig: cssValue is required');
  }
  if (!config.reportFn) {
    throw new Error('ESLintReportConfig: reportFn is required');
  }
  if (!Array.isArray(config.suggestions)) {
    throw new TypeError('ESLintReportConfig: suggestions must be an array');
  }
}

/**
 * Stylelint-specific wrapper that maintains backward compatibility
 */
export function createStylelintReporter(stylelintUtils: StylelintUtils): PluginReporter {
  return {
    report: (config) => {
      // Transform for stylelint's expected format
      const message = typeof config.message === 'object' 
        ? JSON.stringify(config.message)
        : config.message;
        
      stylelintUtils.report({
        ...config,
        message
      });
    }
  };
}

/**
 * ESLint-specific wrapper 
 */
export function createEslintReporter(context: { report: (descriptor: any) => void }): PluginReporter {
  return {
    report: (config) => {
      context.report({
        node: config.node,
        message: config.message,
        fix: config.fix
      });
    }
  };
}

/**
 * Reports linting issues with conditional auto-fix for stylelint.
 * 
 * Auto-fix is only applied when there's exactly one suggestion to avoid ambiguity.
 * 
 * @param config - Stylelint-specific reporting configuration
 * @throws {TypeError} When required parameters are missing or invalid
 * @throws {Error} When stylelint utilities are not available
 * 
 * @example
 * ```typescript
 * reportMatchingHooksStylelint({
 *   valueNode: parsedNode,
 *   suggestions: ['--slds-color-red-50'],
 *   offsetIndex: 0,
 *   reportProps: { severity: 'error' },
 *   messages: { rejected: (old, new) => `Replace ${old} with ${new}` },
 *   stylelintUtils: stylelint.utils,
 *   generateSuggestionsList: (suggestions) => suggestions.join(', ')
 * });
 * ```
 */
export function reportMatchingHooksStylelint(config: StylelintReportConfig): void {
  // Validate configuration
  validateStylelintConfig(config);
  
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

  const stylelintReporter = createStylelintReporter(stylelintUtils);
  
  const reportConfig: ReportConfig = {
    node: valueNode,
    cssValue: value,
    suggestions,
    offsetIndex: index,
    messages: {
      rejected: (oldValue, newValue) => JSON.stringify({
        message: messages.rejected(oldValue, generateSuggestionsList(suggestions)),
        suggestions,
      }),
      suggested: (oldValue) => JSON.stringify({
        message: messages.suggested(oldValue),
        suggestions: [],
      })
    }
  };

  reportWithConditionalFix(
    reportConfig, 
    fixFactory || (() => null), 
    stylelintReporter, 
    {
      index,
      endIndex,
      ...reportProps
    }
  );
}

/**
 * Reports linting issues with conditional auto-fix for ESLint.
 * 
 * Auto-fix is only applied when there's exactly one suggestion to avoid ambiguity.
 * Follows ESLint v9 pattern for conditional fixes.
 * 
 * @param config - ESLint-specific reporting configuration
 * @throws {TypeError} When required parameters are missing or invalid
 * @throws {Error} When ESLint context is not available
 * 
 * @example
 * ```typescript
 * reportMatchingHooksESLint({
 *   node: eslintNode,
 *   suggestions: ['--slds-color-red-50'],
 *   cssValue: '#ff0000',
 *   cssValueStartIndex: 10,
 *   messages: { rejected: (old, new) => `Replace ${old} with ${new}` },
 *   reportFn: context.report,
 *   fixFactory: () => (fixer) => fixer.replaceText(node, newValue)
 * });
 * ```
 */
export function reportMatchingHooksESLint(config: ESLintReportConfig): void {
  // Validate configuration
  validateESLintConfig(config);
  
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
 * Legacy wrapper for backward compatibility
 * @deprecated Use reportMatchingHooksStylelint directly
 */
export function reportMatchingHooksLegacyStylelint(
  valueNode: any,
  suggestions: string[],
  offsetIndex: number,
  props: any,
  messages: MessagesObj,
  stylelintUtils: any,
  generateSuggestionsList: (suggestions: string[]) => string,
  fix?: any
) {
  return reportMatchingHooksStylelint({
    valueNode,
    suggestions,
    offsetIndex,
    reportProps: props,
    messages,
    stylelintUtils,
    generateSuggestionsList,
    fixFactory: fix ? () => fix : undefined
  });
}

/**
 * Legacy wrapper for backward compatibility
 * @deprecated Use reportMatchingHooksESLint directly
 */
export function reportMatchingHooksForEslint(
  node: any,
  suggestions: string[],
  cssValue: string,
  cssValueStartIndex: number,
  messages: MessagesObj,
  reportFn: ESLintReportFunction,
  fixFactory?: () => any,
  reportProps: Record<string, unknown> = {}
) {
  return reportMatchingHooksESLint({
    node,
    suggestions,
    cssValue,
    cssValueStartIndex,
    messages,
    reportFn,
    fixFactory,
    reportProps
  });
} 