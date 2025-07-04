import { Rule } from 'eslint';
import metadata from '@salesforce-ux/sds-metadata';
import rulesMetadata from '../../../../stylelint-plugin-slds/src/utils/rules';
import { getClassNodesAtEnd } from '../../../../stylelint-plugin-slds/src/utils/selector-utils';
import replacePlaceholders from '../../../../stylelint-plugin-slds/src/utils/util';

const ruleId = 'slds/no-slds-class-overrides';
const meta = rulesMetadata[ruleId] || {};
const warningMsg = meta['warningMsg'] || 'Overriding ${selector} isn’t supported. To differentiate SLDS and custom classes, create a CSS class in your namespace. Examples: myapp-input, myapp-button';
const sldsClasses = metadata.sldsClasses;
const sldsSet = new Set(sldsClasses);

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: warningMsg,
      recommended: false,
    },
    schema: [],
  },
  create(context) {
    return {
      Rule(node: any) {
        if (!context.filename.match(/\.(css|scss)$/)) return;
        const prelude = node.prelude;
        if (!prelude || prelude.type !== 'SelectorList' || !Array.isArray(prelude.children)) return;
        prelude.children.forEach((selectorNode: any) => {
          if (!selectorNode || selectorNode.type !== 'Selector' || !Array.isArray(selectorNode.children)) return;
          selectorNode.children.forEach((child: any) => {
            if (child.type === 'ClassSelector' && typeof child.name === 'string' && child.name.startsWith('slds-')) {
              if (sldsSet.has(child.name)) {
                context.report({
                  node,
                  loc: child.loc,
                  message: replacePlaceholders(warningMsg, { selector: `.${child.name}` }),
                });
              }
            }
          });
        });
      },
    };
  },
};

module.exports = rule; 