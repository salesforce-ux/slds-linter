import { Root, Comment } from 'postcss';
import stylelint, { PostcssResult, Rule, RuleSeverity } from 'stylelint';
import ruleMetadata from '../../utils/rulesMetadata';

const { utils, createPlugin } = stylelint;
const ruleName = 'slds/reduce-annotations';

// Fetch metadata
const { severityLevel = 'warning', warningMsg = '' } = ruleMetadata(ruleName) || {};


const annotationList = ["@sldsValidatorIgnoreNextLine", "@sldsValidatorAllow", "@sldsValidatorIgnore"];

// Rule function
const ruleFunction:Partial<stylelint.Rule> = (primaryOptions: boolean, { severity = severityLevel as RuleSeverity } = {}) => {
  return (root: Root, result: PostcssResult) => {
    root.walkComments((comment) => {
      const commentText = comment.text.trim();
      const matchedAnnotation = annotationList.find(annotation => commentText.startsWith(annotation));
      
      if (matchedAnnotation) {
        utils.report({
          message: warningMsg,
          node: comment,
          result,
          ruleName,
          severity,
          index: comment.source.start.offset,
          endIndex: comment.source.end.offset          
        });
      }
    });
  };
};

ruleFunction.ruleName = ruleName;
ruleFunction.meta = {
  url: 'https://developer.salesforce.com/docs/platform/slds-linter/guide/reference-rules.html#reduce-annotations',
  fixable: false
};

// Export the plugin
export default createPlugin(ruleName, <stylelint.Rule>ruleFunction);