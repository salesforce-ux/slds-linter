import { Rule } from 'eslint';
import rulesMetadata from '../../../../stylelint-plugin-slds/src/utils/rules';
import { isTargetProperty } from '../../../../stylelint-plugin-slds/src/utils/prop-utills';

const ruleId = 'slds/no-important-tag';
const meta = rulesMetadata[ruleId] || {};
const warningMsg = meta['warningMsg'] || "Avoid using '!important' unless absolutely necessary.";

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: warningMsg,
      recommended: false,
    },
    fixable: 'code',
    schema: [],
  },
  create(context) {
    return {
      Declaration(node: any) {
        if (!context.filename.match(/\.(css|scss)$/)) return;
        // Match all properties, as in stylelint
        if (node.important && isTargetProperty(node.property, [])) {
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

module.exports = rule; 