import { findClosestColorHook, convertToHex, isValidColor } from '../../../../utils/color-lib-utils';
import { resolvePropertyToMatch } from '../../../../utils/property-matcher';
import type { HandlerContext, DeclarationHandler } from '../../../../types';

// Import @eslint/css-tree for ESLint-compatible CSS value parsing
import { parse, walk, generate } from '@eslint/css-tree';

// Import CSS function utilities for consistent function detection
import { isCssFunction, isCssColorFunction } from '../../../../utils/css-functions';

/**
 * Handle color declarations using CSS tree parsing
 * Supports shorthand properties like background, border, etc.  
 * Uses css-tree for reliable AST-based parsing + chroma-js validation
 */
export const handleColorDeclaration: DeclarationHandler = (node: any, context: HandlerContext) => {
  const cssProperty = node.property.toLowerCase();
  
  // Get the raw CSS value as string and parse with css-tree
  const valueText = context.sourceCode.getText(node.value);
  const colorValues = extractColorsFromCSSValue(valueText);
  
  // Process each color found
  colorValues.forEach(colorValue => {
    if (colorValue !== 'transparent') {
      processColorValue(colorValue, cssProperty, node, context);
    }
  });
};

/**
 * Extract color values from CSS using optimized css-tree traversal
 * Uses this.skip to efficiently prevent traversing skip function children
 */
function extractColorsFromCSSValue(valueText: string): string[] {
  if (!valueText || typeof valueText !== 'string') {
    return [];
  }

  const colors: string[] = [];

  try {
    const ast = parse(valueText, { context: 'value' });
    
    walk(ast, {
      enter(node: any) {
        // Skip CSS functions and their children efficiently using this.skip
        if (node.type === 'Function' && isCssFunction(node.name)) {
          return this.skip;
        }
        
        let colorValue: string | null = null;
        
        switch (node.type) {
          case 'Hash':
            colorValue = `#${node.value}`;
            break;
          case 'Identifier':
            colorValue = node.name;
            break;
          case 'Function':
            // Only process color functions using utility
            if (isCssColorFunction(node.name)) {
              colorValue = generate(node);
            }
            break;
        }
        
        if (colorValue && isValidColor(colorValue)) {
          colors.push(colorValue);
        }
      }
    });
  } catch (error) {
    return [];
  }

  return colors;
}



/**
 * Process validated color value and report issues
 */
function processColorValue(
  colorValue: string, 
  cssProperty: string, 
  declarationNode: any, 
  context: HandlerContext
) {
  const hexValue = convertToHex(colorValue);
  if (!hexValue) {
    return;
  }

  const propToMatch = resolvePropertyToMatch(cssProperty);
  const closestHooks = findClosestColorHook(hexValue, context.valueToStylinghook, propToMatch);

  if (closestHooks.length > 0) {
    // Create ESLint fix for single suggestions only
    const fix = closestHooks.length === 1 ? (fixer: any) => {
      return fixer.replaceText(declarationNode.value, `var(${closestHooks[0]}, ${colorValue})`);
    } : undefined;

    context.context.report({
      node: declarationNode.value,
      messageId: 'hardcodedValue',
      data: {
        oldValue: colorValue,
        newValue: closestHooks.join(', ')
      },
      fix
    });
  } else {
    // No suggestions available
    context.context.report({
      node: declarationNode.value,
      messageId: 'noReplacement',
      data: {
        oldValue: colorValue
      }
    });
  }
}
