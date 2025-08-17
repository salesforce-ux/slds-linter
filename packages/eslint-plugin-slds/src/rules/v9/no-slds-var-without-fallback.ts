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
 * Checks if a var() function has a fallback value by looking for an Operator node with value ","
 */
function hasFallbackValue(varFunctionNode: any): boolean {
  if (!varFunctionNode || !varFunctionNode.children) return false;
  
  // Look for an Operator node with value "," which indicates a fallback parameter
  return varFunctionNode.children.some((child: any) => 
    child.type === 'Operator' && child.value === ','
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
    function reportAndFix(node, cssVar, fallbackValue) {
      context.report({
        node,
        messageId: 'varWithoutFallback',
        data: { cssVar, recommendation: fallbackValue },
        fix(fixer) {
          // Get the var() function node that contains this identifier
          const varFunctionNode = context.sourceCode.getAncestors(node).at(-1);
          
          // Replace the entire var() function with one that includes the fallback
          const varWithFallback = `var(${cssVar}, ${fallbackValue})`;
          return fixer.replaceText(varFunctionNode, varWithFallback);
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
        
        if (hasFallbackValue(varFunctionNode)) {
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
