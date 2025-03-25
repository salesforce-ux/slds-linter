import { findAttr, isAttributesEmpty } from "./utils/node";
import { bemMapping } from "./bem-mapping";

export = {
  meta: {
    type: "problem", // The rule type
    docs: {
      category: "Stylistic Issues",
      recommended: true,
      description: "Replace BEM double-dash syntax in class names with single underscore syntax.",
      url : ""
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
          if (className && className in bemMapping) {
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
              message: JSON.stringify({message: "{{actual}} has been retired. Update it to the new name {{newValue}}.", suggestions:[newValue]}),
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