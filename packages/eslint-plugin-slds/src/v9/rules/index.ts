import type { Rule } from 'eslint';
import noHardcodedValuesSlds1 from './no-hardcoded-values-slds1';
import noHardcodedValuesSlds2 from './no-hardcoded-values-slds2';

/**
 * v9-only rules (e.g., migrated stylelint rules)
 * @public
 */
export const rules: Record<string, Rule.RuleModule> = {
  // Add v9-only rules here, e.g.:
  // "no-slds-var-without-fallback": require('./no-slds-var-without-fallback'),
  'slds/no-hardcoded-values-slds1': noHardcodedValuesSlds1,
  'slds/no-hardcoded-values-slds2': noHardcodedValuesSlds2,
}; 