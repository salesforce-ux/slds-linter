import { Rule } from 'eslint';
import type { ValueToStylingHooksMapping } from '@salesforce-ux/sds-metadata';
import { isTargetProperty } from '../../../utils/css-utils';
import { createESLintReportFunction } from '../../../utils/reporting';
import { findClosestColorHook, convertToHex } from '../../../utils/color-lib-utils';
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
       * Handle color declarations using pure CSS AST traversal
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

        // Traverse CSS AST value nodes directly
        traverseValueNodes(node.value, (valueNode) => {
          if (isColorValueNode(valueNode)) {
            handleSingleColorValue(valueNode, cssProperty, node);
          }
        });
      }

      /**
       * Handle a single color value using CSS AST
       */
      function handleSingleColorValue(valueNode: any, cssProperty: string, declarationNode: any) {
        const colorValue = getColorValueFromNode(valueNode);
        
        // Skip transparent and invalid colors
        if (!colorValue || colorValue === 'transparent') {
          return;
        }

        const hexValue = convertToHex(colorValue);
        if (!hexValue) {
          return;
        }

        const propToMatch = resolvePropertyToMatch(cssProperty);
        const closestHooks = findClosestColorHook(hexValue, valueToStylinghook, propToMatch);

        if (closestHooks.length > 0) {
          // Create ESLint fix for single suggestions only
          const fix = closestHooks.length === 1 ? (fixer: any) => {
            return fixer.replaceText(valueNode, `var(${closestHooks[0]}, ${colorValue})`);
          } : null;

          const message = messages.hardcodedValue
            .replace('{{oldValue}}', colorValue)
            .replace('{{newValue}}', closestHooks.join(', '));

          reportFn({
            node: valueNode,
            message,
            fix
          });
        } else {
          // No suggestions available
          const message = messages.noReplacement.replace('{{oldValue}}', colorValue);
          reportFn({
            node: valueNode,
            message
          });
        }
      }

      /**
       * Handle density/sizing declarations using pure CSS AST traversal
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

        // Traverse CSS AST value nodes directly
        traverseValueNodes(node.value, (valueNode) => {
          if (isDimensionValueNode(valueNode)) {
            handleSingleDimensionValue(valueNode, cssProperty, node);
          }
        });
      }

      /**
       * Handle a single dimension value using CSS AST
       */
      function handleSingleDimensionValue(valueNode: any, cssProperty: string, declarationNode: any) {
        const dimensionValue = getDimensionValueFromNode(valueNode);
        
        if (!dimensionValue || !isDimensionValue(dimensionValue)) {
          return;
        }

        const propToMatch = resolvePropertyToMatch(cssProperty);
        const closestHooks = getStylingHooksForDensityValue(dimensionValue, valueToStylinghook, propToMatch);

        if (closestHooks.length > 0) {
          // Create ESLint fix for single suggestions only
          const fix = closestHooks.length === 1 ? (fixer: any) => {
            return fixer.replaceText(valueNode, `var(${closestHooks[0]}, ${dimensionValue})`);
          } : null;

          const message = messages.hardcodedValue
            .replace('{{oldValue}}', dimensionValue)
            .replace('{{newValue}}', closestHooks.join(', '));

          reportFn({
            node: valueNode,
            message,
            fix
          });
        } else {
          // No suggestions available
          const message = messages.noReplacement.replace('{{oldValue}}', dimensionValue);
          reportFn({
            node: valueNode,
            message
          });
        }
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
       * Pure CSS AST helper functions
       */
      
      /**
       * Traverse CSS AST value nodes recursively
       */
      function traverseValueNodes(valueNode: any, callback: (node: any) => void) {
        if (!valueNode) return;
        
        // Call callback for current node
        callback(valueNode);
        
        // Recursively traverse children if they exist
        if (valueNode.children && Array.isArray(valueNode.children)) {
          for (const child of valueNode.children) {
            traverseValueNodes(child, callback);
          }
        }
      }

      /**
       * Check if a CSS AST node represents a color value
       */
      function isColorValueNode(node: any): boolean {
        if (!node) return false;
        
        // Check for hex colors (Hash type in CSS AST)
        if (node.type === 'Hash') {
          return true;
        }
        
        // Check for named colors (identifiers that are valid colors)
        if (node.type === 'Identifier') {
          const colorName = node.name;
          // Basic named color check - could be expanded
          const namedColors = ['red', 'green', 'blue', 'black', 'white', 'gray', 'orange', 'yellow', 'purple', 'pink', 'brown'];
          return namedColors.includes(colorName?.toLowerCase());
        }
        
        return false;
      }

      /**
       * Check if a CSS AST node represents a dimension value
       */
      function isDimensionValueNode(node: any): boolean {
        if (!node) return false;
        
        // Check for dimension nodes (e.g., 16px, 1rem, 100%)
        if (node.type === 'Dimension') {
          return true;
        }
        
        // Check for identifier nodes that might be font-weight values
        if (node.type === 'Identifier') {
          const fontWeights = ['normal', 'bold', 'bolder', 'lighter', '100', '200', '300', '400', '500', '600', '700', '800', '900'];
          return fontWeights.includes(node.name);
        }
        
        return false;
      }

      /**
       * Extract color value from a CSS AST node
       */
      function getColorValueFromNode(node: any): string | null {
        if (!node) return null;
        
        if (node.type === 'Hash') {
          return '#' + node.value; // e.g., "#ff0000" (add # prefix)
        }
        
        if (node.type === 'Identifier') {
          return node.name; // e.g., "red"
        }
        
        return null;
      }

      /**
       * Extract dimension value from a CSS AST node
       */
      function getDimensionValueFromNode(node: any): string | null {
        if (!node) return null;
        
        if (node.type === 'Dimension') {
          return node.value + (node.unit || ''); // e.g., "16px", "1rem"
        }
        
        if (node.type === 'Identifier') {
          return node.name; // e.g., "bold", "normal"
        }
        
        return null;
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


