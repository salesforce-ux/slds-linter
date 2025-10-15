import { Rule } from 'eslint';
import metadata from '@salesforce-ux/sds-metadata';
import ruleMessages from '../../config/rule-messages.yml';

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
    function reportViolation(node, token: string) {
      const tokenWithoutNamespace = token.replace('--slds-', '').replace('--sds-', '');
      
      context.report({
        node,
        messageId: 'customHookNamespace',
        data: { 
          token,
          tokenWithoutNamespace
        }
      });
    }

    return {
      // CSS custom property declarations: --slds-* and --sds-* properties
      "Declaration[property=/^--s(lds|ds)-/]"(node) {
        const property = node.property;
        
        if (shouldIgnoreDetection(property)) {
          return;
        }
        
        reportViolation(node, property);
      },

      // SLDS/SDS tokens inside var() functions: var(--slds-*) or var(--sds-*)
      "Function[name='var'] Identifier[name=/^--s(lds|ds)-/]"(node) {
        const tokenName = node.name;
        
        if (shouldIgnoreDetection(tokenName)) {
          return;
        }
        
        reportViolation(node, tokenName);
      },
    };
  },
} as Rule.RuleModule;
