import { Declaration } from 'postcss';
import valueParser from 'postcss-value-parser';
import stylelint from 'stylelint';
import { getStylingHooksForDensityValue } from '../../../utils/styling-hook-utils';
import { reportMatchingHooks, MessagesObj } from '../../../utils/report-utils';
import type { ValueToStylingHooksMapping } from '@salesforce-ux/sds-metadata';
import { resolvePropertyToMatch } from '../../../utils/property-matcher';
import { forEachDensifyValue } from '../../../utils/density-utils';

export function handleDensityProps(
  decl: Declaration,
  parsedValue: valueParser.ParsedValue,
  cssValueStartIndex: number,
  supportedStylinghooks: ValueToStylingHooksMapping,
  cssProperty: string,
  reportProps: Partial<stylelint.Problem>,
  messages: MessagesObj
){
  forEachDensifyValue(parsedValue, (node) => {
    handleDensityPropForNode(decl, node, node.value, cssValueStartIndex, supportedStylinghooks, cssProperty, reportProps, messages);
  });
}

function replaceWithHook(decl: Declaration, hook: string, value: string){
  const parsedValue = valueParser(decl.value);
  forEachDensifyValue(parsedValue, (node) => {
    if(node.value === value){
      node.value = `var(${hook}, ${value})`;
      node.type = 'word';
    }
  });
  decl.value = parsedValue.toString();
}

export function handleDensityPropForNode(
  decl: Declaration,
  node: valueParser.Node,
  cssValue: string,
  cssValueStartIndex: number,
  supportedStylinghooks: ValueToStylingHooksMapping,
  cssProperty: string,
  reportProps: Partial<stylelint.Problem>,
  messages: MessagesObj
) {

  const propToMatch = resolvePropertyToMatch(cssProperty);

  const closestHooks = getStylingHooksForDensityValue(cssValue, supportedStylinghooks, propToMatch);

    let fix:stylelint.FixCallback;
    if(closestHooks.length === 1){
      fix =  () => {
        replaceWithHook(decl, closestHooks[0], node.value);
      }
    }

    reportMatchingHooks(
      node,
      closestHooks,
      cssValueStartIndex,
      reportProps,
      messages,
      fix
    );
}