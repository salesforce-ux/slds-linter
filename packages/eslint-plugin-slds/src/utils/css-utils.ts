import { 
  forEachValue, 
  type PositionInfo 
} from './hardcoded-shared-utils';

/**
 * Check if a CSS property should be targeted for linting based on prefixes or explicit targets
 * @param property - The CSS property name to check
 * @param propertyTargets - Array of specific properties to target (empty means target all)
 * @returns true if the property should be targeted
 */
export function isTargetProperty(property: string, propertyTargets: string[] = []): boolean {
  if (typeof property !== 'string') return false;
  return property.startsWith('--sds-')
    || property.startsWith('--slds-')
    || property.startsWith('--lwc-')
    || propertyTargets.length === 0
    || propertyTargets.includes(property);
}

/**
 * CSS Variable information for SLDS variable detection
 */
export interface CssVariableInfo {
  name: string;           // Variable name: --slds-g-color-surface-1
  hasFallback: boolean;   // Whether var() already has a fallback
  functionText: string;   // Full function text: var(--slds-g-color-surface-1)
}

/**
 * Extract CSS variable information from var() function nodes
 * Used specifically for SLDS variable fallback detection
 */
function extractCssVariable(node: any): CssVariableInfo | null {
  if (!node || node.type !== 'Function' || node.name !== 'var') {
    return null;
  }

  // The children are in the node.children property as an array-like structure
  // We need to access the first child to get the variable name
  let firstChild = null;
  let hasComma = false;
  
  // Check if node has children and iterate through them
  if (node.children) {
    // children is an iterable but not always an array
    const childrenArray = Array.from(node.children);
    
    if (childrenArray.length === 0) {
      return null;
    }
    
    firstChild = childrenArray[0];
    
    // Check if there's a comma (fallback separator)
    hasComma = childrenArray.some((child: any) => 
      child.type === 'Operator' && child.value === ','
    );
  } else {
    return null;
  }

  // First child should be the variable name (Identifier)
  if (!firstChild || firstChild.type !== 'Identifier') {
    return null;
  }

  const variableName = firstChild.name;
  if (!variableName || !variableName.startsWith('--slds-')) {
    return null;
  }

  // Reconstruct the function text for replacement
  const functionText = `var(${variableName}${hasComma ? ', ...' : ''})`;

  return {
    name: variableName,
    hasFallback: hasComma,
    functionText
  };
}

/**
 * Check if CSS variable node should be skipped during traversal
 * We don't skip any nodes since we want to find all var() functions
 */
function shouldSkipVariableNode(node: any): boolean {
  return false; // Don't skip any nodes - we want to traverse everything
}

/**
 * Specialized CSS variable traversal for SLDS variables
 * Finds var(--slds-*) functions and reports their fallback status
 */
export function forEachSldsVariable(
  valueText: string,
  callback: (variableInfo: CssVariableInfo, positionInfo: PositionInfo) => void
): void {
  forEachValue(valueText, extractCssVariable, shouldSkipVariableNode, callback);
}