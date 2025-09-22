import { Rule } from 'eslint';
import metadata from '@salesforce-ux/sds-metadata';
import ruleMessages from '../../config/rule-messages.yml';
import { formatMultipleHooks } from '../../utils/css-utils';

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
      data: { oldValue: cssVar, newValue: formatMultipleHooks(recommendation as string[]) }
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
          } else {
            // For var() function replacements, we need to replace the entire function call
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
      "Function[name='var'] Identifier[name=/^--lwc-/]"(node) {
        const tokenName = node.name;
        
        if (shouldIgnoreDetection(tokenName)) {
          return;
        }

        const { hasRecommendation, recommendation, replacementCategory } = getRecommendation(tokenName);
        const { messageId, data } = getReportMessage(tokenName, replacementCategory, recommendation);
        
        let suggestedMatch: string | null = null;
        
        if (hasRecommendation) {
          if (replacementCategory === ReplacementCategory.SLDS_TOKEN) {
            // Create the replacement in the format: var(--slds-token, var(--lwc-token))
            // This matches the Stylelint rule's behavior for SLDS tokens
            const originalVarCall = `var(${tokenName})`;
            suggestedMatch = `var(${recommendation}, ${originalVarCall})`;
          } else if (replacementCategory === ReplacementCategory.RAW_VALUE) {
            suggestedMatch = recommendation as string;
          }
        }

        reportAndFix(node, tokenName, suggestedMatch, messageId, data);
      },
    };
  },
} as Rule.RuleModule;
