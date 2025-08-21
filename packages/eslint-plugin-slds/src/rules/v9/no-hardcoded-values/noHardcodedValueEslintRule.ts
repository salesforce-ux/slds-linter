import { Rule } from 'eslint';
import { createESLintReportFunction } from '../../../utils/reporting';
import { 
  handleColorDeclaration, 
  handleDensityDeclaration, 
  handleBoxShadowDeclaration, 
  handleFontShorthand 
} from './handlers/index';
import type { RuleConfig, HandlerContext } from '../../../utils/types';

/**
 * Creates the shared no-hardcoded-value rule implementation for ESLint v9
 * Following the pattern from reference PRs #233, #234, #247
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

      // Define CSS AST selectors and their handlers
      return {
        // Box shadow properties - complex shorthand requiring special parsing
        "Declaration[property='box-shadow']"(node: any) {
          handleBoxShadowDeclaration(node, handlerContext);
        },

        // Color properties - optimized CSS AST targeting
        "Declaration[property='color'], Declaration[property='background-color'], Declaration[property=/^border.*color$/], Declaration[property='outline-color'], Declaration[property='fill'], Declaration[property='stroke']"(node: any) {
          handleColorDeclaration(node, handlerContext);
        },

        // Density/sizing properties - optimized CSS AST targeting  
        "Declaration[property='font-size'], Declaration[property='font-weight'], Declaration[property=/^(margin|padding)/], Declaration[property='width'], Declaration[property='height'], Declaration[property=/^(min|max)-/], Declaration[property='top'], Declaration[property='right'], Declaration[property='bottom'], Declaration[property='left'], Declaration[property='border-width'], Declaration[property='border-radius'], Declaration[property='line-height'], Declaration[property='letter-spacing'], Declaration[property='word-spacing']"(node: any) {
          handleDensityDeclaration(node, handlerContext);
        },

        // Font shorthand - complex property requiring special parsing
        "Declaration[property='font']"(node: any) {
          handleFontShorthand(node, handlerContext);
        }
      };
    }
  };
}