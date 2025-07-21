const rule = require('../../src/v9/rules/no-hardcoded-values-slds1').default;
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

ruleTester.run('no-hardcoded-values-slds1', rule, {
  valid: [
    {
      code: `.example { width: 0; }`,
      filename: 'test.css',
    },
    {
      code: `.example { width: 0px; }`,
      filename: 'test.css',
    },
    {
      code: `.example { width: 0.0; }`,
      filename: 'test.css',
    },
    {
      code: `.example { background-color: var(--color-brand); }`,
      filename: 'test.css',
    },
  ],
  invalid: [
    {
      code: `.example { color: #ff0000; }`,
      filename: 'test.css',
      errors: [{
        message: /Replace the #ff0000 static value with an SLDS 1 styling hook: .*slds-g-color-palette-red-50|slds-g-color-error-base-50|slds-g-color-palette-hot-orange-50|slds-g-color-palette-hot-orange-60/i
      }]
      // No output property because this has multiple suggestions (4 hooks) - ESLint v9 strict pattern
    },
    {
      code: `.example { font-size: 0.875rem; }`,
      filename: 'test.css',
      errors: [{ message: /Replace the 0.875rem static value with an SLDS 1 styling hook: .*slds-g-font-scale-1/i }],
      output: `.example { font-size: var(--slds-g-font-scale-1, 0.875rem); }`
    },
    {
      code: `.example { box-shadow: 0px 2px 3px 0px #00000027; }`,
      filename: 'test.css',
      errors: [{ message: /Replace the 0px 2px 3px 0px #00000027 static value with an SLDS 1 styling hook: .*slds-g-shadow-2/i }],
      output: `.example { box-shadow: var(--slds-g-shadow-2, 0px 2px 3px 0px #00000027); }`
    },
    {
      code: `.example { font-size: 16px; }`,
      filename: 'test.css',
      errors: [{ message: /Replace the 16px static value with an SLDS 1 styling hook: .*slds-g-font-scale-2/i }],
      output: `.example { font-size: var(--slds-g-font-scale-2, 16px); }`
    },
    {
      code: `.example { background-color: #123456; }`,
      filename: 'test.css',
      errors: [{
        message: /Replace the #123456 static value with an SLDS 1 styling hook: .*slds-g-color-palette-cloud-blue-20|slds-g-color-palette-blue-15|slds-g-color-brand-base-15|slds-g-color-palette-cloud-blue-30|slds-g-color-palette-blue-20/i
      }]
      // No output property because this has multiple suggestions (5 hooks) - ESLint v9 strict pattern
    },
    {
      code: `.example { padding: 20px; }`,
      filename: 'test.css',
      errors: [{
        message: /There's no replacement styling hook for the 20px static value\. Remove the static value\./i
      }]
      // No output property because this is not auto-fixable
    }
  ]
});
