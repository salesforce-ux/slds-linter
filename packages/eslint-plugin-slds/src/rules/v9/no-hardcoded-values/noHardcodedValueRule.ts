import { Rule } from 'eslint';

import { 
  handleColorDeclaration, 
  handleDensityDeclaration 
} from './handlers/index';
import { colorProperties, densificationProperties, fontProperties, toSelector } from '../../../utils/property-matcher';
import type { RuleConfig, HandlerContext } from '../../../types';



/**
 * Creates the shared no-hardcoded-value rule implementation for ESLint v9
 * Simplified implementation focusing on core color and density properties
 * Uses property-matcher.ts to ensure comprehensive coverage without missing properties
 * Complex cases like box-shadow and font shorthand will be handled in future iterations
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
      
      visitors[fontDensitySelector] = (node: any) => {
        handleDensityDeclaration(node, handlerContext);
      };

      return visitors;
    }
  };
}