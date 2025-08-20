import { Rule } from 'eslint';
import valueParser from 'postcss-value-parser';
import type { ValueToStylingHooksMapping } from '@salesforce-ux/sds-metadata';
import { isTargetProperty } from '../../../utils/css-utils';
import { createESLintReportFunction } from '../../../utils/reporting';
import { findClosestColorHook, convertToHex } from '../../../utils/color-lib-utils';
import { forEachColorValue } from '../../../utils/color-utils';
import { getStylingHooksForDensityValue } from '../../../utils/styling-hook-utils';
import { resolvePropertyToMatch } from '../../../utils/property-matcher';
import { parseBoxShadowValue, isBoxShadowMatch } from '../../../utils/boxShadowValueParser';

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
        // CSS AST-optimized approach: Use targeted Declaration selectors for efficiency
        // This reduces the scope compared to a general Declaration visitor
        
        // Box shadow properties - complex shorthand requiring special parsing
        "Declaration[property='box-shadow']"(node: any) {
          handleBoxShadowValue(node);
        },

        // Color properties - optimized CSS AST targeting
        "Declaration[property='color'], Declaration[property='background-color'], Declaration[property=/^border.*color$/], Declaration[property='outline-color'], Declaration[property='fill'], Declaration[property='stroke']"(node: any) {
          handleColorDeclaration(node);
        },

        // Density/sizing properties - optimized CSS AST targeting  
        "Declaration[property='font-size'], Declaration[property='font-weight'], Declaration[property=/^(margin|padding)/], Declaration[property='width'], Declaration[property='height'], Declaration[property=/^(min|max)-/], Declaration[property='top'], Declaration[property='right'], Declaration[property='bottom'], Declaration[property='left'], Declaration[property='border-width'], Declaration[property='border-radius'], Declaration[property='line-height'], Declaration[property='letter-spacing'], Declaration[property='word-spacing']"(node: any) {
          handleDensityDeclaration(node);
        },

        // Font shorthand - complex property requiring special parsing
        "Declaration[property='font']"(node: any) {
          handleFontShorthand(node);
        }
      };



      /**
       * Get declaration property from a value node by traversing up to the declaration
       */
      function getDeclarationProperty(valueNode: any): string {
        let parent = valueNode.parent;
        while (parent && parent.type !== 'Declaration') {
          parent = parent.parent;
        }
        return parent ? parent.property.toLowerCase() : '';
      }

      /**
       * Handle color declarations - simplified using postcss but optimized with CSS AST targeting
       */
      function handleColorDeclaration(node: any) {
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

        // Parse the CSS value using postcss-value-parser
        const parsedValue = valueParser(cssValue);
        
        // Use existing color detection logic
        forEachColorValue(parsedValue, (valueNode) => {
          const hexValue = convertToHex(valueNode.value);
          
          // Skip transparent and invalid colors
          if (valueNode.value === 'transparent' || !hexValue) {
            return;
          }

          const propToMatch = resolvePropertyToMatch(cssProperty);
          const closestHooks = findClosestColorHook(hexValue, valueToStylinghook, propToMatch);

          if (closestHooks.length > 0) {
            // Create ESLint fix for single suggestions only
            const fix = closestHooks.length === 1 ? (fixer: any) => {
              return replaceColorValueInDeclaration(fixer, node, valueNode, closestHooks[0]);
            } : null;

            const message = messages.hardcodedValue
              .replace('{{oldValue}}', valueNode.value)
              .replace('{{newValue}}', closestHooks.join(', '));

            reportFn({
              node: node.value,
              message,
              fix
            });
          } else {
            // No suggestions available
            const message = messages.noReplacement.replace('{{oldValue}}', valueNode.value);
            reportFn({
              node: node.value,
              message
            });
          }
        });
      }

      /**
       * Handle density/sizing declarations - simplified using postcss but optimized with CSS AST targeting
       */
      function handleDensityDeclaration(node: any) {
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

        // Parse the CSS value using postcss-value-parser
        const parsedValue = valueParser(cssValue);
        
        // Process density values
        parsedValue.walk((valueNode) => {
          if (valueNode.type === 'word' && isDimensionValue(valueNode.value)) {
            const propToMatch = resolvePropertyToMatch(cssProperty);
            const closestHooks = getStylingHooksForDensityValue(valueNode.value, valueToStylinghook, propToMatch);

            if (closestHooks.length > 0) {
              // Create ESLint fix for single suggestions only
              const fix = closestHooks.length === 1 ? (fixer: any) => {
                return replaceDensityValueInDeclaration(fixer, node, valueNode, closestHooks[0]);
              } : null;

              const message = messages.hardcodedValue
                .replace('{{oldValue}}', valueNode.value)
                .replace('{{newValue}}', closestHooks.join(', '));

              reportFn({
                node: node.value,
                message,
                fix
              });
            } else {
              // No suggestions available
              const message = messages.noReplacement.replace('{{oldValue}}', valueNode.value);
              reportFn({
                node: node.value,
                message
              });
            }
          }
          return false;
        });
      }

      /**
       * Handle box-shadow values - keep complex parsing but simplify
       */
      function handleBoxShadowValue(node: any) {
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

        // Use existing box shadow parsing logic
        const shadowHooks = getShadowValueToHookEntries(valueToStylinghook);
        const parsedCssValue = parseBoxShadowValue(cssValue);
        
        if (!parsedCssValue || parsedCssValue.length === 0) {
          return;
        }

        // Filter out empty shadow objects
        const validShadows = parsedCssValue.filter((shadow) => Object.entries(shadow).length > 0);
        if (validShadows.length === 0) {
          return;
        }

        // Find matching hook
        for (const [shadowValue, hookNames] of shadowHooks) {
          const parsedHookValue = parseBoxShadowValue(shadowValue);
          if (parsedHookValue && isBoxShadowMatch(validShadows, parsedHookValue)) {
            if (hookNames.length > 0) {
              const suggestions = hookNames;
              
              // ESLint fix function
              const fix = suggestions.length === 1 ? (fixer: any) => {
                return fixer.replaceText(node.value, `var(${suggestions[0]}, ${cssValue})`);
              } : null;

              const message = suggestions.length > 0 
                ? messages.hardcodedValue
                    .replace('{{oldValue}}', cssValue)
                    .replace('{{newValue}}', suggestions.join(', '))
                : messages.noReplacement.replace('{{oldValue}}', cssValue);

              reportFn({
                node: node.value,
                message,
                fix
              });
            }
            return;
          }
        }
      }

      /**
       * Handle font shorthand - simplified font parsing
       */
      function handleFontShorthand(node: any) {
        // For now, skip font shorthand as it's complex
        // Individual font-size and font-weight are handled by CSS AST selectors above
        return;
      }





            /**
       * Helper functions
       */
      function isDimensionValue(value: string): boolean {
        // Check if it's a dimension value (number + unit or just number)
        const dimensionRegex = /^-?(\d+(\.\d+)?|\.\d+)(px|em|rem|%|ch|ex|vw|vh|vmin|vmax|cm|mm|in|pt|pc)?$/;
        return dimensionRegex.test(value) && !isZeroValue(value);
      }

      function isZeroValue(value: string): boolean {
        // Handle zero values which should be ignored
        return /^0(\.0+)?(px|em|rem|%|ch|ex|vw|vh|vmin|vmax|cm|mm|in|pt|pc)?$/.test(value);
      }

      /**
       * ESLint fix functions with proper range calculation
       */
      function replaceColorValueInDeclaration(fixer: any, declNode: any, valueNode: any, hookName: string) {
        // Calculate the proper range for the color value within the declaration
        return replaceValueInDeclaration(fixer, declNode, valueNode, hookName);
      }

      function replaceDensityValueInDeclaration(fixer: any, declNode: any, valueNode: any, hookName: string) {
        // Calculate the proper range for the dimension value within the declaration
        return replaceValueInDeclaration(fixer, declNode, valueNode, hookName);
      }

      /**
       * Generic function to replace a value within a CSS declaration using postcss-value-parser positioning
       */
      function replaceValueInDeclaration(fixer: any, declNode: any, valueNode: any, hookName: string) {
        // Get the full CSS declaration value text
        const fullValueText = context.sourceCode.getText(declNode.value);
        const declValueRange = declNode.value.range;
        
        if (!declValueRange) {
          // If no range available, fall back to replacing the entire value
          return fixer.replaceText(declNode.value, `var(${hookName}, ${fullValueText})`);
        }

        // Use postcss-value-parser source indices to find the exact position
        const startOffset = valueNode.sourceIndex || 0;
        const endOffset = (valueNode.sourceEndIndex !== undefined) 
          ? valueNode.sourceEndIndex 
          : startOffset + valueNode.value.length;

        // Calculate absolute positions within the source code
        const absoluteStart = declValueRange[0] + startOffset;
        const absoluteEnd = declValueRange[0] + endOffset;

        // Validate the range is within bounds
        if (absoluteStart >= declValueRange[0] && absoluteEnd <= declValueRange[1]) {
          return fixer.replaceTextRange(
            [absoluteStart, absoluteEnd],
            `var(${hookName}, ${valueNode.value})`
          );
        } else {
          // Fallback: replace the entire declaration value if range calculation fails
          return fixer.replaceText(declNode.value, `var(${hookName}, ${fullValueText})`);
        }
      }

      /**
       * Extract shadow values and their corresponding hooks from the styling hooks mapping
       */
      function getShadowValueToHookEntries(supportedStylinghooks: ValueToStylingHooksMapping): Array<[string, string[]]> {
        return Object.entries(supportedStylinghooks)
          .filter(([_, value]) => value.some((hook) => hook.properties.includes('box-shadow')))
          .map(([key, value]) => [key, value.map((hook) => hook.name)]);
      }


    }
  };
}


