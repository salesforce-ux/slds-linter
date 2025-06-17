import { Root } from 'postcss';
import valueParser from 'postcss-value-parser';
import stylelint, { PostcssResult, RuleSeverity } from 'stylelint';
import ruleMetadata from '../../utils/rulesMetadata';
import { isTargetProperty } from '../../utils/prop-utills';
import { handleBoxShadow } from './handlers/boxShadowHandler';
import { handleColorProps } from './handlers/colorHandler';
import { handleDensityProps } from './handlers/densityHandler';
import { MessagesObj } from '../../utils/report-utils';
import { toRuleMessages } from '../../utils/rule-message-utils';
import { colorProperties, densificationProperties, matchesCssProperty } from '../../utils/property-matcher';
import type { ValueToStylingHooksMapping } from '@salesforce-ux/sds-metadata';

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
          handleDensityProps(
            decl,
            parsedValue,
            cssValueStartIndex,
            supportedStylinghooks,
            cssProperty,
            reportProps,
            messages
          );
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
