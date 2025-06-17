import type { Rule } from 'eslint';

/**
 * Plugin rules definition
 * @public
 */
export const rules: Record<string, Rule.RuleModule> = {
    "enforce-bem-usage": require('./enforce-bem-usage'),
    "no-deprecated-classes-slds2": require('./no-deprecated-classes-slds2'),
    "modal-close-button-issue": require('./modal-close-button-issue')
}; 