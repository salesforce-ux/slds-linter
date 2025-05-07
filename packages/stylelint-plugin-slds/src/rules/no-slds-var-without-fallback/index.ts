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
    `Your code uses the "${cssVar}" styling hook without a fallback value. Styling hooks are unavailable in some Salesforce environments. To make sure your component renders correctly in all environments, add this fallback value: "${recommendation}". If you need this fallback value to be brand-aware, please check out the SLDS1 tokens page.`,
});

// Find a fallback value based on the CSS variable name
function getFallbackValue(varName: string): string | null {
  return sldsVariables[varName] || null;
}

// Helper function to process var() functions
function forEachVarFn(
  decl: Declaration,
  result: PostcssResult,
  severity: RuleSeverity,
  callback: (varName: string, node: valueParser.FunctionNode, fallbackValue: string) => void
) {
  if (!decl.value?.includes('var(')) return;

  const parsedValue = valueParser(decl.value);
  
  parsedValue.walk((node) => {
    if (node.type !== 'function' || node.value !== 'var') return;
    
    const args = node.nodes;
    if (args.length === 0) return;

    const varNameNode = args[0];
    if (varNameNode.type !== 'word') return;

    const varName = varNameNode.value;
    if (!varName.startsWith('--slds-')) return;

    // Check if already has fallback
    const hasFallback = args.some((arg) => arg.type === 'div' && arg.value === ',');
    if (hasFallback) return;
    
    // Get fallback value
    const fallbackValue = getFallbackValue(varName);
    
    // Only report if we have a fallback value from metadata
    if (!fallbackValue) return;
    
    callback(varName, node, fallbackValue);
  });

  return parsedValue;
}

const ruleFunction: Partial<stylelint.Rule> = (primaryOptions: boolean, { severity = severityLevel as RuleSeverity } = {}) => {
  return (root: Root, result: PostcssResult) => {
    root.walkDecls((decl: Declaration) => {
      forEachVarFn(decl, result, severity, (varName, node, fallbackValue) => {
        // Apply fix
        const fix = () => {
          const varFunctionStr = valueParser.stringify(node);
          const varNameWithFallback = `var(${varName}, ${fallbackValue})`;
          decl.value = decl.value.replace(varFunctionStr, varNameWithFallback);
        };

        // Report the issue
        utils.report({
          message: messages.withRecommendation(varName, fallbackValue),
          node: decl,
          result,
          ruleName,
          severity,
          fix
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