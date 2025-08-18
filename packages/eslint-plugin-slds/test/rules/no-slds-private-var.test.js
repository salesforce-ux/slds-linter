const rule = require('../../src/rules/v9/no-slds-private-var').default;
const { RuleTester } = require('eslint');

let cssPlugin;
try {
  cssPlugin = require('@eslint/css').default || require('@eslint/css');
} catch (e) {
  cssPlugin = require('@eslint/css');
}

const ruleTester = new RuleTester({
  plugins: {
    css: cssPlugin,
  },
  language: 'css/css',
});

ruleTester.run('no-slds-private-var', rule, {
  valid: [
    {
      code: `.example { --slds-valid-var: #fff; }`,
      filename: 'test.css',
    },
    {
      code: `.example { color: red; }`,
      filename: 'test.css',
    },
    {
      code: `.example { background: #123456; }`,
      filename: 'test.css',
    },
    // Custom properties that don't match the private pattern
    {
      code: `.example { --my-custom-var: blue; }`,
      filename: 'test.css',
    },
    {
      code: `.example { --slds-regular-hook: var(--lwc-brand-primary); }`,
      filename: 'test.css',
    },
    // Complex selectors with valid properties
    {
      code: `.container .example:hover { --slds-button-color: #0176d3; }`,
      filename: 'test.css',
    },
    // Regular CSS properties
    {
      code: `.example { margin: 0; padding: 8px; }`,
      filename: 'test.css',
    },
  ],
  invalid: [
    // Basic private variable usage
    {
      code: `.example { --_slds-deprecated-var: #fff; }`,
      output: `.example { --slds-deprecated-var: #fff; }`,
      filename: 'test.css',
      errors: [{
        messageId: 'privateVar',
        type: 'Declaration'
      }]
    },
    
    // Private variable in complex selector
    {
      code: `.container .example { --_slds-private-hook: #123456; }`,
      output: `.container .example { --slds-private-hook: #123456; }`,
      filename: 'test.css',
      errors: [{
        messageId: 'privateVar',
        type: 'Declaration'
      }]
    },

    // Multiple private variables in same file
    {
      code: `
        .example1 { 
          --_slds-deprecated-var: #fff; 
        }
        .example2 { 
          --_slds-another-private: #000; 
        }
      `,
      output: `
        .example1 { 
          --slds-deprecated-var: #fff; 
        }
        .example2 { 
          --slds-another-private: #000; 
        }
      `,
      filename: 'test.css',
      errors: [
        {
          messageId: 'privateVar',
          type: 'Declaration'
        },
        {
          messageId: 'privateVar',
          type: 'Declaration'
        }
      ]
    },

    // Private variable with pseudo-selector
    {
      code: `.example:hover { --_slds-hover-state: #0176d3; }`,
      output: `.example:hover { --slds-hover-state: #0176d3; }`,
      filename: 'test.css',
      errors: [{
        messageId: 'privateVar',
        type: 'Declaration'
      }]
    },

    // Private variable in media query
    {
      code: `
        @media (min-width: 768px) {
          .example { --_slds-responsive-var: 20px; }
        }
      `,
      output: `
        @media (min-width: 768px) {
          .example { --slds-responsive-var: 20px; }
        }
      `,
      filename: 'test.css',
      errors: [{
        messageId: 'privateVar',
        type: 'Declaration'
      }]
    },

    // Private variable with complex value
    {
      code: `.example { --_slds-complex-var: var(--lwc-brand-primary, #0176d3); }`,
      output: `.example { --slds-complex-var: var(--lwc-brand-primary, #0176d3); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'privateVar',
        type: 'Declaration'
      }]
    },
  ]
});
