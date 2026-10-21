import type { TSESLint, TSESTree } from '@typescript-eslint/utils';

type RuleContext<MessageIds extends string, Options extends readonly unknown[]> =
  TSESLint.RuleContext<MessageIds, Options>;

export type StaticCssValueVisitor = (
  node: TSESTree.Node,
  value: string,
  start: number,
  dynamicRanges: Array<[number, number]>,
) => void;

export type StaticStylePropertyVisitor = (
  node: TSESTree.Node,
  name: string,
  range: [number, number],
) => void;

export type InlineStyleDeclaration = {
  node: TSESTree.Node;
  property: string;
  propertyRange: [number, number];
  value: string;
  valueStart: number;
  dynamicRanges: Array<[number, number]>;
  canFix: boolean;
};

export type InlineStyleDeclarationVisitor = (declaration: InlineStyleDeclaration) => void;

function unwrap(expression: TSESTree.Expression): TSESTree.Expression {
  let current = expression;
  while (
    current.type === 'TSAsExpression' ||
    current.type === 'TSSatisfiesExpression' ||
    current.type === 'TSNonNullExpression'
  ) {
    current = current.expression;
  }
  return current;
}

type ResolvedInitializer = TSESTree.Expression | null;
type UseSafety = 'safe' | 'no-fix' | 'unsafe';

function outerExpression(node: TSESTree.Identifier): TSESTree.Expression {
  let current: TSESTree.Expression = node;
  while (
    current.parent.type === 'TSAsExpression' ||
    current.parent.type === 'TSSatisfiesExpression' ||
    current.parent.type === 'TSNonNullExpression'
  ) {
    current = current.parent;
  }
  return current;
}

function directAliasVariable(
  sourceCode: TSESLint.SourceCode,
  referenceNode: TSESTree.Identifier | TSESTree.JSXIdentifier,
): TSESLint.Scope.Variable | null {
  if (referenceNode.type !== 'Identifier') return null;
  const expression = outerExpression(referenceNode);
  const declarator = expression.parent;
  if (
    declarator.type !== 'VariableDeclarator' || declarator.init !== expression ||
    declarator.id.type !== 'Identifier' || declarator.parent.kind !== 'const'
  ) return null;
  const aliasName = declarator.id.name;
  return sourceCode.getDeclaredVariables(declarator).find(variable =>
    variable.name === aliasName
  ) || null;
}

