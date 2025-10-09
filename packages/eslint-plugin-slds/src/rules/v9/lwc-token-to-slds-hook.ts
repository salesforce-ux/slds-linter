import { Rule } from 'eslint';
import metadata from '@salesforce-ux/sds-metadata';
import ruleMessages from '../../config/rule-messages.yml';
import { formatSuggestionHooks } from '../../utils/css-utils';

const ruleConfig = ruleMessages['lwc-token-to-slds-hook'];
const { type, description, url, messages } = ruleConfig;

const lwcToSlds = metadata.lwcToSlds;

// Replacement category enum to match Stylelint version
enum ReplacementCategory {
  EMPTY = 'empty',
  SLDS_TOKEN = 'slds_token',
  ARRAY = 'array',
  RAW_VALUE = 'raw_value'
}

function shouldIgnoreDetection(lwcToken: string): boolean {
  // Ignore if entry not found in the list or the token is marked to use further
  return (
    !lwcToken.startsWith('--lwc-') ||
    !(lwcToken in lwcToSlds) ||
    lwcToSlds[lwcToken].continueToUse
  );
}

function categorizeReplacement(recommendation: string | string[]): ReplacementCategory {
  if (!recommendation || recommendation === '--') {
    return ReplacementCategory.EMPTY;
  }
  if (Array.isArray(recommendation)) {
    return ReplacementCategory.ARRAY;
  }
  if (typeof recommendation === 'string' && recommendation.startsWith('--slds-')) {
    return ReplacementCategory.SLDS_TOKEN;
  }
  return ReplacementCategory.RAW_VALUE;
}

function getRecommendation(lwcToken: string) {
  const oldValue = lwcToken;
  const recommendation = lwcToSlds[oldValue]?.replacement || '';
  const replacementCategory = categorizeReplacement(recommendation);
  const hasRecommendation = oldValue in lwcToSlds && replacementCategory !== ReplacementCategory.EMPTY;
  return { hasRecommendation, recommendation, replacementCategory };
}

/**
 * Extract LWC variable information from var() function nodes
 * Returns the LWC token name and any existing fallback value
 */
function extractLwcVariableWithFallback(node: any, sourceCode: any): { lwcToken: string; fallbackValue: string | null } | null {
  if (!node || node.type !== 'Function' || node.name !== 'var') {
    return null;
  }

  if (!node.children) {
    return null;
  }

  // Convert children to array and get the first child (variable name)
  const childrenArray = Array.from(node.children);
  if (childrenArray.length === 0) {
    return null;
  }
  
  const firstChild = childrenArray[0] as any;
  if (!firstChild || firstChild.type !== 'Identifier') {
    return null;
  }

  const variableName = firstChild.name;
  if (!variableName || !variableName.startsWith('--lwc-')) {
    return null;
  }

  // Check if there's a fallback (comma separator)
  const commaIndex = childrenArray.findIndex((child: any) => 
    child.type === 'Operator' && child.value === ','
  );

  let fallbackValue: string | null = null;
  if (commaIndex !== -1 && commaIndex + 1 < childrenArray.length) {
    // Get the exact text from the source code for the fallback part
    const fallbackStartNode = childrenArray[commaIndex + 1] as any;
    const fallbackEndNode = childrenArray[childrenArray.length - 1] as any;
    
    if (fallbackStartNode.loc && fallbackEndNode.loc) {
      const startOffset = fallbackStartNode.loc.start.offset;
      const endOffset = fallbackEndNode.loc.end.offset;
      const fullText = sourceCode.getText();
      fallbackValue = fullText.substring(startOffset, endOffset).trim();
    }
  }

  return {
    lwcToken: variableName,
    fallbackValue
  };
}

