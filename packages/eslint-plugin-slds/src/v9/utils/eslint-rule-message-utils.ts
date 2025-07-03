// ESLint-specific rule message utility for v9 rules. No stylelint dependency.
import { MessagesObj } from './eslint-report-utils';

export function toEslintRuleMessages(ruleName: string, warningMsg: string): MessagesObj {
  return {
    rejected: (oldValue: string, newValue: string) =>
      warningMsg.replace(/\{oldValue\}/g, oldValue).replace(/\{newValue\}/g, newValue),
    suggested: (oldValue: string) =>
      `There's no replacement styling hook for the ${oldValue} static value. Remove the static value.`,
  };
} 