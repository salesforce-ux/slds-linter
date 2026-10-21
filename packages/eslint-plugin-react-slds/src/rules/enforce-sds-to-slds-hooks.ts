import { merge, type RuleFunction } from '@eslint-react/kit';
import metadata from '@salesforce-ux/sds-metadata';
import { isDynamicCssRange, visitStaticCssVariableNames, type CssVariableName } from '../utils/css-value';
import { createInlineStyleVisitor } from '../utils/inline-style';
import { createReactRule } from '../utils/react-rule';
import { createStyledComponentsDeclarationVisitor } from '../utils/styled-components';

const knownHooks = new Set([
  ...metadata.sldsPlusStylingHooks.global,
  ...metadata.sldsPlusStylingHooks.component,
]);

function replacement(name: string): string | null {
  if (!name.startsWith('--sds-')) return null;
  const suggested = `--slds-${name.slice('--sds-'.length)}`;
  return knownHooks.has(suggested) ? suggested : null;
}

function enforceSdsToSldsHooks(): RuleFunction {
  return context => {
    const reported = new Set<string>();
    const report = (node: CssVariableName['node'], name: string, range: [number, number]) => {
      const suggestedMatch = replacement(name);
      const key = `${range[0]}:${range[1]}`;
      if (!suggestedMatch || reported.has(key)) return;
      reported.add(key);
      context.report({
        node,
        loc: {
          start: context.sourceCode.getLocFromIndex(range[0]),
          end: context.sourceCode.getLocFromIndex(range[1]),
        },
        messageId: 'replaceSdsWithSlds',
        data: { oldValue: name, suggestedMatch },
        fix: fixer => fixer.replaceTextRange(range, suggestedMatch),
      });
    };
    const visitValue = (node: CssVariableName['node'], value: string, start: number, dynamicRanges: Array<[number, number]> = []) => {
      visitStaticCssVariableNames(node, value, start, variable => {
        if (isDynamicCssRange(variable.functionRange[0], variable.range, dynamicRanges, true)) return;
        report(variable.node, variable.name, variable.range);
      });
    };

    return merge(
      // <div style={{color: 'var(--sds-g-color-brand-base-50)'}} />
      createInlineStyleVisitor(context, visitValue, report),
      // styled.div`color: var(--sds-g-color-brand-base-50);`
      createStyledComponentsDeclarationVisitor(context, declaration => {
        report(declaration.node, declaration.property, declaration.propertyRange);
        visitValue(declaration.node, declaration.value, declaration.valueStart, declaration.dynamicRanges);
      }),
    );
  };
}

export default createReactRule('enforce-sds-to-slds-hooks', enforceSdsToSldsHooks, true);
