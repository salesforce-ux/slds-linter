import { Root, Declaration } from 'postcss';
import stylelint, { PostcssResult, Rule, RuleSeverity } from 'stylelint';
import valueParser from 'postcss-value-parser';
import metadata from '@salesforce-ux/sds-metadata';
import ruleMetadata from '../../utils/rulesMetadata';
import replacePlaceholders from '../../utils/util';

const { utils, createPlugin }: typeof stylelint = stylelint;

const ruleName: string = 'slds/no-slds-var-without-fallback';

// Access the slds1ExcludedVars property from metadata
const sldsVariables = metadata.slds1ExcludedVars || {};

// Get rule metadata
const { 
  severityLevel = 'error', 
  errorMsg = '' 
} = ruleMetadata(ruleName) || {};

// Create formatted message object
const messages = utils.ruleMessages(ruleName, {
  expected: (cssVar: string, recommendation: string) =>
    replacePlaceholders(errorMsg, { cssVar, recommendation }),
});

// Find a fallback value based on the CSS variable name
function getFallbackValue(varName: string): string | null {
  return sldsVariables[varName] || null;
}

/**
 * Check if a CSS variable name starts with --slds-
 */
function isSldsCssVariable(cssVar: string): boolean {
  return cssVar.startsWith('--slds-');
}

/**
 * Checks if a var() function has a fallback value
 */
function hasFallbackValue(nodes: valueParser.Node[]): boolean {
  return nodes.some((arg) => arg.type === 'div' && arg.value === ',');
}

/**
 * Extract the variable name from a var() function
 */
function extractVarName(node: valueParser.FunctionNode): string | null {
  if (node.nodes.length === 0) return null;
  
  const varNameNode = node.nodes[0];
  if (varNameNode.type !== 'word') return null;
  
  return varNameNode.value;
}

/**
 * Process a CSS var() function node
 */
function processVarFunction(
  node: valueParser.FunctionNode,
  callback: (varName: string, node: valueParser.FunctionNode, fallbackValue: string) => void
): void {
  const varName = extractVarName(node);
  
  // Skip if not a valid variable name or not an SLDS variable
  if (!varName || !isSldsCssVariable(varName)) return;
  
  // Skip if already has fallback
  if (hasFallbackValue(node.nodes)) return;
  
  // Get fallback value from metadata
  const fallbackValue = getFallbackValue(varName);
  
  // Only report if we have a fallback value from metadata
  if (!fallbackValue) return;
  
  callback(varName, node, fallbackValue);
}

// Helper function to process CSS declarations
function forEachVarFn(
  decl: Declaration,
  result: PostcssResult,
  severity: RuleSeverity,
  callback: (varName: string, node: valueParser.FunctionNode, fallbackValue: string) => void
) {
  if (!decl.value?.includes('var(')) return;

  const parsedValue = valueParser(decl.value);
  
  parsedValue.walk((node) => {
    if (node.type === 'function' && node.value === 'var') {
      processVarFunction(node as valueParser.FunctionNode, callback);
      // Continue walking to check for nested var() functions
      return true;
    }
    return true;
  });

  return parsedValue;
}

/**
 * Create a fix function that adds a fallback value to a var() function
 */
function createFix(decl: Declaration, node: valueParser.FunctionNode, varName: string, fallbackValue: string) {
  return () => {
    const varFunctionStr = valueParser.stringify(node);
    const varNameWithFallback = `var(${varName}, ${fallbackValue})`;
    decl.value = decl.value.replace(varFunctionStr, varNameWithFallback);
  };
}

const ruleFunction: Partial<stylelint.Rule> = (primaryOptions: boolean, { severity = severityLevel as RuleSeverity } = {}) => {
  return (root: Root, result: PostcssResult) => {
    root.walkDecls((decl: Declaration) => {
      forEachVarFn(decl, result, severity, (varName, node, fallbackValue) => {
        // Report the issue
        utils.report({
          message: messages.expected(varName, fallbackValue),
          node: decl,
          result,
          ruleName,
          severity,
          fix: createFix(decl, node, varName, fallbackValue)
        });
      });
    });
  };
};

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;
ruleFunction.meta = {
  url: '',
  fixable: true
};

// Export the plugin
export default createPlugin(ruleName, <stylelint.Rule>ruleFunction); 