import { Declaration } from 'postcss';
import valueParser from 'postcss-value-parser';
import stylelint from 'stylelint';
import { getStylingHooksForDensityValue } from '../../../utils/styling-hook-utils';
import { reportMatchingHooks, MessagesObj } from '../../../utils/report-utils';
import type { ValueToStylingHooksMapping } from '@salesforce-ux/sds-metadata';


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
    const closestHooks = getStylingHooksForDensityValue(cssValue, supportedStylinghooks, cssProperty);

    let fix:stylelint.FixCallback;
    if(closestHooks.length > 0){
      const replacementValue = `var(${closestHooks[0]}, ${node.value})`;
      fix =  () => {
        decl.value = decl.value.replace(valueParser.stringify(node),replacementValue);
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