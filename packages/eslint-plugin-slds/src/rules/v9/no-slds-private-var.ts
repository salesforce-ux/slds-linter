import { Rule } from 'eslint';
import ruleMessages from '../../config/rule-messages';

const ruleConfig = ruleMessages['no-slds-private-var'];
const { type, description, url, messages } = ruleConfig;

export default {
  meta: {
    type,
    docs: {
      description,
      recommended: true,
      url,
    },
    fixable: 'code',
    messages
  },
  
  create(context) {
    return {
      // Handle CSS custom properties (declarations starting with --)
      "Declaration"(node) {
        // Check if this is a custom property declaration
        if (node.property && typeof node.property === 'string' && node.property.startsWith('--_slds-')) {
          context.report({
            node,
            messageId: 'privateVar',
            data: { prop: node.property },
            fix(fixer) {
              // Auto-fix: replace --_slds- with --slds-
              const newProperty = node.property.replace('--_slds-', '--slds-');
              const sourceCode = context.sourceCode.getText(node);
              const fixedCode = sourceCode.replace(node.property, newProperty);
              return fixer.replaceText(node, fixedCode);
            }
          });
        }
      },
    };
  },
} as Rule.RuleModule;
