import { createNoHardcodedValueEslintRule } from './noHardcodedValueEslintRule';
import metadata from '@salesforce-ux/sds-metadata';
import rulesMetadata from '../../../../stylelint-plugin-slds/src/utils/rules';

const valueToStylinghookSldsPlus = metadata.valueToStylingHooksCosmos;

export default createNoHardcodedValueEslintRule({
  ruleId: 'slds/no-hardcoded-values-slds2',
  valueToStylinghook: valueToStylinghookSldsPlus,
  warningMsg: rulesMetadata['slds/no-hardcoded-values-slds2'].warningMsg,
}); 