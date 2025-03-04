import { findAttr, isAttributesEmpty } from "./utils/node";
import { bemMapping } from "./bem-mapping";

export = {
  meta: {
    type: "problem", // The rule type
    docs: {
      category: "Stylistic Issues",
      recommended: true,
    },
    fixable: "code", // This rule can be fixed automatically
    schema: [
      {
        type: "object",
        properties: {
          pattern: { type: "string" }, // Regex pattern for BEM
          flags: { type: "string" }, // Regex flags
        },
        additionalProperties: false,
      },
    ],
    messages: {
      errorMsg:
        "The {{actual}} class doesn’t follow the correct BEM naming convention.",
      suggestedMsg:
        "{{actual}} has been retired. Update it to the new name {{newValue}}.",
    },
  },

  create(context) {
    const pattern =
      /^(?:[a-z0-9]+(?:-[a-z0-9]+)*)(__[a-z0-9]+(?:-[a-z0-9]+)*)?(--[a-z0-9]+(?:-[a-z0-9]+)*)?$/;

    const checkNaming = (name) => pattern.test(name);

    function check(node) {
      if (isAttributesEmpty(node)) {
        return;
      }
      const classAttr = findAttr(node, "class");
      if (classAttr && classAttr.value) {
        const classNames = classAttr.value.value.split(/\s+/);
        classNames.forEach((className) => {
          if (className && !checkNaming(className)) {
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
              data: {
                actual: className,
                newValue
              },
              messageId: newValue? "suggestedMsg": "errorMsg",
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