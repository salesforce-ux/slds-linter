// TODO:Move rule meta to metadata package
import {ruleMetadata} from '@salesforce-ux/stylelint-plugin-slds';
import { resolvePath } from '../utils/nodeVersionUtil';

export const DEFAULT_ESLINT_CONFIG_PATH = resolvePath('@salesforce-ux/eslint-plugin-slds/eslint.config.js', import.meta);
export const DEFAULT_STYLELINT_CONFIG_PATH = resolvePath('@salesforce-ux/stylelint-plugin-slds/.stylelintrc.yml', import.meta);
export const ESLINT_VERSION = process.env.ESLINT_VERSION;
export const LINTER_CLI_VERSION = process.env.CLI_VERSION;

export const getRuleDescription = (ruleId:string)=>{
    const ruleIdWithoutNameSpace = `${ruleId}`.replace(/\@salesforce-ux\//, '');
    return ruleMetadata(ruleIdWithoutNameSpace)?.ruleDesc || '--';
}