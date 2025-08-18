import { Rule } from 'eslint';
import metadata from '@salesforce-ux/sds-metadata';
import ruleMessages from '../../config/rule-messages.yml';

const ruleConfig = ruleMessages['no-sldshook-fallback-for-lwctoken'];
const { type, description, url, messages } = ruleConfig;

const sldsPlusStylingHooks = metadata.sldsPlusStylingHooks;

// Generate values to hooks mapping using only global hooks
// shared hooks are private/ undocumented APIs, so they should not be recommended to customers
// Ref this thread: https://salesforce-internal.slack.com/archives/C071J0Q3FNV/p1743010620921339?thread_ts=1743009353.385429&cid=C071J0Q3FNV
const allSldsHooks = [...sldsPlusStylingHooks.global, ...sldsPlusStylingHooks.component];
const allSldsHooksSet = new Set(allSldsHooks);

/**
 * Check if using an SLDS hook as fallback for LWC token is unsupported
 */
function hasUnsupportedFallback(lwcToken: string, sldsToken: string): boolean {
  // Convert --sds- to --slds- if needed
  const normalizedSldsToken = sldsToken.replace('--sds-', '--slds-');
  
  return lwcToken.startsWith('--lwc-') 
    && normalizedSldsToken.startsWith('--slds-') 
    && allSldsHooksSet.has(normalizedSldsToken);
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
      // Handle LWC tokens inside var() functions: var(--lwc-*, ...)
      "Function[name='var'] Identifier[name=/^--lwc-/]"(node) {
        const lwcToken = node.name;
        
        // Get the var() function node that contains this identifier
        const varFunctionNode = context.sourceCode.getAncestors(node).at(-1);
        if (!varFunctionNode) return;
        
        //access children to find fallback
        const varFunctionChildren = (varFunctionNode as any).children;
        if (!varFunctionChildren) return;
        
        // Find comma operator and the Raw node after it
        let foundComma = false;
        let fallbackRawNode = null;
        
        for (const child of varFunctionChildren) {
          if (child.type === 'Operator' && child.value === ',') {
            foundComma = true;
            continue;
          }
          if (foundComma && child.type === 'Raw') {
            fallbackRawNode = child;
            break;
          }
        }
        
        if (!fallbackRawNode) return;
        
        // Extract SLDS token from the Raw node value
        const fallbackValue = fallbackRawNode.value.trim();
        const varMatch = fallbackValue.match(/var\(([^,)]+)/);
        if (!varMatch) return;
        
        const sldsToken = varMatch[1];
        
        if (hasUnsupportedFallback(lwcToken, sldsToken)) {
          context.report({
            node,
            messageId: 'unsupportedFallback',
            data: { lwcToken, sldsToken }
          });
        }
      }
    };
  },
} as Rule.RuleModule;
