import { Rule } from 'eslint';
import type { ValueToStylingHooksMapping } from '@salesforce-ux/sds-metadata';
import type { ComponentContext } from '../utils/component-context-collector';
import type { ContextAwareSuggestionScorer } from '../utils/context-aware-suggestion-scorer';
import type { ContextualMessageGenerator } from '../utils/contextual-message-generator';

/**
 * Context interface for handlers to access necessary dependencies
 */
export interface HandlerContext {
  valueToStylinghook: ValueToStylingHooksMapping;
  context: Rule.RuleContext;
  sourceCode: any;
}

/**
 * Enhanced context interface with component analysis capabilities
 */
export interface EnhancedHandlerContext extends HandlerContext {
  componentContext?: ComponentContext;
  suggestionScorer?: ContextAwareSuggestionScorer;
  messageGenerator?: ContextualMessageGenerator;
  enableContextAnalysis?: boolean;
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

/**
 * Enhanced handler function signature with context analysis
 */
export type EnhancedDeclarationHandler = (node: any, context: EnhancedHandlerContext) => Promise<void>;