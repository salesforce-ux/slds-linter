import { merge, type RuleFunction } from '@eslint-react/kit';
import metadata from '@salesforce-ux/sds-metadata';
import { isDynamicCssRange, visitStaticCssVariableNames, type CssVariableName } from '../utils/css-value';
import { createInlineStyleVisitor } from '../utils/inline-style';
import { createReactRule } from '../utils/react-rule';
import { createStyledComponentsDeclarationVisitor } from '../utils/styled-components';

const fallbacks = metadata.slds1ExcludedVars as Record<string, string | number>;

function noSldsVarWithoutFallback(): RuleFunction {
  return context => {
    const reported = new Set<string>();
    const report = (variable: CssVariableName) => {
      if (variable.hasFallback || !variable.name.startsWith('--slds-')) return;
      const metadataFallback = fallbacks[variable.name];
      if (metadataFallback == null) return;
      const recommendation = String(metadataFallback);
      const key = `${variable.range[0]}:${variable.range[1]}`;
      if (reported.has(key)) return;
      reported.add(key);
      context.report({
        node: variable.node,
        loc: {
          start: context.sourceCode.getLocFromIndex(variable.range[0]),
          end: context.sourceCode.getLocFromIndex(variable.range[1]),
        },
        messageId: 'varWithoutFallback',
        data: { cssVar: variable.name, recommendation },
        fix: fixer => fixer.replaceTextRange(
          variable.functionRange,
          `var(${variable.name}, ${recommendation})`,
        ),
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
          report(variable);
        }
      });
    };

    return merge(
      // <div style={{color: 'var(--slds-g-color-brand-base-50)'}} />
      createInlineStyleVisitor(context, visitValue),
      // styled.div`color: var(--slds-g-color-brand-base-50);`
      createStyledComponentsDeclarationVisitor(context, declaration => {
        visitValue(declaration.node, declaration.value, declaration.valueStart, declaration.dynamicRanges);
      }),
    );
  };
}

export default createReactRule('no-slds-var-without-fallback', noSldsVarWithoutFallback, true);
