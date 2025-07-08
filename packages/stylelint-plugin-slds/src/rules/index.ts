import noDeprecatedSldsClasses from './no-deprecated-slds-classes';
import noUnsupportedHooksSlds2 from './no-unsupported-hooks-slds2';
import noSldsPrivateVar from './no-slds-private-var';
import lwcTokenToSldsHook from './lwc-token-to-slds-hook';
import noDeprecatedTokensSlds1 from './no-deprecated-tokens-slds1';
import enforceBemUsage from './enforce-bem-usage';
import noCalcFunction from './no-calc-function';
import enforceSdsToSldsHooks from './enforce-sds-to-slds-hooks';
import reduceAnnotations from './reduce-annotations';
import noSldsVarWithoutFallback from './no-slds-var-without-fallback';
import noSldsNamespace from './no-slds-namespace';
import noUnsupportedVarFallback from './no-unsupported-var-fallback';

export default [
  enforceSdsToSldsHooks,
  noDeprecatedSldsClasses,
  noUnsupportedHooksSlds2,
  lwcTokenToSldsHook,
  noCalcFunction,
  noDeprecatedTokensSlds1,
  enforceBemUsage,
  noSldsPrivateVar,
  reduceAnnotations,
  noSldsVarWithoutFallback,
  noSldsNamespace,
  noUnsupportedVarFallback
];
