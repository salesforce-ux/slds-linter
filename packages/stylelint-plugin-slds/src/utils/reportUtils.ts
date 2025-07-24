import { Declaration } from 'postcss';
import stylelint from 'stylelint';
import { generateSuggestionsList, reportMatchingHooksStylelint, MessagesObj } from 'slds-shared-utils';

// Re-export for backward compatibility
export { MessagesObj } from 'slds-shared-utils';

/**
 * Backward-compatible wrapper for reportMatchingHooks.
 * 
 * @deprecated Consider migrating to the shared reportMatchingHooksStylelint function directly.
 */
export function reportMatchingHooks(
  valueNode: any,
  suggestions: string[],
  offsetIndex: number,
  props: Partial<stylelint.Problem>,
  messages: MessagesObj,
  fix?: stylelint.FixCallback
) {
  // Use the new platform-specific function
  reportMatchingHooksStylelint({
    valueNode,
    suggestions,
    offsetIndex,
    reportProps: props,
    messages,
    stylelintUtils: stylelint.utils,
    generateSuggestionsList,
    fixFactory: fix ? () => fix : undefined
  });
} 