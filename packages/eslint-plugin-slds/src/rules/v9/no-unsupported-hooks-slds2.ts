import { Rule } from 'eslint';
import metadata from '@salesforce-ux/sds-metadata';
import ruleMessages from '../../config/rule-messages.yml';

const ruleConfig = ruleMessages['no-unsupported-hooks-slds2'];
const { type, description, url, messages } = ruleConfig;

const deprecatedHooks = new Set(metadata.deprecatedStylingHooks);

function shouldIgnoreDetection(sldsHook: string): boolean {
  return !deprecatedHooks.has(sldsHook);
}

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
    function reportDeprecatedHook(node, token: string) {
      context.report({
        node,
        messageId: 'deprecated',
        data: { token }
      });
    }

    return {
      // Handle CSS custom property declarations (left-side usage): --slds-* properties
      // Example: .THIS { --slds-g-link-color: #f73650; }
      "Declaration[property=/^--s(lds|ds)-/]"(node) {
        const property = node.property;
        
        if (shouldIgnoreDetection(property)) {
          return;
        }
        
        reportDeprecatedHook(node, property);
      },

      // Handle SLDS/SDS hooks inside var() functions (right-side usage): var(--slds-*)
      // Example: .THIS .demo { border-top: 1px solid var(--slds-g-color-border-brand-1); }
      "Function[name='var'] Identifier[name=/^--s(lds|ds)-/]"(node) {
        const tokenName = node.name;
        
        if (shouldIgnoreDetection(tokenName)) {
          return;
        }
        
        reportDeprecatedHook(node, tokenName);
      },
    };
  },
} as Rule.RuleModule;
