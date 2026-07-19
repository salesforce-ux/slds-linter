import { Rule } from 'eslint';

import { 
  handleColorDeclaration, 
  handleDensityDeclaration,
  handleFontDeclaration,
  handleBoxShadowDeclaration
} from './handlers/index';
import { colorProperties, densificationProperties, fontProperties, matchesCssProperty, toSelector } from '../../../utils/property-matcher';
import { isRuleEnabled } from '../../../utils/rule-utils';
import type { RuleConfig, HandlerContext, RuleOptions } from '../../../types';
import { ruleOptionsSchema } from './ruleOptionsSchema';
import {
  isJsxLikeFile,
  createDeclarationVisitor,
  synthesizeDeclarationForHandlers,
  type JsxDeclaration,
} from '../../../utils/jsx';



/**
 * Creates the shared no-hardcoded-value rule implementation for ESLint v9
 * Supports color, density, and font properties including font shorthand
 * Uses property-matcher.ts to ensure comprehensive coverage without missing properties
 * Complex cases like box-shadow will be handled in future iterations
 */
export function defineNoHardcodedValueRule(config: RuleConfig & { ruleName?: string }): Rule.RuleModule {
  const { ruleConfig, ruleName } = config;
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
      schema: ruleOptionsSchema
    },
    
    create(context) {
      if (ruleName === 'no-hardcoded-values-slds1' && 
          isRuleEnabled(context, '@salesforce-ux/slds/no-hardcoded-values-slds2')) {
        return {};
      }

      // Parse options from context
      const options: RuleOptions = context.options[0] || {};
      const ruleOptions: RuleOptions = {
        reportNumericValue: options.reportNumericValue || 'always',
        customMapping: options.customMapping || {},
        preferPaletteHook: options.preferPaletteHook || false
      };

      // Create handler context
      const handlerContext: HandlerContext = {
        valueToStylinghook: config.valueToStylinghook,
        context,
        sourceCode: context.sourceCode,
        options: ruleOptions
      };

      // JSX/React: inline style objects and CSS-in-JS declarations reuse the
      // same value handlers via a synthesized declaration node.
      const filename = context.filename || context.getFilename();
      if (isJsxLikeFile(filename)) {
        return createDeclarationVisitor(context, (decl: JsxDeclaration) => {
          const synthesized = synthesizeDeclarationForHandlers(context, decl);
          if (!synthesized) {
            return;
          }
          const { node, proxiedContext } = synthesized;
          const declHandlerContext: HandlerContext = {
            valueToStylinghook: config.valueToStylinghook,
            context: proxiedContext,
            sourceCode: proxiedContext.sourceCode,
            options: ruleOptions,
          };
          const cssProperty = (decl.property || '').toLowerCase();
          if (!cssProperty || cssProperty.startsWith('--')) {
            return;
          }
          if (matchesCssProperty(colorProperties, cssProperty)) {
            handleColorDeclaration(node, declHandlerContext);
          }
          if (matchesCssProperty(densificationProperties, cssProperty)) {
            handleDensityDeclaration(node, declHandlerContext);
          }
          if (fontProperties.includes(cssProperty)) {
            handleFontDeclaration(node, declHandlerContext);
          }
          if (cssProperty === 'box-shadow') {
            handleBoxShadowDeclaration(node, declHandlerContext);
          }
        });
      }
      
      const colorOnlySelector = toSelector(colorProperties);
      const densityOnlySelector = toSelector(densificationProperties);
      const fontDensitySelector = toSelector(fontProperties);

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
      
      // Font shorthand property, Font density properties (font-size, font-weight)
      visitors[fontDensitySelector] = (node: any) => {
        handleFontDeclaration(node, handlerContext);
      };
      
      // Box-shadow property - special case requiring complete value matching
      visitors['Declaration[property="box-shadow"]'] = (node: any) => {
        handleBoxShadowDeclaration(node, handlerContext);
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