import { findAttr, isAttributesEmpty } from "./utils/node";
//TODO: load deprecatedClasses from @salesforce-ux/metadata-slds instead of local res file.
import { deprecatedClasses } from "./deprecatedClasses";

export = {
  meta: {
    type: "problem", // The rule type
    docs: {
      description: "Replace classes that aren’t available with SLDS 2 classes. See lightningdesignsystem.com for more info.",
      category: "Best Practices",
      recommended: true,
    },
    schema: [], // No additional options needed
    messages: {
      deprecatedClass: "The class '{{className}}' isn't available in SLDS 2. Update it to a class supported in SLDS 2. See lightningdesignsystem.com for more information.",
    },
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
              data: {
                className,
              },
              messageId: "deprecatedClass",
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