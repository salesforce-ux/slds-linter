import { Declaration } from 'postcss';
import stylelint from 'stylelint';
import type { ValueToStylingHooksMapping } from '@salesforce-ux/sds-metadata';
import { handleBoxShadowShared } from 'slds-shared-utils';
import { reportMatchingHooks, MessagesObj } from '../../../utils/reportUtils';

export function handleBoxShadow(
  decl: Declaration,
  cssValue: string,
  cssValueStartIndex: number,
  supportedStylinghooks: ValueToStylingHooksMapping,
  reportProps: Partial<stylelint.Problem>,
  messages: MessagesObj
) {
  return handleBoxShadowShared(
    decl,
    cssValue,
    cssValueStartIndex,
    supportedStylinghooks,
    reportProps,
    messages,
    reportMatchingHooks,
    (decl, closestHooks, value) => () => {
      decl.value = `var(${closestHooks[0]}, ${value})`;
    }
  );
}