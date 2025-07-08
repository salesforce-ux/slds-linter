import { Rule } from 'eslint';
import valueParser from 'postcss-value-parser';
import {
  isTargetProperty,
  colorProperties,
  densificationProperties,
  matchesCssProperty,
  forEachDensifyValue,
  getFullValueFromNode,
  isDensifyValue,
  isFontProperty,
  makeReportMatchingHooks,
  toRuleMessages,
  handleBoxShadow,
  handleColorProps,
  handleDensityPropForNode,
  handleFontProps
} from '../../shared';
import {
  extractCssPropertyAndValue,
  createEslintReportFnFromNode
} from '../utils/eslint-css-utils';
import { adaptEslintDeclarationToPostcss } from '../utils/eslint-to-stylelint-adapter';

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

          const eslintReportFn = createEslintReportFnFromNode(context, node, sourceCode);
          const messages = toRuleMessages(ruleId, warningMsg);
          const reportMatchingHooks = makeReportMatchingHooks(eslintReportFn);

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
        },
      };
    },
  };
} 