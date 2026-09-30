import {generate} from '@eslint/css-tree';
import type {ValueToStylingHooksMapping} from '@salesforce-ux/sds-metadata';
import chroma from 'chroma-js';
import {getCustomMapping} from '../custom-mapping';
import {resolveColorPropertyToMatch} from '../property-matcher';
import {collectValues, formatSuggestionHooks, type AnalyzeHardcodedValueInput, type Candidate} from '../shared';

const skippedColorFunctions = new Set(['attr', 'calc', 'color-mix', 'conic-gradient', 'counter', 'cubic-bezier', 'linear-gradient', 'max', 'min', 'radial-gradient', 'repeating-conic-gradient', 'repeating-linear-gradient', 'repeating-radial-gradient', 'var']);

export function handleColorDeclaration(input: AnalyzeHardcodedValueInput, supported: ValueToStylingHooksMapping): Candidate[] {
  return collectValues(input.value, node => {
    if (node.type === 'Function' && skippedColorFunctions.has(node.name)) return {skip: true};
    let value: string | null = null;
    if (node.type === 'Hash') value = `#${node.value}`;
    else if (node.type === 'Identifier') value = node.name;
    else if (node.type === 'Function' && ['rgb', 'rgba', 'hsl', 'hsla'].includes(node.name)) value = generate(node);
    return !value || value === 'transparent' || !chroma.valid(value) ? null : value;
  }).flatMap(({value: color, start, end}) => {
    const customHook = getCustomMapping(input.property, color, input.options?.customMapping);
    let hooks = customHook ? [customHook] : findClosestColorHook(chroma(color).hex('rgb'), supported, resolveColorPropertyToMatch(input.property));
    let replacement = input.value.slice(start, end);
    let usageContext: string | null = null;
    if (!customHook && typeof input.settings?.contextIndex?.getIssue === 'function' && input.source) {
      const location = input.source.locationAt?.(start) || {
        line: input.source.line,
        column: input.source.column + start,
      };
      const issue = input.settings.contextIndex.getIssue(input.source.filename, location.line, location.column);
      if (issue) {
        usageContext = typeof input.settings.serializeIssueContext === 'function' ? `${input.settings.serializeIssueContext(issue)}. ` : null;
        const classification = typeof input.settings.classifyIssue === 'function' ? input.settings.classifyIssue(issue, hooks) : null;
        const deterministicOnly = input.settings.deterministicOnly ?? input.options?.deterministicOnly;
        const canFix = classification?.tier === 'deterministic' || (!deterministicOnly && classification?.tier === 'semi-deterministic');
        if (classification?.selectedHook && canFix) replacement = createReplacementString(color, classification.selectedHook);
        if (classification?.matchingHooks?.length) hooks = classification.matchingHooks;
      }
    }
    if (replacement === input.value.slice(start, end) && hooks.length === 1) replacement = createReplacementString(color, hooks[0]);
    return [{start, end, replacement, displayValue: hooks.length ? formatSuggestionHooks(hooks) : input.value.slice(start, end),
      hasHook: hooks.length > 0, usageContext}];
  });
}

function createReplacementString(color: string, hook: string): string {
  const variable = `var(${hook}, ${color})`;
  const alpha = chroma(color).alpha();
  return alpha === 1 ? variable : `color-mix(in oklab, ${variable}, transparent ${Math.round((1 - alpha) * 100)}%)`;
}

function findClosestColorHook(color: string, supported: ValueToStylingHooksMapping, property: string): string[] {
  const family = classifyFamily(color);
  const candidates: Array<{distance: number; group: string; name: string; sameFamily: boolean}> = [];
  for (const [value, hooks] of Object.entries(supported)) {
    if (!value || !chroma.valid(value)) continue;
    const hookFamily = classifyFamily(value);
    const sameFamily = compatibleFamily(family, hookFamily);
    for (const hook of hooks) {
      const distance = value.toLowerCase() === color.toLowerCase() ? 0 : chroma.deltaE(value, color);
      if ((hook.properties.includes(property) || hook.properties.includes('*')) && distance < 50) {
        candidates.push({distance, group: hook.group, name: hook.name, sameFamily});
      }
    }
  }
  const byGroup: Record<string, typeof candidates> = {};
  candidates.sort((a, b) => a.sameFamily === b.sameFamily ? a.distance - b.distance : a.sameFamily ? -1 : 1)
    .forEach(candidate => (byGroup[candidate.group] ||= []).push(candidate));
  const order = colorGroupOrder(property);
  const promoted = order.filter(group => group !== 'reference' && byGroup[group]?.some(candidate => candidate.sameFamily));
  return (promoted.length ? promoted : order).flatMap(group => (byGroup[group] || []).slice(0, 3))
    .slice(0, order.length).map(candidate => candidate.name);
}

function classifyFamily(color: string): string {
  try {
    const [hue, saturation, lightness] = chroma(color).hsl();
    if (saturation < 0.1 || lightness < 0.08 || lightness > 0.95 || Number.isNaN(hue)) return 'neutral';
    if (hue < 15) return 'red'; if (hue < 45) return 'orange'; if (hue < 70) return 'yellow';
    if (hue < 160) return 'green'; if (hue < 200) return 'cyan'; if (hue < 265) return 'blue';
    if (hue < 330) return 'purple'; if (hue < 345) return 'pink'; return 'red';
  } catch { return 'neutral'; }
}
const adjacentFamilies: Record<string, string[]> = {
  red: ['orange', 'pink'], orange: ['red', 'yellow'], yellow: ['orange', 'green'], green: ['yellow', 'cyan'],
  cyan: ['green', 'blue'], blue: ['cyan', 'purple'], purple: ['blue', 'pink'], pink: ['purple', 'red'], neutral: [],
};
function compatibleFamily(left: string, right: string): boolean {
  return left !== 'neutral' && right !== 'neutral' && (left === right || adjacentFamilies[left]?.includes(right));
}
function colorGroupOrder(property: string): string[] {
  if (property === 'color' || property === 'fill') return ['surface', 'accent', 'feedback', 'theme', 'reference'];
  if (/background/u.test(property)) return ['surface', 'inverse-surface', 'accent', 'feedback', 'theme', 'reference'];
  if (/border|outline|stroke/u.test(property)) return ['borders', 'inverse-borders', 'accent', 'feedback', 'theme', 'reference'];
  return ['surface', 'inverse-surface', 'accent', 'borders', 'inverse-borders', 'feedback', 'theme', 'reference'];
}
