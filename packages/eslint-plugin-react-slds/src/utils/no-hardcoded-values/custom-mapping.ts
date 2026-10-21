import type {CustomHookMapping} from './shared';

function matchesPropertyPattern(cssProperty: string, pattern: string): boolean {
  const normalizedProperty = cssProperty.toLowerCase();
  const normalizedPattern = pattern.toLowerCase();
  return normalizedProperty === normalizedPattern ||
    (normalizedPattern.endsWith('*') && normalizedProperty.startsWith(normalizedPattern.slice(0, -1)));
}

export function getCustomMapping(cssProperty: string, value: string, customMapping?: CustomHookMapping): string | null {
  if (!customMapping) return null;
  const normalizedValue = value.toLowerCase().trim();
  for (const [hookName, config] of Object.entries(customMapping)) {
    if (config.properties.some(pattern => matchesPropertyPattern(cssProperty, pattern)) &&
      config.values.some(configValue => configValue.toLowerCase().trim() === normalizedValue)) return hookName;
  }
  return null;
}
