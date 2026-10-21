import { merge, type RuleFunction } from '@eslint-react/kit';
import metadata from '@salesforce-ux/sds-metadata';
import { createClassAttributeVisitor } from '../utils/class-attribute';
import { createReactRule } from '../utils/react-rule';
import { createStyledComponentsClassVisitor } from '../utils/styled-components';

const bemMapping = metadata.bemNaming;
const deprecatedClasses = new Set(metadata.deprecatedClasses);

function enforceBemUsage(): RuleFunction {
  return context => {
    const checkClass = token => {
      const replacement = bemMapping[token.name];
      if (typeof replacement !== 'string') return;
      if (deprecatedClasses.has(token.name) || deprecatedClasses.has(replacement)) return;

      context.report({
        node: token.node,
        loc: {
          start: context.sourceCode.getLocFromIndex(token.range[0]),
          end: context.sourceCode.getLocFromIndex(token.range[1]),
        },
        messageId: 'bemDoubleDash',
        data: { actual: token.name, newValue: replacement },
        fix: fixer => fixer.replaceTextRange(token.range, replacement),
      });
    };

    return merge(
      // <div className="slds-container--medium" />
      createClassAttributeVisitor(context, checkClass),
      // styled.div`&.slds-container--medium {}`
      createStyledComponentsClassVisitor(context, checkClass),
    );
  };
}

export default createReactRule('enforce-bem-usage', enforceBemUsage, true);
