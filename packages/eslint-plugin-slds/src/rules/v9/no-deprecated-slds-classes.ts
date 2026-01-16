import { Rule } from 'eslint';
import metadata from '@salesforce-ux/sds-metadata';
import ruleMessages from '../../config/rule-messages';

// Use the same config as the main hybrid rule (no-deprecated-classes-slds2)
const { type, description, url, messages } = ruleMessages['no-deprecated-classes-slds2'];

const deprecatedClasses = metadata.deprecatedClasses;
const deprecatedClassesSet = new Set(deprecatedClasses);

/**
 * CSS implementation for detecting deprecated SLDS classes in CSS files.
 * Checks class selectors for deprecated class names.
 * Used by the hybrid no-deprecated-classes-slds2 rule for CSS contexts.
 */
export default {
  meta: {
    type,
    docs: {
      description,
      recommended: true,
      url,
    },
    messages,
  },

  create(context) {
    return {
      // Check all class selectors for deprecated classes
      "SelectorList Selector ClassSelector"(node) {
        const cssClassSelector = context.sourceCode.getText(node);

        // Extract class name (remove the leading dot)
        const className = cssClassSelector.substring(1);

        // Check if it's a deprecated SLDS class
        if (className && deprecatedClassesSet.has(className)) {
          context.report({
            node,
            messageId: 'deprecatedClass',
            data: { className },
          });
        }
      },
    };
  },
} as Rule.RuleModule;
