import { Rule } from 'eslint';
import { createESLintReportFunction } from '../../../utils/reporting';
import { 
  handleColorDeclaration, 
  handleDensityDeclaration 
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
 * Simplified implementation focusing on core color and density properties
 * Uses property-matcher.ts to ensure comprehensive coverage without missing properties
 * Complex cases like box-shadow and font shorthand will be handled in future iterations
 */
export function createNoHardcodedValueEslintRule(config: RuleConfig): Rule.RuleModule {
  const { ruleConfig, ruleId } = config;
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

      // Prevent SLDS1 from running if SLDS2 is enabled (matches Stylelint behavior)
      if (ruleId === 'slds/no-hardcoded-values-slds1') {
        // Check if SLDS2 rule is enabled in the same config
        const settings = context.settings as any;
        const rules = settings?.eslintConfig?.rules || {};
        if (rules['@salesforce-ux/slds/no-hardcoded-values-slds2']) {
          return {}; // Skip SLDS1 when SLDS2 is enabled
        }
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
        ...densificationProperties,
        'font-size',
        'font-weight'
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

      return visitors;
    }
  };
}