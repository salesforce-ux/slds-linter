import { Rule } from 'eslint';
import { findAttr, isAttributesEmpty } from "../utils/node";
import ruleMessages from '../config/rule-messages';
import { createCssVisitor } from './v9/no-deprecated-slds-classes';
import { isDeprecatedClassName } from '../utils/class-checks';
import {
  isJsxLikeFile,
  mergeVisitors,
  reportRange,
  createClassNameVisitor,
  createCssInJsVisitor,
  type JsxClass,
} from '../utils/jsx';

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
          if (className && isDeprecatedClassName(className)) {
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

/**
 * JSX/React implementation. Checks className tokens and CSS-in-JS class
 * selectors for classes not available in SLDS 2.
 */
const noDeprecatedClassesSlds2Jsx = {
  create(context) {
    const onClass = (info: JsxClass) => {
      const { className, start, end } = info;
      if (isDeprecatedClassName(className)) {
        reportRange(context, start, end, {
          messageId: 'deprecatedClass',
          data: { className },
        });
      }
    };

    return mergeVisitors(
      createClassNameVisitor(context, onClass),
      createCssInJsVisitor(context, () => {}, onClass)
    );
  },
};

// Create a hybrid rule that works for HTML, CSS, and JSX
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

    if (filename.endsWith('.css') || filename.endsWith('.scss')) {
      try {
        return createCssVisitor(context);
      } catch (error) {
        return {};
      }
    } else if (isJsxLikeFile(filename)) {
      return noDeprecatedClassesSlds2Jsx.create(context);
    } else {
      return noDeprecatedClassesSlds2Html.create(context);
    }
  },
};

export = noDeprecatedClassesSlds2;
