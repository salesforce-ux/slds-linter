import { Rule } from 'eslint';
import metadata from '@salesforce-ux/sds-metadata';
import ruleMessages from '../../config/rule-messages';
import { isRuleEnabled } from '../../utils/rule-utils';

// Use the same config as the main hybrid rule (no-deprecated-classes-slds2)
const { type, description, url, messages } = ruleMessages['no-deprecated-classes-slds2'];

const deprecatedClasses = metadata.deprecatedClasses;
const deprecatedClassesSet = new Set(deprecatedClasses);

/**
 * Creates the CSS visitor for detecting deprecated SLDS classes.
 * Exported separately so the hybrid rule can reuse it without triggering the deprecation guard.
 */
export function createCssVisitor(context) {
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
}

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
    deprecated: {
      message: "This CSS-only rule is deprecated. Use the hybrid 'no-deprecated-classes-slds2' rule instead, which handles both HTML and CSS.",
      replacedBy: [
        {
          message: "Use 'no-deprecated-classes-slds2' which supports both HTML and CSS files.",
          plugin: {
            name: "@salesforce-ux/eslint-plugin-slds",
          },
          rule: {
            name: "no-deprecated-classes-slds2",
            url: "https://developer.salesforce.com/docs/platform/slds-linter/guide/reference-rules.html#no-deprecated-classes-slds2",
          },
        },
      ],
    },
  },

  create(context) {
    if (isRuleEnabled(context, '@salesforce-ux/slds/no-deprecated-classes-slds2')) {
      return {};
    }

    return createCssVisitor(context);
  },
} as Rule.RuleModule;
