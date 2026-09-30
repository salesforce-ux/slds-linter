import {parse, tokenize, tokenTypes, walk} from '@eslint/css-tree';
import type {FunctionNode, Identifier, Operator} from '@eslint/css-tree';

export type CssTreeFunction = {
  node: FunctionNode;
  source: string;
  range: [number, number];
  ancestors: FunctionNode[];
};

export type CssTreeFunctionVisitor = (fn: CssTreeFunction) => boolean | void;

// Adapted from packages/eslint-plugin-slds/src/utils/hardcoded-shared-utils.ts::forEachValue.
export function forEachCssFunction(value: string, visitor: CssTreeFunctionVisitor): void {
  if (!value || !hasValidStructure(value)) return;

  try {
    const ast = parse(value, {context: 'value', positions: true, parseCustomProperty: true});
    const ancestors: FunctionNode[] = [];
    const functions: CssTreeFunction[] = [];
    let malformed = false;

    walk(ast, {
      enter(node) {
        if (node.type !== 'Function') return;

        const fn = node as FunctionNode;
        const start = fn.loc?.start.offset;
        const end = fn.loc?.end.offset;
        if (start == null || end == null) return this.skip;
        const source = value.slice(start, end);
        if (!isExactFunctionSource(fn, source)) malformed = true;
        functions.push({node: fn, source, range: [start, end], ancestors: [...ancestors]});
        ancestors.push(fn);
      },
      leave(node) {
        if (node.type === 'Function' && ancestors.at(-1) === node) ancestors.pop();
      },
    });
    if (malformed) return;

    const consumed = new Set<FunctionNode>();
    for (const fn of functions) {
      if (fn.ancestors.some(ancestor => consumed.has(ancestor))) continue;
      if (visitor(fn)) consumed.add(fn.node);
    }
  } catch {
    return;
  }
}

function hasValidStructure(source: string): boolean {
  const stack: number[] = [];
  let valid = true;
  const matchingClose = new Map([
    [tokenTypes.Function, tokenTypes.RightParenthesis],
    [tokenTypes.LeftParenthesis, tokenTypes.RightParenthesis],
    [tokenTypes.LeftSquareBracket, tokenTypes.RightSquareBracket],
    [tokenTypes.LeftCurlyBracket, tokenTypes.RightCurlyBracket],
  ]);
  const closes = new Set(matchingClose.values());

  tokenize(source, (type, start, end) => {
    if (type === tokenTypes.BadString || type === tokenTypes.BadUrl ||
      (type === tokenTypes.Comment && !source.slice(start, end).endsWith('*/'))) {
      valid = false;
    } else if (matchingClose.has(type)) {
      stack.push(matchingClose.get(type)!);
    } else if (closes.has(type) && stack.pop() !== type) {
      valid = false;
    }
  });

  return valid && stack.length === 0;
}

function isExactFunctionSource(node: FunctionNode, source: string): boolean {
  return source.startsWith(`${node.name}(`) && source.endsWith(')');
}

export function getFunctionIdentifier(node: FunctionNode): Identifier | null {
  const first = node.children.first;
  return first?.type === 'Identifier' ? first as Identifier : null;
}

export function getFunctionComma(node: FunctionNode): Operator | null {
  return node.children.toArray().find(
    (child): child is Operator => child.type === 'Operator' && child.value === ',',
  ) || null;
}

export function hasOnlyIdentifierArgument(fn: CssTreeFunction, identifier: Identifier): boolean {
  const argumentEnd = identifier.loc?.end.offset;
  if (argumentEnd == null) return false;
  return isCssWhitespace(fn.source.slice(argumentEnd - fn.range[0], -1));
}

export function isIdentifierThenOptionalFallback(
  fn: CssTreeFunction,
  identifier: Identifier,
  comma: Operator | null,
): boolean {
  const argumentEnd = identifier.loc?.end.offset;
  const suffixEnd = comma?.loc?.start.offset ?? fn.range[1] - 1;
  if (argumentEnd == null || suffixEnd == null) return false;
  return isCssWhitespace(fn.source.slice(argumentEnd - fn.range[0], suffixEnd - fn.range[0]));
}

function isCssWhitespace(source: string): boolean {
  return source.replace(/\/\*[\s\S]*?\*\//gu, '').trim() === '';
}

export function isInsideSldsFallback(fn: CssTreeFunction): boolean {
  return fn.ancestors.some(ancestor => {
    if (ancestor.name !== 'var') return false;
    const identifier = getFunctionIdentifier(ancestor);
    const comma = getFunctionComma(ancestor);
    return Boolean(
      identifier?.name.startsWith('--slds-') &&
      comma?.loc?.end.offset != null &&
      fn.range[0] >= comma.loc.end.offset,
    );
  });
}

export function isDescendantInFallback(fn: CssTreeFunction, ancestor: CssTreeFunction): boolean {
  const comma = getFunctionComma(ancestor.node);
  return Boolean(
    comma?.loc?.end.offset != null &&
    fn.range[0] >= comma.loc.end.offset &&
    fn.range[1] < ancestor.range[1],
  );
}
