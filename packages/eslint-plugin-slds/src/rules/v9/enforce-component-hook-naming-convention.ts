import { Rule } from 'eslint';
import metadata from '@salesforce-ux/sds-metadata';
import ruleMessages from '../../config/rule-messages.yml';
import { findCssVariables } from '../../utils/css-var-utils';
import { reportDeprecatedHook, reportWithoutFix } from '../../utils/eslint-report-utils';

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
       * Handle component hooks in CSS declarations (property names)
       * Example: --slds-c-accordion-color-border: #000;
       */
      "Declaration[property=/^--slds-c-/]"(node) {
        const hookName = node.property;
        
        // Check if this property itself is deprecated
        if (!shouldIgnoreDetection(hookName)) {
          const suggestedMatch = slds1DeprecatedComponentHooks[hookName];
          reportDeprecatedHook(context, node, hookName, suggestedMatch);
        }
        
        // Note: We don't return early here because we also need to check the value
        // for other deprecated hooks. The broader Declaration selector will handle that.
      },

      /*
       * Handle component hooks in var() functions (direct usage)
       * Example: var(--slds-c-accordion-color-border)
       */
      "Function[name='var'] Identifier[name=/^--slds-c-/]"(node) {
        const hookName = node.name;
        
        // Skip if hook should be ignored
        if (shouldIgnoreDetection(hookName)) {
          return;
        }

        const suggestedMatch = slds1DeprecatedComponentHooks[hookName];
        reportDeprecatedHook(context, node, hookName, suggestedMatch);
      },

      /*
       * Handle component hooks in CSS property values (covering the limitation)
       * This catches deprecated hooks used as values that aren't caught by the var() function selector
       * Example: --custom-prop: --slds-c-accordion-color-border; (without var() wrapper)
       * Example: --slds-c-prop: var(--slds-c-accordion-color-border); (with var() wrapper)
       */
      "Declaration"(node) {
        // Get the raw text of the entire declaration
        const declarationText = context.sourceCode.getText(node);
        
        // Find all component hooks in the declaration value (excluding the property name)
        const allHookMatches = findCssVariables(declarationText, /--slds-c-[a-zA-Z0-9-]+/g);
        
        if (allHookMatches.length > 0) {
          // Process hooks that are NOT the property name itself
          const valueHooks = allHookMatches.filter(hook => {
            // Skip the property name itself (already handled by the specific selector)
            return node.property !== hook;
          });
          
          valueHooks.forEach((hookName: string) => {
            // Skip if hook should be ignored
            if (shouldIgnoreDetection(hookName)) {
              return;
            }

            const suggestedMatch = slds1DeprecatedComponentHooks[hookName];
            
            // Report the issue but without auto-fix for complex value parsing
            reportWithoutFix(context, node, 'replace', {
              oldValue: hookName,
              suggestedMatch: suggestedMatch
            });
          });
        }
      }
    };
  },
} as Rule.RuleModule;
