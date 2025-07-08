import { createNoHardcodedValueEslintRule } from './noHardcodedValueEslintRule';
import metadata from '@salesforce-ux/sds-metadata';
import rulesMetadata from '../../shared/rulesMetadata';

export default createNoHardcodedValueEslintRule({
  ruleId: 'slds/no-hardcoded-values-slds1',
  valueToStylinghook: metadata.valueToStylingHooksSlds,
  warningMsg: rulesMetadata['slds/no-hardcoded-values-slds1'].warningMsg,
}); 