import { Rule } from 'eslint';
import type { ValueToStylingHooksMapping } from '@salesforce-ux/sds-metadata';

/**
 * Context interface for handlers to access necessary dependencies
 */
export interface HandlerContext {
  valueToStylinghook: ValueToStylingHooksMapping;
  reportFn: (options: ReportOptions) => void;
  sourceCode: any;
}

/**
 * Options for reporting issues
 */
export interface ReportOptions {
  node: any;
  messageId: string;
  data?: Record<string, any>;
  fix?: (fixer: any) => any;
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