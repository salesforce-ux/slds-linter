import { Rule } from 'eslint';
import metadata from '@salesforce-ux/sds-metadata';
import ruleMessages from '../../../config/rule-messages.yml';
import { defineNoHardcodedValueRule } from './noHardcodedValueRule';

const ruleName = 'no-hardcoded-values-slds1';
const ruleConfig = ruleMessages[ruleName];
const { type, description, url, messages } = ruleConfig;

const valueToStylinghook = metadata.valueToStylingHooksSlds;

export default defineNoHardcodedValueRule({
  ruleConfig,
  valueToStylinghook,
  ruleName,
}) as Rule.RuleModule;

