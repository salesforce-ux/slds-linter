import { Rule } from 'eslint';
import metadata from '@salesforce-ux/sds-metadata';
import { getRuleMetadata, getFormattedMessage } from '../../../utils/rule-metadata';
import { parseVarFunctions, isSldsCssVariable, parseCssFile, isTargetProperty } from '../../../utils/css-parser';

const ruleName = 'no-slds-var-without-fallback';

// Access the slds1ExcludedVars property from metadata
const sldsVariables = metadata.slds1ExcludedVars || {};

// Get rule metadata
const ruleInfo = getRuleMetadata(ruleName);

/**
 * This rule only supports .css, .scss, .html, and .cmp files in ESLint v9.
 * It does NOT support JS/TS/JSX/TSX/template literals.
 */
export = {
  meta: {
    type: 'problem',
    docs: {
      description: ruleInfo?.ruleDesc || 'Add fallback values to SLDS styling hooks',
      recommended: true,
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          propertyTargets: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missingFallback: 'SLDS variable without fallback value',
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const { propertyTargets = [] } = options;
    const filename = context.getFilename();

    // Only run for supported file types
    if (!/\.(css|scss|html|cmp)$/i.test(filename)) {
      return {};
    }

    const sourceCode = context.getSourceCode();
    const content = sourceCode.text;
    const cssNodes = parseCssFile(content, filename);

    cssNodes.forEach((node) => {
      if (node.type === 'css-declaration' && node.value && node.property) {
        // Check if this property should be targeted (matches stylelint behavior)
        if (!isTargetProperty(node.property, propertyTargets)) {
          return;
        }

        const varFunctions = parseVarFunctions(node.value);
        
        varFunctions.forEach(({ varName, hasFallback, fullMatch, startIndex, endIndex }) => {
          if (!isSldsCssVariable(varName) || hasFallback) return;

          const fallbackValue = sldsVariables[varName];
          if (!fallbackValue) return;

          const message = getFormattedMessage(ruleName, 'errorMsg', {
            cssVar: varName,
            recommendation: fallbackValue,
          });

          // Create a virtual node for reporting
          const virtualNode = {
            type: 'Program',
            range: [node.startIndex, node.endIndex] as [number, number],
            loc: {
              start: { line: node.line, column: node.column },
              end: { line: node.endLine, column: node.endColumn }
            }
          };

          context.report({
            node: virtualNode,
            message,
            data: {
              cssVar: varName,
              fallbackValue,
            },
            fix(fixer) {
              const newVarFunction = `var(${varName}, ${fallbackValue})`;
              const newValue = node.value!.replace(fullMatch, newVarFunction);
              return fixer.replaceTextRange([node.startIndex, node.endIndex], `${node.property}: ${newValue};`);
            },
          });
        });
      }
    });

    return {};
  },
}; 