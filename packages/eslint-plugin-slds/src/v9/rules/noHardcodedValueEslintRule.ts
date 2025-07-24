import { Rule } from 'eslint';
import valueParser from 'postcss-value-parser';
import {
  colorProperties,
  densificationProperties,
  matchesCssProperty,
  forEachDensifyValue,
  isDensifyValue,
  isFontProperty,
  replacePlaceholders,
  isTargetProperty
} from 'slds-shared-utils';
import {
  handleBoxShadow,
  handleColorProps,
  handleDensityPropForNode,
  handleFontProps
} from '../../handlers';
import {
  extractCssPropertyAndValue,
  createEslintReportFnFromNode
} from '../../utils/eslint-css-utils';
import { adaptEslintDeclarationToPostcss } from '../../utils/eslint-to-stylelint-adapter';

export function createNoHardcodedValueEslintRule({
  ruleId,
  valueToStylinghook,
  warningMsg,
}: {
  ruleId: string;
  valueToStylinghook: any;
  warningMsg: string;
}): Rule.RuleModule {
  return {
    meta: {
      type: 'suggestion',
      docs: {
        description: warningMsg,
        recommended: false,
      },
      fixable: 'code',
      schema: [],
    },
    create(context) {
      return {
        Declaration(node: any) {
          if (!context.filename.match(/\.(css|scss)$/)) {
            return;
          }
          const sourceCode = context.sourceCode;
          const { cssProperty, cssValue } = extractCssPropertyAndValue(node, sourceCode);
          if (!isTargetProperty(cssProperty)) {
            return;
          }
          const parsedValue = valueParser(cssValue);
          const cssValueStartIndex = node.range ? node.range[0] : 0;
          const isColorProp = matchesCssProperty(colorProperties, cssProperty);
          const isDensiProp = matchesCssProperty(densificationProperties, cssProperty);
          const isFontProp = isFontProperty(cssProperty, cssValue);

          if (cssValue && parsedValue) {
            // Skip if the value is already a CSS variable to prevent circular fixes
            // Handle both "var(...)" and just "var" (when parsed as individual tokens)
            if (cssValue.trim().startsWith('var(') || cssValue.trim() === 'var') {
              return;
            }

            const eslintReportFn = createEslintReportFnFromNode(context, node, sourceCode);
            // Create proper message functions using replacePlaceholders like stylelint plugin
            const messages = {
              rejected: (oldValue: string, newValue: string) =>
                newValue && newValue.trim()
                  ? replacePlaceholders(warningMsg, { oldValue, newValue })
                  : `There's no replacement styling hook for the ${oldValue} static value. Remove the static value.`,
              suggested: (oldValue: string) =>
                `There's no replacement styling hook for the ${oldValue} static value. Remove the static value.`,
            };

            // The adapter is responsible for robust value range calculation
            const adaptedDecl = adaptEslintDeclarationToPostcss(node, cssValue, undefined, sourceCode);

            if (isColorProp) {
              handleColorProps(adaptedDecl, parsedValue, cssValueStartIndex, valueToStylinghook, cssProperty, {}, messages, eslintReportFn);
            } else if (isDensiProp) {
              forEachDensifyValue(parsedValue, (valueNode: any) => {
                handleDensityPropForNode(adaptedDecl, valueNode, valueNode.value, cssValueStartIndex, valueToStylinghook, cssProperty, {}, messages, eslintReportFn);
              });
            } else if (isFontProp) {
              handleFontProps(adaptedDecl, parsedValue, cssValueStartIndex, valueToStylinghook, cssProperty, {}, messages, eslintReportFn);
            } else if (cssProperty === 'box-shadow') {
              handleBoxShadow(adaptedDecl, cssValue, cssValueStartIndex, valueToStylinghook, {}, messages, eslintReportFn);
            }
          }
        }
      };
    }
  };
} 