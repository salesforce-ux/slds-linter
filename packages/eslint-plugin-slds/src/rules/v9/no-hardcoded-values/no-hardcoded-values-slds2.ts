import { Rule } from 'eslint';
import metadata from '@salesforce-ux/sds-metadata';
import ruleMessages from '../../../config/rule-messages.yml';
import { createNoHardcodedValueEslintRule } from './noHardcodedValueEslintRule';

const ruleConfig = ruleMessages['no-hardcoded-values-slds2'];
const { type, description, url, messages } = ruleConfig;

const valueToStylinghook = metadata.valueToStylingHooksCosmos;

export default createNoHardcodedValueEslintRule({
  ruleConfig,
  valueToStylinghook,
}) as Rule.RuleModule;

