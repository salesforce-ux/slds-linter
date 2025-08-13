import { Rule } from 'eslint';
import metadata from '@salesforce-ux/sds-metadata';
import ruleMessages from '../../config/rule-messages.yml';

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
    return {
      // Combined selector to handle both CSS custom properties and var() function calls
      "Declaration[property=/^--sds-/], Function[name='var'] Identifier[name=/^--sds-/]"(node) {
        if (node.type === "Declaration") {
          // Left side: CSS custom property declaration
          // Example: --sds-c-border-radius: 50%;
          const property = node.property;
          
          if (shouldIgnoreDetection(property)) {
            return;
          }

          const suggestedMatch = toSldsToken(property);
          
          context.report({
            node,
            messageId: 'replaceSdsWithSlds',
            data: { 
              oldValue: property,
              suggestedMatch 
            },
            fix(fixer) {
              // For CSS Declaration nodes, we need to replace the property name
              const sourceCode = context.sourceCode;
              const fullText = sourceCode.getText();
              const nodeOffset = node.loc.start.offset;
              
              // Search for the property name around the node position
              const searchStart = Math.max(0, nodeOffset - 10);
              const searchEnd = nodeOffset + property.length + 10;
              const searchArea = fullText.substring(searchStart, searchEnd);
              
              const propertyIndex = searchArea.indexOf(property);
              if (propertyIndex !== -1) {
                const actualStart = searchStart + propertyIndex;
                const actualEnd = actualStart + property.length;
                return fixer.replaceTextRange([actualStart, actualEnd], suggestedMatch);
              }
              return null;
            }
          });
        } else if (node.type === "Identifier") {
          // Right side: SDS token in var() function calls
          // Example: var(--sds-g-color-surface-1)
          const tokenName = node.name;
          
          if (shouldIgnoreDetection(tokenName)) {
            return;
          }

          const suggestedMatch = toSldsToken(tokenName);
          
          context.report({
            node,
            messageId: 'replaceSdsWithSlds',
            data: { 
              oldValue: tokenName,
              suggestedMatch 
            },
            fix(fixer) {
              return fixer.replaceText(node, suggestedMatch);
            }
          });
        }
      }
    };
  },
} as Rule.RuleModule;
