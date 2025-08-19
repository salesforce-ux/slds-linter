import { Rule } from 'eslint';
import ruleMessages from '../../config/rule-messages.yml';

const ruleConfig = ruleMessages['reduce-annotations'];
const { type, description, url, messages } = ruleConfig;

// SLDS validator annotations to detect and flag for removal
const SLDS_ANNOTATIONS = [
  "@sldsValidatorIgnoreNextLine", 
  "@sldsValidatorAllow", 
  "@sldsValidatorIgnore"
];

// CSS comment pattern for detecting annotations
const COMMENT_REGEX = /\/\*[\s\S]*?\*\//g;

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
        const text = sourceCode.getText();
        let match;
        
        // Find all CSS comments and check for SLDS validator annotations
        while ((match = COMMENT_REGEX.exec(text)) !== null) {
          const commentContent = match[0].slice(2, -2).trim(); // Remove /* and */
          
          // Check if comment contains any SLDS validator annotation
          const hasAnnotation = SLDS_ANNOTATIONS.some(annotation => 
            commentContent.startsWith(annotation)
          );
          
          if (hasAnnotation) {
            // Calculate line and column position
            const beforeComment = text.substring(0, match.index);
            const lines = beforeComment.split('\n');
            const line = lines.length;
            const column = lines[lines.length - 1].length + 1;
            
            context.report({
              loc: {
                start: { line, column },
                end: { line, column: column + match[0].length }
              },
              messageId: 'removeAnnotation',
            });
          }
        }
      },
    };
  },
} as Rule.RuleModule;
