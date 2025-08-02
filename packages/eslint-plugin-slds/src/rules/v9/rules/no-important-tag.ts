/**
 * @fileoverview Rule to disallow `!important` flags in CSS properties
 * Compatible with @eslint/css parser for ESLint v9
 * Enhanced with ESLint suggest API for multiple fix options
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
    hasSuggestions: true, // Enable suggestions API
    schema: [
      {
        type: 'object',
        properties: {
          propertyTargets: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of CSS properties to target for !important checking'
          }
        },
        additionalProperties: false,
      },
    ],
    messages: ruleConfig.messages,
  },
  
  create(context) {
    const sourceCode = context.sourceCode;
    const options = context.options[0] || {};
    const propertyTargets = options.propertyTargets || [];
    
    // Simple regex to detect !important
    const importantPattern = /!(\s|\/\*.*?\*\/)*important/iu;

    /**
     * Generate suggestion options for replacing !important
     */
    function generateSuggestions(node: any, propertyName: string, currentValue: string) {
      const suggestions = [];
      const declarationText = sourceCode.getText(node);

      // Suggestion 1: Simply remove !important
      suggestions.push({
        messageId: 'removeImportant',
        fix(fixer) {
          const newText = declarationText.replace(importantPattern, '');
          const cleanedText = newText.replace(/\s*;/, ' ;');
          return fixer.replaceText(node, cleanedText);
        },
      });

      // Suggestion 2: Add specificity comment (following stylelint pattern)
      suggestions.push({
        messageId: 'addSpecificityComment',
        fix(fixer) {
          const newText = declarationText.replace(importantPattern, '/* TODO: Increase specificity instead */');
          return fixer.replaceText(node, newText);
        },
      });

      return suggestions;
    }

    return {
      Declaration(node: any) {
        // Check if declaration has !important flag AND matches property targeting (stylelint parity)
        if (node.important && isTargetProperty(node.property, propertyTargets)) {
          const declarationText = sourceCode.getText(node);
          const importantMatch = importantPattern.exec(declarationText);
          
          if (importantMatch) {
            const currentValue = node.value;
            
            context.report({
              node,
              messageId: 'unexpectedImportant',
              // Auto-fix: Simple !important removal (parity with stylelint version)
              fix(fixer) {
                const newText = declarationText.replace(importantPattern, '');
                const cleanedText = newText.replace(/\s*;/, ' ;');
                return fixer.replaceText(node, cleanedText);
              },
              suggest: generateSuggestions(node, node.property, currentValue),
            });
          }
        }
      },
    };
  },
} as Rule.RuleModule; 