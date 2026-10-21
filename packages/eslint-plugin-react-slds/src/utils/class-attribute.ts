import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import type { ClassToken, ClassTokenVisitor } from './class-token';

type RuleContext<MessageIds extends string, Options extends readonly unknown[]> =
  TSESLint.RuleContext<MessageIds, Options>;

function tokens(node: TSESTree.Node, value: string, start: number): ClassToken[] {
  return Array.from(value.matchAll(/\S+/gu), match => ({
    node,
    name: match[0],
    range: [start + match.index, start + match.index + match[0].length],
  }));
}

function literalTokens<MessageIds extends string, Options extends readonly unknown[]>(
  context: RuleContext<MessageIds, Options>,
  node: TSESTree.StringLiteral,
): ClassToken[] {
  const source = context.sourceCode.getText(node);
  const quote = source[0];
  if ((quote !== '"' && quote !== "'") || source.at(-1) !== quote) return [];
  const rawValue = source.slice(1, -1);
  if (rawValue !== node.value) return [];
  return tokens(node, rawValue, node.range[0] + 1);
}

function templateTokens(node: TSESTree.TemplateLiteral): ClassToken[] {
  return node.quasis.flatMap((quasi, index) => {
    const value = quasi.value.cooked;
    if (value == null || quasi.value.raw !== value) return [];
    const startsAtExpression = index > 0;
    const endsAtExpression = index < node.expressions.length;
    const contentStart = quasi.range[0] + 1;
    const classTokens = tokens(quasi, value, contentStart);
    // `one ${value} two` yields two classes; `${prefix}one` is only a partial class.
    return classTokens.filter(token => {
      const relativeStart = token.range[0] - contentStart;
      const relativeEnd = token.range[1] - contentStart;
      if (startsAtExpression && relativeStart === 0 && !/^\s/u.test(value)) return false;
      if (endsAtExpression && relativeEnd === value.length && !/\s$/u.test(value)) return false;
      return true;
    });
  });
}

export function createClassAttributeVisitor<MessageIds extends string, Options extends readonly unknown[]>(
  context: RuleContext<MessageIds, Options>,
  check: ClassTokenVisitor,
): TSESLint.RuleListener {
  // Visits static class tokens in `class` and `className`, including static template segments.
  return {
    JSXAttribute(node) {
      if (node.name.type !== 'JSXIdentifier') return;
      if (node.name.name !== 'className' && node.name.name !== 'class') return;

      let classTokens: ClassToken[] = [];
      if (node.value?.type === 'Literal' && typeof node.value.value === 'string') {
        classTokens = literalTokens(context, node.value);
      } else if (node.value?.type === 'JSXExpressionContainer' && node.value.expression.type !== 'JSXEmptyExpression') {
        const expression = node.value.expression;
        if (expression.type === 'Literal' && typeof expression.value === 'string') {
          classTokens = literalTokens(context, expression);
        } else if (expression.type === 'TemplateLiteral') {
          classTokens = templateTokens(expression);
        }
      }

      for (const token of classTokens) check(token);
    },
  };
}
