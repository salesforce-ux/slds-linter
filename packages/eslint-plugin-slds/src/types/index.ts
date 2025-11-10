import { Rule } from 'eslint';
import type { ValueToStylingHooksMapping } from '@salesforce-ux/sds-metadata';

/**
 * Custom mapping for hook replacements
 * Maps hook names to their applicable properties and values
 */
export interface CustomHookMapping {
  [hookName: string]: {
    properties: string[];
    values: string[];
  };
}

/**
 * Options for the no-hardcoded-values rule
 */
export interface RuleOptions {
  /**
   * Controls when to report hardcoded numeric values
   * - 'never': Don't report hardcoded numeric values
   * - 'always': Always report hardcoded numeric values (default)
   * - 'hasReplacement': Only report when a replacement hook is available
   */
  reportNumericValue?: 'never' | 'always' | 'hasReplacement';
  
  /**
   * Custom mapping for pre-configured hook replacements
   */
  customMapping?: CustomHookMapping;
  
  /**
   * Prefer palette hooks when multiple replacements are available
   */
  preferPaletteHook?: boolean;
}

/**
 * Context interface for handlers to access necessary dependencies
 */
export interface HandlerContext {
  valueToStylinghook: ValueToStylingHooksMapping;
  context: Rule.RuleContext;
  sourceCode: any;
  options?: RuleOptions;
}



/**
 * Configuration for creating the rule
 */
export interface RuleConfig {
  ruleConfig: {
    type: 'problem' | 'suggestion' | 'layout';
    description: string;
    url?: string;
    messages: Record<string, string>;
  };
  valueToStylinghook: ValueToStylingHooksMapping;
}

/**
 * Handler function signature for CSS declarations
 */
export type DeclarationHandler = (node: any, context: HandlerContext) => void;