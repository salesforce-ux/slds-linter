import { Rule } from 'eslint';
import metadata from '@salesforce-ux/sds-metadata';
import ruleMessages from '../../config/rule-messages.yml';
import { forEachSldsVariable, type CssVariableInfo } from '../../utils/css-utils';
import type { PositionInfo } from '../../utils/hardcoded-shared-utils';

const ruleConfig = ruleMessages['no-slds-var-without-fallback'];
const { type, description, url, messages } = ruleConfig;

// Access the slds1ExcludedVars property from metadata
const sldsVariables = metadata.slds1ExcludedVars || {};

/**
 * ESLint rule to detect SLDS variables used without fallback values
 * Uses CSS AST parsing for consistent detection across all CSS contexts
 */
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
    return {
      "Declaration"(node) {
        const valueText = context.sourceCode.getText(node.value);
        if (!valueText) return;

        const variablesNeedingFallback: Array<{
          cssVar: string;
          fallbackValue: string;
          start: number;
          end: number;
        }> = [];

        // Use AST parsing to find all SLDS variables
        forEachSldsVariable(valueText, (variableInfo: CssVariableInfo, positionInfo: PositionInfo) => {
          const { name: cssVar, hasFallback } = variableInfo;
          
          if (hasFallback) return; // Skip if variable already has a fallback
          
          const fallbackValue = sldsVariables[cssVar];
          if (!fallbackValue) return; // No fallback available in metadata
          
          variablesNeedingFallback.push({
            cssVar,
            fallbackValue,
            start: positionInfo.start?.offset || 0,
            end: positionInfo.end?.offset || 0
          });
        });

        // Report violations with combined fix
        if (variablesNeedingFallback.length > 0) {
          // Create combined fix for all variables
          let newValue = valueText;
          const sortedVariables = variablesNeedingFallback.sort((a, b) => b.start - a.start);
          
          sortedVariables.forEach(({ cssVar, fallbackValue, start, end }) => {
            const replacement = `var(${cssVar}, ${fallbackValue})`;
            newValue = newValue.substring(0, start) + replacement + newValue.substring(end);
          });

          // Report each variable separately but with the same combined fix
          variablesNeedingFallback.forEach(({ cssVar, fallbackValue }) => {
            context.report({
              node,
              messageId: 'varWithoutFallback',
              data: { cssVar, recommendation: fallbackValue },
              fix: (fixer) => fixer.replaceText(node.value, newValue)
            });
          });
        }
      }
    };
  },
} as Rule.RuleModule;