function useSafety(
  sourceCode: TSESLint.SourceCode,
  variable: TSESLint.Scope.Variable,
  cache: Map<TSESLint.Scope.Variable, UseSafety>,
): UseSafety {
  const cached = cache.get(variable);
  if (cached) return cached;
  // A mutation or escape through any const alias also makes its source unsafe.
  const pending = [variable];
  const checked = new Set<TSESLint.Scope.Variable>();
  const parents = new Map<TSESLint.Scope.Variable, Set<TSESLint.Scope.Variable>>();
  const directlyUnsafe = new Set<TSESLint.Scope.Variable>();
  const directlyNoFix = new Set<TSESLint.Scope.Variable>();
  while (pending.length > 0) {
    const current = pending.pop()!;
    if (checked.has(current)) continue;
    checked.add(current);
    if (cache.get(current) === 'unsafe') {
      directlyUnsafe.add(current);
      continue;
    }
    if (cache.get(current) === 'no-fix') {
      directlyNoFix.add(current);
      continue;
    }
    if (cache.get(current) === 'safe') continue;
    const definition = current.defs[0];
    if (
      definition?.type === 'Variable' &&
      definition.parent?.kind === 'const' &&
      definition.parent.parent.type === 'ExportNamedDeclaration'
    ) {
      directlyUnsafe.add(current);
    }
    for (const reference of current.references) {
      const referenceNode = reference.identifier;
      if (referenceNode.type === 'Identifier') {
        const expression = outerExpression(referenceNode);
        const parent = expression.parent;
        if (parent.type === 'MemberExpression' && parent.object === expression) {
          const operation = parent.parent;
          if (
            (operation.type === 'AssignmentExpression' && operation.left === parent) ||
            operation.type === 'UpdateExpression' ||
            (operation.type === 'UnaryExpression' && operation.operator === 'delete')
          ) {
            directlyUnsafe.add(current);
            break;
          }
          directlyNoFix.add(current);
        }
        const expressionParent = expression.parent;
        if (
          ((expressionParent.type === 'CallExpression' || expressionParent.type === 'NewExpression') &&
            expressionParent.arguments.includes(expression)) ||
          (expressionParent.type === 'ReturnStatement' && expressionParent.argument === expression) ||
          (expressionParent.type === 'ArrowFunctionExpression' && expressionParent.body === expression) ||
          (expressionParent.type === 'ExportDefaultDeclaration' && expressionParent.declaration === expression) ||
          (expressionParent.type === 'ExportSpecifier' && expressionParent.local === expression)
        ) {
          directlyUnsafe.add(current);
          break;
        }
        if (
          (expressionParent.type === 'VariableDeclarator' && expressionParent.init === expression &&
            expressionParent.parent.kind !== 'const') ||
          (expressionParent.type === 'AssignmentExpression' && expressionParent.right === expression)
        ) {
          directlyUnsafe.add(current);
          break;
        }
      }
      const alias = directAliasVariable(sourceCode, referenceNode);
      if (alias) {
        const aliasParents = parents.get(alias) || new Set<TSESLint.Scope.Variable>();
        aliasParents.add(current);
        parents.set(alias, aliasParents);
        pending.push(alias);
      }
    }
  }
  // Propagate alias hazards back to the values from which each alias was derived.
  const unsafe = new Set(directlyUnsafe);
  const unsafePending = [...directlyUnsafe];
  while (unsafePending.length > 0) {
    for (const parent of parents.get(unsafePending.pop()!) || []) {
      if (unsafe.has(parent)) continue;
      unsafe.add(parent);
      unsafePending.push(parent);
    }
  }
  const noFix = new Set(directlyNoFix);
  const noFixPending = [...directlyNoFix];
  while (noFixPending.length > 0) {
    for (const parent of parents.get(noFixPending.pop()!) || []) {
      if (unsafe.has(parent) || noFix.has(parent)) continue;
      noFix.add(parent);
      noFixPending.push(parent);
    }
  }
  checked.forEach(candidate => cache.set(candidate,
    unsafe.has(candidate) ? 'unsafe' : noFix.has(candidate) ? 'no-fix' : 'safe'));
  return unsafe.has(variable) ? 'unsafe' : noFix.has(variable) ? 'no-fix' : 'safe';
}

function resolvedConstInitializer(
  sourceCode: TSESLint.SourceCode,
  identifier: TSESTree.Identifier,
  cache: Map<TSESLint.Scope.Variable, ResolvedInitializer>,
  mutationCache: Map<TSESLint.Scope.Variable, UseSafety>,
): ResolvedInitializer {
  let scope: TSESLint.Scope.Scope | null = sourceCode.getScope(identifier);
  while (scope) {
    const variable = scope.variables.find(candidate => candidate.name === identifier.name);
    if (variable) {
      if (cache.has(variable)) return cache.get(variable)!;
      if (variable.defs.length !== 1 || variable.defs[0].type !== 'Variable') return null;
      const definition = variable.defs[0];
      if (definition.parent?.kind !== 'const' || definition.node.id.type !== 'Identifier') return null;
      const initializer = definition.node.init && useSafety(sourceCode, variable, mutationCache) !== 'unsafe'
        ? unwrap(definition.node.init)
        : null;
      cache.set(variable, initializer);
      return initializer;
    }
    scope = scope.upper;
  }
  return null;
}

