import { Rule } from 'eslint';
import metadata from '@salesforce-ux/sds-metadata';
import { rulesMetadata, replacePlaceholders } from 'slds-shared-utils';

const warningMsg = rulesMetadata['slds/no-slds-class-overrides'].warningMsg;
const sldsClasses = metadata.sldsPlusClasses; // ← Using correct dataset for parity
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

export default rule; 