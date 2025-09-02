import { Rule } from 'eslint';

import { 
  handleColorDeclaration, 
  handleDensityDeclaration,
  handleFontDeclaration 
} from './handlers/index';
import { colorProperties, densificationProperties, fontProperties, fontShorthandProperties, toSelector } from '../../../utils/property-matcher';
import type { RuleConfig, HandlerContext } from '../../../types';



/**
 * Creates the shared no-hardcoded-value rule implementation for ESLint v9
 * Supports color, density, and font properties including font shorthand
 * Uses property-matcher.ts to ensure comprehensive coverage without missing properties
 * Complex cases like box-shadow will be handled in future iterations
 */
export function defineNoHardcodedValueRule(config: RuleConfig): Rule.RuleModule {
  const { ruleConfig } = config;
  const { type, description, url, messages } = ruleConfig;

  return {
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
      // Create handler context
      const handlerContext: HandlerContext = {
        valueToStylinghook: config.valueToStylinghook,
        context,
        sourceCode: context.sourceCode
      };
      
      const colorOnlySelector = toSelector(colorProperties);
      const densityOnlySelector = toSelector(densificationProperties);
      const fontDensitySelector = toSelector(fontProperties);
      const fontShorthandSelector = toSelector(fontShorthandProperties);

      // Find overlapping properties that need both handlers
      // This includes exact matches and wildcard pattern matches
      const overlappingProperties = colorProperties.filter(colorProp => {
        return densificationProperties.some(densityProp => {
          if (densityProp === colorProp) {
            return true; // Exact match
          }
          if (densityProp.includes('*')) {
            // Check if colorProp matches the wildcard pattern
            const regexPattern = new RegExp('^' + densityProp.replace(/\*/g, '.*') + '$');
            return regexPattern.test(colorProp);
          }
          return false;
        });
      });
      const overlappingSet = new Set(overlappingProperties);
      
      // Create property lists excluding overlaps to avoid triple processing
      const colorOnlyProps = colorProperties.filter(prop => !overlappingSet.has(prop));
      const densityOnlyProps = densificationProperties.filter(prop => !overlappingSet.has(prop));
      
      // Define CSS AST selectors and their handlers
      const visitors: Record<string, (node: any) => void> = {};
      
      // Color-only properties (excluding overlaps)
      if (colorOnlyProps.length > 0) {
        const colorOnlySelector = toSelector(colorOnlyProps);
        visitors[colorOnlySelector] = (node: any) => {
          handleColorDeclaration(node, handlerContext);
        };
      }

      // Density-only properties (excluding overlaps)
      if (densityOnlyProps.length > 0) {
        const densityOnlySelector = toSelector(densityOnlyProps);
        visitors[densityOnlySelector] = (node: any) => {
          handleDensityDeclaration(node, handlerContext);
        };
      }
      
      // Font density properties (font-size, font-weight)
      visitors[fontDensitySelector] = (node: any) => {
        handleFontDeclaration(node, handlerContext);
      };
      
      // Font shorthand property
      visitors[fontShorthandSelector] = (node: any) => {
        handleFontDeclaration(node, handlerContext);
      };

      // For overlapping properties, run both handlers
      if (overlappingProperties.length > 0) {
        const overlappingSelector = toSelector(overlappingProperties);
        visitors[overlappingSelector] = (node: any) => {
          handleColorDeclaration(node, handlerContext);
          handleDensityDeclaration(node, handlerContext);
        };
      }

      return visitors;
    }
  };
}