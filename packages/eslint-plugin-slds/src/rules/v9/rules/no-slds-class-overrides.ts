/**
 * @fileoverview Rule to disallow overriding SLDS CSS classes
 * Uses YAML-based messages and ESLint v9 native messageId system
 */

import { Rule } from 'eslint';
import metadata from '@salesforce-ux/sds-metadata';
import { getRuleConfig } from '../../../utils/yaml-message-loader';

const ruleName = 'no-slds-class-overrides';
const ruleConfig = getRuleConfig(ruleName);
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
    fixable: ruleConfig.meta.fixable,
    hasSuggestions: ruleConfig.meta.hasSuggestions,
    schema: [],
    // Use messages directly from YAML - ESLint v9 handles {{placeholder}} interpolation
    messages: ruleConfig.messages,
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    // Skip non-CSS files
    if (!context.filename?.match(/\.(css|scss)$/)) {
      return {};
    }

    return {
      // Use ClassSelector visitor to directly target CSS class selectors
      ClassSelector(node: any) {
        // Extract the class name from the ClassSelector node
        const className = node.name;
        
        // Check if this is an SLDS class that shouldn't be overridden
        if (className && className.startsWith('slds-') && sldsClassesSet.has(className)) {
          context.report({
            node,
            messageId: 'sldsClassOverride',
            data: {
              className: className,
            },
          });
        }
      },
    };
  },
} as Rule.RuleModule; 