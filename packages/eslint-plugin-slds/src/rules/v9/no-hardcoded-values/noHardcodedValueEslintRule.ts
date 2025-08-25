import { Rule } from 'eslint';
import { createESLintReportFunction } from '../../../utils/reporting';
import { 
  handleColorDeclaration, 
  handleDensityDeclaration,
  handleFontShorthand 
} from './handlers/index';
import { colorProperties, densificationProperties } from '../../../utils/property-matcher';
import type { RuleConfig, HandlerContext } from '../../../utils/types';

/**
 * Convert property patterns to CSS AST selector patterns
 * Handles wildcards (*) and creates proper ESLint CSS selector syntax
 */
function createCSSASTSelector(properties: string[]): string {
  const selectorParts = properties.map(prop => {
    if (prop.includes('*')) {
      // Convert wildcards to regex patterns for CSS AST selectors
      const regexPattern = prop.replace(/\*/g, '.*');
      return `Declaration[property=/${regexPattern}$/]`;
    } else {
      // Exact property match
      return `Declaration[property='${prop}']`;
    }
  });
  
  return selectorParts.join(', ');
}

/**
 * Creates the shared no-hardcoded-value rule implementation for ESLint v9
 * Supports color, density, and font shorthand properties
 * Uses property-matcher.ts to ensure comprehensive coverage without missing properties
 * Complex cases like box-shadow can be added in future iterations
 */
export function createNoHardcodedValueEslintRule(config: RuleConfig): Rule.RuleModule {
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
      // Skip non-CSS files
      if (!context.filename?.match(/\.(css|scss)$/)) {
        return {};
      }

      // Create ESLint-specific reporting function
      const reportFn = createESLintReportFunction(context, messages);

      // Create handler context
      const handlerContext: HandlerContext = {
        valueToStylinghook: config.valueToStylinghook,
        reportFn,
        sourceCode: context.sourceCode
      };

      // Generate CSS AST selectors from property-matcher.ts arrays
      const colorSelector = createCSSASTSelector(colorProperties);
      const densitySelector = createCSSASTSelector([
        ...densificationProperties
      ]);

      // Define CSS AST selectors and their handlers using property-matcher.ts
      const visitors: Record<string, (node: any) => void> = {};
      
      // Color properties - handle hardcoded color values
      visitors[colorSelector] = (node: any) => {
        handleColorDeclaration(node, handlerContext);
      };

      // Density/sizing properties - handle hardcoded dimension values  
      visitors[densitySelector] = (node: any) => {
        handleDensityDeclaration(node, handlerContext);
      };

      // Individual font properties - handle hardcoded font values
      visitors["Declaration[property='font-size'], Declaration[property='font-weight']"] = (node: any) => {
        handleDensityDeclaration(node, handlerContext);
      };

      // Font shorthand - complex property requiring special parsing
      visitors["Declaration[property='font']"] = (node: any) => {
        handleFontShorthand(node, handlerContext);
      };

      return visitors;
    }
  };
}