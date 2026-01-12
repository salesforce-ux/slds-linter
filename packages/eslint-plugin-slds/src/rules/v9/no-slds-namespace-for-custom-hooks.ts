import { Rule } from 'eslint';
import metadata from '@salesforce-ux/sds-metadata';
import ruleMessages from '../../config/rule-messages';
import { forEachNamespacedVariable, type CssVariableInfo } from '../../utils/css-utils';
import type { PositionInfo } from '../../utils/hardcoded-shared-utils';

const ruleConfig = ruleMessages['no-slds-namespace-for-custom-hooks'];
const { type, description, url, messages } = ruleConfig;

const sldsPlusStylingHooks = metadata.sldsPlusStylingHooks;

// Generate values to hooks mapping using only global hooks
// shared hooks are private/ undocumented APIs, so they should not be recommended to customers
// Ref this thread: https://salesforce-internal.slack.com/archives/C071J0Q3FNV/p1743010620921339?thread_ts=1743009353.385429&cid=C071J0Q3FNV
// Note: kinetics hooks available but excluded due to TypeScript type mismatch (type says 'kinetic', runtime has 'kinetics')
const allSldsHooks = [...sldsPlusStylingHooks.global, ...sldsPlusStylingHooks.component, ...sldsPlusStylingHooks.shared];

const toSldsToken = (sdsToken: string) => sdsToken.replace('--sds-', '--slds-');

function shouldIgnoreDetection(sdsToken: string): boolean {
  // Ignore if entry found in the list or not starts with reserved namespace
  if (sdsToken.startsWith('--sds-') || sdsToken.startsWith('--slds-')) {
    return allSldsHooks.includes(toSldsToken(sdsToken));
  }
  return true;
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
    return {
      "Declaration"(node) {
        // Check 1: Property name (left-side) for custom properties using reserved namespaces
        const property = node.property;
        if (property && 
            (property.startsWith('--slds-') || property.startsWith('--sds-')) &&
            !shouldIgnoreDetection(property)) {
          const tokenWithoutNamespace = property.replace('--slds-', '').replace('--sds-', '');
          
          // Report at the property location (before the colon)
          context.report({
            node,
            loc: node.loc, // Use full declaration loc which includes the property
            messageId: 'customHookNamespace',
            data: { 
              token: property,
              tokenWithoutNamespace
            }
          });
        }

        // Check 2: Property value (right-side) - Use AST parsing to detect var() functions
        const valueText = context.sourceCode.getText(node.value);
        if (valueText) {
          forEachNamespacedVariable(valueText, (variableInfo: CssVariableInfo, positionInfo: PositionInfo) => {
            const { name: tokenName } = variableInfo;
            
            if (!shouldIgnoreDetection(tokenName)) {
              const tokenWithoutNamespace = tokenName.replace('--slds-', '').replace('--sds-', '');
              
              // Use exact position if available, otherwise report on declaration node
              if (positionInfo.start && positionInfo.end && node.value.loc) {
                context.report({
                  node,
                  loc: {
                    start: {
                      line: node.value.loc.start.line + positionInfo.start.line - 1,
                      column: node.value.loc.start.column + positionInfo.start.column - 1
                    },
                    end: {
                      line: node.value.loc.start.line + positionInfo.end.line - 1,
                      column: node.value.loc.start.column + positionInfo.end.column - 1
                    }
                  },
                  messageId: 'customHookNamespace',
                  data: { token: tokenName, tokenWithoutNamespace }
                });
              } else {
                context.report({
                  node,
                  messageId: 'customHookNamespace',
                  data: { token: tokenName, tokenWithoutNamespace }
                });
              }
            }
          });
        }
      },
    };
  },
} as Rule.RuleModule;
