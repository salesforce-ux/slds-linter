import { findClosestColorHook, convertToHex, isValidColor } from '../../../../utils/color-lib-utils';
import { resolvePropertyToMatch } from '../../../../utils/property-matcher';
import type { HandlerContext, DeclarationHandler } from '../../../../utils/types';

/**
 * Handle color declarations using CSS AST traversal
 * Simplified approach leveraging chroma-js validation and CSS AST raw text
 */
export const handleColorDeclaration: DeclarationHandler = (node: any, context: HandlerContext) => {
  const cssProperty = node.property.toLowerCase();
  
  // Get the raw color value from CSS AST
  const colorValue = getColorValueFromAST(node.value);
  
  if (colorValue && isValidColor(colorValue) && colorValue !== 'transparent') {
    processColorValue(colorValue, cssProperty, node, context);
  }
};

/**
 * Extract color value from CSS AST node using simple text reconstruction
 * Handles hex, named colors, rgb(), rgba(), hsl(), hsla()
 */
function getColorValueFromAST(valueNode: any): string | null {
  if (!valueNode) return null;
  
  switch (valueNode.type) {
    case 'Hash':
      return `#${valueNode.value}`;
      
    case 'Identifier':
      return valueNode.name;
      
    case 'Function':
      // Reconstruct function call from AST
      if (['rgb', 'rgba', 'hsl', 'hsla'].includes(valueNode.name)) {
        return reconstructFunctionFromAST(valueNode);
      }
      break;
      
    case 'Value':
      // Value wrapper - extract from first child
      return valueNode.children?.[0] ? getColorValueFromAST(valueNode.children[0]) : null;
  }
  
  return null;
}

/**
 * Reconstruct color function from CSS AST 
 * Simple approach: rebuild the string from AST structure
 */
function reconstructFunctionFromAST(functionNode: any): string {
  const args: string[] = [];
  
  if (!functionNode.children) {
    return `${functionNode.name}()`;
  }
  
  for (const child of functionNode.children) {
    if (child.type === 'Operator' && child.value === ',') {
      continue; // Skip commas, we'll add them back
    }
    
    if (child.type === 'Number') {
      args.push(child.value);
    } else if (child.type === 'Percentage') {
      args.push(`${child.value}%`);
    } else if (child.type === 'Value' && child.children?.[0]) {
      // Handle nested values
      if (child.children[0].type === 'Number') {
        args.push(child.children[0].value);
      } else if (child.children[0].type === 'Percentage') {
        args.push(`${child.children[0].value}%`);
      }
    }
  }
  
  return `${functionNode.name}(${args.join(', ')})`;
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

    context.reportFn({
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
    context.reportFn({
      node: declarationNode.value,
      messageId: 'noReplacement',
      data: {
        oldValue: colorValue
      }
    });
  }
}
