import { Rule } from 'eslint';
import { rulesMetadata, isTargetProperty } from 'slds-shared-utils';

const warningMsg = rulesMetadata['slds/no-important-tag'].warningMsg;

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: warningMsg,
      recommended: false,
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          propertyTargets: {
            type: 'array',
            items: { type: 'string' }
          }
        },
        additionalProperties: false
      }
    ],
  },
  create(context) {
    const options = context.options[0] || {};
    const propertyTargets = options.propertyTargets || [];
    
    return {
      Declaration(node: any) {
        if (!context.filename.match(/\.(css|scss)$/)) return;
        // Match properties based on targets, maintaining stylelint parity
        if (node.important && isTargetProperty(node.property, propertyTargets)) {
          // Report at the property location
          const start = node.loc.start;
          const end = node.loc.end;
          context.report({
            node,
            loc: { start, end },
            message: warningMsg,
            fix(fixer: any) {
              // Remove !important from the full declaration text
              // Use the node's range to get the full declaration
              if (!node.range) return null;
              const sourceCode = context.sourceCode;
              const declText = sourceCode.text.slice(node.range[0], node.range[1]);
              // Remove all !important (with or without leading whitespace)
              const fixedText = declText.replace(/\s*!important\b/g, '');
              return fixer.replaceTextRange([node.range[0], node.range[1]], fixedText);
            },
          });
        }
      },
    };
  },
};

export default rule; 