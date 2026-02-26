import { Rule } from 'eslint';
import { findAttr, isAttributesEmpty } from "../utils/node";
import metadata from '@salesforce-ux/sds-metadata';
import ruleMessages from '../config/rule-messages';
import { createCssVisitor } from './v9/no-deprecated-slds-classes';

const deprecatedClasses = metadata.deprecatedClasses;
const ruleConfig = ruleMessages['no-deprecated-classes-slds2'];
const { type, description, url, messages } = ruleConfig;

/**
 * HTML implementation for detecting deprecated SLDS classes in HTML templates.
 * Checks class attributes on HTML elements for deprecated class names.
 */
const noDeprecatedClassesSlds2Html = {
  create(context) {
    function check(node) {
      if (isAttributesEmpty(node)) {
        return;
      }

      const classAttr = findAttr(node, "class");
      if (classAttr && classAttr.value) {
        const classNames = classAttr.value.value.split(/\s+/);
        classNames.forEach((className) => {
          if (className && deprecatedClasses.includes(className)) {
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

            context.report({
              node,
              loc: { start: startLoc, end: endLoc },
              messageId: 'deprecatedClass',
              data: {
                className,
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
const noDeprecatedClassesSlds2 = {
  meta: {
    type,
    docs: {
      category: "Best Practices",
      recommended: true,
      description,
      url
    },
    schema: [],
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
        return createCssVisitor(context);
      } catch (error) {
        // If CSS implementation fails, likely ESLint v8 without CSS support
        // Return empty visitor to avoid errors
        return {};
      }
    } else {
      // Use HTML implementation (compatible with both ESLint v8 and v9)
      return noDeprecatedClassesSlds2Html.create(context);
    }
  },
};

export = noDeprecatedClassesSlds2;