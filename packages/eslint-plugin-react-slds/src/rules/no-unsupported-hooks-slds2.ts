import { merge, type RuleFunction } from '@eslint-react/kit';
import metadata from '@salesforce-ux/sds-metadata';
import { isDynamicCssRange, visitStaticCssVariableNames, type CssVariableName } from '../utils/css-value';
import { createInlineStyleVisitor } from '../utils/inline-style';
import { createReactRule } from '../utils/react-rule';
import { createStyledComponentsDeclarationVisitor } from '../utils/styled-components';

const deprecatedHooks = new Set(metadata.deprecatedStylingHooks);

function noUnsupportedHooksSlds2(): RuleFunction {
  return context => {
    const reported = new Set<string>();
    const report = (node: CssVariableName['node'], name: string, range: [number, number]) => {
      const key = `${range[0]}:${range[1]}`;
      if (!deprecatedHooks.has(name) || reported.has(key)) return;
      reported.add(key);
      context.report({
        node,
        loc: {
          start: context.sourceCode.getLocFromIndex(range[0]),
          end: context.sourceCode.getLocFromIndex(range[1]),
        },
        messageId: 'deprecated',
        data: { token: name },
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
      // <div style={{color: 'var(--slds-g-deprecated-hook)'}} />
      createInlineStyleVisitor(context, visitValue, report),
      // styled.div`color: var(--slds-g-deprecated-hook);`
      createStyledComponentsDeclarationVisitor(context, declaration => {
        report(declaration.node, declaration.property, declaration.propertyRange);
        visitValue(
          declaration.node,
          declaration.value,
          declaration.valueStart,
          declaration.dynamicRanges,
        );
      }),
    );
  };
}

export default createReactRule('no-unsupported-hooks-slds2', noUnsupportedHooksSlds2);
