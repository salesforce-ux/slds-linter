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
 * Extract all color values from a CSS value using css-tree's AST parsing
 * Optimized to use existing @eslint/css-tree package from dependencies
 * Efficiently skips ignored function nodes during traversal
 */
function extractColorsFromCSSValue(valueText: string): string[] {
  if (!valueText || typeof valueText !== 'string') {
    return [];
  }

  const colors: string[] = [];
  const skippedNodes = new Set();

  try {
    // Parse the CSS value using css-tree with value context
    const ast = parse(valueText, { context: 'value' });
    
    // First pass: identify nodes inside ignored functions
    walk(ast, (node: any, item: any, list: any) => {
      if (node.type === 'Function' && ['var', 'calc', 'color-mix'].includes(node.name)) {
        // Mark this function and all its children for skipping
        walk(node, (childNode: any) => {
          skippedNodes.add(childNode);
        });
      }
    });
    
    // Second pass: extract colors from non-skipped nodes
    walk(ast, (node: any) => {
      if (!skippedNodes.has(node)) {
        let colorValue: string | null = null;
        
        // Inline color extraction logic using css-tree node types
        switch (node.type) {
          case 'Hash':
            colorValue = `#${node.value}`;
            break;
          case 'Identifier':
            colorValue = node.name;
            break;
          case 'Function':
            // Handle color functions: rgb(), rgba(), hsl(), hsla()
            if (['rgb', 'rgba', 'hsl', 'hsla'].includes(node.name)) {
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
    // If parsing fails, return empty array (malformed CSS)
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
