import {generate, parse, walk} from '@eslint/css-tree';
import type {ValueToStylingHooksMapping} from '@salesforce-ux/sds-metadata';
import chroma from 'chroma-js';
import {getCustomMapping} from '../custom-mapping';
import {formatSuggestionHooks, type AnalyzeHardcodedValueInput, type Candidate, type ParsedUnitValue} from '../shared';

type BoxShadowValue = {offsetX?: string; offsetY?: string; blurRadius?: string; spreadRadius?: string; color?: string; inset?: boolean};

export function handleBoxShadowDeclaration(input: AnalyzeHardcodedValueInput, supported: ValueToStylingHooksMapping): Candidate[] {
  const customHook = getCustomMapping(input.property, input.value, input.options?.customMapping);
  if (customHook) return [createBoxShadowReplacement(input.value, [customHook])];
  const parsed = parseBoxShadowValue(input.value);
  if (!parsed.length) return [];
  for (const [value, hooks] of Object.entries(supported)) {
    const shadowHooks = hooks.filter(hook => hook.properties.includes('box-shadow')).map(hook => hook.name);
    if (shadowHooks.length && isBoxShadowMatch(parsed, parseBoxShadowValue(value))) {
      return [createBoxShadowReplacement(input.value, shadowHooks)];
    }
  }
  return [];
}

function createBoxShadowReplacement(originalValue: string, hooks: string[]): Candidate {
  return {start: 0, end: originalValue.length,
    replacement: hooks.length === 1 ? `var(${hooks[0]}, ${originalValue})` : originalValue,
    displayValue: formatSuggestionHooks(hooks), hasHook: true};
}

function parseBoxShadowValue(value: string): BoxShadowValue[] {
  try {
    const ast = parse(value, {context: 'value'});
    const parts: Array<{lengths: string[]; colors: string[]; inset: boolean}> = [];
    let current: {lengths: string[]; colors: string[]; inset: boolean} | null = null;
    const finish = () => {
      if (current && (current.lengths.length || current.colors.length || current.inset)) parts.push(current);
      current = null;
    };
    walk(ast, {enter(node: any) {
      if (node.type === 'Operator' && node.value === ',') { finish(); return; }
      if (node.type === 'WhiteSpace') return;
      current ||= {lengths: [], colors: [], inset: false};
      if (node.type === 'Function') {
        if (isColorValue(node)) current.colors.push(generate(node));
        else if (isLengthValue(node)) current.lengths.push(generate(node));
        return this.skip;
      }
      if (node.type === 'Identifier' && node.name.toLowerCase() === 'inset') current.inset = true;
      else if (isLengthValue(node)) current.lengths.push(generate(node));
      else if (isColorValue(node)) current.colors.push(generate(node));
    }});
    finish();
    return parts.map(part => {
      const shadow: BoxShadowValue = {};
      (['offsetX', 'offsetY', 'blurRadius', 'spreadRadius'] as const).forEach((key, index) => {
        if (part.lengths[index]) shadow[key] = part.lengths[index];
      });
      if (part.colors[0]) shadow.color = part.colors[0];
      if (part.inset) shadow.inset = true;
      return shadow;
    });
  } catch { return []; }
}

function isColorValue(node: any): boolean {
  if (node.type === 'Hash') return true;
  if (node.type === 'Identifier') return chroma.valid(node.name);
  if (node.type !== 'Function') return false;
  if (['rgb', 'rgba', 'hsl', 'hsla'].includes(node.name.toLowerCase())) return true;
  return getVarToken(node).startsWith('--slds-g-color');
}
function isLengthValue(node: any): boolean {
  if (node.type === 'Dimension') return parseUnitValue(`${node.value}${node.unit}`) !== null;
  if (node.type === 'Number') return Number(node.value) === 0;
  if (node.type !== 'Function') return false;
  if (['calc', 'min', 'max'].includes(node.name.toLowerCase())) return true;
  return /^--slds-g-(spacing|sizing)/u.test(getVarToken(node));
}
function getVarToken(node: any): string {
  if (node.type !== 'Function' || node.name !== 'var') return '';
  const first = node.children?.first;
  return first?.type === 'Identifier' ? first.name : '';
}
function parseUnitValue(value: string): ParsedUnitValue | null {
  const match = value.match(/^(-?\d*\.?\d+)(px|em|rem|%|ch)?$/u);
  return match ? {value: Number(match[1]), unit: (match[2] || null) as ParsedUnitValue['unit']} : null;
}
function isBoxShadowMatch(left: BoxShadowValue[], right: BoxShadowValue[]): boolean {
  if (left.length !== right.length) return false;
  const lengths = ['offsetX', 'offsetY', 'blurRadius', 'spreadRadius'] as const;
  return left.every((shadow, index) => shadow.color === right[index].color && shadow.inset === right[index].inset &&
    lengths.every(key => normalizeLengthValue(shadow[key]) === normalizeLengthValue(right[index][key])));
}
function normalizeLengthValue(value?: string): string { return !value || value === '0' ? '0px' : value; }
