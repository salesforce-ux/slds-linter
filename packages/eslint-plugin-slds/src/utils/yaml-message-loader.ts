/**
 * Simple YAML message loader for ESLint rules
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { load } from 'js-yaml';

export interface RuleMessages {
  description: string;
  url?: string;
  messages: Record<string, string>;
}

interface YamlConfig {
  [ruleName: string]: RuleMessages;
}

let configCache: YamlConfig | null = null;

/**
 * Load and parse YAML configuration
 */
function loadConfig(): YamlConfig {
  if (configCache) return configCache;
  
  try {
    const yamlPath = join(__dirname, '../config/rule-messages.yml');
    const yamlContent = readFileSync(yamlPath, 'utf-8');
    configCache = load(yamlContent) as YamlConfig;
    return configCache;
  } catch (error) {
    console.warn('Failed to load YAML config:', error);
    return {};
  }
}

/**
 * Get messages for a rule
 */
export function getRuleMessages(ruleName: string): RuleMessages {
  const config = loadConfig();
  const rule = config[ruleName];
  
  if (!rule || !rule.messages) {
    return {
      description: `Rule ${ruleName}`,
      messages: { default: `Rule violation: ${ruleName}` }
    };
  }
  
  return rule;
}

/**
 * Get complete rule config (for ESLint v9 CSS rules)
 */
export function getRuleConfig(ruleName: string): any {
  const messages = getRuleMessages(ruleName);
  const metadata = getMetadata(ruleName);
  
  return {
    meta: {
      type: metadata.type,
      docs: {
        description: messages.description,
        category: metadata.category,
        recommended: metadata.recommended,
        url: messages.url,
      },
      fixable: metadata.fixable,
      hasSuggestions: metadata.hasSuggestions,
      severity: metadata.severity,
    },
    messages: messages.messages,
  };
}

/**
 * Technical metadata (kept in code, not CX-maintained)
 */
function getMetadata(ruleName: string) {
  const rules: Record<string, any> = {
    'no-important-tag': {
      type: 'problem',
      category: 'Stylistic Issues',
      recommended: true,
      fixable: 'code',
      hasSuggestions: true,
      severity: 'warning',
    },
    'no-slds-class-overrides': {
      type: 'problem',
      category: 'Best Practices',
      recommended: true,
      fixable: null,
      hasSuggestions: true,
      severity: 'warning',
    },
    'enforce-bem-usage': {
      type: 'suggestion',
      category: 'Stylistic Issues', // BEM is stylistic formatting
      recommended: true,
      fixable: 'code',
      hasSuggestions: false,
      severity: 'error',
    },
    'modal-close-button-issue': {
      type: 'problem',
      category: 'Best Practices',
      recommended: true,
      fixable: 'code', // Originally had fixable code
      hasSuggestions: false,
      severity: 'error',
    },
    'no-deprecated-classes-slds2': {
      type: 'problem',
      category: 'Best Practices',
      recommended: true,
      fixable: null, // No auto-fix for deprecated classes
      hasSuggestions: false,
      severity: 'error',
    },
  };

  return rules[ruleName] || {
    type: 'problem',
    category: 'Best Practices',
    recommended: true,
    fixable: null,
    hasSuggestions: false,
    severity: 'error',
  };
} 