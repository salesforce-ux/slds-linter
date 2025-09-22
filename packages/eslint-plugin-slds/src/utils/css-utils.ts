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
}

/**
 * Extract CSS variable information from var() function nodes
 * Used specifically for SLDS variable fallback detection
 */
function extractSldsVariable(node: any): CssVariableInfo | null {
  if (!node || node.type !== 'Function' || node.name !== 'var') {
    return null;
  }

  if (!node.children) {
    return null;
  }

  // Convert children to array and get the first child (variable name)
  const childrenArray = Array.from(node.children);
  if (childrenArray.length === 0) {
    return null;
  }
  
  const firstChild = childrenArray[0] as any;
  if (!firstChild || firstChild.type !== 'Identifier') {
    return null;
  }

  const variableName = firstChild.name;
  if (!variableName || !variableName.startsWith('--slds-')) {
    return null;
  }

  // Check if there's a fallback (comma separator)
  const hasFallback = childrenArray.some((child: any) => 
    child.type === 'Operator' && child.value === ','
  );

  return {
    name: variableName,
    hasFallback
  };
}

/**
 * Specialized CSS variable traversal for SLDS variables
 * Finds var(--slds-*) functions and reports their fallback status
 */
export function forEachSldsVariable(
  valueText: string,
  callback: (variableInfo: CssVariableInfo, positionInfo: PositionInfo) => void
): void {
  forEachValue(valueText, extractSldsVariable, () => false, callback);
}

/**
 * Format multiple hook suggestions for better readability
 * @param hooks - Array of hook names to format
 * @returns Formatted string with hooks
 */
export function formatMultipleHooks(hooks: string[]): string {
  if (hooks.length === 1) {
    return `${hooks[0]}`;
  }

  // Loop through hooks and append each as a numbered list item with line breaks
  return '\n' + hooks.map((hook, index) => `${index + 1}. ${hook}`).join('\n');
}