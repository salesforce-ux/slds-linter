import type {ValueToStylingHooksMapping} from '@salesforce-ux/sds-metadata';
import {getCustomMapping} from '../custom-mapping';
import {resolveDensityPropertyToMatch} from '../property-matcher';
import {allowedUnits, collectValues, unitCandidate, type AnalyzeHardcodedValueInput, type Candidate, type ParsedUnitValue} from '../shared';

export function handleDensityDeclaration(input: AnalyzeHardcodedValueInput, supported: ValueToStylingHooksMapping): Candidate[] {
  const propertyToMatch = resolveDensityPropertyToMatch(input.property);
  return collectValues(input.value, node => {
    if (node.type === 'Function') return {skip: true};
    if (node.type === 'Dimension') {
      const value = Number(node.value);
      const unit = node.unit.toLowerCase();
      return value !== 0 && allowedUnits.includes(unit) ? {value, unit} as ParsedUnitValue : null;
    }
    if (node.type === 'Percentage') {
      const value = Number(node.value);
      return value ? {value, unit: '%'} as ParsedUnitValue : null;
    }
    if (node.type === 'Number') {
      const value = Number(node.value);
      return value ? {value, unit: null} as ParsedUnitValue : null;
    }
    return null;
  }).map(({value, start, end}) => {
    const rawValue = value.unit ? `${value.value}${value.unit}` : String(value.value);
    return unitCandidate(value, propertyToMatch, supported, start, end,
      getCustomMapping(input.property, rawValue, input.options?.customMapping));
  });
}