function visitStaticValue<MessageIds extends string, Options extends readonly unknown[]>(
  context: RuleContext<MessageIds, Options>,
  expression: TSESTree.Expression,
  visit: StaticCssValueVisitor,
  resolveIdentifier: boolean,
  initializerCache: Map<TSESLint.Scope.Variable, ResolvedInitializer>,
  mutationCache: Map<TSESLint.Scope.Variable, UseSafety>,
  visitedValues: Set<TSESTree.Expression>,
  dedupeValues = true,
  isDirect = true,
  visitDeclaration?: (node: TSESTree.Node, value: string, start: number, dynamicRanges: Array<[number, number]>, canFix: boolean) => void,
): void {
  const value = unwrap(expression);
  if (dedupeValues && visitedValues.has(value)) return;
  if (dedupeValues) visitedValues.add(value);
  if (value.type === 'Literal' && typeof value.value === 'string') {
    const source = context.sourceCode.getText(value);
    const quote = source[0];
    if ((quote === '"' || quote === "'") && source.at(-1) === quote) {
      const rawValue = source.slice(1, -1);
      if (rawValue === value.value) {
        visit(value, rawValue, value.range[0] + 1, []);
        visitDeclaration?.(value, rawValue, value.range[0] + 1, [], isDirect);
      }
    }
  } else if (value.type === 'TemplateLiteral') {
    if (value.quasis.some(quasi => quasi.value.cooked !== quasi.value.raw)) return;
    const start = value.range[0] + 1;
    const dynamicRanges = value.expressions.map((_expression, index) => [
      value.quasis[index].range[1] - 2,
      value.quasis[index + 1].range[0] + 1,
    ] as [number, number]);
    const characters = context.sourceCode.text.slice(start, value.range[1] - 1).split('');
    // Blank interpolation source so CSS ranges still map to the original file.
    for (const [holeStart, holeEnd] of dynamicRanges) {
      characters.fill(' ', holeStart - start, holeEnd - start);
    }
    const staticValue = characters.join('');
    visit(value, staticValue, start, dynamicRanges);
    visitDeclaration?.(value, staticValue, start, dynamicRanges, isDirect);
  } else if (resolveIdentifier && value.type === 'Identifier') {
    const initializer = resolvedConstInitializer(context.sourceCode, value, initializerCache, mutationCache);
    if (initializer) visitStaticValue(
      context, initializer, visit, false, initializerCache, mutationCache, visitedValues,
      dedupeValues, false, visitDeclaration,
    );
  }
}

export function createInlineStyleVisitor<
  MessageIds extends string,
  Options extends readonly unknown[],
>(
  context: RuleContext<MessageIds, Options>,
  visit: StaticCssValueVisitor,
  visitProperty?: StaticStylePropertyVisitor,
): TSESLint.RuleListener {
  // Visits static values and property names in `<div style={{color: 'red'}} />`.
  return createInlineStyleTraversal(context, visit, visitProperty);
}

function createInlineStyleTraversal<
  MessageIds extends string,
  Options extends readonly unknown[],
