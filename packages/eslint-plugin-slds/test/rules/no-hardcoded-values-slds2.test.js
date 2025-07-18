const rule = require('../../src/v9/rules/no-hardcoded-values-slds2').default;
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

ruleTester.run('no-hardcoded-values-slds2', rule, {
  valid: [
    {
      code: `.example { background-color: var(--slds-g-color-palette-neutral-100, #fff); }`,
      filename: 'test.css',
    },
    {
      code: `.example { border: var(--slds-g-sizing-border-1, 1px) solid; }`,
      filename: 'test.css',
    },
    {
      code: `.example { border: var(--slds-g-sizing-border-1, var(--lwc-borderWidthThin, 1px)) solid; }`,
      filename: 'test.css',
    },
    {
      code: `.example { background-color: color-mix(in oklab, #a71e14 25%, white); }`,
      filename: 'test.css',
    },
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
      errors: [{ message: /Consider replacing the #ff0000 static value with an SLDS 2 styling hook that has a similar value: .*slds-g-color-palette-red-50|slds-g-color-palette-hot-orange-50|slds-g-color-palette-hot-orange-60/i }]
      // No output property because this has multiple suggestions (3 hooks)
    },
    {
      code: `.example { font-size: 0.875rem; }`,
      filename: 'test.css',
      errors: [{ message: /Consider replacing the 0.875rem static value with an SLDS 2 styling hook that has a similar value: .*slds-g-font-scale-1/i }],
      output: `.example { font-size: var(--slds-g-font-scale-1, 0.875rem); }`
    },
    {
      code: `.example { background-color: #ffffff; }`,
      filename: 'test.css',
      errors: [{ message: /Consider replacing the #ffffff static value with an SLDS 2 styling hook that has a similar value: .*slds-g-color-palette-neutral-100|slds-g-color-neutral-base-100|slds-g-color-brand-base-100|slds-g-color-error-base-100|slds-g-color-warning-base-100/i }]
      // No output property because this has multiple suggestions (5 hooks)
    },
    {
      code: `.example { color: #ffffff; }`,
      filename: 'test.css',
      errors: [{ message: /Consider replacing the #ffffff static value with an SLDS 2 styling hook that has a similar value: .*slds-g-color-palette-neutral-100|slds-g-color-neutral-base-100|slds-g-color-brand-base-100|slds-g-color-error-base-100|slds-g-color-warning-base-100/i }]
      // No output property because this has multiple suggestions (5 hooks)
    },
    {
      code: `.example { border-color: #fff; }`,
      filename: 'test.css',
      errors: [{ message: /Consider replacing the #fff static value with an SLDS 2 styling hook that has a similar value: .*slds-g-color-palette-neutral-100|slds-g-color-neutral-base-100|slds-g-color-brand-base-100|slds-g-color-error-base-100|slds-g-color-warning-base-100/i }]
      // No output property because this has multiple suggestions (5 hooks)
    },
    {
      code: `.example { font-size: 16px; }`,
      filename: 'test.css',
      errors: [{ message: /Consider replacing the 16px static value with an SLDS 2 styling hook that has a similar value: .*slds-g-font-scale-2/i }],
      output: `.example { font-size: var(--slds-g-font-scale-2, 16px); }`
    },
    {
      code: `.example { font-size: 1rem; }`,
      filename: 'test.css',
      errors: [{ message: /Consider replacing the 1rem static value with an SLDS 2 styling hook that has a similar value: .*slds-g-font-scale-2/i }],
      output: `.example { font-size: var(--slds-g-font-scale-2, 1rem); }`
    },
    {
      code: `.example { background-color: #123456; }`,
      filename: 'test.css',
      errors: [{ message: /Consider replacing the #123456 static value with an SLDS 2 styling hook that has a similar value: .*slds-g-color-palette-cloud-blue-20|slds-g-color-palette-blue-15|slds-g-color-on-surface-3|slds-g-color-surface-inverse-2|slds-g-color-surface-container-inverse-2/i }]
      // No output property because this has multiple suggestions (5 hooks)
    }
  ]
}); 