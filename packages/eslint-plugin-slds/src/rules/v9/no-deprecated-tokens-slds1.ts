import { Rule } from 'eslint';
import metadata from '@salesforce-ux/sds-metadata';
import ruleMessages from '../../config/rule-messages.yml';

const ruleConfig = ruleMessages['no-deprecated-tokens-slds1'];
const { type, description, url, messages } = ruleConfig;

// Get both mappings to chain Aura → LWC → SLDS
const auraToLwc = metadata.auraToLwcTokensMapping;
const lwcToSlds = metadata.lwcToSlds;

export default {
  meta: {
    type,
    docs: {
      description: description,
      recommended: true,
      url,
    },
    fixable: 'code',
    messages,
  },
  
  create(context) {
    /**
     * Check if a token should be ignored (not in mapping or not LWC token)
     */
    function shouldIgnoreDetection(token: string): boolean {
      return !(token in auraToLwc) || !auraToLwc[token].startsWith('--lwc-');
    }

    /**
     * Generate replacement - directly to SLDS with LWC fallback (removes t())
     * Output format: var(--slds-*, var(--lwc-*)) or var(--lwc-*) if no SLDS mapping
     */
    function generateReplacement(tokenName: string): string | null {
      const lwcToken = auraToLwc[tokenName];
      if (!lwcToken || !lwcToken.startsWith('--lwc-')) {
        return null;
      }
      
      const sldsMapping = lwcToSlds[lwcToken];
      
      // If SLDS mapping exists and is a direct token replacement
      if (sldsMapping && !sldsMapping.continueToUse) {
        const sldsHook = sldsMapping.replacement;
        if (typeof sldsHook === 'string' && sldsHook.startsWith('--slds-')) {
          // Final format: var(--slds-*, var(--lwc-*))
          return `var(${sldsHook}, var(${lwcToken}))`;
        }
      }
      
      // Fallback: just LWC token without t()
      return `var(${lwcToken})`;
    }

    function handleTokenFunction(node, functionName) {
      // Get the token name from the identifier
      const tokenName = context.sourceCode.getText(node);
      
      // Skip if token should be ignored
      if (shouldIgnoreDetection(tokenName)) {
        return;
      }

      // Create original function call for error message
      const originalFunctionCall = `${functionName}(${tokenName})`;
      const replacement = generateReplacement(tokenName);
      
      if (replacement) {
        // Report with replacement suggestion
        context.report({
          node,
          messageId: 'deprecatedToken',
          data: { 
            oldValue: originalFunctionCall,
            newValue: replacement
          },
          fix(fixer) {
            // Use node position to avoid multiple replacements of same token
            const sourceCode = context.sourceCode.getText();
            const tokenFunctionCall = `${functionName}(${tokenName})`;
            const nodeOffset = node.loc.start.offset;
            
            // Search backwards from the node position to find the function start
            const searchStart = Math.max(0, nodeOffset - functionName.length - 1);
            const searchEnd = nodeOffset + tokenName.length + 1;
            const searchArea = sourceCode.substring(searchStart, searchEnd);
            
            const functionCallIndex = searchArea.indexOf(tokenFunctionCall);
            if (functionCallIndex !== -1) {
              const actualStart = searchStart + functionCallIndex;
              const actualEnd = actualStart + tokenFunctionCall.length;
              return fixer.replaceTextRange([actualStart, actualEnd], replacement);
            }
            return null;
          }
        });
      } else {
        // Report without specific replacement
        context.report({
          node,
          messageId: 'noReplacement',
        });
      }
    }

    return {
      "Function[name='token'] Identifier"(node) {
        handleTokenFunction(node, 'token');
      },
      "Function[name='t'] Identifier"(node) {
        handleTokenFunction(node, 't');
      },
    };

  },
} as Rule.RuleModule;
