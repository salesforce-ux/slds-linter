import { Declaration } from 'postcss';
import valueParser from 'postcss-value-parser';
import stylelint from 'stylelint';
import { findClosestColorHook, convertToHex } from '../../../utils/color-lib-utils';
import { forEachColorValue } from '../../../utils/color-utils';
import { reportMatchingHooks, MessagesObj } from '../../../utils/report-utils';
import type { ValueToStylingHooksMapping } from '@salesforce-ux/sds-metadata';
import { isBorderColorProperty, resolvePropertyToMatch } from '../../../utils/property-matcher';


function replaceColorWithHook(decl: Declaration, hook: string, colorValue: string){
  const parsedValue = valueParser(decl.value);
  forEachColorValue(parsedValue, (node) => {
    if(node.value === colorValue){
      node.value = `var(${hook}, ${colorValue})`;
      node.type = 'word';
    }
  });
  decl.value = parsedValue.toString();
}

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
    const propToMatch = resolvePropertyToMatch(cssProperty);
    
    const closestHooks = findClosestColorHook(
      hexValue,
      supportedStylinghooks,
      propToMatch
    );

    let fix = null;
    if(closestHooks.length === 1){
      fix = () => {
        replaceColorWithHook(decl, closestHooks[0], node.value);
      }
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