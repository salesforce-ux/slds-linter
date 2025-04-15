import { createNoHardcodedValueRule } from './noHardcodedValue.rule';
import { MetadataService, MetadataFile, ValueToStylingHooksMapping } from '../../services/metadata.service';
const valueToStylinghookSlds = MetadataService.loadMetadata<ValueToStylingHooksMapping>(MetadataFile.VALUE_TO_STYLING_HOOKS_SLDS);
const valueToStylinghookSldsPlus = MetadataService.loadMetadata<ValueToStylingHooksMapping>(MetadataFile.VALUE_TO_STYLING_HOOKS_COSMOS);

export const noHardcodedValuesSlds = createNoHardcodedValueRule('slds/no-hardcoded-values-slds1', valueToStylinghookSlds);
export const noHardcodedValuesSldsPlus = createNoHardcodedValueRule('slds/no-hardcoded-values-slds2', valueToStylinghookSldsPlus);