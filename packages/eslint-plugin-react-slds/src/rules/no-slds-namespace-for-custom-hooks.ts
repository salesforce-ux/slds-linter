import { merge, type RuleFunction } from '@eslint-react/kit';
import metadata from '@salesforce-ux/sds-metadata';
import { isDynamicCssRange, visitStaticCssVariableNames, type CssVariableName } from '../utils/css-value';
import { createInlineStyleVisitor } from '../utils/inline-style';
import { createReactRule } from '../utils/react-rule';
import { createStyledComponentsDeclarationVisitor } from '../utils/styled-components';

const knownHooks = new Set([
  ...metadata.sldsPlusStylingHooks.global,
  ...metadata.sldsPlusStylingHooks.component,
  ...metadata.sldsPlusStylingHooks.shared,
]);

function isUnknownReservedHook(name: string): boolean {
  if (!name.startsWith('--slds-') && !name.startsWith('--sds-')) return false;
  const normalized = name.startsWith('--sds-') ? `--slds-${name.slice('--sds-'.length)}` : name;
  return !knownHooks.has(normalized);
}

function noSldsNamespaceForCustomHooks(): RuleFunction {
  return context => {
    const reported = new Set<string>();
    const report = (node: CssVariableName['node'], name: string, range: [number, number]) => {
      const key = `${range[0]}:${range[1]}`;
      if (!isUnknownReservedHook(name) || reported.has(key)) return;
      reported.add(key);
      context.report({
        node,
        loc: {
          start: context.sourceCode.getLocFromIndex(range[0]),
          end: context.sourceCode.getLocFromIndex(range[1]),
        },
        messageId: 'customHookNamespace',
        data: { token: name, tokenWithoutNamespace: name.replace(/^--s(?:ld|d)s-/u, '') },
      });
    };
    const visitValue = (
      node: CssVariableName['node'],
      value: string,
      start: number,
      dynamicRanges: Array<[number, number]> = [],
    ) => {
      visitStaticCssVariableNames(node, value, start, variable => {
        if (!isDynamicCssRange(variable.functionRange[0], variable.range, dynamicRanges, true)) {
          report(variable.node, variable.name, variable.range);
        }
      });
    };

    return merge(
      // <div style={{color: 'var(--slds-my-custom-color)'}} />
      createInlineStyleVisitor(context, visitValue, report),
      // styled.div`color: var(--slds-my-custom-color);`
      createStyledComponentsDeclarationVisitor(context, declaration => {
        if (!isDynamicCssRange(
          declaration.propertyRange[0],
          declaration.propertyRange,
          declaration.dynamicRanges,
        )) {
          report(declaration.node, declaration.property, declaration.propertyRange);
        }
        visitValue(declaration.node, declaration.value, declaration.valueStart, declaration.dynamicRanges);
      }),
    );
  };
}

export default createReactRule(
  'no-slds-namespace-for-custom-hooks',
  noSldsNamespaceForCustomHooks,
);
