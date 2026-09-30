import { merge, type RuleFunction } from '@eslint-react/kit';
import metadata from '@salesforce-ux/sds-metadata';
import { isDynamicCssRange, visitStaticLwcVarCalls, type CssVariableCall } from '../utils/css-value';
import { createInlineStyleVisitor } from '../utils/inline-style';
import { createReactRule } from '../utils/react-rule';
import { createStyledComponentsDeclarationVisitor } from '../utils/styled-components';

const lwcToSlds = metadata.lwcToSlds;

type Replacement = string | string[];
type Category = 'empty' | 'array' | 'slds' | 'raw';

function replacement(token: string): { category: Category; value: Replacement } | null {
  const entry = lwcToSlds[token];
  if (!entry || entry.continueToUse) return null;
  const value = entry.replacement || '';
  if (!value || value === '--') return { category: 'empty', value };
  if (Array.isArray(value)) return { category: 'array', value };
  return { category: value.startsWith('--slds-') ? 'slds' : 'raw', value };
}

function message(token: string, category: Category, value: Replacement) {
  if (category === 'empty') {
    return { messageId: 'errorWithNoRecommendation', data: { oldValue: token } } as const;
  }
  const newValue = Array.isArray(value)
    ? value.map((item, index) => `\n${index + 1}. ${item}`).join('')
    : value;
  return {
    messageId: category === 'raw' ? 'errorWithReplacement' : 'errorWithStyleHooks',
    data: { oldValue: token, newValue },
  } as const;
}

function lwcTokenToSldsHook(): RuleFunction {
  return context => {
    const reported = new Set<string>();
    const reportCall = (call: CssVariableCall) => {
      const recommendation = replacement(call.name);
      if (!recommendation) return false;
      const consumesCall = recommendation.category === 'slds' || recommendation.category === 'raw';
      const key = `${call.range[0]}:${call.range[1]}`;
      if (reported.has(key)) return consumesCall;
      reported.add(key);
      const details = message(call.name, recommendation.category, recommendation.value);
      const fix = recommendation.category === 'slds'
        ? `var(${recommendation.value as string}, ${call.source})`
        : recommendation.category === 'raw' ? recommendation.value as string : null;
      context.report({
        node: call.node,
        loc: {
          start: context.sourceCode.getLocFromIndex(call.range[0]),
          end: context.sourceCode.getLocFromIndex(call.range[1]),
        },
        ...details,
        fix: fix ? fixer => fixer.replaceTextRange(call.range, fix) : undefined,
      });
      return consumesCall;
    };
    const reportProperty = (node: CssVariableCall['node'], name: string, range: [number, number]) => {
      const recommendation = replacement(name);
      const key = `${range[0]}:${range[1]}`;
      if (!recommendation || reported.has(key)) return;
      reported.add(key);
      const details = message(name, recommendation.category, recommendation.value);
      const fix = recommendation.category === 'slds' ? recommendation.value as string : null;
      context.report({
        node,
        loc: {
          start: context.sourceCode.getLocFromIndex(range[0]),
          end: context.sourceCode.getLocFromIndex(range[1]),
        },
        ...details,
        fix: fix ? fixer => fixer.replaceTextRange(range, fix) : undefined,
      });
    };

    return merge(
      // <div style={{color: 'var(--lwc-brandPrimary)'}} />
      createInlineStyleVisitor(context, (node, value, start, dynamicRanges) => {
        visitStaticLwcVarCalls(node, value, start, call => {
          if (isDynamicCssRange(call.range[0], call.range, dynamicRanges)) return true;
          return reportCall(call);
        });
      }, reportProperty),
      // styled.div`color: var(--lwc-brandPrimary);`
      createStyledComponentsDeclarationVisitor(context, declaration => {
        reportProperty(declaration.node, declaration.property, declaration.propertyRange);
        visitStaticLwcVarCalls(declaration.node, declaration.value, declaration.valueStart, call => {
          if (isDynamicCssRange(call.range[0], call.range, declaration.dynamicRanges)) return true;
          return reportCall(call);
        });
      }),
    );
  };
}

export default createReactRule('lwc-token-to-slds-hook', lwcTokenToSldsHook, true);
