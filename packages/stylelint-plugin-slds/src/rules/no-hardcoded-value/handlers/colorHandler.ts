import { Declaration } from 'postcss';
import valueParser from 'postcss-value-parser';
import stylelint from 'stylelint';
import { findClosestColorHook, convertToHex, forEachColorValue } from 'slds-shared-utils';
import { reportMatchingHooks, MessagesObj } from '../../../utils/reportUtils';
import type { ValueToStylingHooksMapping } from '@salesforce-ux/sds-metadata';

export function handleColorProps(
  decl: Declaration,
  parsedValue: valueParser.ParsedValue,
  cssValueStartIndex: number,
  supportedStylinghooks: ValueToStylingHooksMapping,
  cssProperty: string,
  reportProps: Partial<stylelint.Problem>,
  messages: MessagesObj
) {
  forEachColorValue(parsedValue, (node) => {
    const hexValue = convertToHex(node.value);
    // transparent is a special case, it should not be converted to a hook
    if (node.value === 'transparent' || !hexValue) {
      return;
    }
    const closestHooks = findClosestColorHook(
      hexValue,
      supportedStylinghooks,
      cssProperty
    );

    const fix = () => {
      decl.value = decl.value.replace(
        valueParser.stringify(node),
        `var(${closestHooks[0]}, ${hexValue})`
      );
    };

    reportMatchingHooks(
      node,
      closestHooks,
      cssValueStartIndex,
      reportProps,
      messages,
      fix
    );
  });
} 