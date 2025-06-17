import { Declaration } from 'postcss';
import stylelint from 'stylelint';
import { findExactMatchStylingHook } from '../../../utils/styling-hook-utils';
import type { ValueToStylingHooksMapping } from '@salesforce-ux/sds-metadata';
import { reportMatchingHooks, MessagesObj } from '../../../utils/report-utils';

export function handleBoxShadow(
  decl: Declaration,
  cssValue: string,
  cssValueStartIndex: number,
  supportedStylinghooks: ValueToStylingHooksMapping,
  reportProps: Partial<stylelint.Problem>,
  messages: MessagesObj
) {
  if (cssValue in supportedStylinghooks) {
    const closestHooks = findExactMatchStylingHook(
      cssValue,
      supportedStylinghooks,
      'box-shadow'
    );

    const fix = () => {
      decl.value = `var(${closestHooks[0]}, ${cssValue})`;
    };

    if (closestHooks.length > 0) {
      reportMatchingHooks(
        decl,
        closestHooks,
        cssValueStartIndex,
        reportProps,
        messages,
        fix
      );
    }
  }
} 