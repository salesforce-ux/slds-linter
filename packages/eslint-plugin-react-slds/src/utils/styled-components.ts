import selectorParser from 'postcss-selector-parser';
import { parse as parseStyled } from 'postcss-styled-syntax';
import { type Declaration, type Root, type Rule as PostcssRule } from 'postcss';
import { type TSESLint, type TSESTree } from '@typescript-eslint/utils';
import type { ClassToken, ClassTokenVisitor } from './class-token';

type RuleContext<MessageIds extends string, Options extends readonly unknown[]> =
  TSESLint.RuleContext<MessageIds, Options>;

type StyledSelectorVisitor = (classes: readonly ClassToken[]) => void;
type DynamicRange = readonly [number, number];

export type StyledDeclaration = {
  node: TSESTree.Node;
  property: string;
  propertyRange: [number, number];
  value: string;
  valueStart: number;
  dynamicRanges: Array<[number, number]>;
  canFix: boolean;
};

type StyledTemplateAnalysis = Readonly<{
  node: TSESTree.TemplateLiteral;
  root: Root;
  sourceOffset: number;
  dynamicRanges: readonly DynamicRange[];
}>;

const syntheticPrefix = 'const Component = styled.div`';
// Multiple rules inspect the same template, so parse it only once per source file.
const analysisCache = new WeakMap<
  TSESLint.SourceCode,
  WeakMap<TSESTree.TemplateLiteral, StyledTemplateAnalysis | null>
>();

function rootIdentifier(tag: TSESTree.Expression): TSESTree.Identifier | null {
  let current = tag;
  while (current.type === 'CallExpression' || current.type === 'MemberExpression') {
    current = current.type === 'CallExpression' ? current.callee : current.object;
  }
  return current.type === 'Identifier' ? current : null;
}

function resolvedVariable(
  sourceCode: TSESLint.SourceCode,
  identifier: TSESTree.Identifier,
): TSESLint.Scope.Variable | null {
  let scope: TSESLint.Scope.Scope | null = sourceCode.getScope(identifier);
  while (scope) {
    const variable = scope.variables.find(candidate => candidate.name === identifier.name);
    if (variable) return variable;
    scope = scope.upper;
  }
  return null;
}

function isStyledComponentsBinding(variable: TSESLint.Scope.Variable | null): boolean {
  const definition = variable?.defs[0];
  const specifier = definition?.node;
  if (
    definition?.type !== 'ImportBinding' ||
    (specifier?.type !== 'ImportDefaultSpecifier' && specifier?.type !== 'ImportSpecifier') ||
    specifier.parent.type !== 'ImportDeclaration' ||
    specifier.parent.source.value !== 'styled-components'
  ) {
    return false;
  }
  if (specifier.type === 'ImportDefaultSpecifier') return true;
  return (
    specifier.imported.type === 'Identifier'
      ? specifier.imported.name
      : specifier.imported.value
  ) === 'styled';
}

function interpolationRanges(node: TSESTree.TemplateLiteral): readonly DynamicRange[] {
  return Object.freeze(node.expressions.map((_expression, index) => Object.freeze([
    node.quasis[index].range[1] - 2,
    node.quasis[index + 1].range[0] + 1,
  ] as const)));
}

function maskDynamicRanges(
  value: string,
  valueStart: number,
  dynamicRanges: readonly DynamicRange[],
): string {
  const characters = value.split('');
  const valueEnd = valueStart + value.length;
  for (const [holeStart, holeEnd] of dynamicRanges) {
    if (holeStart >= valueEnd || holeEnd <= valueStart) continue;
    characters.fill(' ', Math.max(0, holeStart - valueStart), Math.min(value.length, holeEnd - valueStart));
  }
  return characters.join('');
}

function analyzeStyledTemplate(
  sourceCode: TSESLint.SourceCode,
  taggedTemplate: TSESTree.TaggedTemplateExpression,
): StyledTemplateAnalysis | null {
  let sourceCache = analysisCache.get(sourceCode);
  if (!sourceCache) {
    sourceCache = new WeakMap();
    analysisCache.set(sourceCode, sourceCache);
  }
  const cached = sourceCache.get(taggedTemplate.quasi);
  if (cached !== undefined) return cached;

  const identifier = rootIdentifier(taggedTemplate.tag);
  if (!identifier || !isStyledComponentsBinding(resolvedVariable(sourceCode, identifier))) {
    sourceCache.set(taggedTemplate.quasi, null);
    return null;
  }

  const templateStart = taggedTemplate.quasi.range[0] + 1;
  const template = sourceCode.text.slice(templateStart, taggedTemplate.quasi.range[1] - 1);
  let root: Root | undefined;
  try {
    // Parse a complete synthetic declaration, then translate its offsets back to the template.
    root = parseStyled(`${syntheticPrefix}${template}\`;`).nodes.find(
      candidate => candidate.type === 'root',
    ) as Root | undefined;
  } catch {
    sourceCache.set(taggedTemplate.quasi, null);
    return null;
  }
  if (!root) {
    sourceCache.set(taggedTemplate.quasi, null);
    return null;
  }

  const analysis = Object.freeze({
    node: taggedTemplate.quasi,
    root,
    sourceOffset: templateStart - syntheticPrefix.length,
    dynamicRanges: interpolationRanges(taggedTemplate.quasi),
  });
  sourceCache.set(taggedTemplate.quasi, analysis);
  return analysis;
}

