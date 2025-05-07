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

const { severityLevel = 'error', warningMsg = 'var({{cssVar}}) must include a fallback value. Suggested: var({{cssVar}}, {{recommendation}})' } = ruleMetadata(ruleName) || {};

const messages = utils.ruleMessages(ruleName, {
  expected: (cssVar: string, recommendation: string) =>
    replacePlaceholders(warningMsg, { cssVar, recommendation }),
  withRecommendation: (cssVar: string, recommendation: string) =>
    `Your code uses the "${cssVar}" styling hook without a fallback value. Styling hooks are unavailable in some Salesforce environments. To make sure your component renders correctly in all environments, add this fallback value: "${recommendation}". If you need this fallback value to be brand-aware, please check out the SLDS1 tokens page. (slds/no-slds-var-without-fallback)`,
  withoutRecommendation: (cssVar: string) =>
    `Your code uses the "${cssVar}" styling hook without a fallback value. Styling hooks are unavailable in some Salesforce environments. To make sure your component renders correctly in all environments, add a fallback value. If you need this fallback value to be brand-aware, please check out the SLDS1 tokens page. (slds/no-slds-var-without-fallback)`,
});

// Find a fallback value based on the CSS variable name
function getFallbackValue(varName: string): string | null {
  // Check if we have an exact match in the slds1ExcludedVars
  if (sldsVariables[varName]) {
    return sldsVariables[varName];
  }
  
  // Return null if no exact match is found
  return null;
}

// Check if node is a var() function
function isVarFunction(node: valueParser.Node): boolean {
  return (
    node.type === "function" && 
    node.value === "var" && 
    node.nodes.length > 0
  );
}

// Check if node has a fallback (second argument to var())
function hasFallbackValue(node: valueParser.FunctionNode): boolean {
  return node.nodes.some((arg) => arg.type === 'div' && arg.value === ',');
}

// Process SLDS variables in CSS declarations
function processSldsCssVars(
  decl: Declaration,
  result: PostcssResult,
  ruleName: string,
  severity: RuleSeverity
) {
  // Skip if value doesn't contain var() function
  if (!decl.value || !decl.value.includes('var(')) {
    return;
  }

  const parsedValue = valueParser(decl.value);
  
  parsedValue.walk((node) => {
    // Check if this is a var() function
    if (!isVarFunction(node)) {
      return;
    }

    const functionNode = node as valueParser.FunctionNode;
    const varNameNode = functionNode.nodes[0];
    
    // Skip if not a text node
    if (varNameNode.type !== 'word') {
      return;
    }

    const varName = varNameNode.value;
    
    // Only process SLDS variables
    if (!varName.startsWith('--slds-')) {
      return;
    }

    // Check if variable already has a fallback
    if (hasFallbackValue(functionNode)) {
      return;
    }

    // Get an appropriate fallback value
    const fallbackValue = getFallbackValue(varName);
    
    // Only add fix if we have a fallback value
    let fix = undefined;
    if (fallbackValue) {
      fix = () => {
        // Simple string replacement approach
        const varFunctionStr = valueParser.stringify(node);
        const varNameWithFallback = `var(${varName}, ${fallbackValue})`;
        decl.value = decl.value.replace(varFunctionStr, varNameWithFallback);
      };
    }

    // Report the issue with appropriate message
    let message;
    if (fallbackValue) {
      message = messages.withRecommendation(varName, fallbackValue);
    } else {
      message = messages.withoutRecommendation(varName);
    }

    // Report the issue
    utils.report({
      message,
      node: decl,
      result,
      ruleName,
      severity,
      fix
    });
  });
}

const ruleFunction: Partial<stylelint.Rule> = (primaryOptions: boolean, { severity = severityLevel as RuleSeverity } = {}) => {
  return (root: Root, result: PostcssResult) => {
    // Process the CSS root and find CSS variables
    root.walkDecls((decl: Declaration) => {
      processSldsCssVars(decl, result, ruleName, severity);
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