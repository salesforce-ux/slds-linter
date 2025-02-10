const { RuleTester } = require("eslint"); // Import RuleTester
const rule = require("../../src/rules/no-deprecated-slds-classes"); // Import the rule
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
      code: `<div class="slds-align-content-center"></div>`, // Single deprecated class
      errors: [
        {
          message: "The class 'slds-align-content-center' is deprecated and should not be used.",
          line: 1,
          column: 13,
        },
      ],
    },
    {
      code: `<div class="slds-app-launcher__tile-body_small slds-app-launcher__tile-figure_small"></div>`, // Multiple deprecated classes
      errors: [
        {
          message: "The class 'slds-app-launcher__tile-body_small' is deprecated and should not be used.",
          line: 1,
          column: 13,
        },
        {
          message: "The class 'slds-app-launcher__tile-figure_small' is deprecated and should not be used.",
          line: 1,
          column: 48,
        },
      ],
    },
  ],
});