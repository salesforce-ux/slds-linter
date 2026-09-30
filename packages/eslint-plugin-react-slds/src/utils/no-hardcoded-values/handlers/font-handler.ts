import type {ValueToStylingHooksMapping} from '@salesforce-ux/sds-metadata';
import {getCustomMapping} from '../custom-mapping';
import {allowedUnits, collectValues, isKnownFontWeight, unitCandidate, type AnalyzeHardcodedValueInput, type Candidate, type ParsedUnitValue} from '../shared';

export function handleFontDeclaration(input: AnalyzeHardcodedValueInput, supported: ValueToStylingHooksMapping): Candidate[] {
  return collectValues(input.value, node => {
    if (node.type === 'Function') return {skip: true};
    if (node.type === 'Dimension') {
      const value = Number(node.value);
      const unit = node.unit.toLowerCase();
      return value > 0 && allowedUnits.includes(unit) ? {value, unit} as ParsedUnitValue : null;
    }
    if (node.type === 'Percentage') {
      const value = Number(node.value);
      return value ? {value, unit: '%'} as ParsedUnitValue : null;
    }
    if (node.type === 'Number') {
      const value = Number(node.value);
      return value > 0 && isKnownFontWeight(value) ? {value, unit: null} as ParsedUnitValue : null;
    }
    if (node.type === 'Identifier' && isKnownFontWeight(node.name)) {
      return {value: node.name.toLowerCase() === 'normal' ? 400 : node.name.toLowerCase(), unit: null} as ParsedUnitValue;
    }
    return null;
  }).flatMap(({value, start, end}) => {
    const isWeight = !value.unit && isKnownFontWeight(value.value);
    if (input.property === 'font-size' && !value.unit) return [];
    if (input.property === 'font-weight' && !isWeight) return [];
    const propertyToMatch = isWeight ? 'font-weight' : 'font-size';
    const rawValue = value.unit ? `${value.value}${value.unit}` : String(value.value);
    return [unitCandidate(value, propertyToMatch, supported, start, end,
      getCustomMapping(propertyToMatch, rawValue, input.options?.customMapping))];
  });
}
