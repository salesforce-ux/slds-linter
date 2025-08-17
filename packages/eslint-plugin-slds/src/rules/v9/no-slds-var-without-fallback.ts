import { Rule } from 'eslint';
import metadata from '@salesforce-ux/sds-metadata';
import ruleMessages from '../../config/rule-messages.yml';

const ruleConfig = ruleMessages['no-slds-var-without-fallback'];
const { type, description, url, messages } = ruleConfig;

// Access the slds1ExcludedVars property from metadata
const sldsVariables = metadata.slds1ExcludedVars || {};

/**
 * Check if a CSS variable name starts with --slds-
 */
function isSldsCssVariable(cssVar: string): boolean {
  return cssVar.startsWith('--slds-');
}

/**
 * Checks if a var() function has a fallback value by checking if there's a comma
 * indicating a second parameter
 */
function isVarFunction(node: any): boolean {
  return node && node.type === 'Function' && node.name === 'var';
}

/**
 * Checks if a var() function has a fallback value by examining the function call text
 */
function hasFallbackValue(varFunctionNode: any, sourceCode: any): boolean {
  if (!varFunctionNode) return false;
  
  // Get the text of the var() function
  const functionText = sourceCode.getText(varFunctionNode);
  
  // Check if there's a comma in the function call, indicating a fallback value
  // We need to be careful not to count commas inside nested function calls
  let parenLevel = 0;
  let foundComma = false;
  
  for (let i = 0; i < functionText.length; i++) {
    const char = functionText[i];
    
    if (char === '(') {
      parenLevel++;
    } else if (char === ')') {
      parenLevel--;
    } else if (char === ',' && parenLevel === 1) {
      // Found a comma at the top level of the var() function
      foundComma = true;
      break;
    }
  }
  
  return foundComma;
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
    function reportAndFix(node, cssVar, fallbackValue) {
      context.report({
        node,
        messageId: 'varWithoutFallback',
        data: { cssVar, recommendation: fallbackValue },
        fix(fixer) {
          // Find the var() function call that contains this identifier
          const sourceCode = context.sourceCode;
          const varFunctionNode = context.sourceCode.getAncestors(node).at(-1);
          
          if (isVarFunction(varFunctionNode)) {
            // Replace the entire var() function with one that includes the fallback
            const varFunctionCall = `var(${cssVar})`;
            const varWithFallback = `var(${cssVar}, ${fallbackValue})`;
            
            return fixer.replaceText(varFunctionNode, varWithFallback);
          }
          
          return null;
        }
      });
    }

    return {
      // Handle SLDS tokens inside var() functions: var(--slds-*)
      "Function[name='var'] Identifier[name=/^--slds-/]"(node) {
        const cssVar = node.name;
        
        if (!isSldsCssVariable(cssVar)) {
          return;
        }

        // Get the var() function node that contains this identifier
        const varFunctionNode = context.sourceCode.getAncestors(node).at(-1);
        
        if (!isVarFunction(varFunctionNode) || hasFallbackValue(varFunctionNode, context.sourceCode)) {
          return;
        }

        // Check if we have a fallback value for this SLDS variable
        const fallbackValue = sldsVariables[cssVar];
        
        if (!fallbackValue) {
          return;
        }

        reportAndFix(node, cssVar, fallbackValue);
      }
    };
  },
} as Rule.RuleModule;
