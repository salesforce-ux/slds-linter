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
 * Parse a var() function string to extract tokens and check for nested fallbacks
 */
function parseVarFunction(rawValue: string): { lwcToken?: string; sldsToken?: string } | null {
  // Remove the 'var(' prefix and ')' suffix, then trim
  const content = rawValue.replace(/^var\s*\(\s*/, '').replace(/\s*\)$/, '').trim();
  
  // Split by comma to get main token and fallback
  const parts = content.split(',').map(part => part.trim());
  
  if (parts.length < 2) {
    return null; // No fallback present
  }
  
  const mainToken = parts[0];
  const fallbackPart = parts[1];
  
  // Check if the main token is an LWC token
  if (!isLwcToken(mainToken)) {
    return null;
  }
  
  // Handle nested var() functions in fallback
  let fallbackToken = fallbackPart;
  if (fallbackPart.startsWith('var(')) {
    // Extract the token from nested var() function
    const nestedContent = fallbackPart.replace(/^var\s*\(\s*/, '').replace(/\s*\).*$/, '').trim();
    const nestedParts = nestedContent.split(',').map(part => part.trim());
    fallbackToken = nestedParts[0];
  }
  
  return {
    lwcToken: mainToken,
    sldsToken: fallbackToken
  };
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
        
        // Get the raw value of the var() function using getText
        const rawValue = context.sourceCode.getText(varFunctionNode).trim();
        
        // Parse the var() function to extract tokens
        const parsed = parseVarFunction(rawValue);
        
        if (!parsed) {
          return;
        }
        
        const { sldsToken } = parsed;
        
        if (!hasUnsupportedFallback(lwcToken, sldsToken)) {
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
