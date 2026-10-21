import {merge, type RuleFunction} from '@eslint-react/kit';
import metadata from '@salesforce-ux/sds-metadata';
import {isDynamicCssRange, visitStaticCssVariableNames, type CssVariableName} from '../utils/css-value';
import {createInlineStyleVisitor} from '../utils/inline-style';
import {createReactRule} from '../utils/react-rule';
import {createStyledComponentsDeclarationVisitor} from '../utils/styled-components';

const deprecatedHooks = metadata.slds1DeprecatedComponentHooks;

function replacement(name: string): string | null {
  if (!name.startsWith('--slds-c-') || !(name in deprecatedHooks)) return null;
  return deprecatedHooks[name];
}

function enforceComponentHookNamingConvention(): RuleFunction {
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
        messageId: 'replace',
        data: {oldValue: name, suggestedMatch},
        fix: fixer => fixer.replaceTextRange(range, suggestedMatch),
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
      // <div style={{color: 'var(--slds-c-accordion-color-border)'}} />
      createInlineStyleVisitor(context, visitValue, report),
      // styled.div`color: var(--slds-c-accordion-color-border);`
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
  'enforce-component-hook-naming-convention',
  enforceComponentHookNamingConvention,
  true,
);
