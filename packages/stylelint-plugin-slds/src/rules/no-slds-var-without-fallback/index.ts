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

// Helper function to process var() functions
function forEachVarFn(
  decl: Declaration,
  result: PostcssResult,
  severity: RuleSeverity,
  callback: (varName: string, node: valueParser.FunctionNode, hasFallback: boolean) => void
) {
  // Skip if the value doesn't contain `var(`
  if (!decl.value || !decl.value.includes('var(')) {
    return;
  }

  // Parse the value
  const parsedValue = valueParser(decl.value);

  // Walk through function nodes
  parsedValue.walk((node) => {
    if (node.type !== 'function' || node.value !== 'var') {
      return;
    }

    // Extract the variable name from the function arguments
    const args = node.nodes;
    if (args.length === 0) {
      return;
    }

    // Get the variable name (first argument)
    const varNameNode = args[0];
    if (varNameNode.type !== 'word') {
      return;
    }

    const varName = varNameNode.value;

    // Only process SLDS variables (starting with --slds-)
    if (!varName.startsWith('--slds-')) {
      return;
    }

    // Check if the variable already has a fallback
    const hasFallback = args.some((arg) => arg.type === 'div' && arg.value === ',');

    callback(varName, node, hasFallback);
  });

  return parsedValue;
}

const ruleFunction: Partial<stylelint.Rule> = (primaryOptions: boolean, { severity = severityLevel as RuleSeverity } = {}) => {
  return (root: Root, result: PostcssResult) => {
    // Process the CSS root and find CSS variables
    root.walkDecls((decl: Declaration) => {
      forEachVarFn(decl, result, severity, (varName, node, hasFallback) => {
        if (!hasFallback) {
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
        }
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