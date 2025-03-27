import { valueToStylinghookSlds, valueToStylinghookSldsplus } from '@salesforce-ux/metadata-slds';
import { createNoHardcodedValueRule } from './noHardcodedValue.rule';

export const noHardcodedValuesSlds = createNoHardcodedValueRule('slds/no-hardcoded-values-slds1', valueToStylinghookSlds);
export const noHardcodedValuesSldsPlus = createNoHardcodedValueRule('slds/no-hardcoded-values-slds2', valueToStylinghookSldsplus);