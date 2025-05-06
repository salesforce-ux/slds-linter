const { RuleTester } = require("eslint"); // Import RuleTester
const rule = require("../../src/rules/enforce-bem-usage"); // Import the rule

const ruleTester = new RuleTester({
  parser: require.resolve("@html-eslint/parser"), // Specify the parser for HTML files
});

ruleTester.run("enforce-bem-usage", rule, {
  valid: [
    {
      code: `<div class="block__element_modifier"></div>`, // Valid BEM class name
    },
    {
      code: `<div class="block block__element block__element_modifier"></div>`, // Multiple valid BEM class names
    },
    {
      code: `<div class="header__logo header__logo_small"></div>`, // Another valid BEM example
    },
    {
      code: `<div></div>`, // No class attribute
    },
    {
      code: `<div class="Block--modifier"></div>`, // Invalid: Uppercase letters      
    },
    {
      code: `<div class="block__element--"></div>`, // Invalid: Ends with `--`      
    },
    {
      code: `<div class="slds-action-overflow--touch"></div>`, // Deprecated BEM value     
    },
    {
      code: `<div class="slds-app-launcher__tile--small"></div>`, // Deprecated BEM value     
    },
    {
      code: `<div class="slds-action-overflow_touch"></div>`, // Deprecated BEM equivalent     
    },
  ],
  invalid: [
    {
      code: `<div class="slds-container--medium"></div>`, // Invalid: underscore instead of double underscore
      errors: [
        {
          message: "{\"message\":\"slds-container--medium has been retired. Update it to the new name slds-container_medium.\",\"suggestions\":[\"slds-container_medium\"]}",
          line: 1,
          column: 13,
        },
      ],
      output: `<div class="slds-container_medium"></div>`, // Expected fix (if mapping exists)
    },    
    {
      code: `<div class="block block_element slds-border--left"></div>`, // Invalid: `block_element` not in BEM
      errors: [
        {
          message: "{\"message\":\"slds-border--left has been retired. Update it to the new name slds-border_left.\",\"suggestions\":[\"slds-border_left\"]}",
          line: 1,
          column: 33,
        }
      ],
      output: `<div class="block block_element slds-border_left"></div>`, // Expected fix (replaces `block_element`)
    },
    {
      code: `<div class="slds-p-right--xxx-small"></div>`, // Invalid: Missing block name
      errors: [
        {
          message: "{\"message\":\"slds-p-right--xxx-small has been retired. Update it to the new name slds-p-right_xxx-small.\",\"suggestions\":[\"slds-p-right_xxx-small\"]}",
          line: 1,
          column: 13,
        },
      ],
      output: `<div class="slds-p-right_xxx-small"></div>`, // Expected fix (if mapping exists)
    }
  ],
});