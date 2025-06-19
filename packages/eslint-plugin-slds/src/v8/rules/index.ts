import type { Rule } from 'eslint';

/**
 * ESLint v8 compatible rules
 * @public
 */
export const rules: Record<string, Rule.RuleModule> = {
    "enforce-bem-usage": require('../../rules/enforce-bem-usage'),
    "no-deprecated-classes-slds2": require('../../rules/no-deprecated-classes-slds2'),
    "modal-close-button-issue": require('../../rules/modal-close-button-issue')
}; 