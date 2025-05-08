import { Root, Comment } from 'postcss';
import stylelint, { PostcssResult, Rule, RuleSeverity } from 'stylelint';
import ruleMetadata from '../../utils/rulesMetadata';
import { formatMessageWithSuggestions } from '../../../../shared-utils/src';

const { utils, createPlugin } = stylelint;
const ruleName = 'slds/reduce-annotations';

// Fetch metadata
const { severityLevel = 'warning', warningMsg = '' } = ruleMetadata(ruleName) || {};
const annotationList = [
  "@sldsValidatorAllow",
  "@sldsValidatorIgnore",
  "@sldsValidatorIgnoreNextLine"
];

// Rule function
const ruleFunction:Partial<stylelint.Rule> = (primaryOptions: boolean, { severity = severityLevel as RuleSeverity } = {}) => {
  return (root: Root, result: PostcssResult) => {
    root.walkComments((comment) => {
      if (annotationList.some(annotation => comment.text.trim().includes(annotation))) {
        utils.report({
          message: formatMessageWithSuggestions(warningMsg, []),
          node: comment,
          result,
          ruleName,
          severity,
          fix:()=>{
            comment.remove(); // Auto-fix by removing the comment
          }
        });
      }
    });
  };
};

ruleFunction.ruleName = ruleName;
ruleFunction.meta = {
  url: '',
  fixable: true
};

// Export the plugin
export default createPlugin(ruleName, <stylelint.Rule>ruleFunction);