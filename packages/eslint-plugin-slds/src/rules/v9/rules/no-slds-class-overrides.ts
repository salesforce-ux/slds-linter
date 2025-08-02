/**
 * @fileoverview Rule to disallow overriding SLDS CSS classes
 * Compatible with @eslint/css parser for ESLint v9
 * Maintains parity with stylelint version (no auto-fix, basic suggestions)
 */

import { Rule } from 'eslint';
import metadata from '@salesforce-ux/sds-metadata';
import { getRuleConfig } from '../../../utils/yaml-message-loader';

const ruleName = 'no-slds-class-overrides';
const ruleConfig = getRuleConfig(ruleName);

// Get SLDS classes from metadata (same as stylelint version)
const sldsClasses = metadata.sldsPlusClasses;
const sldsClassesSet = new Set(sldsClasses);

export default {
  meta: {
    type: ruleConfig.meta.type,
    docs: {
      description: ruleConfig.meta.docs.description,
      category: ruleConfig.meta.docs.category,
      recommended: ruleConfig.meta.docs.recommended,
      url: ruleConfig.meta.docs.url || 'https://developer.salesforce.com/docs/platform/slds-linter/guide/reference-rules.html#no-slds-class-overrides',
    },
    fixable: null, // No auto-fix (parity with stylelint version)
    hasSuggestions: true, // Basic suggest API
    schema: [],
    messages: ruleConfig.messages,
  },
  
  create(context) {
    const sourceCode = context.sourceCode;

    /**
     * Generate basic suggestion options (simple, no complexity)
     */
    function generateSuggestions(node: any, className: string) {
      const suggestions = [];
      const selectorText = sourceCode.getText(node.parent || node);

      // Basic suggestion: Add ESLint disable comment
      suggestions.push({
        messageId: 'addDisableComment',
        data: { className },
        fix(fixer) {
          const ruleWithComment = `/* eslint-disable-next-line slds/no-slds-class-overrides */\n${selectorText}`;
          return fixer.replaceText(node.parent || node, ruleWithComment);
        },
      });

      return suggestions;
    }

    return {
      ClassSelector(node: any) {
        const className = node.name;
        
        // Core detection logic (same as stylelint version)
        if (className && className.startsWith('slds-') && sldsClassesSet.has(className)) {
          context.report({
            node,
            messageId: 'sldsClassOverride',
            data: {
              className: className,
            },
            // Basic suggestions (no complexity)
            suggest: generateSuggestions(node, className),
          });
        }
      },
    };
  },
} as Rule.RuleModule; 