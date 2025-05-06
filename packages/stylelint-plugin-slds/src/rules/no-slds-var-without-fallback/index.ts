import { Root, Declaration } from 'postcss';
import stylelint, { PostcssResult, Rule, RuleSeverity } from 'stylelint';
import valueParser from 'postcss-value-parser';
import metadata from '@salesforce-ux/sds-metadata';
import ruleMetadata from '../../utils/rulesMetadata';
import replacePlaceholders from '../../utils/util';

const { utils, createPlugin }: typeof stylelint = stylelint;

const ruleName: string = 'slds/no-slds-var-without-fallback';

// Cast the metadata to access the slds1ExcludedVars property
const sldsVariables = (metadata as any).slds1ExcludedVars || {};

const { severityLevel = 'error', warningMsg = 'var({{cssVar}}) must include a fallback value. Suggested: var({{cssVar}}, {{recommendation}})' } = ruleMetadata(ruleName) || {};

const messages = utils.ruleMessages(ruleName, {
  expected: (cssVar: string, recommendation: string) =>
    replacePlaceholders(warningMsg, { cssVar, recommendation }),
});

// Define default fallbacks for specific types of variables based on naming patterns
const defaultFallbacks = {
  // Colors
  color: '#000000',
  border: '#000000',
  // Spacing
  spacing: '0',
  sizing: '0',
  // Font size
  font: '1rem',
  // Default fallback for unidentified variable types
  default: '0',
};

// Find a fallback value based on the CSS variable name
function getFallbackValue(varName: string): string {
  // First check if we have an exact match in the slds1ExcludedVars
  if (sldsVariables[varName]) {
    return sldsVariables[varName];
  }

  // If we don't have a direct match, use pattern matching as a fallback
  if (varName.includes('color') || varName.includes('border')) {
    return defaultFallbacks.color;
  } else if (varName.includes('spacing') || varName.includes('sizing')) {
    return defaultFallbacks.spacing;
  } else if (varName.includes('font')) {
    return defaultFallbacks.font;
  }
  return defaultFallbacks.default;
}

function ruleFunction(primary: boolean, { severity = severityLevel as RuleSeverity } = {}) {
  return (root: Root, result: PostcssResult) => {
    // Early exit if the rule is not enabled
    if (!primary) {
      return;
    }

    // Process the CSS root and find CSS variables
    root.walkDecls((decl: Declaration) => {
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

        if (!hasFallback) {
          // Get an appropriate fallback value
          const fallbackValue = getFallbackValue(varName);

          const fix = primary ? () => {
            // Add the fallback value
            node.nodes.push(
              { type: 'div', value: ',', sourceIndex: 0, sourceEndIndex: 1, before: '', after: ' ' } as valueParser.DivNode,
              { type: 'word', value: fallbackValue, sourceIndex: 0, sourceEndIndex: fallbackValue.length } as valueParser.WordNode
            );
            
            // Update the declaration value
            decl.value = parsedValue.toString();
          } : undefined;

          // Report the issue
          utils.report({
            message: messages.expected(varName, fallbackValue),
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
}

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;
ruleFunction.meta = {
  url: '',
  fixable: true,
  description: 'Enforces that any SLDS hooks (variables) include a fallback value',
  detail: 'This ensures CSS will still function in contexts where SLDS hooks are not available',
  documentation: 'https://developer.salesforce.com/docs/component-library/documentation/en/lwc/lwc.create_components_css_custom_properties'
};

export default createPlugin(ruleName, ruleFunction as unknown as Rule); 