const rule = require('../../src/v9/rules/no-important-tag').default;
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
      code: `.example { background-color: blue; font-size: 14px; }`,
      filename: 'test.css',
    },
    {
      code: `.custom-class { margin: 10px; padding: 5px; }`,
      filename: 'test.css',
    },
  ],
  invalid: [
    {
      code: `.example { color: red !important; }`,
      filename: 'test.css',
      errors: [{
        message: /Avoid using '!important' unless absolutely necessary/i
      }]
    },
    {
      code: `.example { background-color: blue !important; font-size: 14px !important; }`,
      filename: 'test.css',
      errors: [
        {
          message: /Avoid using '!important' unless absolutely necessary/i
        },
        {
          message: /Avoid using '!important' unless absolutely necessary/i
        }
      ]
    },
  ]
}); 