function getReportMessage(cssVar: string, replacementCategory: ReplacementCategory, recommendation: string | string[]): { messageId: string, data: any } {
  if (!recommendation) {
    // Found a deprecated token but don't have any alternate recommendation then just report user to follow docs
    return {
      messageId: 'errorWithNoRecommendation',
      data: { oldValue: cssVar }
    };
  } else if (replacementCategory === ReplacementCategory.ARRAY) {
    return {
      messageId: 'errorWithStyleHooks',
      data: { oldValue: cssVar, newValue: formatSuggestionHooks(recommendation as string[]) }
    };
  } else if (replacementCategory === ReplacementCategory.SLDS_TOKEN) {
    return {
      messageId: 'errorWithStyleHooks',
      data: { oldValue: cssVar, newValue: recommendation as string }
    };
  } else {
    return {
      messageId: 'errorWithReplacement',
      data: { oldValue: cssVar, newValue: recommendation as string }
    };
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
    function reportAndFix(node, oldValue, suggestedMatch, messageId, data) {
      let fixFunction = null;
      
      // Only provide fix if we have a concrete suggestion
      if (suggestedMatch) {
        fixFunction = (fixer) => {
          // For Declaration nodes, use the offset from loc info
          if (node.type === "Declaration") {
            const sourceCode = context.sourceCode;
            const fullText = sourceCode.getText();
            const nodeOffset = node.loc.start.offset;
            
            // The property name appears at the start of the Declaration
            const propertyStart = nodeOffset;
            const propertyEnd = propertyStart + oldValue.length;
            
            // Verify we're replacing the right text
            const textAtPosition = fullText.substring(propertyStart, propertyEnd);
            if (textAtPosition === oldValue) {
              return fixer.replaceTextRange([propertyStart, propertyEnd], suggestedMatch);
            }
          } else if (node.type === "Function" && node.name === "var") {
            // For var() function replacements, replace the entire function call
            const sourceCode = context.sourceCode;
            const fullText = sourceCode.getText();
            const nodeOffset = node.loc.start.offset;
            const nodeEnd = node.loc.end.offset;
            
            // Replace the entire var() function
            return fixer.replaceTextRange([nodeOffset, nodeEnd], suggestedMatch);
          } else {
            // For Identifier nodes inside var() functions, we need to replace the entire function call
            const sourceCode = context.sourceCode;
            const fullText = sourceCode.getText();
            
            // Find the var() function call that contains this identifier
            const varFunctionCall = `var(${oldValue})`;
            const nodeOffset = node.loc.start.offset;
            
            // Search backwards to find the 'var(' part
            const searchStart = Math.max(0, nodeOffset - 4); // 'var('.length = 4
            const searchEnd = nodeOffset + oldValue.length + 1; // +1 for closing ')'
            const searchArea = fullText.substring(searchStart, searchEnd);
            
            const functionCallIndex = searchArea.indexOf(varFunctionCall);
            if (functionCallIndex !== -1) {
              const actualStart = searchStart + functionCallIndex;
              const actualEnd = actualStart + varFunctionCall.length;
              return fixer.replaceTextRange([actualStart, actualEnd], suggestedMatch);
            }
          }
          return null;
        };
      }

      context.report({
        node,
        messageId,
        data,
        fix: fixFunction
      });
    }

    return {
      // CSS custom property declarations: --lwc-* properties
      "Declaration[property=/^--lwc-/]"(node) {
        const property = node.property;
        
        if (shouldIgnoreDetection(property)) {
          return;
        }

        const { hasRecommendation, recommendation, replacementCategory } = getRecommendation(property);
        const { messageId, data } = getReportMessage(property, replacementCategory, recommendation);
        
        // Only provide auto-fix for SLDS token replacements
        const suggestedMatch = (hasRecommendation && replacementCategory === ReplacementCategory.SLDS_TOKEN) 
          ? recommendation as string 
          : null;
        
        reportAndFix(node, property, suggestedMatch, messageId, data);
      },

      // LWC tokens inside var() functions: var(--lwc-*)
      "Function[name='var']"(node) {
        const lwcVarInfo = extractLwcVariableWithFallback(node, context.sourceCode);
        if (!lwcVarInfo) {
          return;
        }

        const { lwcToken, fallbackValue } = lwcVarInfo;
        
        if (shouldIgnoreDetection(lwcToken)) {
          return;
        }

        const { hasRecommendation, recommendation, replacementCategory } = getRecommendation(lwcToken);
        const { messageId, data } = getReportMessage(lwcToken, replacementCategory, recommendation);
        
        let suggestedMatch: string | null = null;
        
        if (hasRecommendation) {
          if (replacementCategory === ReplacementCategory.SLDS_TOKEN) {
            // Create the replacement in the format: var(--slds-token, var(--lwc-token, fallback))
            // This preserves any existing fallback value
            const originalVarCall = fallbackValue 
              ? `var(${lwcToken}, ${fallbackValue})`
              : `var(${lwcToken})`;
            suggestedMatch = `var(${recommendation}, ${originalVarCall})`;
          } else if (replacementCategory === ReplacementCategory.RAW_VALUE) {
            suggestedMatch = recommendation as string;
          }
        }

        reportAndFix(node, lwcToken, suggestedMatch, messageId, data);
      },
    };
  },
} as Rule.RuleModule;
