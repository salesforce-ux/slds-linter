import { merge, type RuleFunction } from '@eslint-react/kit';
import metadata from '@salesforce-ux/sds-metadata';
import { type TSESTree } from '@typescript-eslint/utils';
import { createClassAttributeVisitor } from '../utils/class-attribute';
import { createReactRule } from '../utils/react-rule';
import { createStyledComponentsClassVisitor } from '../utils/styled-components';

const deprecatedClasses = new Set(metadata.deprecatedClasses);

function noDeprecatedClassesSlds2(): RuleFunction {
  return context => {
    const reportClass = (node: TSESTree.Node, className: string, range: [number, number]) => {
      if (!deprecatedClasses.has(className)) return;

      context.report({
        node,
        loc: {
          start: context.sourceCode.getLocFromIndex(range[0]),
          end: context.sourceCode.getLocFromIndex(range[1]),
        },
        messageId: 'deprecatedClass',
        data: { className },
      });
    };
    // <div className="slds-deprecated-class" />
    const classVisitor = createClassAttributeVisitor(context, token => {
      reportClass(token.node, token.name, token.range);
    });
    // styled.div`&.slds-deprecated-class {}`
    const styledComponentsVisitor = createStyledComponentsClassVisitor(
      context,
      token => reportClass(token.node, token.name, token.range),
    );

    return merge(classVisitor, styledComponentsVisitor);
  };
}

export default createReactRule('no-deprecated-classes-slds2', noDeprecatedClassesSlds2);
