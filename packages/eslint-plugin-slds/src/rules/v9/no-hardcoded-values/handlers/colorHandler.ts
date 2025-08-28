import { findClosestColorHook, convertToHex, isValidColor } from '../../../../utils/color-lib-utils';
import { resolvePropertyToMatch } from '../../../../utils/property-matcher';
import type { HandlerContext, DeclarationHandler } from '../../../../types';

// Import @eslint/css-tree for ESLint-compatible CSS value parsing
import { parse, walk, generate } from '@eslint/css-tree';

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
    if (colorValue && isValidColor(colorValue) && colorValue !== 'transparent') {
      processColorValue(colorValue, cssProperty, node, context);
    }
  });
};

/**
 * Extract all color values from a CSS value using css-tree parsing
 * Uses css-tree for reliable AST-based color detection in shorthand properties
 * More accurate than regex patterns for complex CSS values
 */
function extractColorsFromCSSValue(valueText: string): string[] {
  if (!valueText || typeof valueText !== 'string') {
    return [];
  }

  // Quick check for values that should be skipped entirely
  if (valueText.includes('var(') || valueText.includes('calc(') || valueText.includes('color-mix(')) {
    return [];
  }

  const colors: string[] = [];

  // Parse the CSS value using css-tree with value context
  const ast = parse(valueText, { context: 'value' });
  
  // Walk the AST to find color values using css-tree's built-in walk
  walk(ast, (node: any) => {
    const colorValue = extractColorFromCSSNode(node);
    if (colorValue && isValidColor(colorValue)) {
      colors.push(colorValue);
    }
  });

  return colors;
}



/**
 * Extract color value from a CSS AST node
 */
function extractColorFromCSSNode(node: any): string | null {
  if (!node || !node.type) return null;

  switch (node.type) {
    case 'Hash':
      return `#${node.value}`;
      
    case 'Identifier':
      // Check if it's a named color (validated later with chroma-js)
      return node.name;
      
    case 'Function':
      // Handle color functions: rgb(), rgba(), hsl(), hsla()
      if (['rgb', 'rgba', 'hsl', 'hsla'].includes(node.name)) {
        return generate(node);
      }
      break;
  }
  
  return null;
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
