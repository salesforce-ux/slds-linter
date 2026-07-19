import { Rule } from 'eslint';
import { findAttr, isAttributesEmpty } from "../utils/node";
import ruleMessages from '../config/rule-messages';
import enforceBemUsageCss from './v9/enforce-bem-usage';
import { getBemReplacement, isBemMappedDeprecated } from '../utils/class-checks';
import {
  isJsxLikeFile,
  mergeVisitors,
  reportRange,
  createClassNameVisitor,
  createCssInJsVisitor,
  type JsxClass,
} from '../utils/jsx';

const ruleConfig = ruleMessages['enforce-bem-usage'];
const { type, description, url, messages } = ruleConfig;

const enforceBemUsageHtml = {
  create(context) {  

    function check(node) {
      if (isAttributesEmpty(node)) {
        return;
      }
      const classAttr = findAttr(node, "class");
      if (classAttr && classAttr.value) {
        const classNames = classAttr.value.value.split(/\s+/);
        classNames.forEach((className) => {
          const newValue = getBemReplacement(className);
          if (className && newValue && !isBemMappedDeprecated(className)) {
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
              messageId: 'bemDoubleDash',
              data: {
                actual: className,
                newValue
              },
              fix(fixer) {
                const newClassValue = classAttr.value.value.replace(
                  className,
                  newValue
                );
                return fixer.replaceTextRange(
                  [classAttr.value.range[0], classAttr.value.range[1]],
                  `${newClassValue}`
                );
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
 * JSX/React implementation. Checks className tokens (string, template literal,
 * clsx/classnames) and CSS-in-JS class selectors for retired BEM syntax.
 */
const enforceBemUsageJsx = {
  create(context) {
    const onClass = (info: JsxClass) => {
      const { className, start, end, mappable } = info;
      const newValue = getBemReplacement(className);
      if (!newValue || isBemMappedDeprecated(className)) {
        return;
      }
      reportRange(context, start, end, {
        messageId: 'bemDoubleDash',
        data: { actual: className, newValue },
        fix: mappable ? (fixer) => fixer.replaceTextRange([start, end], newValue) : undefined,
      });
    };

    return mergeVisitors(
      createClassNameVisitor(context, onClass),
      createCssInJsVisitor(context, () => {}, onClass)
    );
  },
};

// Create a hybrid rule that works for HTML, CSS, and JSX
const enforceBemUsage = {
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

    if (filename.endsWith('.css') || filename.endsWith('.scss')) {
      try {
        return enforceBemUsageCss.create(context);
      } catch (error) {
        return {};
      }
    } else if (isJsxLikeFile(filename)) {
      return enforceBemUsageJsx.create(context);
    } else {
      return enforceBemUsageHtml.create(context);
    }
  },
};

export = enforceBemUsage;
