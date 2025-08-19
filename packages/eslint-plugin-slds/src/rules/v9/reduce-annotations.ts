import { Rule } from 'eslint';
import ruleMessages from '../../config/rule-messages.yml';

const ruleConfig = ruleMessages['reduce-annotations'];
const { type, description, url, messages } = ruleConfig;

// List of annotations to detect and flag
const annotationList = ["@sldsValidatorIgnoreNextLine", "@sldsValidatorAllow", "@sldsValidatorIgnore"];

// Helper function for manual location calculation
function calculateLocation(text: string, index: number) {
  const lines = text.substring(0, index).split('\n');
  return {
    line: lines.length,
    column: lines[lines.length - 1].length
  };
}

// Fallback method for comment detection if AST doesn't expose comments directly
function fallbackCommentDetection(context, rootNode) {
  const sourceCode = context.sourceCode;
  const text = sourceCode.getText();
  
  // Only use regex as absolute fallback
  const commentRegex = /\/\*[\s\S]*?\*\//g;
  let match;
  
  while ((match = commentRegex.exec(text)) !== null) {
    const commentText = match[0].slice(2, -2).trim();
    
    const matchedAnnotation = annotationList.find(annotation => 
      commentText.startsWith(annotation)
    );
    
    if (matchedAnnotation) {
      const commentStart = match.index;
      const commentEnd = match.index + match[0].length;
      
      // Calculate precise location for the comment start (where annotation begins)
      const beforeMatch = text.substring(0, commentStart);
      const lines = beforeMatch.split('\n');
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
}

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
      // CSS parser optimization: try multiple approaches for comment detection
      "StyleSheet"(node) {
        const sourceCode = context.sourceCode;
        
        // Approach 1: Try to get comments using ESLint's method(when available)
        // try {
        //    ...implementation
        // } catch (error) {
        //   // getAllComments() not available in CSS context, continue to fallback
        // }
        
        // Approach 2: Use optimized regex parsing (based on @eslint/css limitations)
        // This is currently the most reliable approach for CSS files
        fallbackCommentDetection(context, node);
      },
    };
  },
} as Rule.RuleModule;
