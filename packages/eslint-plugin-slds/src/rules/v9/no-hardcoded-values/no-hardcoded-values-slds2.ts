import { Rule } from 'eslint';
import metadata from '@salesforce-ux/sds-metadata';
import ruleMessages from '../../../config/rule-messages.yml';
import { defineNoHardcodedValueRule } from './noHardcodedValueRule';
 
const ruleName = 'no-hardcoded-values-slds2';
const ruleConfig = ruleMessages[ruleName];
const { type, description, url, messages } = ruleConfig;

const valueToStylinghook = metadata.valueToStylingHooksCosmos;

export default defineNoHardcodedValueRule({
  ruleConfig,
  valueToStylinghook,
  ruleName,
}) as Rule.RuleModule;

