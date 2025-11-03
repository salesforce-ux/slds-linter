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
 * Generic CSS variable extractor that can be customized for different use cases
 * @param node - AST node to extract from
 * @param filter - Function to validate and extract variable information
 * @returns Extracted variable info or null
 */
function extractCssVariable<T>(
  node: any,
  filter: (variableName: string, childrenArray: any[]) => T | null
): T | null {
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
  if (!variableName) {
    return null;
  }

  return filter(variableName, childrenArray);
}

/**
 * Specialized CSS variable traversal for SLDS variables
 * Finds var(--slds-*) functions and reports their fallback status
 */
export function forEachSldsVariable(
  valueText: string,
  callback: (variableInfo: CssVariableInfo, positionInfo: PositionInfo) => void
): void {
  const extractor = (node: any) => extractCssVariable(node, (variableName, childrenArray) => {
    if (!variableName.startsWith('--slds-')) {
      return null;
    }

    // Check if there's a fallback (comma separator)
    const hasFallback = childrenArray.some((child: any) => 
      child.type === 'Operator' && child.value === ','
    );

    return { name: variableName, hasFallback };
  });

  forEachValue(valueText, extractor, () => false, callback);
}

/**
 * Specialized CSS variable traversal for SLDS/SDS namespace detection
 * Finds var(--slds-*) or var(--sds-*) functions in CSS values
 * Note: hasFallback is set to false as it's unused for namespace validation
 */
export function forEachNamespacedVariable(
  valueText: string,
  callback: (variableInfo: CssVariableInfo, positionInfo: PositionInfo) => void
): void {
  const extractor = (node: any) => extractCssVariable(node, (variableName) => {
    // Check for SLDS or SDS namespace
    if (variableName.startsWith('--slds-') || variableName.startsWith('--sds-')) {
      return { name: variableName, hasFallback: false }; // hasFallback unused, but required by interface
    }
    return null;
  });

  forEachValue(valueText, extractor, () => false, callback);
}

/**
 * Specialized CSS variable traversal for LWC variables
 * Finds var(--lwc-*) functions in CSS values and reports their fallback status
 */
export function forEachLwcVariable(
  valueText: string,
  callback: (variableInfo: CssVariableInfo, positionInfo: PositionInfo) => void
): void {
  const extractor = (node: any) => extractCssVariable(node, (variableName, childrenArray) => {
    if (!variableName.startsWith('--lwc-')) {
      return null;
    }

    // Check if there's a fallback (comma separator)
    const hasFallback = childrenArray.some((child: any) => 
      child.type === 'Operator' && child.value === ','
    );

    return { name: variableName, hasFallback };
  });

  forEachValue(valueText, extractor, () => false, callback);
}

/**
 * Format multiple hook suggestions for better readability
 * @param hooks - Array of hook names to format
 * @returns Formatted string with hooks
 */
export function formatSuggestionHooks(hooks: string[]): string {
  if (hooks.length === 1) {
    return `${hooks[0]}`;
  }

  // Loop through hooks and append each as a numbered list item with line breaks
  return '\n' + hooks.map((hook, index) => `${index + 1}. ${hook}`).join('\n');
}