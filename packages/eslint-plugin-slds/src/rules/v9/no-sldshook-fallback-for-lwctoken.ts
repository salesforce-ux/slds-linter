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
 * Convert --sds- token to --slds- equivalent
 */
const toSldsToken = (sdsToken: string = '') => (sdsToken || '').replace('--sds-', '--slds-');

/**
 * Check if a CSS variable name starts with --lwc-
 */
function isLwcToken(token: string): boolean {
  return token.startsWith('--lwc-');
}

/**
 * Check if a CSS variable name starts with --slds-
 */
function isSldsToken(token: string): boolean {
  return token.startsWith('--slds-');
}

/**
 * Check if using an SLDS hook as fallback for LWC token is unsupported
 */
function hasUnsupportedFallback(lwcToken: string, sldsToken: string): boolean {
  const safeSldsToken = toSldsToken(sldsToken);
  return lwcToken && safeSldsToken 
    && isLwcToken(lwcToken) 
    && isSldsToken(safeSldsToken) 
    && allSldsHooksSet.has(safeSldsToken);
}

/**
 * Extract SLDS token from the fallback part of a var() function
 * Handles both direct tokens and nested var() functions
 */
function extractSldsTokenFromFallback(fallbackValue: string): string | null {
  const trimmed = fallbackValue.trim();
  
  // Check if the fallback is a nested var() function
  if (trimmed.startsWith('var(')) {
    // Extract the token from nested var() function: var(--slds-token, ...)
    const match = trimmed.match(/^var\s*\(\s*(--[^,\s)]+)/);
    return match ? match[1] : null;
  }
  
  // For direct token references (though less common in fallbacks)
  if (trimmed.startsWith('--')) {
    return trimmed.split(/[,\s)]/)[0];
  }
  
  return null;
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
        if (node.type !== "Identifier") {
          return;
        }
        
        const lwcToken = node.name;
        
        // Get the var() function node that contains this identifier
        const varFunctionNode = context.sourceCode.getAncestors(node).at(-1);
        
        if (!varFunctionNode) {
          return;
        }
        
        // Get the raw text of the entire var() function
        const rawValue = context.sourceCode.getText(varFunctionNode);
        
        // Check if there's a comma (indicating a fallback value exists)
        if (!rawValue.includes(',')) {
          return;
        }
        
        // Extract the fallback part after the first comma
        const commaIndex = rawValue.indexOf(',');
        const fallbackPart = rawValue.substring(commaIndex + 1, rawValue.lastIndexOf(')')).trim();
        
        const sldsToken = extractSldsTokenFromFallback(fallbackPart);
        
        if (!sldsToken || !hasUnsupportedFallback(lwcToken, sldsToken)) {
          return;
        }
        
        context.report({
          node,
          messageId: 'unsupportedFallback',
          data: { 
            lwcToken,
            sldsToken 
          }
        });
      }
    };
  },
} as Rule.RuleModule;
