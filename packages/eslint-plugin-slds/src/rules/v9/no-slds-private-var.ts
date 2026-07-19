import { Rule } from 'eslint';
import ruleMessages from '../../config/rule-messages';
import {
  isJsxLikeFile,
  reportRange,
  createDeclarationVisitor,
  type JsxDeclaration,
} from '../../utils/jsx';

const ruleConfig = ruleMessages['no-slds-private-var'];
const { type, description, url, messages } = ruleConfig;

export default {
  meta: {
    type,
    docs: {
      description,
      recommended: true,
      url,
    },
    fixable: 'code',
    messages
  },
  
  create(context) {
    const filename = context.filename || context.getFilename();

    // JSX/React: inline style objects and CSS-in-JS declarations.
    if (isJsxLikeFile(filename)) {
      return createDeclarationVisitor(context, (decl: JsxDeclaration) => {
        const property = decl.property;
        if (property && property.startsWith('--_slds-') && decl.propertyStart !== null && decl.propertyEnd !== null) {
          const newProperty = property.replace('--_slds-', '--slds-');
          reportRange(context, decl.propertyStart, decl.propertyEnd, {
            messageId: 'privateVar',
            data: { prop: property },
            fix: decl.propertyMappable
              ? (fixer) => fixer.replaceTextRange([decl.propertyStart!, decl.propertyEnd!], newProperty)
              : undefined,
          });
        }
      });
    }

    return {
      // Handle CSS custom properties (declarations starting with --)
      "Declaration"(node) {
        // Check if this is a custom property declaration
        if (node.property && typeof node.property === 'string' && node.property.startsWith('--_slds-')) {
          context.report({
            node,
            messageId: 'privateVar',
            data: { prop: node.property },
            fix(fixer) {
              // Auto-fix: replace --_slds- with --slds-
              const newProperty = node.property.replace('--_slds-', '--slds-');
              const sourceCode = context.sourceCode.getText(node);
              const fixedCode = sourceCode.replace(node.property, newProperty);
              return fixer.replaceText(node, fixedCode);
            }
          });
        }
      },
    };
  },
} as Rule.RuleModule;
