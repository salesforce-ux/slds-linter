import { Rule } from 'eslint';
import valueParser from 'postcss-value-parser';
import metadata from '@salesforce-ux/sds-metadata';
import { isTargetProperty } from '../../../../stylelint-plugin-slds/src/utils/prop-utills';
import { handleBoxShadow } from '../../../../stylelint-plugin-slds/src/rules/no-hardcoded-value/handlers/boxShadowHandler';
import { handleColorProps } from '../../../../stylelint-plugin-slds/src/rules/no-hardcoded-value/handlers/colorHandler';
import { handleDensityPropForNode } from '../../../../stylelint-plugin-slds/src/rules/no-hardcoded-value/handlers/densityHandler';
import { colorProperties, densificationProperties, matchesCssProperty } from '../../../../stylelint-plugin-slds/src/utils/property-matcher';
import { handleFontProps } from '../../../../stylelint-plugin-slds/src/rules/no-hardcoded-value/handlers/fontHandler';
import { forEachDensifyValue, getFullValueFromNode, isDensifyValue } from '../../../../stylelint-plugin-slds/src/utils/density-utils';
import { isFontProperty } from '../../../../stylelint-plugin-slds/src/utils/fontValueParser';
import { makeReportMatchingHooks } from '../../../../stylelint-plugin-slds/src/utils/report-utils';
import type { DeclarationPlain } from '@eslint/css-tree';
import { toRuleMessages } from '../../../../stylelint-plugin-slds/src/utils/rule-message-utils';
import rulesMetadata from '../../../../stylelint-plugin-slds/src/utils/rules';

const valueToStylinghookSlds = metadata.valueToStylingHooksSlds;

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow hardcoded static values in favor of SLDS 1 styling hooks',
      recommended: false,
    },
    fixable: 'code',
    schema: [],
  },
  create(context) {
    return {
      Declaration(node: any) {
        // Only run on CSS/SCSS files
        if (!context.filename.match(/\.(css|scss)$/)) {
          return;
        }

        // Adapter: Convert ESLint node to PostCSS-like shape
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

        // ESLint-compatible report function with autofix support
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
        const reportMatchingHooks = makeReportMatchingHooks(eslintReportFn);

        // Adapter: PostCSS-like decl for handler
        const adaptedDecl = {
          ...node,
          value: cssValue,
          // Add any other properties your handler expects
        };

        // Handlers need to be adapted to use ESLint's report
        const ruleId = 'slds/no-hardcoded-values-slds1';
        const ruleMeta = rulesMetadata[ruleId];
        const messages = toRuleMessages(ruleId, ruleMeta.warningMsg);
        if (cssProperty === 'box-shadow') {
          handleBoxShadow(
            adaptedDecl,
            cssValue,
            cssValueStartIndex,
            valueToStylinghookSlds,
            { node },
            messages,
            reportMatchingHooks
          );
        } else if (isFontProp) {
          handleFontProps(
            adaptedDecl,
            parsedValue,
            cssValueStartIndex,
            valueToStylinghookSlds,
            cssProperty,
            { node },
            messages,
            reportMatchingHooks
          );
        } else if (isColorProp) {
          // Use the ESLint-compatible reportMatchingHooks
          handleColorProps(
            adaptedDecl,
            parsedValue,
            cssValueStartIndex,
            valueToStylinghookSlds,
            cssProperty,
            { node },
            messages,
            reportMatchingHooks
          );
        } else if (isDensiProp) {
          forEachDensifyValue(parsedValue, (n) => {
            // Skip reporting for 0 values (match stylelint behavior)
            if (!isDensifyValue(n, true)) return;
            // Extract the value substring from the original property value using sourceIndex and sourceEndIndex
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
              valueToStylinghookSlds,
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

export default rule; 