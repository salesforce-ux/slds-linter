import { Rule } from 'eslint';
import metadata from '@salesforce-ux/sds-metadata';
import ruleMessages from '../../config/rule-messages.yml';

const ruleConfig = ruleMessages['no-deprecated-tokens-slds1'];
const { type, description, url, messages } = ruleConfig;

// Get token mapping from metadata (Aura tokens to LWC tokens)
const tokenMapping = metadata.auraToLwcTokensMapping;

export default {
  meta: {
    type: type,
    docs: {
      description: description,
      recommended: true,
      url: url,
    },
    fixable: 'code',
    messages: messages,
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
    function generateReplacement(tokenName: string): string | null {
      if (shouldIgnoreDetection(tokenName)) {
        return null;
      }
      const recommendation = tokenMapping[tokenName];
      return `var(${recommendation}, token(${tokenName}))`;
    }

    return {
      "Function[name='token'] Identifier, Function[name='t'] Identifier"(node) {
        // Get the token name from the identifier
        const tokenName = context.sourceCode.getText(node);
        
        // Skip if token should be ignored
        if (shouldIgnoreDetection(tokenName)) {
          return;
        }

        // Generate replacement preserving the original function name
        const functionNode = node.parent; // Should be the Function node
        
        // Find the actual Function node in the AST hierarchy
        let actualFunctionNode = functionNode;
        while (actualFunctionNode && actualFunctionNode.type !== 'Function') {
          actualFunctionNode = actualFunctionNode.parent;
        }
        
        const originalFunctionCall = actualFunctionNode ? 
          context.sourceCode.getText(actualFunctionNode) : 
          `token(${tokenName})`; // fallback

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
              if (actualFunctionNode && actualFunctionNode.type === 'Function') {
                // Generate replacement preserving original function call format
                const newReplacement = `var(${tokenMapping[tokenName]}, ${originalFunctionCall})`;
                return fixer.replaceText(actualFunctionNode, newReplacement);
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
      },
    };
  },
} as Rule.RuleModule;
