/**
 * Shared class-token detection helpers.
 *
 * These wrap the SLDS metadata sets so that every surface that can carry a CSS
 * class (HTML `class`, CSS selectors, JSX `className`, Vue/Angular bindings, ...)
 * matches classes against a single source of truth.
 */
import metadata from '@salesforce-ux/sds-metadata';

const bemMapping: Record<string, string> = metadata.bemNaming as Record<string, string>;
const deprecatedClasses = new Set<string>(metadata.deprecatedClasses);
const sldsClasses = new Set<string>(metadata.sldsPlusClasses);

/**
 * Whether a class name is deprecated in SLDS 2.
 */
export function isDeprecatedClassName(className: string): boolean {
  return !!className && deprecatedClasses.has(className);
}

/**
 * Returns the modern (single underscore) BEM replacement for a class name using
 * the retired double-dash syntax, or null when there is no mapping.
 */
export function getBemReplacement(className: string): string | null {
  if (className && className in bemMapping && typeof bemMapping[className] === 'string') {
    return bemMapping[className];
  }
  return null;
}

/**
 * Whether a class name (or its BEM-mapped equivalent) is deprecated.
 * Mirrors the guard used by the HTML enforce-bem-usage rule so that deprecated
 * classes are owned by no-deprecated-classes-slds2 instead of being double
 * reported.
 */
export function isBemMappedDeprecated(className: string): boolean {
  return deprecatedClasses.has(className) || deprecatedClasses.has(bemMapping[className]);
}

/**
 * Whether a class name is an official SLDS class (used to flag overrides).
 */
export function isSldsClass(className: string): boolean {
  return !!className && className.startsWith('slds-') && sldsClasses.has(className);
}
