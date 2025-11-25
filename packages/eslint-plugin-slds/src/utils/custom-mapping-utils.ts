import type { CustomHookMapping } from '../types';

/**
 * Check if a CSS property matches a pattern (supports wildcards)
 * @param cssProperty - The CSS property to check (e.g., "background-color")
 * @param pattern - The pattern to match against (e.g., "background*" or "color")
 * @returns true if the property matches the pattern
 */
function matchesPropertyPattern(cssProperty: string, pattern: string): boolean {
  const normalizedProperty = cssProperty.toLowerCase();
  const normalizedPattern = pattern.toLowerCase();

  // Exact match
  if (normalizedProperty === normalizedPattern) {
    return true;
  }

  // Wildcard match (e.g., "background*" matches "background-color", "background-image")
  if (normalizedPattern.endsWith('*')) {
    const prefix = normalizedPattern.slice(0, -1);
    return normalizedProperty.startsWith(prefix);
  }

  return false;
}

/**
 * Get custom hook mapping for a given CSS property and value
 * @param cssProperty - The CSS property (e.g., "background-color", "color")
 * @param value - The hardcoded value (e.g., "#fff", "16px")
 * @param customMapping - The custom mapping configuration from rule options
 * @returns The hook name if a mapping is found, null otherwise
 */
export function getCustomMapping(
  cssProperty: string,
  value: string,
  customMapping?: CustomHookMapping
): string | null {
  if (!customMapping) {
    return null;
  }

  const normalizedValue = value.toLowerCase().trim();

  // Iterate through all hook mappings
  for (const [hookName, config] of Object.entries(customMapping)) {
    // Check if any property pattern matches
    const propertyMatches = config.properties.some((pattern) =>
      matchesPropertyPattern(cssProperty, pattern)
    );

    if (!propertyMatches) {
      continue;
    }

    // Check if the value matches any configured value
    const valueMatches = config.values.some(
      (configValue) => configValue.toLowerCase().trim() === normalizedValue
    );

    if (valueMatches) {
      return hookName;
    }
  }

  return null;
}
