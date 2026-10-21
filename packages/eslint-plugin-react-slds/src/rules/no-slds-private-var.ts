import {merge, type RuleFunction} from '@eslint-react/kit';
import type {TSESTree} from '@typescript-eslint/utils';
import {isDynamicCssRange} from '../utils/css-value';
import {createInlineStyleVisitor} from '../utils/inline-style';
import {createReactRule} from '../utils/react-rule';
import {createStyledComponentsDeclarationVisitor} from '../utils/styled-components';

const privatePrefix = '--_slds-';

function noSldsPrivateVar(): RuleFunction {
  return context => {
    const reported = new Set<string>();
    const report = (node: TSESTree.Node, name: string, range: [number, number]) => {
      if (!name.startsWith(privatePrefix)) return;
      const key = `${range[0]}:${range[1]}`;
      if (reported.has(key)) return;
      reported.add(key);
      context.report({
        node,
        loc: {
          start: context.sourceCode.getLocFromIndex(range[0]),
          end: context.sourceCode.getLocFromIndex(range[1]),
        },
        messageId: 'privateVar',
        data: {prop: name},
        fix: fixer => fixer.replaceTextRange(
          [range[0], range[0] + privatePrefix.length],
          '--slds-',
        ),
      });
    };

    return merge(
      // <div style={{'--_slds-private': 'red'}} />
      createInlineStyleVisitor(context, () => {}, report),
      // styled.div`--_slds-private: red;`
      createStyledComponentsDeclarationVisitor(context, declaration => {
        if (!isDynamicCssRange(
          declaration.propertyRange[0],
          declaration.propertyRange,
          declaration.dynamicRanges,
        )) {
          report(declaration.node, declaration.property, declaration.propertyRange);
        }
      }),
    );
  };
}

export default createReactRule('no-slds-private-var', noSldsPrivateVar, true);
