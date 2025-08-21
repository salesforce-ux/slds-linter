import type { ValueToStylingHooksMapping } from '@salesforce-ux/sds-metadata';

/**
 * Utilities for handling box-shadow values
 */

/**
 * Extract shadow values and their corresponding hooks from the styling hooks mapping
 */
export function getShadowValueToHookEntries(supportedStylinghooks: ValueToStylingHooksMapping): Array<[string, string[]]> {
  return Object.entries(supportedStylinghooks)
    .filter(([_, value]) => value.some((hook) => hook.properties.includes('box-shadow')))
    .map(([key, value]) => [key, value.map((hook) => hook.name)]);
}
