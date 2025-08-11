import { Rule } from 'eslint';
import metadata from '@salesforce-ux/sds-metadata';
import ruleMessages from '../../config/rule-messages.yml';

const ruleConfig = ruleMessages['no-deprecated-slds-classes'];

const deprecatedClasses = metadata.deprecatedClasses;
const deprecatedClassesSet = new Set(deprecatedClasses);

export default {
  meta: {
    type: ruleConfig.type,
    docs: {
      description: ruleConfig.description,
      recommended: true,
      url: ruleConfig.url,
    },
    fixable: null,
    hasSuggestions: false,
    schema: [],
    messages: ruleConfig.messages,
  },
  
  create(context) {
    return {
      // For no-deprecated-slds-classes: Check all class selectors for deprecated classes
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
