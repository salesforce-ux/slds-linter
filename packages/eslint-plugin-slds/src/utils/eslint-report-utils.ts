/**
 * Utility functions for ESLint reporting and auto-fixing
 */

/**
 * Report a deprecated hook with auto-fix capability for CSS declarations and identifiers
 */
export function reportDeprecatedHook(
  context: any, 
  node: any, 
  hookName: string, 
  suggestedMatch: string,
  messageId: string = 'replace'
): void {
  context.report({
    node: node,
    messageId,
    data: { 
      oldValue: hookName,
      suggestedMatch: suggestedMatch
    },
    fix(fixer: any) {
      if (node.type === "Declaration") {
        // Replace the property name in CSS declaration
        const originalText = context.sourceCode.getText(node);
        const colonIndex = originalText.indexOf(':');
        const valuePartWithColon = originalText.substring(colonIndex);
        return fixer.replaceText(node, `${suggestedMatch}${valuePartWithColon}`);
      } else if (node.type === "Identifier") {
        // Replace the identifier name in var() function
        return fixer.replaceText(node, suggestedMatch);
      }
      return null;
    }
  });
}

/**
 * Report an issue without auto-fix capability
 */
export function reportWithoutFix(
  context: any,
  node: any,
  messageId: string,
  data?: Record<string, any>
): void {
  context.report({
    node,
    messageId,
    data
  });
}
