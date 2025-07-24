import stylelint from 'stylelint';
import { replacePlaceholders } from 'slds-shared-utils';
import { MessagesObj } from './reportUtils';

export function toRuleMessages(ruleName: string, warningMsg: string): MessagesObj {
  return stylelint.utils.ruleMessages(ruleName, {
    rejected: (oldValue: string, newValue: string) =>
      replacePlaceholders(warningMsg, { oldValue, newValue }),
    suggested: (oldValue: string) =>
      `There's no replacement styling hook for the ${oldValue} static value. Remove the static value.`,
  });
} 