import {parse, walk} from '@eslint/css-tree';
import type {ValueToStylingHooksMapping} from '@salesforce-ux/sds-metadata';

export type HardcodedValueFinding = {
  range: [number, number];
  messageId: 'hardcodedValue' | 'noReplacement';
  data: Record<string, string>;
  replacement: string | null;
};

export type CustomHookMapping = Record<string, {properties: string[]; values: string[]}>;
export type HardcodedValueOptions = {
  reportNumericValue?: 'never' | 'always' | 'hasReplacement';
  customMapping?: CustomHookMapping;
  deterministicOnly?: boolean;
};
export type HardcodedValueSettings = {
  contextIndex?: {getIssue(filename: string | undefined, line: number, column: number): unknown};
  classifyIssue?: (issue: unknown, closestHooks: string[]) => {tier?: string; selectedHook?: string | null; matchingHooks?: string[]} | null;
  serializeIssueContext?: (issue: unknown) => string;
  deterministicOnly?: boolean;
};

export function getHardcodedValueSettings(settings: unknown): HardcodedValueSettings {
  if (!settings || typeof settings !== 'object') return {};

  const value = settings as Record<string, unknown>;
  const contextIndex = value.contextIndex;
  return {
    ...(contextIndex && typeof contextIndex === 'object' &&
      typeof (contextIndex as {getIssue?: unknown}).getIssue === 'function'
      ? {contextIndex: contextIndex as HardcodedValueSettings['contextIndex']}
      : {}),
    ...(typeof value.classifyIssue === 'function' ? {classifyIssue: value.classifyIssue as HardcodedValueSettings['classifyIssue']} : {}),
    ...(typeof value.serializeIssueContext === 'function'
      ? {serializeIssueContext: value.serializeIssueContext as HardcodedValueSettings['serializeIssueContext']}
      : {}),
    ...(typeof value.deterministicOnly === 'boolean' ? {deterministicOnly: value.deterministicOnly} : {}),
  };
}
export type AnalyzeHardcodedValueInput = {
  property: string;
  value: string;
  sourceStart?: number;
  source?: {
    filename?: string;
    line: number;
    column: number;
    locationAt?: (offset: number) => {line: number; column: number};
  };
  options?: HardcodedValueOptions;
  settings?: HardcodedValueSettings;
};
export type ParsedUnitValue = {unit: 'px' | 'rem' | '%' | 'em' | 'ch' | null; value: number | string};
export type Candidate = {
  start: number; end: number; replacement: string; displayValue: string; hasHook: boolean;
  isNumeric?: boolean; usageContext?: string | null;
};

export const allowedUnits = ['px', 'em', 'rem', '%', 'ch'];
const fontWeights = ['normal', 'bold', 'bolder', 'lighter', '100', '200', '300', '400', '500', '600', '700', '800', '900'];

export function reportCandidates(input: AnalyzeHardcodedValueInput, candidates: Candidate[]): HardcodedValueFinding[] {
  const sourceStart = input.sourceStart ?? 0;
  const numericMode = input.options?.reportNumericValue || 'always';
  return candidates.sort((a, b) => b.start - a.start).flatMap(candidate => {
    if (candidate.isNumeric && (numericMode === 'never' || (numericMode === 'hasReplacement' && !candidate.hasHook))) return [];
    const oldValue = input.value.slice(candidate.start, candidate.end);
    const replacement = candidate.replacement === oldValue ? null : candidate.replacement;
    const common = {oldValue, usageContext: candidate.usageContext || ''};
    return [{
      range: [sourceStart + candidate.start, sourceStart + candidate.end] as [number, number],
      messageId: candidate.hasHook ? 'hardcodedValue' as const : 'noReplacement' as const,
      data: candidate.hasHook ? {...common, newValue: candidate.displayValue} : common,
      replacement,
    }];
  });
}

export function collectValues<T>(source: string, extract: (node: any) => T | {skip: true} | null): Array<{value: T; start: number; end: number}> {
  const values: Array<{value: T; start: number; end: number}> = [];
  try {
    const ast = parse(source, {context: 'value', positions: true});
    walk(ast, {enter(node: any) {
      const extracted = extract(node);
      if (extracted && typeof extracted === 'object' && 'skip' in extracted) return this.skip;
      if (extracted != null && node.loc?.start && node.loc?.end) {
        values.push({value: extracted as T, start: node.loc.start.offset, end: node.loc.end.offset});
      }
    }});
  } catch { return []; }
  return values;
}

export function getStylingHooksForDensityValue(parsed: ParsedUnitValue, supported: ValueToStylingHooksMapping, property: string): string[] {
  const alternate = typeof parsed.value === 'number' ? alternateUnit(parsed.value, parsed.unit) : null;
  const hooks: string[] = [];
  for (const [value, entries] of Object.entries(supported)) {
    const metadataValue = typeof parsed.value === 'string' ? null : parseUnit(value);
    const matches = typeof parsed.value === 'string' ? value.toLowerCase() === parsed.value.toLowerCase() :
      sameUnitValue(parsed, metadataValue) || sameUnitValue(alternate, metadataValue);
    if (matches) entries.filter(hook => hook.properties.includes(property)).forEach(hook => hooks.push(hook.name));
  }
  return hooks;
}

export function unitCandidate(parsed: ParsedUnitValue, property: string, supported: ValueToStylingHooksMapping, start: number, end: number, customHook: string | null): Candidate {
  const rawValue = parsed.unit ? `${parsed.value}${parsed.unit}` : String(parsed.value);
  const hooks = customHook ? [customHook] : getStylingHooksForDensityValue(parsed, supported, property);
  return {start, end, replacement: hooks.length === 1 ? `var(${hooks[0]}, ${rawValue})` : rawValue,
    displayValue: hooks.length ? formatSuggestionHooks(hooks) : rawValue, hasHook: hooks.length > 0, isNumeric: true};
}

export function formatSuggestionHooks(hooks: string[]): string {
  return hooks.length === 1 ? hooks[0] : `\n${hooks.map((hook, index) => `${index + 1}. ${hook}`).join('\n')}`;
}
export function isKnownFontWeight(value: number | string): boolean { return fontWeights.includes(String(value).toLowerCase()); }
function parseUnit(value: string): ParsedUnitValue | null {
  const match = value.match(/^(-?\d*\.?\d+)(px|em|rem|%|ch)?$/u);
  return match ? {value: Number(match[1]), unit: (match[2] || null) as ParsedUnitValue['unit']} : null;
}
function alternateUnit(value: number, unit: ParsedUnitValue['unit']): ParsedUnitValue | null {
  if (unit === 'px') return {value: Number((value / 16).toFixed(4)), unit: 'rem'};
  if (unit === 'rem') return {value: Number.parseInt(String(value * 16), 10), unit: 'px'};
  return null;
}
function sameUnitValue(left: ParsedUnitValue | null, right: ParsedUnitValue | null): boolean {
  return Boolean(left && right && left.unit == right.unit && left.value === right.value);
}
