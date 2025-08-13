import { Rule } from 'eslint';
import metadata from '@salesforce-ux/sds-metadata';
import ruleMessages from '../../config/rule-messages.yml';

const { type, description, url, messages } = ruleMessages['enforce-bem-usage'];

const bemMapping = metadata.bemNaming;

export default {
  meta: {
    type,
    docs: {
      description,
      recommended: true,
      url,
    },
    fixable: 'code',
    messages,
  },
  
  create(context) {
    return {
      // Check all class selectors for BEM usage
      "SelectorList Selector ClassSelector"(node) {
        const cssClassSelector = context.sourceCode.getText(node);
        
        // Extract class name (remove the leading dot)
        const className = cssClassSelector.substring(1);
        
        // Check mapping data for this class name (matches Stylelint logic)
        if (className && className in bemMapping) {
          const newValue = bemMapping[className];
          if (typeof newValue === 'string') {
            context.report({
              node,
              messageId: 'bemDoubleDash',
              data: {
                actual: className,
                newValue,
              },
              fix(fixer) {
                return fixer.replaceText(node, `.${newValue}`);
              },
            });
          }
        }
      },
    };
  },
} as Rule.RuleModule;
