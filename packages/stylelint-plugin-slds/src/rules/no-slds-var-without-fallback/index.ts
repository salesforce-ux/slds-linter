import { Root, Declaration } from 'postcss';
import stylelint, { PostcssResult, Rule, RuleSeverity } from 'stylelint';
import valueParser from 'postcss-value-parser';
import metadata from '@salesforce-ux/sds-metadata';
import ruleMetadata from '../../utils/rulesMetadata';
import replacePlaceholders from '../../utils/util';
import { isTargetProperty } from '../../utils/prop-utills';
import { forEachVarFunction } from '../../utils/decl-utils';

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
 * Create a fix function that adds a fallback value to a var() function
 */
function createFix(decl: Declaration, node: valueParser.FunctionNode, varName: string, fallbackValue: string) {
  return () => {
    const varFunctionStr = valueParser.stringify(node);
    const varNameWithFallback = `var(${varName}, ${fallbackValue})`;
    decl.value = decl.value.replace(varFunctionStr, varNameWithFallback);
  };
}

const ruleFunction: Partial<stylelint.Rule> = (primaryOptions: boolean, { severity = severityLevel as RuleSeverity, propertyTargets = [] } = {}) => {
  return (root: Root, result: PostcssResult) => {
    root.walkDecls((decl: Declaration) => {
      if (!isTargetProperty(decl.prop, propertyTargets)) {
        return;
      }

      forEachVarFunction(decl, (node, startOffset) => {
        const functionNode = node as valueParser.FunctionNode;
        let cssVarNode = functionNode.nodes[0];
        let cssVar = cssVarNode.value;
  
        if (!isSldsCssVariable(cssVar) || hasFallbackValue(functionNode.nodes)) return;

        const fallbackValue = sldsVariables[cssVar] || null;

        if (!fallbackValue) return;
        const index = cssVarNode.sourceIndex + startOffset;
        const endIndex = cssVarNode.sourceEndIndex + startOffset;
        
        // Report the issue
        utils.report({
          message: messages.expected(cssVar, fallbackValue),
          node: decl,
          result,
          ruleName,
          severity,
          index,
          endIndex,
          fix: createFix(decl, functionNode, cssVar, fallbackValue)
        });
      });
    });
  };
};

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;
ruleFunction.meta = {
  url: 'https://developer.salesforce.com/docs/platform/slds-linter/guide/reference-rules.html#no-slds-var-without-fallback',
  fixable: true
};

// Export the plugin
export default createPlugin(ruleName, <stylelint.Rule>ruleFunction); 