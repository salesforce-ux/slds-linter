import { Rule } from 'eslint';
import metadata from '@salesforce-ux/sds-metadata';
import ruleMessages from '../../config/rule-messages.yml';

const ruleConfig = ruleMessages['enforce-component-hook-naming-convention'];
const { type, description, url, messages } = ruleConfig;

const slds1DeprecatedComponentHooks = metadata.slds1DeprecatedComponentHooks;

/**
 * Check if using a deprecated component hook that should be replaced
 */
function shouldIgnoreDetection(hook: string): boolean {
  // Ignore if entry not found in the list
  return (
    !hook.startsWith('--slds-c-') || !(hook in slds1DeprecatedComponentHooks)
  );
}

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
      /*
       * Handle component hooks in CSS declarations
       */
      "Declaration[property=/^--slds-c-/], Function[name='var'] Identifier[name=/^--slds-c-/]"(node) {
        let hookName: string;
        let reportNode = node;
        
        if (node.type === "Declaration") {
          // CSS custom property declaration: --slds-c-...
          hookName = node.property;
        } else if (node.type === "Identifier") {
          // Inside var() function: var(--slds-c-...)
          hookName = node.name;
        } else {
          return;
        }

        // Skip if hook should be ignored
        if (shouldIgnoreDetection(hookName)) {
          return;
        }

        const suggestedMatch = slds1DeprecatedComponentHooks[hookName];
        
        context.report({
          node: reportNode,
          messageId: 'replace',
          data: { 
            oldValue: hookName,
            suggestedMatch: suggestedMatch
          },
          fix(fixer) {
            if (node.type === "Declaration") {
              // Replace the property name in CSS declaration
              const originalText = context.sourceCode.getText(node);
              const colonIndex = originalText.indexOf(':');
              const valuePartWithColon = originalText.substring(colonIndex);
              return fixer.replaceText(node, `${suggestedMatch}${valuePartWithColon}`);
            } else if (node.type === "Identifier") {
              // Replace the identifier name in var() function
              return fixer.replaceText(node, suggestedMatch);
            }
            return null;
          }
        });
      }
    };
  },
} as Rule.RuleModule;
