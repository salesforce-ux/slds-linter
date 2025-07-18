import { Root, Comment } from 'postcss';
import stylelint, { PostcssResult, Rule, RuleSeverity } from 'stylelint';
import ruleMetadata from '../../utils/rulesMetadata';

const { utils, createPlugin } = stylelint;
const ruleName = 'slds/reduce-annotations';

// Fetch metadata
const { severityLevel = 'warning', warningMsg = '' } = ruleMetadata(ruleName) || {};

// Mapping of SLDS validator comments to stylelint comments
const annotationMapping: Record<string, string> = {
  "@sldsValidatorIgnoreNextLine": "stylelint-disable-next-line",
  "@sldsValidatorAllow": "stylelint-enable",
  "@sldsValidatorIgnore": "stylelint-disable"
};

const annotationList = Object.keys(annotationMapping);

// Rule function
const ruleFunction:Partial<stylelint.Rule> = (primaryOptions: boolean, { severity = severityLevel as RuleSeverity } = {}) => {
  return (root: Root, result: PostcssResult) => {
    root.walkComments((comment) => {
      const commentText = comment.text.trim();
      const matchedAnnotation = annotationList.find(annotation => commentText.startsWith(annotation));
      
      if (matchedAnnotation) {
        utils.report({
          message: JSON.stringify({message: warningMsg, suggestions:[]}),
          node: comment,
          result,
          ruleName,
          severity,
          index: comment.source.start.offset,
          endIndex: comment.source.end.offset,
          fix: () => {
            const stylelintComment = annotationMapping[matchedAnnotation];
            // Replace the annotation but preserve any rule names that follow
            const remainingText = commentText.substring(matchedAnnotation.length).trim();
            const newCommentText = remainingText ? `${stylelintComment} ${remainingText}` : stylelintComment;
            comment.text = newCommentText;
          }
        });
      }
    });
  };
};

ruleFunction.ruleName = ruleName;
ruleFunction.meta = {
  url: 'https://developer.salesforce.com/docs/platform/slds-linter/guide/reference-rules.html#reduce-annotations',
  fixable: true
};

// Export the plugin
export default createPlugin(ruleName, <stylelint.Rule>ruleFunction);