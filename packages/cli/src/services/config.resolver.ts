import { resolvePath } from '../utils/nodeVersionUtil';
import { readFileSync } from 'fs';
import { parse as yamlParse } from 'yaml';
import path from 'path';

export const DEFAULT_ESLINT_CONFIG_PATH = resolvePath('@salesforce-ux/eslint-plugin-slds/config', import.meta);
export const ESLINT_VERSION = process.env.ESLINT_VERSION;
export const LINTER_CLI_VERSION = process.env.CLI_VERSION;

// Cache for rule metadata
let ruleMetadataCache: Record<string, any> | null = null;

/**
 * Load rule metadata from the YAML file
 */
function loadRuleMetadata(): Record<string, any> {
  if (ruleMetadataCache) {
    return ruleMetadataCache;
  }

  try {
    const ruleMessagesYamlPath = resolvePath('@salesforce-ux/eslint-plugin-slds/rule-messages', import.meta);
    const yamlContent = readFileSync(ruleMessagesYamlPath, 'utf8');
    ruleMetadataCache = yamlParse(yamlContent) as Record<string, any>;
    return ruleMetadataCache;
  } catch (error) {
    console.warn('Warning: Could not load rule metadata from YAML file:', error);
    return {};
  }
}

/**
 * Get rule description from metadata
 */
export const getRuleDescription = (ruleId: string): string => {
  const ruleIdWithoutNameSpace = `${ruleId}`.replace(/\@salesforce-ux\//, '');
  const metadata = loadRuleMetadata();
  
  return metadata[ruleIdWithoutNameSpace]?.description || '--';
};