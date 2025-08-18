/**
 * Utility functions for working with CSS variables and var() functions in ESLint rules
 */

/**
 * Check if a node is a var() function
 */
export function isVarFunction(node: any): boolean {
  return node && node.type === 'Function' && node.name === 'var';
}

/**
 * Check if a var() function has a fallback value
 */
export function hasFallback(varFunctionNode: any): boolean {
  if (!isVarFunction(varFunctionNode)) return false;
  
  const children = varFunctionNode.children;
  if (!children) return false;
  
  // Look for comma operator which indicates a fallback
  return children.some((child: any) => child.type === 'Operator' && child.value === ',');
}

/**
 * Get the primary value (first parameter) from a var() function
 */
export function getVarPrimaryValue(varFunctionNode: any): string | null {
  if (!isVarFunction(varFunctionNode)) return null;
  
  const children = varFunctionNode.children;
  if (!children || children.length === 0) return null;
  
  // Find the first Identifier node which contains the CSS variable name
  for (const child of children) {
    if (child.type === 'Identifier') {
      return child.name;
    }
  }
  
  return null;
}

/**
 * Get the fallback value from a var() function node
 */
export function getFallbackValue(varFunctionNode: any): string | null {
  if (!hasFallback(varFunctionNode)) return null;
  
  const children = varFunctionNode.children;
  if (!children) return null;
  
  // Find comma operator and the Raw node after it
  let foundComma = false;
  let fallbackRawNode = null;
  
  for (const child of children) {
    if (child.type === 'Operator' && child.value === ',') {
      foundComma = true;
      continue;
    }
    if (foundComma && child.type === 'Raw') {
      fallbackRawNode = child;
      break;
    }
  }
  
  return fallbackRawNode ? fallbackRawNode.value.trim() : null;
}

/**
 * Parse var() function children to extract all relevant information
 */
export function parseVarFunction(varFunctionNode: any): {
  primaryValue: string | null;
  fallbackValue: string | null;
  hasFallback: boolean;
} {
  if (!isVarFunction(varFunctionNode)) {
    return {
      primaryValue: null,
      fallbackValue: null,
      hasFallback: false
    };
  }
  
  return {
    primaryValue: getVarPrimaryValue(varFunctionNode),
    fallbackValue: getFallbackValue(varFunctionNode),
    hasFallback: hasFallback(varFunctionNode)
  };
}

/**
 * Find all CSS variable references in a text string using regex
 */
export function findCssVariables(text: string, pattern?: RegExp): string[] {
  const defaultPattern = /--[a-zA-Z0-9-]+/g;
  const regex = pattern || defaultPattern;
  return text.match(regex) || [];
}

/**
 * Extract SLDS token from a var() fallback value string
 * Example: "var(--slds-g-color-border-1)" -> "--slds-g-color-border-1"
 */
export function extractSldsTokenFromVarString(varString: string): string | null {
  const varMatch = varString.match(/var\(([^,)]+)/);
  return varMatch ? varMatch[1] : null;
}
