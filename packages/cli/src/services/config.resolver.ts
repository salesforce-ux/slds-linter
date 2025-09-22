import { resolvePath } from '../utils/nodeVersionUtil';
import ruleMessages from '@salesforce-ux/eslint-plugin-slds/rule-messages.yml';

export const DEFAULT_ESLINT_CONFIG_PATH = resolvePath('@salesforce-ux/eslint-plugin-slds/config', import.meta);
export const ESLINT_VERSION = process.env.ESLINT_VERSION;
export const LINTER_CLI_VERSION = process.env.CLI_VERSION;

/**
 * Get rule description from metadata
 */
export const getRuleDescription = (ruleId: string): string => {
  // Remove both @salesforce-ux/ namespace and slds/ prefix to match YAML keys
  const ruleIdWithoutNameSpace = `${ruleId}`
    .replace(/\@salesforce-ux\//, '')  // Remove npm namespace
    .replace(/^slds\//, '');           // Remove slds/ prefix
  
  return ruleMessages[ruleIdWithoutNameSpace]?.description || '--';
};