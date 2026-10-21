import { merge, type RuleFunction } from '@eslint-react/kit';
import metadata from '@salesforce-ux/sds-metadata';
import { isDynamicCssRange, visitStaticTokenCalls, type CssFunctionCall } from '../utils/css-value';
import { createInlineStyleVisitor } from '../utils/inline-style';
import { createReactRule } from '../utils/react-rule';
import { createStyledComponentsDeclarationVisitor } from '../utils/styled-components';

const auraToLwc = metadata.auraToLwcTokensMapping;
const lwcToSlds = metadata.lwcToSlds;
const globalHooks = metadata.globalStylingHooksMetadata?.global || {};

function fallbackFor(sldsHook: string): string | null {
  const value = globalHooks[sldsHook]?.values?.slds;
  if (!value) return null;
  if (!value.startsWith('var(')) return value;
  const innerHook = value.match(/(--slds-[\w-]+)/u)?.[1];
  return innerHook ? globalHooks[innerHook]?.values?.slds || null : null;
}

function replacementFor(tokenName: string): string | null {
  const lwcToken = auraToLwc[tokenName];
  if (!lwcToken?.startsWith('--lwc-')) return null;
  const sldsHook = lwcToSlds[lwcToken]?.replacement;
  if (typeof sldsHook !== 'string' || !sldsHook.startsWith('--slds-')) {
    return `var(${lwcToken})`;
  }
  const fallback = fallbackFor(sldsHook);
  const lwcFallback = fallback ? `var(${lwcToken}, ${fallback})` : `var(${lwcToken})`;
  return `var(${sldsHook}, ${lwcFallback})`;
}

function noDeprecatedTokensSlds1(): RuleFunction {
  return context => {
    const reported = new Set<string>();
    const check = (call: CssFunctionCall) => {
      const replacement = replacementFor(call.name);
      const key = `${call.range[0]}:${call.range[1]}`;
      if (!replacement || reported.has(key)) return;
      reported.add(key);
      context.report({
        node: call.node,
        loc: {
          start: context.sourceCode.getLocFromIndex(call.range[0]),
          end: context.sourceCode.getLocFromIndex(call.range[1]),
        },
        messageId: 'deprecatedToken',
        data: {
          oldValue: `${call.functionName}(${call.name})`,
          newValue: replacement,
        },
        fix: fixer => fixer.replaceTextRange(call.range, replacement),
      });
    };

    return merge(
      // <div style={{color: 'token(brandPrimary)'}} />
      createInlineStyleVisitor(context, (node, value, start, dynamicRanges) => {
        visitStaticTokenCalls(node, value, start, call => {
          if (!isDynamicCssRange(call.range[0], call.range, dynamicRanges)) check(call);
        });
      }),
      // styled.div`color: token(brandPrimary);`
      createStyledComponentsDeclarationVisitor(context, declaration => {
        visitStaticTokenCalls(declaration.node, declaration.value, declaration.valueStart, call => {
          if (!isDynamicCssRange(call.range[0], call.range, declaration.dynamicRanges)) check(call);
        });
      }),
    );
  };
}

export default createReactRule('no-deprecated-tokens-slds1', noDeprecatedTokensSlds1, true);
