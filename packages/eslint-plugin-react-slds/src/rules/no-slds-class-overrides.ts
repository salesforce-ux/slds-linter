import { type RuleFunction } from '@eslint-react/kit';
import metadata from '@salesforce-ux/sds-metadata';
import { createReactRule } from '../utils/react-rule';
import { createStyledComponentsSelectorVisitor } from '../utils/styled-components';

const sldsClasses = new Set(metadata.sldsPlusClasses);

function noSldsClassOverrides(): RuleFunction {
  // styled.div`&.slds-button { color: red; }`
  return context => createStyledComponentsSelectorVisitor(context, classes => {
    const classToken = classes.at(-1);
    if (!classToken?.name.startsWith('slds-') || !sldsClasses.has(classToken.name)) return;

    context.report({
      node: classToken.node,
      loc: {
        start: context.sourceCode.getLocFromIndex(classToken.range[0]),
        end: context.sourceCode.getLocFromIndex(classToken.range[1]),
      },
      messageId: 'sldsClassOverride',
      data: { className: classToken.name },
    });
  });
}

export default createReactRule('no-slds-class-overrides', noSldsClassOverrides);
