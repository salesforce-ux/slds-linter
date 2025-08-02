import { findAttr, isAttributesEmpty } from "./utils/node";
import metadata from '@salesforce-ux/sds-metadata';
import { getRuleMessages } from '../utils/yaml-message-loader';

const deprecatedClasses = metadata.deprecatedClasses;
const ruleMessages = getRuleMessages('no-deprecated-classes-slds2');

export = {
  meta: {
    type: "problem", // The rule type
    docs: {
      category: "Best Practices",
      recommended: true,
      description: ruleMessages.description,
      url: ruleMessages.url
    },
    schema: [], // No additional options needed
    messages: ruleMessages.messages,
  },

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
            const classNameStart = classAttr.value.value.indexOf(className) +7; // 7 here is for `class= "`
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