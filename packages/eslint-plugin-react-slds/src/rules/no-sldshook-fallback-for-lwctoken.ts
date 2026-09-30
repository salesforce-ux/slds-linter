import { merge, type RuleFunction } from '@eslint-react/kit';
import metadata from '@salesforce-ux/sds-metadata';
import {
  visitStaticLwcSldsFallbacks,
  isDynamicCssRange,
  type CssVariableFallback,
} from '../utils/css-value';
import { createInlineStyleVisitor } from '../utils/inline-style';
import { createReactRule } from '../utils/react-rule';
import { createStyledComponentsDeclarationVisitor } from '../utils/styled-components';

const knownHooks = new Set([
  ...metadata.sldsPlusStylingHooks.global,
  ...metadata.sldsPlusStylingHooks.component,
]);

function noSldshookFallbackForLwctoken(): RuleFunction {
  return context => {
    const reported = new Set<string>();
    const report = (fallback: CssVariableFallback) => {
      const normalized = fallback.sldsToken.replace(/^--sds-/u, '--slds-');
      const key = `${fallback.range[0]}:${fallback.range[1]}`;
      if (!knownHooks.has(normalized) || reported.has(key)) return;
      reported.add(key);
      context.report({
        node: fallback.node,
        loc: {
          start: context.sourceCode.getLocFromIndex(fallback.range[0]),
          end: context.sourceCode.getLocFromIndex(fallback.range[1]),
        },
        messageId: 'unsupportedFallback',
        data: { lwcToken: fallback.lwcToken, sldsToken: fallback.sldsToken },
      });
    };
    const visitValue = (
      node: CssVariableFallback['node'],
      value: string,
      start: number,
      dynamicRanges: Array<[number, number]> = [],
    ) => {
      visitStaticLwcSldsFallbacks(node, value, start, fallback => {
        if (!isDynamicCssRange(fallback.relationshipRange[0], fallback.relationshipRange, dynamicRanges)) report(fallback);
      });
    };

    return merge(
      // <div style={{color: 'var(--lwc-color, var(--slds-g-color-brand-base-50))'}} />
      createInlineStyleVisitor(context, visitValue),
      // styled.div`color: var(--lwc-color, var(--slds-g-color-brand-base-50));`
      createStyledComponentsDeclarationVisitor(context, declaration => {
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

export default createReactRule(
  'no-sldshook-fallback-for-lwctoken',
  noSldshookFallbackForLwctoken,
);
