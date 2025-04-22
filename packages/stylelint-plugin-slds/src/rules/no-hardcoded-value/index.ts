import { createNoHardcodedValueRule } from './noHardcodedValue.rule';
import metadata from '@salesforce-ux/sds-metadata';
const valueToStylinghookSlds = metadata.valueToStylingHooksSlds;
const valueToStylinghookSldsPlus = metadata.valueToStylingHooksCosmos;

export const noHardcodedValuesSlds = createNoHardcodedValueRule('slds/no-hardcoded-values-slds1', valueToStylinghookSlds);
export const noHardcodedValuesSldsPlus = createNoHardcodedValueRule('slds/no-hardcoded-values-slds2', valueToStylinghookSldsPlus);