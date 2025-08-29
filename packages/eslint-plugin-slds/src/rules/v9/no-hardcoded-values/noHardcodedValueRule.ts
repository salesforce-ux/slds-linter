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

      // Define CSS AST selectors and their handlers
      const visitors: Record<string, (node: any) => void> = {};
      
      // Color-only properties
      visitors[colorOnlySelector] = (node: any) => {
        handleColorDeclaration(node, handlerContext);
      };

      // Density-only properties
      visitors[densityOnlySelector] = (node: any) => {
        handleDensityDeclaration(node, handlerContext);
      };
      
      // Font density properties (font-size, font-weight)
      visitors[fontDensitySelector] = (node: any) => {
        handleFontDeclaration(node, handlerContext);
      };
      
      // Font shorthand property
      visitors[fontShorthandSelector] = (node: any) => {
        handleFontDeclaration(node, handlerContext);
      };

      return visitors;
    }
  };
}