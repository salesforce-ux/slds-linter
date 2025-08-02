/**
 * @fileoverview Rule to disallow `!important` flags in CSS properties
 * Uses YAML-based messages and ESLint v9 native messageId system
 * 
 * NOTE: We use a custom implementation instead of the official @eslint/css no-important rule because:
 * 1. SLDS-specific property targeting with isTargetProperty()
 * 2. CX writer message customization via YAML configuration
 * 3. Configurable propertyTargets for SLDS workflows
 * 4. Direct auto-fix instead of suggestions-only
 * 
 * Official rule: https://github.com/eslint/css/blob/main/docs/rules/no-important.md
 */

import { Rule } from 'eslint';
import { getRuleConfig } from '../../../utils/yaml-message-loader';
import { isTargetProperty } from '../../../utils/css-utils';

const ruleName = 'no-important-tag';
const ruleConfig = getRuleConfig(ruleName);

export default {
  meta: {
    type: ruleConfig.meta.type,
    docs: {
      description: ruleConfig.meta.docs.description,
      category: ruleConfig.meta.docs.category,
      recommended: ruleConfig.meta.docs.recommended,
      url: ruleConfig.meta.docs.url || 'https://developer.salesforce.com/docs/platform/slds-linter/guide/reference-rules.html#no-important-tag',
    },
    fixable: ruleConfig.meta.fixable,
    hasSuggestions: ruleConfig.meta.hasSuggestions,
    schema: [
      {
        type: 'object',
        properties: {
          propertyTargets: {
            type: 'array',
            items: { type: 'string' },
            description: 'Specific CSS properties to target (empty means target all SLDS properties)',
          },
        },
        additionalProperties: false,
      },
    ],
    // Use messages directly from YAML - ESLint v9 handles {{placeholder}} interpolation
    messages: ruleConfig.messages,
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    // Skip non-CSS files
    if (!context.filename?.match(/\.(css|scss)$/)) {
      return {};
    }

    const options = context.options[0] || {};
    const propertyTargets = options.propertyTargets || [];
    const importantPattern = /!(\s|\/\*.*?\*\/)*important/iu;

    return {
      Declaration(node: any) {
        // Check if this is a target property for SLDS linting
        if (!isTargetProperty(node.property, propertyTargets)) {
          return;
        }

        if (node.important) {
          const sourceCode = context.sourceCode;
          const declarationText = sourceCode.getText(node);
          const importantMatch = importantPattern.exec(declarationText);

          if (importantMatch) {
            // Report and auto-fix the !important flag
            context.report({
              node,
              messageId: 'unexpectedImportant',
              fix(fixer) {
                // Primary fix: remove !important
                const fullText = sourceCode.getText(node);
                const newText = fullText.replace(importantPattern, '');
                return fixer.replaceText(node, newText);
              },
            });
          }
        }
      },
    };
  },
} as Rule.RuleModule; 