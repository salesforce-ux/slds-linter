import { Rule } from 'eslint';

/**
 * Creates an ESLint-specific reporting function that formats messages
 * and handles the conditional fix pattern (only fix when single suggestion)
 */
export function createESLintReportFunction(context: Rule.RuleContext, messages: any) {
  return function reportFn(config: {
    node?: any;
    messageId: string;
    data?: any;
    fix?: any;
    [key: string]: any;
  }) {
    context.report({
      node: config.node,
      messageId: config.messageId,
      data: config.data || {},
      fix: config.fix || null,
    });
  };
}

