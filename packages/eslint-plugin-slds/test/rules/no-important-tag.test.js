const rule = require('../../src/rules/v9/rules/no-important-tag').default;
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

ruleTester.run('no-important-tag', rule, {
  valid: [
    {
      code: `.example { color: red; }`,
      filename: 'test.css',
    },
    {
      code: `.example { background-color: var(--slds-g-color-brand); }`,
      filename: 'test.css',
    },
    {
      code: `.example { padding: 16px; margin: 8px; }`,
      filename: 'test.css',
    },
    {
      code: `.example { --slds-custom-prop: blue; }`,
      filename: 'test.css',
    },
    {
      code: `.example { 
        /* This is a comment */
        color: blue;
      }`,
      filename: 'test.css',
    },
  ],
  invalid: [
    {
      code: `.example { color: red !important; }`,
      filename: 'test.css',
      errors: [{
        messageId: 'unexpectedImportant',
        type: 'Declaration',
      }],
      output: `.example { color: red ; }`
    },
    {
      code: `.example { background-color: var(--slds-g-color-brand) !important; }`,
      filename: 'test.css',
      errors: [{
        messageId: 'unexpectedImportant',
        type: 'Declaration',
      }],
      output: `.example { background-color: var(--slds-g-color-brand) ; }`
    },
    {
      code: `.example { --slds-custom-prop: blue !important; }`,
      filename: 'test.css',
      errors: [{
        messageId: 'unexpectedImportant',
        type: 'Declaration',
      }],
      output: `.example { --slds-custom-prop: blue ; }`
    },
    {
      code: `.example { color: red ! /* comment */ important; }`,
      filename: 'test.css',
      errors: [{
        messageId: 'unexpectedImportant',
        type: 'Declaration',
      }],
      output: `.example { color: red ; }`
    },
    {
      code: `.example { margin: 16px !  important; }`,
      filename: 'test.css',
      errors: [{
        messageId: 'unexpectedImportant',
        type: 'Declaration',
      }],
      output: `.example { margin: 16px ; }`
    },
    {
      code: `.example { 
        color: red !important; 
        background: blue !important; 
      }`,
      filename: 'test.css',
      errors: [
        {
          messageId: 'unexpectedImportant',
          type: 'Declaration',
        },
        {
          messageId: 'unexpectedImportant',
          type: 'Declaration',
        }
      ],
      output: `.example { 
        color: red ; 
        background: blue ; 
      }`
    }
  ]
}); 