function createStyledTemplateVisitor<
  MessageIds extends string,
  Options extends readonly unknown[],
>(
  context: RuleContext<MessageIds, Options>,
  visitAnalysis: (analysis: StyledTemplateAnalysis) => void,
): TSESLint.RuleListener {
  return {
    TaggedTemplateExpression(node) {
      const analysis = analyzeStyledTemplate(context.sourceCode, node);
      if (analysis) visitAnalysis(analysis);
    },
  };
}

function selectorPositionOffset(
  selector: string,
  position: { line: number; column: number },
): number {
  let offset = 0;
  for (let line = 1; line < position.line; line += 1) {
    offset = selector.indexOf('\n', offset) + 1;
  }
  return offset + position.column;
}

export function createStyledComponentsClassVisitor<
  MessageIds extends string,
  Options extends readonly unknown[],
>(
  context: RuleContext<MessageIds, Options>,
  check: ClassTokenVisitor,
): TSESLint.RuleListener {
  // Example: styled.div with the selector `&.slds-button {}`.
  return createStyledTemplateVisitor(context, analysis => {
    analysis.root.walkRules((cssRule: PostcssRule) => {
      if (!cssRule.source?.start) return;
      const selectorStart = analysis.sourceOffset + cssRule.source.start.offset;
      try {
        selectorParser(selectors => {
          selectors.walkClasses(classSelector => {
            if (!classSelector.source?.end) return;
            const rawStart = selectorStart + classSelector.sourceIndex;
            const rawEnd =
              selectorStart + selectorPositionOffset(cssRule.selector, classSelector.source.end);
            if (
              analysis.dynamicRanges.some(
                ([holeStart, holeEnd]) => rawEnd === holeStart || rawStart === holeEnd,
              )
            ) {
              return;
            }
            check({
              node: analysis.node,
              name: classSelector.value,
              range: [rawStart + 1, rawEnd],
            });
          });
        }).processSync(cssRule.selector);
      } catch {
        return;
      }
    });
  });
}

export function createStyledComponentsSelectorVisitor<
  MessageIds extends string,
  Options extends readonly unknown[],
>(
  context: RuleContext<MessageIds, Options>,
  check: StyledSelectorVisitor,
): TSESLint.RuleListener {
  // Groups direct classes by selector, as in `.wrapper .slds-button:hover`.
  return createStyledTemplateVisitor(context, analysis => {
    analysis.root.walkRules((cssRule: PostcssRule) => {
      if (!cssRule.source?.start) return;
      const selectorStart = analysis.sourceOffset + cssRule.source.start.offset;
      try {
        selectorParser(selectors => {
          selectors.each(selector => {
            const classes: ClassToken[] = [];
            // Nested pseudo classes do not identify the selector's styled target.
            selector.nodes.forEach(selectorNode => {
              if (selectorNode.type !== 'class' || !selectorNode.source?.end) return;
              const rawStart = selectorStart + selectorNode.sourceIndex;
              const rawEnd =
                selectorStart + selectorPositionOffset(cssRule.selector, selectorNode.source.end);
              if (
                analysis.dynamicRanges.some(
                  ([holeStart, holeEnd]) => rawEnd === holeStart || rawStart === holeEnd,
                )
              ) {
                return;
              }
              classes.push({
                node: analysis.node,
                name: selectorNode.value,
                range: [rawStart + 1, rawEnd],
              });
            });
            const lastClass = classes.at(-1);
            const selectorEnd = selectorStart + selectorPositionOffset(
              cssRule.selector,
              selector.source.end!,
            );
            // In `.slds-button ${Child}`, the dynamic tail may become the real target.
            if (
              lastClass &&
              analysis.dynamicRanges.some(([holeStart]) =>
                holeStart > lastClass.range[1] && holeStart < selectorEnd,
              )
            ) {
              return;
            }
            check(classes);
          });
        }).processSync(cssRule.selector);
      } catch {
        return;
      }
    });
  });
}

export function createStyledComponentsDeclarationVisitor<
  MessageIds extends string,
  Options extends readonly unknown[],
>(
  context: RuleContext<MessageIds, Options>,
  check: (declaration: StyledDeclaration) => void,
): TSESLint.RuleListener {
  // Example: styled.div with the declaration `color: var(--token);`.
  return createStyledTemplateVisitor(context, analysis => {
    analysis.root.walkDecls((declaration: Declaration) => {
      if (!declaration.source?.start) return;
      const propertyStart = analysis.sourceOffset + declaration.source.start.offset;
      const valueStart = propertyStart + declaration.prop.length + declaration.raws.between.length;
      const value = declaration.raws.value?.raw || declaration.value;
      // Report only when PostCSS offsets map exactly to the original template.
      if (
        context.sourceCode.text.slice(propertyStart, propertyStart + declaration.prop.length) !== declaration.prop ||
        context.sourceCode.text.slice(valueStart, valueStart + value.length) !== value
      ) return;
      check({
        node: analysis.node,
        property: declaration.prop,
        propertyRange: [propertyStart, propertyStart + declaration.prop.length],
        value: maskDynamicRanges(value, valueStart, analysis.dynamicRanges),
        valueStart,
        dynamicRanges: analysis.dynamicRanges.map(range => [...range]),
        canFix: true,
      });
    });
  });
}
