/**
 * ESLint-specific adapter functions and message utilities
 */
import { Rule } from 'eslint';
import type { MessagesObj } from 'slds-shared-utils';

/**
 * Standardized messages adapter for ESLint handlers
 */
export function createESLintMessages(messages: any): MessagesObj {
  return {
    rejected: (oldValue: string, newValue: string) => 
      messages && messages.rejected ? 
        messages.rejected(oldValue, newValue) : 
        `Replace ${oldValue} with ${newValue}`,
    suggested: (oldValue: string) => 
      messages && messages.suggested ? 
        messages.suggested(oldValue) : 
        `No suggestions found for: ${oldValue}`
  };
}

/**
 * Simple adapter to make ESLint CSS nodes work with shared handlers
 * Keeps what works but eliminates complexity
 */
export function createSimpleAdapter(node: any, context: Rule.RuleContext) {
  const sourceCode = context.sourceCode;
  const cssProperty = node.property;
  const cssValue = sourceCode.getText(node.value);
  
  // Minimal decl adapter for shared handlers
  const declAdapter = {
    prop: cssProperty,
    value: { 
      value: cssValue,
      range: node.value.range || [node.value.loc?.start?.offset || 0, node.value.loc?.end?.offset || 0]
    }
  };
  
  // Simplified reporting function - let ESLint handle location natively
  const reportFn = (reportObj: any) => {
    context.report({
      node: node.value, // Report on the value for precise location
      message: String(reportObj.message),
      fix: reportObj.fix ? (fixer: any) => reportObj.fix(fixer, sourceCode) || null : null,
    });
  };
  
  return { declAdapter, reportFn, cssProperty, cssValue };
} 