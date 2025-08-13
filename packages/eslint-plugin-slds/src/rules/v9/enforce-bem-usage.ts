import { Rule } from 'eslint';
import metadata from '@salesforce-ux/sds-metadata';
import ruleMessages from '../../config/rule-messages.yml';

const { type, description, url, messages } = ruleMessages['enforce-bem-usage'];

const bemMapping = metadata.bemNaming;
const deprecatedClasses = metadata.deprecatedClasses;

// Create reverse mapping from old BEM (underscore) to new BEM (double dash)
const reverseBemMapping: Record<string, string> = {};
Object.entries(bemMapping).forEach(([newClass, oldClass]) => {
  if (typeof oldClass === 'string') {
    reverseBemMapping[oldClass] = newClass;
  }
});

/**
 * Checks if a given className or its BEM mapped equivalent is deprecated.
 */
const isDeprecatedClass = (className: string): boolean => {
  return deprecatedClasses.includes(className) || deprecatedClasses.includes(bemMapping[className]);
};

export default {
  meta: {
    type,
    docs: {
      description,
      recommended: true,
      url,
    },
    fixable: 'code',
    messages,
  },
  
  create(context) {
    return {
      // Check all class selectors for BEM usage
      "SelectorList Selector ClassSelector"(node) {
        const cssClassSelector = context.sourceCode.getText(node);
        
        // Extract class name (remove the leading dot)
        const className = cssClassSelector.substring(1);
        
        // Check if it has a BEM mapping (old to new) and is not deprecated
        if (className && className in reverseBemMapping && !isDeprecatedClass(className)) {
          const newValue = reverseBemMapping[className];
          
          context.report({
            node,
            messageId: 'bemDoubleDash',
            data: {
              actual: className,
              newValue,
            },
            fix(fixer) {
              if (newValue) {
                return fixer.replaceText(node, `.${newValue}`);
              }
              return null;
            },
          });
        }
      },
    };
  },
} as Rule.RuleModule;
