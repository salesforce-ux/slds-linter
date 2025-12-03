import { Rule } from 'eslint';
import metadata from '@salesforce-ux/sds-metadata';
import ruleMessages from '../../config/rule-messages';

const ruleConfig = ruleMessages['enforce-sds-to-slds-hooks'];
const { type, description, url, messages } = ruleConfig;

const sldsPlusStylingHooks = metadata.sldsPlusStylingHooks;

// Generate values to hooks mapping using only global hooks
// shared hooks are private/ undocumented APIs, so they should not be recommended to customers
// Ref this thread: https://salesforce-internal.slack.com/archives/C071J0Q3FNV/p1743010620921339?thread_ts=1743009353.385429&cid=C071J0Q3FNV
const allSldsHooks = [...sldsPlusStylingHooks.global, ...sldsPlusStylingHooks.component];

const toSldsToken = (sdsToken: string) => sdsToken.replace('--sds-', '--slds-');

function shouldIgnoreDetection(sdsToken: string) {
  // Ignore if entry not found in the list
  return (
    !sdsToken.startsWith('--sds-') || !allSldsHooks.includes(toSldsToken(sdsToken))
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
    function reportAndFix(node, oldValue, suggestedMatch) {
      context.report({
        node,
        messageId: 'replaceSdsWithSlds',
        data: { oldValue, suggestedMatch },
        fix(fixer) {
          // For Declaration nodes, use the offset from loc info
          if (node.type === "Declaration") {
            const sourceCode = context.sourceCode;
            const fullText = sourceCode.getText();
            const nodeOffset = node.loc.start.offset;
            
            // The property name appears at the start of the Declaration
            const propertyStart = nodeOffset;
            const propertyEnd = propertyStart + oldValue.length;
            
            // Verify we're replacing the right text
            const textAtPosition = fullText.substring(propertyStart, propertyEnd);
            if (textAtPosition === oldValue) {
              return fixer.replaceTextRange([propertyStart, propertyEnd], suggestedMatch);
            }
          }
          
          // For Identifier nodes (inside var() functions), simple replacement works
          return fixer.replaceText(node, suggestedMatch);
        }
      });
    }

    return {
      // CSS custom property declarations: --sds-* properties
      "Declaration[property=/^--sds-/]"(node) {
        const property = node.property;
        
        if (shouldIgnoreDetection(property)) {
          return;
        }

        const suggestedMatch = toSldsToken(property);
        reportAndFix(node, property, suggestedMatch);
      },

      // SDS tokens inside var() functions: var(--sds-*)
      "Function[name='var'] Identifier[name=/^--sds-/]"(node) {
        const tokenName = node.name;
        
        if (shouldIgnoreDetection(tokenName)) {
          return;
        }

        const suggestedMatch = toSldsToken(tokenName);
        reportAndFix(node, tokenName, suggestedMatch);
      }
    };
  },
} as Rule.RuleModule;
