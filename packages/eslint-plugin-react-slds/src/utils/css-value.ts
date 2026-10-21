import type {TSESTree} from '@typescript-eslint/utils';
import {
  forEachCssFunction,
  getFunctionComma,
  getFunctionIdentifier,
  hasOnlyIdentifierArgument,
  isDescendantInFallback,
  isIdentifierThenOptionalFallback,
  isInsideSldsFallback,
  type CssTreeFunction,
} from './css-tree';

export type CssFunctionCall = {
  functionName: 't' | 'token';
  name: string;
  node: TSESTree.Node;
  range: [number, number];
};

export type CssFunctionCallVisitor = (call: CssFunctionCall) => void;

export type CssVariableCall = {
  name: string;
  node: TSESTree.Node;
  range: [number, number];
  source: string;
};

export type CssVariableCallVisitor = (call: CssVariableCall) => boolean | void;

export type CssVariableName = {
  name: string;
  hasFallback: boolean;
  node: TSESTree.Node;
  range: [number, number];
  functionRange: [number, number];
};

export type CssVariableNameVisitor = (variable: CssVariableName) => void;

export type CssVariableFallback = {
  lwcToken: string;
  sldsToken: string;
  node: TSESTree.Node;
  range: [number, number];
  relationshipRange: [number, number];
};

export type CssVariableFallbackVisitor = (fallback: CssVariableFallback) => void;

export function isDynamicCssRange(
  constructStart: number,
  staticRange: [number, number],
  dynamicRanges: Array<[number, number]>,
  touchesHole = false,
): boolean {
  let low = 0;
  let high = dynamicRanges.length;
  while (low < high) {
    const middle = low + Math.floor((high - low) / 2);
    if (dynamicRanges[middle][1] < constructStart) low = middle + 1;
    else high = middle;
  }
  const dynamicRange = dynamicRanges[low];
  if (!dynamicRange) return false;
  const [holeStart, holeEnd] = dynamicRange;
  return constructStart === holeEnd || staticRange[0] === holeEnd ||
    (staticRange[0] < holeEnd && (touchesHole ? staticRange[1] >= holeStart : staticRange[1] > holeStart));
}

export function visitStaticLwcSldsFallbacks(
  node: TSESTree.Node,
  value: string,
  start: number,
  check: CssVariableFallbackVisitor,
): void {
  const functions: CssTreeFunction[] = [];
  forEachCssFunction(value, fn => { functions.push(fn); });

  for (const outer of functions) {
    const lwc = getValidVarIdentifier(outer);
    if (!lwc?.name.startsWith('--lwc-') || !getFunctionComma(outer.node)) continue;
    const nested = functions.find(candidate =>
      candidate.node.name === 'var' && isDescendantInFallback(candidate, outer),
    );
    if (!nested) continue;
    const slds = getValidVarIdentifier(nested);
    if (!slds || (!slds.name.startsWith('--slds-') && !slds.name.startsWith('--sds-'))) continue;
    const lwcStart = lwc.loc?.start.offset;
    const lwcEnd = lwc.loc?.end.offset;
    const sldsEnd = slds.loc?.end.offset;
    if (lwcStart == null || lwcEnd == null || sldsEnd == null) continue;
    check({
      lwcToken: lwc.name,
      sldsToken: slds.name,
      node,
      range: [start + lwcStart, start + lwcEnd],
      relationshipRange: [start + outer.range[0], start + sldsEnd],
    });
  }
}

export function visitStaticCssVariableNames(
  node: TSESTree.Node,
  value: string,
  start: number,
  check: CssVariableNameVisitor,
): void {
  forEachCssFunction(value, fn => {
    const identifier = getValidVarIdentifier(fn);
    if (!identifier) return;
    const nameStart = identifier.loc?.start.offset;
    const nameEnd = identifier.loc?.end.offset;
    if (nameStart == null || nameEnd == null) return;
    check({
      name: identifier.name,
      hasFallback: getFunctionComma(fn.node) != null,
      node,
      range: [start + nameStart, start + nameEnd],
      functionRange: [start + fn.range[0], start + fn.range[1]],
    });
  });
}

export function visitStaticLwcVarCalls(
  node: TSESTree.Node,
  value: string,
  start: number,
  check: CssVariableCallVisitor,
): void {
  forEachCssFunction(value, fn => {
    const identifier = getValidVarIdentifier(fn);
    if (!identifier?.name.startsWith('--lwc-') || isInsideSldsFallback(fn)) return;
    return check({
      name: identifier.name,
      node,
      range: [start + fn.range[0], start + fn.range[1]],
      source: fn.source,
    });
  });
}

export function visitStaticTokenCalls(
  node: TSESTree.Node,
  value: string,
  start: number,
  check: CssFunctionCallVisitor,
): void {
  forEachCssFunction(value, fn => {
    if ((fn.node.name !== 'token' && fn.node.name !== 't') || isInsideSldsFallback(fn)) return;
    const identifier = getFunctionIdentifier(fn.node);
    if (!identifier || !hasOnlyIdentifierArgument(fn, identifier)) return;
    check({
      functionName: fn.node.name,
      name: identifier.name,
      node,
      range: [start + fn.range[0], start + fn.range[1]],
    });
    return true;
  });
}

function getValidVarIdentifier(fn: CssTreeFunction) {
  if (fn.node.name !== 'var') return null;
  const identifier = getFunctionIdentifier(fn.node);
  if (!identifier || !identifier.name.startsWith('--')) return null;
  const comma = getFunctionComma(fn.node);
  return isIdentifierThenOptionalFallback(fn, identifier, comma) ? identifier : null;
}
