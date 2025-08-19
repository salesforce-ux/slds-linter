import { Rule } from 'eslint';
import valueParser from 'postcss-value-parser';
import type { ValueToStylingHooksMapping } from '@salesforce-ux/sds-metadata';
import {
  handleBoxShadow,
  handleColorProps,
  handleDensityPropForNode,
  handleFontProps
} from '../handlers';
import { isTargetProperty } from '../../../utils/css-utils';
import { createESLintReportFunction } from '../utils/reporting';

/**
 * Creates the shared no-hardcoded-value rule implementation for ESLint v9
 * Following the pattern from reference PRs #233, #234, #247
 */
export function createNoHardcodedValueEslintRule({
  ruleId,
  ruleConfig,
  valueToStylinghook,
}: {
  ruleId: string;
  ruleConfig: any;
  valueToStylinghook: ValueToStylingHooksMapping;
}): Rule.RuleModule {
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

      // Create ESLint-specific reporting function
      const reportFn = createESLintReportFunction(context, messages);

      // Prevent SLDS1 from running if SLDS2 is enabled (matches Stylelint behavior)
      if (ruleId === 'slds/no-hardcoded-values-slds1') {
        // Check if SLDS2 rule is enabled in the same config
        const settings = context.settings as any;
        const rules = settings?.eslintConfig?.rules || {};
        if (rules['@salesforce-ux/slds/no-hardcoded-values-slds2']) {
          return {}; // Skip SLDS1 when SLDS2 is enabled
        }
      }

      return {
        Declaration(node: any) {
          const cssProperty = node.property.toLowerCase();
          const cssValue = context.sourceCode.getText(node.value);
          
          // Apply property targeting logic
          if (!isTargetProperty(cssProperty)) {
            return;
          }

          // Skip CSS variables and function calls
          if (cssValue?.trim().startsWith('var(') || 
              cssValue?.trim() === 'var' ||
              cssValue?.includes('color-mix(')) {
            return;
          }

          // Parse the CSS value for processing
          const parsedValue = valueParser(cssValue);
          const cssValueStartIndex = 0; // ESLint provides node-relative positions

          // Create declaration adapter for handlers
          const declAdapter = {
            prop: cssProperty,
            value: { 
              value: cssValue,
              range: node.value.range || [0, cssValue.length]
            },
            // Pass the actual ESLint node and context for range information
            __eslintNode: node,
            __context: context
          };



          const reportProps = {
            node: node.value, // Report on value node for precise location
          };

          // Determine property type and handle accordingly (order matters!)
          if (cssProperty === 'box-shadow') {
            handleBoxShadow(
              declAdapter,
              cssValue,
              cssValueStartIndex,
              valueToStylinghook,
              reportProps,
              messages,
              reportFn
            );
          } else if (isFontProperty(cssProperty, cssValue)) {
            // Font properties should be handled first (includes font-size, font-weight, font)
            handleFontProps(
              declAdapter,
              parsedValue,
              cssValueStartIndex,
              valueToStylinghook,
              cssProperty,
              reportProps,
              messages,
              reportFn
            );
          } else {
            // Handle color and density properties separately
            if (isColorProperty(cssProperty)) {
              handleColorProps(
                declAdapter,
                parsedValue,
                cssValueStartIndex,
                valueToStylinghook,
                cssProperty,
                reportProps,
                messages,
                reportFn
              );
            }
            
            if (isDensityProperty(cssProperty)) {
              forEachDensifyValue(parsedValue, (valueNode: any) => {
                handleDensityPropForNode(
                  declAdapter,
                  valueNode,
                  valueNode.value,
                  cssValueStartIndex,
                  valueToStylinghook,
                  cssProperty,
                  reportProps,
                  messages,
                  reportFn
                );
              });
            }
          }
        }
      };
    }
  };
}

// Helper functions for property classification
function isColorProperty(property: string): boolean {
  const colorProperties = [
    'color', 'background-color', 'border-color', 'border-top-color',
    'border-right-color', 'border-bottom-color', 'border-left-color',
    'outline-color', 'text-decoration-color', 'fill', 'stroke'
  ];
  return colorProperties.includes(property.toLowerCase());
}

function isDensityProperty(property: string): boolean {
  const densityProperties = [
    'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
    'top', 'right', 'bottom', 'left', 'border-width', 'border-radius',
    'font-size', 'line-height', 'letter-spacing', 'word-spacing'
  ];
  return densityProperties.includes(property.toLowerCase());
}

function isFontProperty(property: string, value: string): boolean {
  return property === 'font' || property === 'font-size' || property === 'font-weight';
}

function forEachDensifyValue(parsedValue: valueParser.ParsedValue, callback: (node: valueParser.Node) => void): void {
  parsedValue.walk((node) => {
    if (node.type === 'word' && isDimensionValue(node.value)) {
      callback(node);
    }
    return false;
  });
}

function isDimensionValue(value: string): boolean {
  // Check if it's a dimension value (number + unit or just number)
  const dimensionRegex = /^-?(\d+(\.\d+)?|\.\d+)(px|em|rem|%|ch|ex|vw|vh|vmin|vmax|cm|mm|in|pt|pc)?$/;
  return dimensionRegex.test(value) && !isZeroValue(value);
}

function isZeroValue(value: string): boolean {
  // Handle zero values which should be ignored
  return /^0(\.0+)?(px|em|rem|%|ch|ex|vw|vh|vmin|vmax|cm|mm|in|pt|pc)?$/.test(value);
}
