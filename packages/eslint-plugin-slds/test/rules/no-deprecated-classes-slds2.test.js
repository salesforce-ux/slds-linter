const { RuleTester } = require("eslint"); // Import RuleTester
const rule = require("../../src/rules/no-deprecated-classes-slds2"); // Import the rule
const path = require("path");
const fs = require("fs");

// Create a mock deprecatedClasses.json file for testing
const mockDeprecatedClassesPath = path.resolve(
  __dirname,
  "./__mocks__/deprecatedClasses.test.json"
);

const ruleTester = new RuleTester({
  parser: require.resolve("@html-eslint/parser"), // Specify the parser for HTML files
});

ruleTester.run("no-deprecated-classes", rule, {
  valid: [
    {
      code: `<div class="new-class"></div>`, // Valid class
    },
    {
      code: `<div class="working_class"></div>`, // Another valid class
    },
    {
      code: `<div></div>`, // No class attribute
    },
  ],
  invalid: [
    {
      code: `<div class="slds-action-overflow--touch"></div>`, // Single deprecated class
      errors: [
        {
          message: "{\"message\":\"The class slds-action-overflow--touch isn't available in SLDS 2. Update it to a class supported in SLDS 2. See lightningdesignsystem.com for more information.\",\"suggestions\":[]}",
          line: 1,
          column: 13,
        },
      ],
    },
    {
      code: `<div class="slds-app-launcher__tile-body_small slds-app-launcher__tile-figure_small"></div>`, // Multiple deprecated classes
      errors: [
        {
          message: "{\"message\":\"The class slds-app-launcher__tile-body_small isn't available in SLDS 2. Update it to a class supported in SLDS 2. See lightningdesignsystem.com for more information.\",\"suggestions\":[]}",
          line: 1,
          column: 13,
        },
        {
          message:  "{\"message\":\"The class slds-app-launcher__tile-figure_small isn't available in SLDS 2. Update it to a class supported in SLDS 2. See lightningdesignsystem.com for more information.\",\"suggestions\":[]}",
          line: 1,
          column: 48,
        },
      ],
    },
  ],
});