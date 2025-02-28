import { Root, Comment } from 'postcss';
import stylelint, { PostcssResult, Rule, RuleSeverity } from 'stylelint';
import ruleMetadata from '../../utils/rulesMetadata';

const { utils, createPlugin } = stylelint;
const ruleName = 'slds/reduce-annotations';

// Fetch metadata
const { severityLevel = 'warning' } = ruleMetadata(ruleName) || {};
const annotationList = [
  "@sldsValidatorAllow",
  "@sldsValidatorIgnore",
  "@sldsValidatorIgnoreNextLine"
];

// Rule function
const rule = (primaryOptions, { severity = severityLevel as RuleSeverity } = {}) => {
  return (root: Root, result: PostcssResult) => {
    root.walkComments((comment) => {
      if (annotationList.some(annotation => comment.text.trim().includes(annotation))) {
        utils.report({
          message: `Avoid using '${comment.text.trim()}'. This is a temporary bypass and should be removed in the future.`,
          node: comment,
          result,
          ruleName,
          severity,
        });
        if (result.stylelint.config.fix) {
          comment.remove(); // Auto-fix by removing the comment
        }
      }
    });
  };
};

export default createPlugin(ruleName, rule as unknown as Rule);