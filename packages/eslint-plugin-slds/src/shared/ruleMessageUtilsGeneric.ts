import replacePlaceholders from './util';

export function toRuleMessages(ruleName: string, warningMsg: string) {
  return {
    rejected: (oldValue: string, newValue: string) =>
      replacePlaceholders(warningMsg, { oldValue, newValue }),
    suggested: (oldValue: string) =>
      `There's no replacement styling hook for the ${oldValue} static value. Remove the static value.`,
  };
} 