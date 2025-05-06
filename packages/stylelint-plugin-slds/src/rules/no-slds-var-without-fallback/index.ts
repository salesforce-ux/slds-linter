import { Root, Declaration } from 'postcss';
import stylelint, { PostcssResult, RuleSeverity } from 'stylelint';
import valueParser from 'postcss-value-parser';
import * as fs from 'fs';
import * as path from 'path';
import ruleMetadata from '../../utils/rulesMetadata';
import replacePlaceholders from '../../utils/util';

const { utils, createPlugin }: typeof stylelint = stylelint;

const ruleName: string = 'slds/no-slds-var-without-fallback';

// Fetch metadata
const { severityLevel = 'error', warningMsg = 'var({{cssVar}}) must include a fallback value. Suggested: {{recommendation}}', errorMsg = '', ruleDesc = 'Checks for var(--slds-*) functions without fallbacks' } = ruleMetadata(ruleName) || {};

const messages = utils.ruleMessages(ruleName, {
  expected: (cssVar: string, recommendation: string) =>
    replacePlaceholders(warningMsg, { cssVar, recommendation }),
});

// Default fallback values by variable type
const defaultFallbacks: {[key: string]: string} = {
  color: '#000000',
  'background-color': '#ffffff',
  spacing: '0',
  'font-size': '1rem',
  'line-height': '1.5',
  border: '0',
  radius: '0',
  'z-index': '0',
  duration: '0ms',
  opacity: '1',
  shadow: 'none',
  default: 'initial'
};

// Function to get a fallback value for a variable
function getFallbackValue(cssVarName: string, property?: string): string {
  // Determine fallback based on variable name patterns
  if (cssVarName.includes('-color-')) {
    return defaultFallbacks.color;
  } else if (cssVarName.includes('-background-')) {
    return defaultFallbacks['background-color'];
  } else if (cssVarName.includes('-spacing-') || cssVarName.includes('-size-')) {
    return defaultFallbacks.spacing;
  } else if (cssVarName.includes('-font-size-')) {
    return defaultFallbacks['font-size'];
  } else if (cssVarName.includes('-radius-')) {
    return defaultFallbacks.radius;
  } else if (cssVarName.includes('-z-index-')) {
    return defaultFallbacks['z-index'];
  } else if (cssVarName.includes('-duration-')) {
    return defaultFallbacks.duration;
  } else if (cssVarName.includes('-shadow-')) {
    return defaultFallbacks.shadow;
  } else if (cssVarName.includes('-opacity-')) {
    return defaultFallbacks.opacity;
  } else if (property) {
    // Use property as a hint for the type of fallback needed
    const propertyLower = property.toLowerCase();
    for (const [key, value] of Object.entries(defaultFallbacks)) {
      if (propertyLower.includes(key)) {
        return value;
      }
    }
  }
  
  // Default fallback
  return defaultFallbacks.default;
}

// Rule function
const ruleFunction: Partial<stylelint.Rule> = (primaryOption: boolean, { severity = severityLevel as RuleSeverity } = {}) => {
  return (root: Root, result: PostcssResult) => {
    const validOptions = stylelint.utils.validateOptions(result, ruleName, {
      actual: primaryOption,
    });

    if (!validOptions) {
      return;
    }

    root.walkDecls((decl: Declaration) => {
      const parsedValue = valueParser(decl.value);

      parsedValue.walk((node) => {
        // Check if it's a var() function
        if (node.type === 'function' && node.value === 'var') {
          // Extract the variable name (first argument)
          const cssVarNode = node.nodes[0];
          if (!cssVarNode) return;

          const cssVar = cssVarNode.value;
          
          // Only process SLDS variables (--slds-*)
          if (!cssVar.startsWith('--slds-')) {
            return;
          }
          
          // Check if it has a fallback (a comma followed by additional content)
          const hasFallback = node.nodes.length > 2 && 
                             node.nodes[1].type === 'div' && 
                             node.nodes[1].value === ',';
                              
          if (!hasFallback) {
            // Get a recommended fallback
            const fallbackValue = getFallbackValue(cssVar, decl.prop);
            
            utils.report({
              message: messages.expected(cssVar, `var(${cssVar}, ${fallbackValue})`),
              node: decl,
              result,
              ruleName,
              severity,
              fix: primaryOption ? () => {
                // Apply the fix - add a fallback value to the var() function
                node.nodes.push(
                  { type: 'div', value: ',', sourceIndex: 0, sourceEndIndex: 1, before: '', after: ' ' },
                  { type: 'word', value: fallbackValue, sourceIndex: 0, sourceEndIndex: fallbackValue.length }
                );
                
                // Update the declaration value
                decl.value = parsedValue.toString();
              } : undefined
            });
          }
        }
      });
    });
  };
};

ruleFunction.ruleName = ruleName;
ruleFunction.meta = {
  url: '',
  fixable: true
};

// Export the plugin
export default createPlugin(ruleName, <stylelint.Rule>ruleFunction); 