>(
  context: RuleContext<MessageIds, Options>,
  visit: StaticCssValueVisitor,
  visitProperty?: StaticStylePropertyVisitor,
  visitDeclaration?: InlineStyleDeclarationVisitor,
): TSESLint.RuleListener {
  const initializerCache = new Map<TSESLint.Scope.Variable, ResolvedInitializer>();
  const mutationCache = new Map<TSESLint.Scope.Variable, UseSafety>();
  const visitedObjects = new Set<TSESTree.ObjectExpression>();
  const visitedValues = new Set<TSESTree.Expression>();
  return {
    JSXAttribute(node) {
      if (
        node.name.type !== 'JSXIdentifier' ||
        node.name.name !== 'style' ||
        node.value?.type !== 'JSXExpressionContainer' ||
        node.value.expression.type === 'JSXEmptyExpression'
      ) return;

      let style = unwrap(node.value.expression as TSESTree.Expression);
      let styleCanFix = true;
      if (style.type === 'Identifier') {
        const styleName = style.name;
        let scope: TSESLint.Scope.Scope | null = context.sourceCode.getScope(style);
        while (scope) {
          const variable = scope.variables.find(candidate => candidate.name === styleName);
          if (variable) {
            styleCanFix = useSafety(context.sourceCode, variable, mutationCache) === 'safe';
            break;
          }
          scope = scope.upper;
        }
        const initializer = resolvedConstInitializer(context.sourceCode, style, initializerCache, mutationCache);
        if (!initializer) return;
        style = initializer;
      }
      if (style.type !== 'ObjectExpression') return;
      if (visitedObjects.has(style)) return;
      visitedObjects.add(style);
      for (const property of style.properties) {
        if (property.type === 'Property') {
          if (visitProperty) {
            const key = property.key;
            if (key.type === 'Literal' && typeof key.value === 'string') {
              const source = context.sourceCode.getText(key);
              const quote = source[0];
              if ((quote === '"' || quote === "'") && source.at(-1) === quote && source.slice(1, -1) === key.value) {
                visitProperty(key, key.value, [key.range[0] + 1, key.range[1] - 1]);
              }
            } else if (
              property.computed && key.type === 'TemplateLiteral' && key.expressions.length === 0 &&
              key.quasis[0].value.cooked === key.quasis[0].value.raw
            ) {
              visitProperty(key, key.quasis[0].value.raw, [key.range[0] + 1, key.range[1] - 1]);
            }
          }
          const declarationProperty = visitDeclaration
            ? staticProperty(context.sourceCode, property)
            : null;
          // Declaration mode revisits shared values because each CSS property has different semantics.
          visitStaticValue(
            context,
            property.value as TSESTree.Expression,
            visit,
            true,
            initializerCache,
            mutationCache,
            visitedValues,
            !visitDeclaration,
            true,
            declarationProperty ? (valueNode, value, valueStart, dynamicRanges, canFix) => {
              visitDeclaration!({
                node: valueNode,
                property: normalizeInlineProperty(declarationProperty.name),
                propertyRange: declarationProperty.range,
                value,
                valueStart,
                dynamicRanges,
                canFix: canFix && styleCanFix,
              });
            } : undefined,
          );
        }
      }
    },
  };
}

function staticProperty(
  sourceCode: TSESLint.SourceCode,
  property: TSESTree.Property,
): {name: string; range: [number, number]} | null {
  const key = property.key;
  if (!property.computed && key.type === 'Identifier') {
    return {name: key.name, range: [...key.range]};
  }
  if (key.type === 'Literal' && typeof key.value === 'string') {
    const source = sourceCode.getText(key);
    const quote = source[0];
    if ((quote === '"' || quote === "'") && source.at(-1) === quote && source.slice(1, -1) === key.value) {
      return {name: key.value, range: [key.range[0] + 1, key.range[1] - 1]};
    }
  }
  if (
    property.computed && key.type === 'TemplateLiteral' && key.expressions.length === 0 &&
    key.quasis[0].value.cooked === key.quasis[0].value.raw
  ) {
    return {name: key.quasis[0].value.raw, range: [key.range[0] + 1, key.range[1] - 1]};
  }
  return null;
}

function normalizeInlineProperty(property: string): string {
  if (property.startsWith('--')) return property;
  const kebab = property.replace(/([A-Z])/gu, '-$1').toLowerCase();
  // React uses `msTransition`; its CSS spelling is `-ms-transition`.
  return kebab.startsWith('ms-') ? `-${kebab}` : kebab;
}

export function createInlineStyleDeclarationVisitor<
  MessageIds extends string,
  Options extends readonly unknown[],
>(
  context: RuleContext<MessageIds, Options>,
  visit: InlineStyleDeclarationVisitor,
): TSESLint.RuleListener {
  // Emits `{property, value, ranges, canFix}` for each static inline declaration.
  return createInlineStyleTraversal(context, () => {}, undefined, visit);
}
