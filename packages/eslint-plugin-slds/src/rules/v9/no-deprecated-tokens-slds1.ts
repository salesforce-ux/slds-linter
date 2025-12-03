import { Rule } from 'eslint';
import metadata from '@salesforce-ux/sds-metadata';
import ruleMessages from '../../config/rule-messages';

const ruleConfig = ruleMessages['no-deprecated-tokens-slds1'];
const { type, description, url, messages } = ruleConfig;

// Get token mapping from metadata (Aura tokens to LWC tokens)
const tokenMapping = metadata.auraToLwcTokensMapping;

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
      return (!(token in tokenMapping) || !tokenMapping[token].startsWith('--lwc-'));
    }

    /**
     * Generate replacement suggestion for deprecated token
     */
    function generateReplacement(tokenName: string, originalFunctionCall: string): string | null {
      if (shouldIgnoreDetection(tokenName)) {
        return null;
      }
      const recommendation = tokenMapping[tokenName];
      return `var(${recommendation}, ${originalFunctionCall})`;
    }

    function handleTokenFunction(node, functionName) {
      // Get the token name from the identifier
      const tokenName = context.sourceCode.getText(node);
      
      // Skip if token should be ignored
      if (shouldIgnoreDetection(tokenName)) {
        return;
      }

      // Create original function call - mirroring stylelint's approach
      const originalFunctionCall = `${functionName}(${tokenName})`;
      const replacement = generateReplacement(tokenName, originalFunctionCall);
      
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
