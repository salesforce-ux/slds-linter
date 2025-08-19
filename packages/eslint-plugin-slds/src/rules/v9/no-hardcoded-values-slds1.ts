import { Rule } from 'eslint';
import metadata from '@salesforce-ux/sds-metadata';
import ruleMessages from '../../config/rule-messages.yml';
import { createNoHardcodedValueEslintRule } from './shared/noHardcodedValueEslintRule';

const ruleConfig = ruleMessages['no-hardcoded-values-slds1'];
const { type, description, url, messages } = ruleConfig;

const valueToStylinghook = metadata.valueToStylingHooksSlds;

export default createNoHardcodedValueEslintRule({
  ruleId: 'slds/no-hardcoded-values-slds1',
  ruleConfig,
  valueToStylinghook,
}) as Rule.RuleModule;

