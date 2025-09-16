import { Rule } from 'eslint';
import metadata from '@salesforce-ux/sds-metadata';
import ruleMessages from '../../config/rule-messages.yml';
import { 
  forEachSldsVariable, 
  type CssVariableInfo
} from '../../utils/css-utils';
import { 
  type PositionInfo, 
  type ReplacementInfo 
} from '../../utils/hardcoded-shared-utils';

const ruleConfig = ruleMessages['no-slds-var-without-fallback'];
const { type, description, url, messages } = ruleConfig;

// Access the slds1ExcludedVars property from metadata
const sldsVariables = metadata.slds1ExcludedVars || {};

/**
 * Handler for processing SLDS variables found in CSS values
 */
function handleSldsVariables(
  declarationNode: any,
  context: Rule.RuleContext,
  valueText: string
): void {
  const replacements: ReplacementInfo[] = [];
  
  // Use AST parsing to find all SLDS variables
  forEachSldsVariable(valueText, (variableInfo: CssVariableInfo, positionInfo: PositionInfo) => {
    const { name: cssVar, hasFallback } = variableInfo;
    
    // Skip if variable already has a fallback
    if (hasFallback) {
      return;
    }
    
    // Check if we have a fallback value for this SLDS variable
    const fallbackValue = sldsVariables[cssVar];
    if (!fallbackValue) {
      return; // No fallback available in metadata
    }
    
    // Calculate position information for precise error reporting
    const start = positionInfo.start?.offset || 0;
    const end = positionInfo.end?.offset || start;
    
    // Create the replacement with fallback
    const replacement = `var(${cssVar}, ${fallbackValue})`;
    const displayValue = cssVar;
    
    replacements.push({
      start,
      end,
      replacement,
      displayValue,
      hasHook: true // We have a fallback value available
    });
  });
  
  // If we have replacements, report them with a single combined fix
  if (replacements.length > 0) {
    // Create a new value with all SLDS variables fixed
    let newValue = valueText;
    
    // Apply all replacements from right to left to maintain string positions
    const sortedReplacements = replacements.sort((a, b) => b.start - a.start);
    sortedReplacements.forEach(({ start: rStart, end: rEnd, replacement: rReplacement }) => {
      newValue = newValue.substring(0, rStart) + rReplacement + newValue.substring(rEnd);
    });

    // Report each variable separately but with the same combined fix
    replacements.forEach(({ displayValue }) => {
      context.report({
        node: declarationNode,
        messageId: 'varWithoutFallback',
        data: { 
          cssVar: displayValue, 
          recommendation: sldsVariables[displayValue] 
        },
        fix(fixer) {
          // All variables get the same combined fix
          return fixer.replaceText(declarationNode.value, newValue);
        }
      });
    });
  }
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
    return {
      // Handle all CSS declarations - unified approach using AST parsing
      "Declaration"(node) {
        // Get the text representation of the value
        const valueString = context.sourceCode.getText(node.value);
        
        // Skip if no value
        if (!valueString) {
          return;
        }
        
        // Use AST parsing to handle all SLDS variables consistently
        handleSldsVariables(node, context, valueString);
      }
    };
  },
} as Rule.RuleModule;
