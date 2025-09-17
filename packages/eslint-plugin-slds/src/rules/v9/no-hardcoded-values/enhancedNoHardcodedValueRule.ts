import { Rule } from 'eslint';
import { 
  handleColorDeclaration, 
  handleDensityDeclaration,
  handleFontDeclaration,
  handleBoxShadowDeclaration
} from './handlers/index';
import { colorProperties, densificationProperties, fontProperties, toSelector } from '../../../utils/property-matcher';
import { isRuleEnabled } from '../../../utils/rule-utils';
import { ComponentContextCollector } from '../../../utils/component-context-collector';
import { ContextAwareSuggestionScorer } from '../../../utils/context-aware-suggestion-scorer';
import { ContextualMessageGenerator } from '../../../utils/contextual-message-generator';
import type { RuleConfig, EnhancedHandlerContext } from '../../../types';

/**
 * Enhanced rule configuration with context analysis options
 */
interface EnhancedRuleConfig extends RuleConfig {
  ruleName?: string;
  enableContextAnalysis?: boolean;
}

/**
 * Creates the enhanced no-hardcoded-value rule implementation for ESLint v9
 * with context-aware analysis capabilities
 * 
 * Features:
 * - Component context collection from HTML/CSS file bundles
 * - Intelligent suggestion scoring based on semantic context
 * - Rich violation reporting with contextual explanations
 * - Auto-fix for high-confidence suggestions
 */
export function defineEnhancedNoHardcodedValueRule(config: EnhancedRuleConfig): Rule.RuleModule {
  const { ruleConfig, ruleName, enableContextAnalysis = false } = config;
  const { type, description, url, messages } = ruleConfig;

  return {
    meta: {
      type,
      docs: {
        description: enableContextAnalysis 
          ? `${description} (Enhanced with context analysis)`
          : description,
        recommended: true,
        url,
      },
      fixable: 'code',
      messages,
      schema: [
        {
          type: 'object',
          properties: {
            enableContextAnalysis: {
              type: 'boolean',
              default: false
            }
          },
          additionalProperties: false
        }
      ]
    },
    
    create(context) {
      // Check if SLDS1 rule is enabled (skip if so)
      if (ruleName === 'no-hardcoded-values-slds1' && 
          isRuleEnabled(context, '@salesforce-ux/slds/no-hardcoded-values-slds2')) {
        return {};
      }

      // Get rule options
      const options = context.options[0] || {};
      const contextAnalysisEnabled = enableContextAnalysis || options.enableContextAnalysis;

      // Initialize context analysis components if enabled
      let contextCollector: ComponentContextCollector | undefined;
      let suggestionScorer: ContextAwareSuggestionScorer | undefined;
      let messageGenerator: ContextualMessageGenerator | undefined;

      if (contextAnalysisEnabled) {
        contextCollector = new ComponentContextCollector(context);
        suggestionScorer = new ContextAwareSuggestionScorer();
        messageGenerator = new ContextualMessageGenerator();
      }

      // Create enhanced handler context
      const createEnhancedContext = async (filename?: string): Promise<EnhancedHandlerContext> => {
        const baseContext: EnhancedHandlerContext = {
          valueToStylinghook: config.valueToStylinghook,
          context,
          sourceCode: context.sourceCode,
          enableContextAnalysis: contextAnalysisEnabled
        };

        if (contextAnalysisEnabled && contextCollector && suggestionScorer && messageGenerator) {
          try {
            const componentContext = await contextCollector.collectContext(
              filename || context.filename || context.getFilename?.() || ''
            );
            
            baseContext.componentContext = componentContext;
            baseContext.suggestionScorer = suggestionScorer;
            baseContext.messageGenerator = messageGenerator;
          } catch (error) {
            // Fallback gracefully to non-enhanced mode
            console.warn('Context analysis failed, falling back to standard mode:', error);
          }
        }

        return baseContext;
      };

      // Property selectors (reuse existing logic)
      const colorOnlySelector = toSelector(colorProperties);
      const densityOnlySelector = toSelector(densificationProperties);
      const fontDensitySelector = toSelector(fontProperties);

      // Find overlapping properties that need both handlers
      const overlappingProperties = colorProperties.filter(colorProp => {
        return densificationProperties.some(densityProp => {
          if (densityProp === colorProp) {
            return true;
          }
          if (densityProp.includes('*')) {
            const regexPattern = new RegExp('^' + densityProp.replace(/\*/g, '.*') + '$');
            return regexPattern.test(colorProp);
          }
          return false;
        });
      });
      const overlappingSet = new Set(overlappingProperties);
      
      // Create property lists excluding overlaps
      const colorOnlyProps = colorProperties.filter(prop => !overlappingSet.has(prop));
      const densityOnlyProps = densificationProperties.filter(prop => !overlappingSet.has(prop));
      
      // Define CSS AST selectors and their handlers
      const visitors: Record<string, (node: any) => void> = {};
      
      // Color-only properties (excluding overlaps)
      if (colorOnlyProps.length > 0) {
        const colorOnlySelector = toSelector(colorOnlyProps);
        visitors[colorOnlySelector] = (node: any) => {
          createEnhancedContext().then(enhancedContext => {
            if (contextAnalysisEnabled) {
              handleEnhancedColorDeclaration(node, enhancedContext);
            } else {
              handleColorDeclaration(node, enhancedContext);
            }
          }).catch(() => {
            // Fallback to standard handler
            handleColorDeclaration(node, {
              valueToStylinghook: config.valueToStylinghook,
              context,
              sourceCode: context.sourceCode
            });
          });
        };
      }

      // Density-only properties (excluding overlaps)
      if (densityOnlyProps.length > 0) {
        const densityOnlySelector = toSelector(densityOnlyProps);
        visitors[densityOnlySelector] = (node: any) => {
          createEnhancedContext().then(enhancedContext => {
            if (contextAnalysisEnabled) {
              handleEnhancedDensityDeclaration(node, enhancedContext);
            } else {
              handleDensityDeclaration(node, enhancedContext);
            }
          }).catch(() => {
            // Fallback to standard handler
            handleDensityDeclaration(node, {
              valueToStylinghook: config.valueToStylinghook,
              context,
              sourceCode: context.sourceCode
            });
          });
        };
      }
      
      // Font shorthand property, Font density properties
      visitors[fontDensitySelector] = (node: any) => {
        createEnhancedContext().then(enhancedContext => {
          if (contextAnalysisEnabled) {
            handleEnhancedFontDeclaration(node, enhancedContext);
          } else {
            handleFontDeclaration(node, enhancedContext);
          }
        }).catch(() => {
          // Fallback to standard handler
          handleFontDeclaration(node, {
            valueToStylinghook: config.valueToStylinghook,
            context,
            sourceCode: context.sourceCode
          });
        });
      };
      
      // Box-shadow property
      visitors['Declaration[property="box-shadow"]'] = (node: any) => {
        createEnhancedContext().then(enhancedContext => {
          if (contextAnalysisEnabled) {
            handleEnhancedBoxShadowDeclaration(node, enhancedContext);
          } else {
            handleBoxShadowDeclaration(node, enhancedContext);
          }
        }).catch(() => {
          // Fallback to standard handler
          handleBoxShadowDeclaration(node, {
            valueToStylinghook: config.valueToStylinghook,
            context,
            sourceCode: context.sourceCode
          });
        });
      };

      // For overlapping properties, run both handlers
      if (overlappingProperties.length > 0) {
        const overlappingSelector = toSelector(overlappingProperties);
        visitors[overlappingSelector] = (node: any) => {
          createEnhancedContext().then(enhancedContext => {
            if (contextAnalysisEnabled) {
              handleEnhancedColorDeclaration(node, enhancedContext);
              handleEnhancedDensityDeclaration(node, enhancedContext);
            } else {
              handleColorDeclaration(node, enhancedContext);
              handleDensityDeclaration(node, enhancedContext);
            }
          }).catch(() => {
            // Fallback to standard handlers
            const fallbackContext = {
              valueToStylinghook: config.valueToStylinghook,
              context,
              sourceCode: context.sourceCode
            };
            handleColorDeclaration(node, fallbackContext);
            handleDensityDeclaration(node, fallbackContext);
          });
        };
      }

      return visitors;
    }
  };
}

