import { Rule } from 'eslint';
import valueParser from 'postcss-value-parser';
import { isTargetProperty } from '../../../../stylelint-plugin-slds/src/utils/shared/general';
import {
  handleBoxShadow,
  handleColorProps,
  handleDensityPropForNode,
  handleFontProps,
  GenericMessagesObj,
  GenericReportFn
} from '../../../../stylelint-plugin-slds/src/utils/shared/handlers';
import { colorProperties, densificationProperties, matchesCssProperty } from '../../../../stylelint-plugin-slds/src/utils/property-matcher';
import { forEachDensifyValue, getFullValueFromNode, isDensifyValue } from '../../../../stylelint-plugin-slds/src/utils/density-utils';
import { isFontProperty } from '../../../../stylelint-plugin-slds/src/utils/fontValueParser';
import { makeReportMatchingHooks } from '../../../../stylelint-plugin-slds/src/utils/report-utils-generic';
import { toRuleMessages } from '../../../../stylelint-plugin-slds/src/utils/rule-message-utils-generic';

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
          let cssProperty = node.property && node.property.toLowerCase();
          let cssValue = '';
          if (node.value && node.value.range) {
            cssValue = sourceCode.text.slice(node.value.range[0], node.value.range[1]);
          } else if (node.value && node.value.children && Array.isArray(node.value.children)) {
            cssValue = node.value.children.map(child => {
              if (child.type === 'Dimension' && child.value && child.unit) {
                return `${child.value}${child.unit}`;
              }
              if (child.type === 'Percentage' && child.value) {
                return `${child.value}%`;
              }
              if (child.type === 'Hash' && child.value) {
                return `#${child.value}`;
              }
              if (child.value && child.unit) {
                return `${child.value}${child.unit}`;
              }
              if (child.value) {
                return child.value;
              }
              if (child.name) {
                return child.name;
              }
              return '';
            }).join(' ');
          }
          if (!isTargetProperty(cssProperty)) {
            return;
          }
          const parsedValue = valueParser(cssValue);
          const cssValueStartIndex = node.range ? node.range[0] : 0;
          const isColorProp = matchesCssProperty(colorProperties, cssProperty);
          const isDensiProp = matchesCssProperty(densificationProperties, cssProperty);
          const isFontProp = isFontProperty(cssProperty, cssValue);

          const eslintReportFn = (reportObj: any) => {
            const { index, endIndex } = reportObj;
            context.report({
              node,
              message: typeof reportObj.message === 'string' ? reportObj.message : JSON.stringify(reportObj.message),
              loc: (typeof index === 'number' && typeof endIndex === 'number')
                ? (() => {
                    function getLocFromIndexManual(text, idx) {
                      let line = 1, col = 0, i = 0;
                      while (i < idx && i < text.length) {
                        if (text[i] === '\n') {
                          line++;
                          col = 0;
                        } else {
                          col++;
                        }
                        i++;
                      }
                      return { line, column: col + 1 };
                    }
                    const valueStartOffset = node.value?.loc?.start?.offset ?? 0;
                    const absStart = valueStartOffset + (index ?? 0);
                    const absEnd = valueStartOffset + (endIndex ?? 0);
                    const startLoc = getLocFromIndexManual(sourceCode.text, absStart);
                    const endLoc = getLocFromIndexManual(sourceCode.text, absEnd);
                    return {
                      start: startLoc,
                      end: endLoc
                    };
                  })()
                : undefined,
              fix: reportObj.fix
                ? fixer => {
                    return reportObj.fix(fixer, sourceCode) || null;
                  }
                : null,
            });
          };
          const messages = toRuleMessages(ruleId, warningMsg);
          const reportMatchingHooks = makeReportMatchingHooks(eslintReportFn);

          const adaptedDecl = {
            ...node,
            value: cssValue,
          };

          if (cssProperty === 'box-shadow') {
            handleBoxShadow(
              adaptedDecl,
              cssValue,
              cssValueStartIndex,
              valueToStylinghook,
              { node },
              messages,
              reportMatchingHooks
            );
          } else if (isFontProp) {
            handleFontProps(
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
            handleColorProps(
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
              handleDensityPropForNode(
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