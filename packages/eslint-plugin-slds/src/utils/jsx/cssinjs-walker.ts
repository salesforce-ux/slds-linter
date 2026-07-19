/**
 * Parse a CSS-in-JS template literal (styled-components / emotion) and expose the
 * declarations and class selectors it contains, mapped back to source offsets so
 * that existing SLDS detection can run against them.
 *
 * Template interpolations (`${...}`) are replaced with a safe placeholder ident
 * before parsing. Because the placeholder length differs from the real source
 * expression, any finding whose source range crosses an interpolation is
 * returned as non-mappable with null offsets, so rules skip it entirely (no
 * report and no auto-fix) rather than risk editing the wrong source text.
 */
import { parse, walk } from '@eslint/css-tree';

const PLACEHOLDER = '__slds_expr__';
const WRAP_PREFIX = '.__slds_w__{';
const WRAP_SUFFIX = '}';

export interface CssInJsDeclaration {
  property: string;
  valueText: string;
  propertyStart: number | null;
  propertyEnd: number | null;
  valueStart: number | null;
  valueEnd: number | null;
  propertyMappable: boolean;
  valueMappable: boolean;
}

export interface CssInJsClass {
  className: string;
  start: number | null;
  end: number | null;
  mappable: boolean;
  isLastInSelector: boolean;
}

interface Segment {
  cssStart: number;
  cssEnd: number;
  sourceStart: number | null;
}

interface CombinedResult {
  combined: string;
  segments: Segment[];
}

/**
 * Build the combined placeholder-CSS string for a TemplateLiteral, recording a
 * map from combined offsets back to source offsets.
 */
function buildCombined(templateLiteral: any, sourceCode: any): CombinedResult {
  const quasis = templateLiteral.quasis || [];
  const expressions = templateLiteral.expressions || [];

  let combined = '';
  const segments: Segment[] = [];

  quasis.forEach((quasi: any, index: number) => {
    // TemplateElement.range includes the delimiters; the raw content starts one
    // character in (`` ` `` or `}`).
    const raw = quasi.value.raw;
    const cssStart = combined.length;
    combined += raw;
    segments.push({ cssStart, cssEnd: combined.length, sourceStart: quasi.range[0] + 1 });

    if (index < expressions.length) {
      const cssStartPh = combined.length;
      combined += PLACEHOLDER;
      segments.push({ cssStart: cssStartPh, cssEnd: combined.length, sourceStart: null });
    }
  });

  return { combined, segments };
}

/**
 * Map an offset in the combined string back to a source offset, also returning
 * the index of the segment it landed in.
 */
function mapOffset(
  combinedOffset: number,
  segments: Segment[]
): { offset: number | null; mappable: boolean; segIndex: number } {
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (combinedOffset >= seg.cssStart && combinedOffset <= seg.cssEnd) {
      if (seg.sourceStart === null) {
        return { offset: null, mappable: false, segIndex: i };
      }
      return { offset: seg.sourceStart + (combinedOffset - seg.cssStart), mappable: true, segIndex: i };
    }
  }
  return { offset: null, mappable: false, segIndex: -1 };
}

/**
 * Map a [start, end] range in the wrapped-CSS coordinate space back to source.
 *
 * A range is only mappable when both endpoints fall inside the *same* source
 * segment. Segments strictly alternate quasi/placeholder/quasi, so endpoints in
 * different segments always straddle at least one `${...}` interpolation. In
 * that case the placeholder length (a fixed sentinel) differs from the real
 * interpolation length, so any offset arithmetic derived from the placeholder
 * text would point at the wrong source location. We therefore return a fully
 * null (non-mappable) range so downstream rules skip both reporting and fixing
 * rather than corrupt consumer source.
 */
