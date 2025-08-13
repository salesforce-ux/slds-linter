import { Rule } from 'eslint';
import { findAttr, isAttributesEmpty } from "../utils/node";
import metadata from '@salesforce-ux/sds-metadata';
import ruleMessages from '../config/rule-messages.yml';
import enforceBemUsageCss from './v9/enforce-bem-usage';

const bemMapping = metadata.bemNaming;
const deprecatedClasses = metadata.deprecatedClasses;
const ruleConfig = ruleMessages['enforce-bem-usage'];
const { type, description, url, messages } = ruleConfig;
/**
 * Checks if a given className or its BEM mapped equivalent is deprecated.
 * 
 * This function checks whether the provided className is included in the
 * `deprecatedClasses` list or if the BEM mapped class is deprecated.
 * 
 * @param className - The class name to check for deprecation.
 * @returns A boolean indicating whether the className or its mapped version is deprecated.
 */
const isDeprecatedClass = (className : string) => {
  return (deprecatedClasses.includes(className) || deprecatedClasses.includes(bemMapping[className]))
}

const htmlRule = {
  create(context) {  

    function check(node) {
      if (isAttributesEmpty(node)) {
        return;
      }
      const classAttr = findAttr(node, "class");
      if (classAttr && classAttr.value) {
        const classNames = classAttr.value.value.split(/\s+/);
        classNames.forEach((className) => {
          if (className && className in bemMapping && !isDeprecatedClass(className)) {
            // Find the exact location of the problematic class name
            const classNameStart = classAttr.value.value.indexOf(className) + 7; // 7 here is for `class= "`
            const classNameEnd = classNameStart + className.length;

            // Use the loc property to get line and column from the class attribute
            const startLoc = {
              line: classAttr.loc.start.line,
              column: classAttr.loc.start.column + classNameStart,
            };
            const endLoc = {
              line: classAttr.loc.start.line,
              column: classAttr.loc.start.column + classNameEnd,
            };

            // Check whether a fixed class is available
            const newValue = bemMapping[className];
            context.report({
              node,
              loc: { start: startLoc, end: endLoc },
              messageId: 'bemDoubleDash',
              data: {
                actual: className,
                newValue
              },
              fix(fixer) {
                if (newValue) {
                  const newClassValue = classAttr.value.value.replace(
                    className,
                    newValue
                  );
                  return fixer.replaceTextRange(
                    [classAttr.value.range[0], classAttr.value.range[1]],
                    `${newClassValue}`
                  );
                }
                return null; // Ensure a return value even if no fix is applied
              },
            });
          }
        });
      }
    }

    return {
      Tag: check,
    };
  },
};



// Create a hybrid rule that works for both HTML and CSS
const hybridRule = {
  meta: {
    type,
    docs: {
      recommended: true,
      description,
      url
    },
    fixable: "code",
    messages
  },

  create(context) {
    const filename = context.filename || context.getFilename();
    
    // Check if we're in a CSS context
    if (filename.endsWith('.css') || filename.endsWith('.scss')) {
      // Try to detect if we have CSS support
      // In ESLint v9 with @eslint/css, we should have CSS AST support
      try {
        // Use CSS implementation (ESLint v9 with @eslint/css)
        return enforceBemUsageCss.create(context);
      } catch (error) {
        // If CSS implementation fails, likely ESLint v8 without CSS support
        // Return empty visitor to avoid errors
        return {};
      }
    } else {
      // Use HTML implementation (compatible with both ESLint v8 and v9)
      return htmlRule.create(context);
    }
  },
};

export = hybridRule;