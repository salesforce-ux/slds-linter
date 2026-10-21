import metadata from '@salesforce-ux/sds-metadata';
import {
  handleBoxShadowDeclaration,
  handleColorDeclaration,
  handleDensityDeclaration,
  handleFontDeclaration,
} from './handlers';
import {colorProperties, densificationProperties, fontProperties, matchesCssProperty} from './property-matcher';
import {getHardcodedValueSettings, reportCandidates} from './shared';
import type {
  AnalyzeHardcodedValueInput,
  CustomHookMapping,
  HardcodedValueFinding,
  HardcodedValueOptions,
  HardcodedValueSettings,
} from './shared';

export type {
  AnalyzeHardcodedValueInput,
  CustomHookMapping,
  HardcodedValueFinding,
  HardcodedValueOptions,
  HardcodedValueSettings,
} from './shared';
export {getHardcodedValueSettings};

const mapping = metadata.valueToStylingHooksCosmos;

export function analyzeHardcodedValue(input: AnalyzeHardcodedValueInput): HardcodedValueFinding[] {
  const property = input.property.toLowerCase();
  if (!input.value || property.startsWith('--')) return [];
  if (property === 'box-shadow') return reportCandidates(input, handleBoxShadowDeclaration(input, mapping));

  const findings: HardcodedValueFinding[] = [];
  if (matchesCssProperty(colorProperties, property)) {
    findings.push(...reportCandidates(input, handleColorDeclaration(input, mapping)));
  }
  if (matchesCssProperty(densificationProperties, property)) {
    findings.push(...reportCandidates(input, handleDensityDeclaration(input, mapping)));
  }
  if (fontProperties.includes(property)) {
    findings.push(...reportCandidates(input, handleFontDeclaration(input, mapping)));
  }
  return findings;
}
