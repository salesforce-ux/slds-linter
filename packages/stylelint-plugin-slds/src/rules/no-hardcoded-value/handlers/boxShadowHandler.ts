import { Declaration } from 'postcss';
import stylelint from 'stylelint';
import type { ValueToStylingHooksMapping } from '@salesforce-ux/sds-metadata';
import { reportMatchingHooks, MessagesObj } from '../../../utils/report-utils';
import { parseBoxShadowValue, isBoxShadowMatch, BoxShadowValue } from '../../../utils/boxShadowValueParser';

function toBoxShadowValue(cssValue: string): BoxShadowValue[] {
  const parsedCssValue = parseBoxShadowValue(cssValue).filter((shadow) => Object.entries(shadow).length > 0);
  if(parsedCssValue.length == 0){
    return;
  }
  return parsedCssValue;
}

function shadowValueToHookEntries(supportedStylinghooks: ValueToStylingHooksMapping): Array<[string, string[]]> {
  return Object.entries(supportedStylinghooks).filter(([key, value]) => {
    return value.some((hook) => hook.properties.includes('box-shadow'));
  }).map(([key, value]) => {
    return [key, value.map((hook) => hook.name)];
  });
}

export function handleBoxShadow(
  decl: Declaration,
  cssValue: string,
  cssValueStartIndex: number,
  supportedStylinghooks: ValueToStylingHooksMapping,
  reportProps: Partial<stylelint.Problem>,
  messages: MessagesObj
) {

  const shadowHooks = shadowValueToHookEntries(supportedStylinghooks);
  
  const parsedCssValue = toBoxShadowValue(cssValue);
  if(!parsedCssValue){
    return;
  }

  for(const [shadow, closestHooks] of shadowHooks){
    const parsedValueHook = toBoxShadowValue(shadow);
    if (parsedValueHook && isBoxShadowMatch(parsedCssValue, parsedValueHook)) {
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
      return;
    }
  }
} 