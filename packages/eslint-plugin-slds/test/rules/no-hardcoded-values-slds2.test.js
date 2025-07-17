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
      errors: [{ message: /#ff0000.*slds-g-color-palette-red-50|slds-g-color-palette-hot-orange-50|slds-g-color-palette-hot-orange-60/i }],
      output: `.example { color: var(--slds-g-color-palette-red-50, #ff0000); }`
    },
    {
      code: `.example { font-size: 0.875rem; }`,
      filename: 'test.css',
      errors: [{ message: /0.875rem.*slds-g-font-scale-1/i }],
      output: `.example { font-size: var(--slds-g-font-scale-1, 0.875rem); }`
    },
    {
      code: `.example { background-color: #ffffff; }`,
      filename: 'test.css',
      errors: [{ message: /#ffffff.*slds-g-color-palette-neutral-100|slds-g-color-brand-base-100|slds-g-color-error-base-100|slds-g-color-warning-base-100|slds-g-color-success-base-100/i }],
      output: `.example { background-color: var(--slds-g-color-palette-neutral-100, #ffffff); }`
    },
    {
      code: `.example { color: #ffffff; }`,
      filename: 'test.css',
      errors: [{ message: /#ffffff.*slds-g-color-palette-neutral-100|slds-g-color-brand-base-100|slds-g-color-error-base-100|slds-g-color-warning-base-100|slds-g-color-success-base-100/i }],
      output: `.example { color: var(--slds-g-color-palette-neutral-100, #ffffff); }`
    },
    {
      code: `.example { border-color: #fff; }`,
      filename: 'test.css',
      errors: [{ message: /#fff.*slds-g-color-palette-neutral-100|slds-g-color-brand-base-100|slds-g-color-error-base-100|slds-g-color-warning-base-100|slds-g-color-success-base-100/i }],
      output: `.example { border-color: var(--slds-g-color-palette-neutral-100, #ffffff); }`
    },
    {
      code: `.example { font-size: 16px; }`,
      filename: 'test.css',
      errors: [{ message: /16px.*slds-g-font-scale-2/i }],
      output: `.example { font-size: var(--slds-g-font-scale-2, 16px); }`
    },
    {
      code: `.example { font-size: 1rem; }`,
      filename: 'test.css',
      errors: [{ message: /1rem.*slds-g-font-scale-2/i }],
      output: `.example { font-size: var(--slds-g-font-scale-2, 1rem); }`
    },
    {
      code: `.example { background-color: #123456; }`,
      filename: 'test.css',
      errors: [{ message: /#123456.*slds-g-color-palette-cloud-blue-20|slds-g-color-palette-blue-15|slds-g-color-palette-cloud-blue-30|slds-g-color-palette-blue-20|slds-g-color-palette-cloud-blue-15/i }],
      output: `.example { background-color: var(--slds-g-color-palette-cloud-blue-20, #123456); }`
    }
  ]
}); 