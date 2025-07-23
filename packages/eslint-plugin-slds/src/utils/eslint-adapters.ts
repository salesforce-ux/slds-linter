/**
 * ESLint-specific adapter functions and message utilities
 */
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