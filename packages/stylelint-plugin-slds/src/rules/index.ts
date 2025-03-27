import noDeprecatedSldsClasses from './no-deprecated-slds-classes';
import noUnsupportedHooksSlds2 from './no-unsupported-hooks-slds2';
import noImportantTag from './no-important-tag';
import noSldsClassOverrides from './no-slds-class-overrides';
import noSldsPrivateVar from './no-slds-private-var';
import lwcTokenToSldsHook from './lwc-token-to-slds-hook';
import noDeprecatedTokensSlds1 from './no-deprecated-tokens-slds1';
import enforceBemUsage from './enforce-bem-usage';
import noDeprecatedSLDS2Classes from './no-deprecated-slds2-classes';
import noCalcFunction from './no-calc-function';
import enforceSdsToSldsHooks from './enforce-sds-to-slds-hooks';
import reduceAnnotations from './reduce-annotations';
import { noHardcodedValuesSlds, noHardcodedValuesSldsPlus } from './no-hardcoded-value';

export default [
  enforceSdsToSldsHooks,
  noDeprecatedSldsClasses,
  noUnsupportedHooksSlds2,
  lwcTokenToSldsHook,
  noCalcFunction,
  noHardcodedValuesSlds,
  noSldsClassOverrides,
  noHardcodedValuesSldsPlus,
  noDeprecatedSLDS2Classes,
  noDeprecatedTokensSlds1,
  enforceBemUsage,
  noSldsPrivateVar,
  noImportantTag,
  reduceAnnotations
];
