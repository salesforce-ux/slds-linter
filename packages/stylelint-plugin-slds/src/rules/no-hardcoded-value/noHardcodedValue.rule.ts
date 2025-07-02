import { Root } from 'postcss';
import valueParser from 'postcss-value-parser';
import stylelint, { PostcssResult, RuleSeverity } from 'stylelint';
import ruleMetadata from '../../utils/rulesMetadata';
import { isTargetProperty } from '../../utils/prop-utills';
import { handleBoxShadow } from './handlers/boxShadowHandler';
import { handleColorProps } from './handlers/colorHandler';
import { handleDensityPropForNode } from './handlers/densityHandler';
import { toRuleMessages } from '../../utils/rule-message-utils';
import { colorProperties, densificationProperties, matchesCssProperty } from '../../utils/property-matcher';
import type { ValueToStylingHooksMapping } from '@salesforce-ux/sds-metadata';
import { handleFontProps } from './handlers/fontHandler';
import { forEachDensifyValue } from '../../utils/density-utils';
import { isFontProperty } from '../../utils/fontValueParser';
import { forEachVarFunction } from '../../utils/decl-utils';

const { createPlugin } = stylelint;

export const createNoHardcodedValueRule = (
  ruleName: string,
  supportedStylinghooks: ValueToStylingHooksMapping
) => {
  const {
    severityLevel = 'error',
    warningMsg = '',
    errorMsg = '',
    ruleDesc = 'No description provided',
  } = ruleMetadata(ruleName) || {};

  const messages = toRuleMessages(ruleName, warningMsg);

  const ruleFunction: Partial<stylelint.Rule> = (
    primaryOptions: boolean,
    { severity = severityLevel as RuleSeverity, propertyTargets = [] } = {}
  ) => {
    return (root: Root, result: PostcssResult) => {
      root.walkDecls((decl) => {
        if (!isTargetProperty(decl.prop, propertyTargets)) {
          return;
        }

        const cssProperty = decl.prop.toLowerCase();
        const cssValue = decl.value;
        const parsedValue = valueParser(cssValue);
        const cssValueStartIndex = decl.toString().indexOf(cssValue);
        const isColorProp = matchesCssProperty(colorProperties, cssProperty);
        const isDensiProp = matchesCssProperty(densificationProperties, cssProperty);
        const isFontProp = isFontProperty(cssProperty, cssValue);

        const reportProps: Partial<stylelint.Problem> = {
          node: decl,
          result,
          ruleName,
          severity,
        };

        if (cssProperty === 'box-shadow') {
          handleBoxShadow(
            decl,
            cssValue,
            cssValueStartIndex,
            supportedStylinghooks,
            reportProps,
            messages
          );
        } else if(isFontProp){
          handleFontProps(
            decl,
            parsedValue,
            cssValueStartIndex,
            supportedStylinghooks,
            cssProperty,
            reportProps,
            messages
          );
        } else if (isColorProp) {
          handleColorProps(
            decl,
            parsedValue,
            cssValueStartIndex,
            supportedStylinghooks,
            cssProperty,
            reportProps,
            messages
          );
        } else if (isDensiProp) {
          // Collect fallback nodes from var() functions
          const fallbackNodes = new Set();
          forEachVarFunction(decl, (varNode) => {
            // All nodes after the first (token) are fallback(s)
            const fnNode = varNode as valueParser.FunctionNode;
            fnNode.nodes.slice(1).forEach(fallback => {
              // Only add if it's a number or unit, not a keyword like 'solid'
              const parsed = valueParser.unit(fallback.value);
              if (parsed || /^\d+(\.\d+)?$/.test(fallback.value)) {
                fallbackNodes.add(fallback.value);
              }
            });
          });
          forEachDensifyValue(parsedValue, (node) => {
            // Skip reporting if node is a fallback in var()
            if (fallbackNodes.has(node.value)) return;
            // Only report if node is numeric/unit
            const parsed = valueParser.unit(node.value);
            if (!(parsed || /^\d+(\.\d+)?$/.test(node.value))) return;
            handleDensityPropForNode(decl, node, node.value, cssValueStartIndex, supportedStylinghooks, cssProperty, reportProps, messages);
          });
        }
      });
    };
  };

  ruleFunction.ruleName = ruleName;
  ruleFunction.messages = <any>messages;
  ruleFunction.meta = {
    url: '',
    fixable: true,
  };

  return createPlugin(ruleName, <stylelint.Rule>ruleFunction);
};
