import { Rule } from 'eslint';
import ruleMessages from '../../config/rule-messages';

const ruleConfig = ruleMessages['reduce-annotations'];
const { type, description, url, messages } = ruleConfig;

// SLDS validator annotations to detect and flag for removal
const SLDS_ANNOTATIONS = [
  "@sldsValidatorIgnoreNextLine", 
  "@sldsValidatorAllow", 
  "@sldsValidatorIgnore"
];

export default {
  meta: {
    type,
    docs: {
      description,
      recommended: true,
      url,
    },
    messages,
  },
  
  create(context) {
    return {
      StyleSheet(node) {
        const sourceCode = context.sourceCode;
        
        let comments = (sourceCode as any)?.comments || [];

        comments.forEach(comment => {
          const commentContent = comment.value.trim();
          
          const matchingAnnotation = SLDS_ANNOTATIONS.find(annotation => 
            commentContent.startsWith(annotation)
          );
          
          if (matchingAnnotation) {
            context.report({
              node: comment,
              messageId: 'removeAnnotation'
            });
          }
        });
      },
    };
  },
} as Rule.RuleModule;
