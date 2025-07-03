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
} from '../../../../stylelint-plugin-slds/src/shared';
import {
  handleBoxShadowEslintV9,
  handleColorPropsEslintV9,
  handleDensityPropForNodeEslintV9,
  handleFontPropsEslintV9,
} from '../../../../stylelint-plugin-slds/src/utils/shared/handlers';
import {
  extractCssPropertyAndValue,
  createEslintReportFnFromNode,
} from '../utils/eslint-css-utils';

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

          const adaptedDecl = {
            ...node,
            value: cssValue,
          };

          if (cssProperty === 'box-shadow') {
            handleBoxShadowEslintV9(
              adaptedDecl,
              cssValue,
              cssValueStartIndex,
              valueToStylinghook,
              { node },
              messages,
              reportMatchingHooks
            );
          } else if (isFontProp) {
            handleFontPropsEslintV9(
              adaptedDecl,
              parsedValue,
              cssValueStartIndex,
              valueToStylinghook,
              cssProperty,
              { node },
              messages,
              reportMatchingHooks
            );
          } else if (isColorProp) {
            handleColorPropsEslintV9(
              adaptedDecl,
              parsedValue,
              cssValueStartIndex,
              valueToStylinghook,
              cssProperty,
              { node },
              messages,
              reportMatchingHooks
            );
          } else if (isDensiProp) {
            forEachDensifyValue(parsedValue, (n) => {
              if (!isDensifyValue(n, true)) return;
              let valueWithUnit = '';
              if (typeof n.sourceIndex === 'number' && typeof n.sourceEndIndex === 'number') {
                valueWithUnit = cssValue.slice(n.sourceIndex, n.sourceEndIndex);
              } else {
                valueWithUnit = getFullValueFromNode(n);
              }
              handleDensityPropForNodeEslintV9(
                adaptedDecl,
                n,
                valueWithUnit,
                cssValueStartIndex,
                valueToStylinghook,
                cssProperty,
                { node },
                messages,
                reportMatchingHooks,
                true
              );
            });
          }
        },
      };
    },
  };
} 