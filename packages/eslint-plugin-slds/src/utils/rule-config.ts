/**
 * Rule configuration utility
 * Combines YAML message data with technical metadata
 */

import ruleMessages from '../config/rule-messages.yml';

export interface RuleMessages {
  description: string;
  url?: string;
  messages: Record<string, string>;
}

export interface TechnicalMeta {
  type: 'problem' | 'suggestion' | 'layout';
  docs: {
    description: string;
    category: string;
    recommended: boolean;
    url?: string;
  };
  fixable: 'code' | 'whitespace' | null;
  hasSuggestions: boolean;
  severity: 'error' | 'warning';
}

export interface RuleConfig {
  meta: TechnicalMeta;
  messages: Record<string, string>;
}

// Technical metadata (kept in code, not in YAML)
const technicalMeta: Record<string, Omit<TechnicalMeta, 'docs'> & { category: string }> = {
  // ESLint v9 CSS Rules
  'no-important-tag': {
    type: 'problem',
    category: 'Stylistic Issues',
    fixable: 'code',
    hasSuggestions: true,
    severity: 'warning',
  },
  'no-slds-class-overrides': {
    type: 'problem',
    category: 'Best Practices',
    fixable: null,
    hasSuggestions: true,
    severity: 'error',
  },
  
  // ESLint v8 HTML/Component Rules
  'enforce-bem-usage': {
    type: 'suggestion',
    category: 'Stylistic Issues',
    fixable: 'code',
    hasSuggestions: false,
    severity: 'error',
  },
  'modal-close-button-issue': {
    type: 'problem',
    category: 'Possible Errors',
    fixable: 'code',
    hasSuggestions: true,
    severity: 'error',
  },
  'no-deprecated-classes-slds2': {
    type: 'problem',
    category: 'Possible Errors',
    fixable: 'code',
    hasSuggestions: true,
    severity: 'error',
  },
};

/**
 * Get rule messages (CX-maintained content from YAML)
 */
export function getRuleMessages(ruleName: string): RuleMessages {
  const messages = ruleMessages[ruleName];
  if (!messages) {
    throw new Error(`Rule messages not found for: ${ruleName}`);
  }
  return messages;
}

/**
 * Get complete rule configuration (messages + technical metadata)
 */
export function getRuleConfig(ruleName: string): RuleConfig {
  const messages = getRuleMessages(ruleName);
  const meta = technicalMeta[ruleName];
  
  if (!meta) {
    throw new Error(`Technical metadata not found for: ${ruleName}`);
  }

  return {
    meta: {
      type: meta.type,
      docs: {
        description: messages.description,
        category: meta.category,
        recommended: true, // All rules are recommended
        url: messages.url,
      },
      fixable: meta.fixable,
      hasSuggestions: meta.hasSuggestions,
      severity: meta.severity,
    },
    messages: messages.messages,
  };
} 