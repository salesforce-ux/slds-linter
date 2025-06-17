import { Declaration } from 'postcss';
import valueParser from 'postcss-value-parser';
import stylelint from 'stylelint';
import { findExactMatchStylingHook } from '../../../utils/styling-hook-utils';
import { forEachDensifyValue } from '../../../utils/density-utils';
import { reportMatchingHooks, MessagesObj } from '../../../utils/report-utils';
import type { ValueToStylingHooksMapping } from '@salesforce-ux/sds-metadata';

export function handleDensityProps(
  decl: Declaration,
  parsedValue: valueParser.ParsedValue,
  cssValueStartIndex: number,
  supportedStylinghooks: ValueToStylingHooksMapping,
  cssProperty: string,
  reportProps: Partial<stylelint.Problem>,
  messages: MessagesObj
) {
  forEachDensifyValue(parsedValue, (node) => {
    let alternateValue = null;
    const parsedValue = valueParser.unit(node.value);
    const unitType = parsedValue && parsedValue.unit;
    const numberVal = parsedValue ? Number(parsedValue.number) : 0;
    
    if (unitType === 'px') {
      let floatValue = parseFloat(`${numberVal / 16}`);
      if (!isNaN(floatValue)) {
        alternateValue = `${parseFloat(floatValue.toFixed(4))}rem`;
      }
    } else if (unitType === 'rem') {
      const intValue = parseInt(`${numberVal * 16}`);
      if (!isNaN(intValue)) {
        alternateValue = `${intValue}px`;
      }
    }

    let suggestedValue = node.value;
    let closestHooks = findExactMatchStylingHook(
      node.value,
      supportedStylinghooks,
      cssProperty
    );

    if (!closestHooks || !closestHooks.length) {
      suggestedValue = alternateValue;
      closestHooks = findExactMatchStylingHook(
        alternateValue,
        supportedStylinghooks,
        cssProperty
      );
    }

    const fix = () => {
      decl.value = decl.value.replace(
        valueParser.stringify(node),
        `var(${closestHooks[0]}, ${suggestedValue})`
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