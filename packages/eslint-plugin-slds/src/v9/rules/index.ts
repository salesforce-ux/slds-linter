import type { Rule } from 'eslint';

/**
 * v9-only rules (e.g., migrated stylelint rules)
 * @public
 */
export const rules: Record<string, Rule.RuleModule> = {
  // Add v9-only rules here, e.g.:
  // "no-slds-var-without-fallback": require('./no-slds-var-without-fallback'),
}; 