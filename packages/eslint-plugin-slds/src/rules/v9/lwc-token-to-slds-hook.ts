import { Rule } from 'eslint';
import metadata from '@salesforce-ux/sds-metadata';
import ruleMessages from '../../config/rule-messages';
import { formatSuggestionHooks, forEachLwcVariable, type CssVariableInfo } from '../../utils/css-utils';
import type { PositionInfo } from '../../utils/hardcoded-shared-utils';

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
    function reportAndFix(
      node: any,
      suggestedMatch: string | null,
      messageId: string,
      data: any,
      fixRange?: [number, number],
      loc?: any
    ) {
      context.report({
        node,
        loc: loc || node.loc,
        messageId,
        data,
        fix: suggestedMatch && fixRange ? (fixer) => {
          return fixer.replaceTextRange(fixRange, suggestedMatch);
        } : undefined
      });
    }

    return {
      // CSS custom property declarations: Check both property name and value
      "Declaration"(node) {
        // Check 1: Property name (left-side) for custom properties using --lwc- prefix
        const property = node.property;
        if (property && property.startsWith('--lwc-')) {
          if (!shouldIgnoreDetection(property)) {
            const { hasRecommendation, recommendation, replacementCategory } = getRecommendation(property);
            const { messageId, data } = getReportMessage(property, replacementCategory, recommendation);
            
            // Only provide auto-fix for SLDS token replacements
            const suggestedMatch = (hasRecommendation && replacementCategory === ReplacementCategory.SLDS_TOKEN) 
              ? recommendation as string 
              : null;
            
            // Calculate fix range for property name
            const propertyStart = node.loc.start.offset;
            const propertyEnd = propertyStart + property.length;
            
            reportAndFix(node, suggestedMatch, messageId, data, [propertyStart, propertyEnd]);
          }
        }

        // Check 2: Property value (right-side) - Use AST parsing to detect var(--lwc-*) functions
        // Note: We use forEachLwcVariable instead of Function[name='var'] handler because
        // ESLint treats custom property values (e.g., --custom-prop: var(--lwc-token)) as raw strings
        // rather than parsing them into Function nodes. This AST-based approach handles both cases.
        const valueText = context.sourceCode.getText(node.value);
        if (valueText) {
          forEachLwcVariable(valueText, (variableInfo: CssVariableInfo, positionInfo: PositionInfo) => {
            const { name: lwcToken, hasFallback } = variableInfo;
            
            if (shouldIgnoreDetection(lwcToken)) {
              return;
            }

            const { hasRecommendation, recommendation, replacementCategory } = getRecommendation(lwcToken);
            const { messageId, data } = getReportMessage(lwcToken, replacementCategory, recommendation);
            
            let suggestedMatch: string | null = null;
            
            if (hasRecommendation) {
              if (replacementCategory === ReplacementCategory.SLDS_TOKEN) {
                // Extract fallback value from the original var() call if present
                // Use position info to get the full var() call text
                let fallbackValue: string | null = null;
                if (hasFallback && positionInfo.start && positionInfo.end && positionInfo.start.offset !== undefined && positionInfo.end.offset !== undefined) {
                  const varCallText = valueText.substring(positionInfo.start.offset, positionInfo.end.offset);
                  // Find the comma after the token name and extract everything after it (before the closing paren)
                  const commaIndex = varCallText.indexOf(',');
                  if (commaIndex !== -1) {
                    // Extract from after comma to before closing paren
                    fallbackValue = varCallText.substring(commaIndex + 1, varCallText.length - 1).trim();
                  }
                }
                
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

            // Calculate fix range and location using position info from AST parsing
            const valueStartOffset = node.value.loc.start.offset;
            const varStartOffset = valueStartOffset + (positionInfo.start?.offset || 0);
            const varEndOffset = valueStartOffset + (positionInfo.end?.offset || valueText.length);
            
            // Calculate precise location if position info is available
            const preciseLoc = positionInfo.start && positionInfo.end && node.value.loc ? {
              start: {
                line: node.value.loc.start.line + positionInfo.start.line - 1,
                column: node.value.loc.start.column + positionInfo.start.column - 1
              },
              end: {
                line: node.value.loc.start.line + positionInfo.end.line - 1,
                column: node.value.loc.start.column + positionInfo.end.column - 1
              }
            } : node.value.loc;
            
            reportAndFix(node, suggestedMatch, messageId, data, [varStartOffset, varEndOffset], preciseLoc);
          });
        }
      },
    };
  },
} as Rule.RuleModule;
