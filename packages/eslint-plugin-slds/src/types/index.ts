import { Rule } from 'eslint';
import type { ValueToStylingHooksMapping } from '@salesforce-ux/sds-metadata';

/**
 * Context interface for handlers to access necessary dependencies
 */
export interface HandlerContext {
  valueToStylinghook: ValueToStylingHooksMapping;
  context: Rule.RuleContext;
  sourceCode: any;
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