const rule = require('../../src/v9/rules/no-slds-class-overrides').default;
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

ruleTester.run('no-slds-class-overrides', rule, {
  valid: [
    {
      code: `
        .custom-button {
          background-color: blue;
        }
        .custom-text {
          font-size: 14px;
        }
      `,
      filename: 'test.css',
    },
    {
      code: `
        .foo {
          color: red;
        }
        .my-custom-class {
          padding: 10px;
        }
      `,
      filename: 'test.css',
    },
    {
      code: `
        .slds-my-own {
          font-size: 14px;
        }
        .custom-namespace-button {
          display: flex;
        }
      `,
      filename: 'test.css',
    },
  ],
  invalid: [
    {
      code: `
        .foo {
          color: red;
        }
        .slds-button {
          background-color: blue;
        }
        .slds-textarea {
          font-size: 14px;
        }
      `,
      filename: 'test.css',
      errors: [
        {
          message: /Overriding \.+slds-button isn't supported\. To differentiate SLDS and custom classes, create a CSS class in your namespace\./i
        },
        {
          message: /Overriding \.+slds-textarea isn't supported\. To differentiate SLDS and custom classes, create a CSS class in your namespace\./i
        }
      ]
    },
    {
      code: `
        .foo {
          color: red;
        }
        .slds-button {
          background-color: blue;
        }
        .slds-button-group {
          display: flex;
        }
      `,
      filename: 'test.css',
      errors: [
        {
          message: /Overriding \.+slds-button isn't supported\. To differentiate SLDS and custom classes, create a CSS class in your namespace\./i
        },
        {
          message: /Overriding \.+slds-button-group isn't supported\. To differentiate SLDS and custom classes, create a CSS class in your namespace\./i
        }
      ]
    },
    {
      code: `
        .foo {
          color: red;
        }
        .slds-button {
          background-color: blue;
        }
        .slds-my-own {
          font-size: 14px;
        }
        .slds-button-group {
          display: flex;
        }
      `,
      filename: 'test.css',
      errors: [
        {
          message: /Overriding \.+slds-button isn't supported\. To differentiate SLDS and custom classes, create a CSS class in your namespace\./i
        },
        {
          message: /Overriding \.+slds-button-group isn't supported\. To differentiate SLDS and custom classes, create a CSS class in your namespace\./i
        }
      ]
    }
  ]
}); 