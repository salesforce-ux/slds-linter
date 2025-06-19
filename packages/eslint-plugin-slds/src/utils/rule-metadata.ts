interface RuleMetadata {
  name: string;
  severityLevel: string;
  warningMsg?: string;
  errorMsg?: string;
  ruleDesc: string;
}

const ruleMetadata: Record<string, RuleMetadata> = {
  'no-slds-var-without-fallback': {
    name: 'no-slds-var-without-fallback',
    severityLevel: 'error',
    warningMsg: 'Your code uses the ${cssVar} styling hook without a fallback value. Styling hooks are unavailable in some Salesforce environments. To render your component correctly in all environments, add this fallback value: var(${cssVar}, ${recommendation}) . To make this fallback value brand-aware, use a branded design token instead of a static value. See Design Tokens on v1.lightningdesignsystem.com.',
    errorMsg: 'Your code uses the ${cssVar} styling hook without a fallback value. Styling hooks are unavailable in some Salesforce environments. To render your component correctly in all environments, add this fallback value: var(${cssVar}, ${recommendation}) . To make this fallback value brand-aware, use a branded design token instead of a static value. See Design Tokens on v1.lightningdesignsystem.com.',
    ruleDesc: 'Add fallback values to SLDS styling hooks. The fallback values are used in Salesforce environments where styling hooks are unavailable.',
  },
  // Add other rules metadata here
};

/**
 * Replace placeholders in a template string with provided values
 */
function replacePlaceholders(template: string, args: { [key: string]: string }): string {
  return template
    .replace(/\${(.*?)}/g, (_, key) => args[key.trim()] || '')
    .replace(/\{\{(.*?)\}\}/g, (_, key) => args[key.trim()] || '');
}

/**
 * Get metadata for a specific rule
 */
export function getRuleMetadata(ruleName: string): RuleMetadata | undefined {
  return ruleMetadata[ruleName];
}

/**
 * Get formatted message for a rule
 */
export function getFormattedMessage(ruleName: string, messageType: 'warningMsg' | 'errorMsg', args: { [key: string]: string }): string {
  const metadata = ruleMetadata[ruleName];
  if (!metadata || !metadata[messageType]) return '';
  return replacePlaceholders(metadata[messageType]!, args);
} 