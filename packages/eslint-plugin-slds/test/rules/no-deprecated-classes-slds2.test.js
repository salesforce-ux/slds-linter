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
  languageOptions: {
    parser: require("@html-eslint/parser"), // Specify the parser for HTML files using flat config format
    ecmaVersion: 2021,
    sourceType: "module"
  }
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
          messageId: "deprecatedClass",
          line: 1,
          column: 13,
        },
      ],
    },
    {
      code: `<div class="slds-app-launcher__tile-body_small slds-app-launcher__tile-figure_small"></div>`, // Multiple deprecated classes
      errors: [
        {
          messageId: "deprecatedClass",
          line: 1,
          column: 13,
        },
        {
          messageId: "deprecatedClass",
          line: 1,
          column: 48,
        },
      ],
    },
  ],
});