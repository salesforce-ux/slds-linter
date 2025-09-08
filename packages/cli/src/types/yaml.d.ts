/**
 * TypeScript module declarations for YAML imports
 * Allows importing .yml files as JSON objects via esbuild
 */

declare module '*rule-messages.yml' {
  interface RuleMessages {
    description: string;
    url?: string;
    type: 'problem' | 'suggestion' | 'layout';
    messages: Record<string, string>;
  }
  
  const content: Record<string, RuleMessages>;
  export default content;
}

// Specific declaration for the eslint plugin rule messages
declare module '@salesforce-ux/eslint-plugin-slds/rule-messages' {
  interface RuleMessages {
    description: string;
    url?: string;
    type: 'problem' | 'suggestion' | 'layout';
    messages: Record<string, string>;
  }
  
  const content: Record<string, RuleMessages>;
  export default content;
}