function mapRange(
  wrappedStart: number,
  wrappedEnd: number,
  segments: Segment[]
): { start: number | null; end: number | null; mappable: boolean } {
  const combinedStart = wrappedStart - WRAP_PREFIX.length;
  const combinedEnd = wrappedEnd - WRAP_PREFIX.length;
  const start = mapOffset(combinedStart, segments);
  const end = mapOffset(combinedEnd, segments);
  const mappable =
    start.mappable &&
    end.mappable &&
    start.offset !== null &&
    end.offset !== null &&
    start.segIndex === end.segIndex;
  if (!mappable) {
    return { start: null, end: null, mappable: false };
  }
  return { start: start.offset, end: end.offset, mappable: true };
}

export interface CssInJsResult {
  declarations: CssInJsDeclaration[];
  classes: CssInJsClass[];
}

/**
 * Per-parse cache. All JSX rules (12+) invoke `walkCssInJs` on the same
 * TemplateLiteral nodes during a single lint pass; parsing each template once
 * and memoizing by node identity avoids redundant css-tree parses. AST nodes
 * are recreated every pass, so a WeakMap keyed by the node is both safe (no
 * stale results) and self-cleaning (garbage collected with the AST).
 */
const walkCache = new WeakMap<object, CssInJsResult>();

/**
 * Extract declarations and class selectors from a CSS-in-JS TemplateLiteral.
 */
export function walkCssInJs(
  templateLiteral: any,
  sourceCode: any
): CssInJsResult {
  if (templateLiteral && typeof templateLiteral === 'object') {
    const cached = walkCache.get(templateLiteral);
    if (cached) {
      return cached;
    }
  }

  const result = computeWalkCssInJs(templateLiteral, sourceCode);

  if (templateLiteral && typeof templateLiteral === 'object') {
    walkCache.set(templateLiteral, result);
  }
  return result;
}

function computeWalkCssInJs(
  templateLiteral: any,
  sourceCode: any
): CssInJsResult {
  const declarations: CssInJsDeclaration[] = [];
  const classes: CssInJsClass[] = [];

  let combinedResult: CombinedResult;
  try {
    combinedResult = buildCombined(templateLiteral, sourceCode);
  } catch {
    return { declarations, classes };
  }

  const { combined, segments } = combinedResult;
  const wrapped = WRAP_PREFIX + combined + WRAP_SUFFIX;

  let ast: any;
  try {
    ast = parse(wrapped, { positions: true, onParseError: () => {} } as any);
  } catch {
    return { declarations, classes };
  }

  try {
    walk(ast, {
      enter(node: any) {
        if (node.type === 'Declaration') {
          const property: string = node.property || '';
          if (property.includes(PLACEHOLDER)) {
            return;
          }

          const declStart = node.loc?.start?.offset;
          const valueLoc = node.value?.loc;
          if (declStart === undefined || !valueLoc) {
            return;
          }

          const propRange = mapRange(declStart, declStart + property.length, segments);
          const valueStartWrapped = valueLoc.start.offset;
          const valueEndWrapped = valueLoc.end.offset;
          const valueText = wrapped.slice(valueStartWrapped, valueEndWrapped);
          const valRange = mapRange(valueStartWrapped, valueEndWrapped, segments);

          declarations.push({
            property,
            valueText,
            propertyStart: propRange.start,
            propertyEnd: propRange.end,
            valueStart: valRange.start,
            valueEnd: valRange.end,
            propertyMappable: propRange.mappable,
            valueMappable: valRange.mappable,
          });
        } else if (node.type === 'Selector') {
          const classChildren: any[] = [];
          node.children?.forEach((child: any) => {
            if (child.type === 'ClassSelector') {
              classChildren.push(child);
            }
          });
          classChildren.forEach((child, idx) => {
            const className: string = child.name || '';
            if (!className || className.includes(PLACEHOLDER)) {
              return;
            }
            const nameStartWrapped = (child.loc?.start?.offset ?? 0) + 1; // skip the dot
            const range = mapRange(nameStartWrapped, nameStartWrapped + className.length, segments);
            classes.push({
              className,
              start: range.start,
              end: range.end,
              mappable: range.mappable,
              isLastInSelector: idx === classChildren.length - 1,
            });
          });
        }
      },
    });
  } catch {
    // best-effort: return what we have
  }

  return { declarations, classes };
}
