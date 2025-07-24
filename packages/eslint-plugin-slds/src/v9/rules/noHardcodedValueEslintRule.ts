import { Rule } from 'eslint';
import valueParser from 'postcss-value-parser';
import {
  colorProperties,
  densificationProperties,
  matchesCssProperty,
  forEachDensifyValue,
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
import { createSimpleAdapter } from '../../utils/eslint-adapters';

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
      messages: {
        hardcodedValue: warningMsg,
        noReplacement: "There's no replacement styling hook for the {{value}} static value. Remove the static value."
      }
    },
    create(context) {
      // Skip non-CSS files
      if (!context.filename?.match(/\.(css|scss)$/)) {
        return {};
      }

      // Create message functions
      const messages = {
        rejected: (oldValue: string, newValue: string) =>
          newValue && newValue.trim()
            ? replacePlaceholders(warningMsg, { oldValue, newValue })
            : `There's no replacement styling hook for the ${oldValue} static value. Remove the static value.`,
        suggested: (oldValue: string) =>
          `There's no replacement styling hook for the ${oldValue} static value. Remove the static value.`,
      };

            return {
        Declaration(node: any) {
          const { declAdapter, reportFn, cssProperty, cssValue } = createSimpleAdapter(node, context);
          
          if (!isTargetProperty(cssProperty)) {
            return;
          }
          
          // Skip CSS variables  
          if (cssValue?.trim().startsWith('var(') || cssValue?.trim() === 'var') {
            return;
          }
          
          const parsedValue = valueParser(cssValue);
          const isColorProp = matchesCssProperty(colorProperties, cssProperty);
          const isDensiProp = matchesCssProperty(densificationProperties, cssProperty);
          const isFontProp = isFontProperty(cssProperty, cssValue);

          if (cssValue && parsedValue) {
            if (isColorProp) {
              handleColorProps(declAdapter, parsedValue, 0, valueToStylinghook, cssProperty, {}, messages, reportFn);
            } else if (isDensiProp) {
              forEachDensifyValue(parsedValue, (valueNode: any) => {
                handleDensityPropForNode(declAdapter, valueNode, valueNode.value, 0, valueToStylinghook, cssProperty, {}, messages, reportFn);
              });
            } else if (isFontProp) {
              handleFontProps(declAdapter, parsedValue, 0, valueToStylinghook, cssProperty, {}, messages, reportFn);
            } else if (cssProperty === 'box-shadow') {
              handleBoxShadow(declAdapter, cssValue, 0, valueToStylinghook, {}, messages, reportFn);
            }
          }
        }
      };
    }
  };
} 