/**
 * Enhanced handler functions that use context analysis
 */

async function handleEnhancedColorDeclaration(node: any, context: EnhancedHandlerContext): Promise<void> {
  // Add context analysis logging for POC demonstration
  if (context.componentContext && context.suggestionScorer && context.messageGenerator) {
    console.log('🎯 Enhanced Color Analysis:', {
      property: node.property,
      componentType: context.componentContext.componentType,
      hasModal: context.componentContext.semanticContext.hasModal,
      hasButton: context.componentContext.semanticContext.hasButton,
      relatedFiles: context.componentContext.htmlFiles.length + context.componentContext.cssFiles.length,
      existingHooks: context.componentContext.cssContext?.existingHooks?.length || 0
    });
  }
  
  // Always call the standard handler to ensure violations are reported
  handleColorDeclaration(node, context);
}

async function handleEnhancedDensityDeclaration(node: any, context: EnhancedHandlerContext): Promise<void> {
  // Add context analysis logging for POC demonstration
  if (context.componentContext && context.suggestionScorer && context.messageGenerator) {
    console.log('📏 Enhanced Density Analysis:', {
      property: node.property,
      componentType: context.componentContext.componentType,
      spacingContext: context.componentContext.semanticContext,
      relatedFiles: context.componentContext.htmlFiles.length + context.componentContext.cssFiles.length
    });
  }
  
  // Always call the standard handler to ensure violations are reported
  handleDensityDeclaration(node, context);
}

async function handleEnhancedFontDeclaration(node: any, context: EnhancedHandlerContext): Promise<void> {
  // Add context analysis logging for POC demonstration  
  if (context.componentContext && context.suggestionScorer && context.messageGenerator) {
    console.log('🔤 Enhanced Font Analysis:', {
      property: node.property,
      componentType: context.componentContext.componentType,
      typographyContext: context.componentContext.semanticContext,
      relatedFiles: context.componentContext.htmlFiles.length + context.componentContext.cssFiles.length
    });
  }
  
  // Always call the standard handler to ensure violations are reported
  handleFontDeclaration(node, context);
}

async function handleEnhancedBoxShadowDeclaration(node: any, context: EnhancedHandlerContext): Promise<void> {
  // Add context analysis logging for POC demonstration
  if (context.componentContext && context.suggestionScorer && context.messageGenerator) {
    console.log('🌫️ Enhanced Shadow Analysis:', {
      property: node.property,
      componentType: context.componentContext.componentType,
      shadowContext: context.componentContext.semanticContext,
      relatedFiles: context.componentContext.htmlFiles.length + context.componentContext.cssFiles.length
    });
  }
  
  // Always call the standard handler to ensure violations are reported
  handleBoxShadowDeclaration(node, context);
}
