import { findAttr, isAttributesEmpty } from "./utils/node";
import metadata from '@salesforce-ux/sds-metadata';
const deprecatedClasses = metadata.deprecatedClasses;

export = {
  meta: {
    type: "problem", // The rule type
    docs: {
      category: "Best Practices",
      recommended: true,
      description: "Replace classes that aren’t available with SLDS 2 classes. See lightningdesignsystem.com for more info.",
      url : "https://developer.salesforce.com/docs/platform/slds-linter/guide/reference-rules.html#no-deprecated-classes-slds2"
    },
    schema: [], // No additional options needed
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
              message: JSON.stringify({message:"The class {{className}} isn't available in SLDS 2. Update it to a class supported in SLDS 2. See lightningdesignsystem.com for more information.", suggestions:[]}),
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