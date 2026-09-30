const rule = require('../../src/rules/v9/no-invalid-hook-property-usage').default;
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

ruleTester.run('no-invalid-hook-property-usage', rule, {
  valid: [
    {
      code: `.error-banner { background-color: var(--slds-g-color-error-container-2); }`,
      filename: 'test.css',
    },
    {
      code: `.error-text { color: var(--slds-g-color-on-error-2); }`,
      filename: 'test.css',
    },
    {
      code: `.test-font { font: normal var(--slds-g-font-weight-bold) var(--slds-g-font-scale-2)/1.5 sans-serif; }`,
      filename: 'test.css',
    },
    {
      code: `.test-font-line-height { font: normal var(--slds-g-font-weight-bold) var(--slds-g-font-scale-2)/var(--slds-g-font-line-height-4) sans-serif; }`,
      filename: 'test.css',
    },
    {
      code: `.test-shadow { box-shadow: 0 0 0 1px var(--slds-g-color-border-base-1); }`,
      filename: 'test.css',
    },
    {
      code: `.test-shadow-border-width { box-shadow: 0 0 0 var(--slds-g-sizing-border-1) var(--slds-g-color-border-base-1); }`,
      filename: 'test.css',
    },
    {
      code: `.test-shadow-spacing { box-shadow: 0 var(--slds-g-spacing-1) 0 var(--slds-g-color-border-base-1); }`,
      filename: 'test.css',
    },
    {
      code: `.outline-ok { outline: 1px solid var(--slds-g-color-border-base-1); }`,
      filename: 'test.css',
    },
    {
      code: `.border-side-ok { border-left-width: var(--slds-g-sizing-border-1); }`,
      filename: 'test.css',
    },
    {
      code: `.gap-ok { gap: var(--slds-g-spacing-1); }`,
      filename: 'test.css',
    },
    // wildcard property matching via property-matcher.ts
    {
      code: `.anim { animation-duration: var(--slds-g-duration-quickly); }`,
      filename: 'test.css',
    },
    // unknown global hooks are ignored
    {
      code: `.unknown { color: var(--slds-g-custom-unknown); }`,
      filename: 'test.css',
    },
    // non-global hooks are ignored
    {
      code: `.table { color: var(--slds-s-table-color); }`,
      filename: 'test.css',
    },
    // non-SLDS variables are ignored
    {
      code: `.custom { color: var(--my-custom-color); }`,
      filename: 'test.css',
    },
  ],

  invalid: [
    {
      code: `.error-text { color: var(--slds-g-color-error-container-2); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'invalidProperty',
        data: {
          hook: '--slds-g-color-error-container-2',
          property: 'color',
          allowedProperties: 'background, background-color',
        },
      }],
    },
    {
      code: `.box { font-size: var(--slds-g-spacing-1); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'invalidProperty',
        data: {
          hook: '--slds-g-spacing-1',
          property: 'font-size',
          allowedProperties: 'padding, margin, top, right, bottom, left',
        },
      }],
    },
    {
      code: `.anim { color: var(--slds-g-duration-quickly); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'invalidProperty',
        data: {
          hook: '--slds-g-duration-quickly',
          property: 'color',
          allowedProperties: 'animation*, transition*',
        },
      }],
    },
    {
      code: `.font-invalid { font: normal var(--slds-g-spacing-1) 1rem/1.5 sans-serif; }`,
      filename: 'test.css',
      errors: [{
        messageId: 'invalidProperty',
        data: {
          hook: '--slds-g-spacing-1',
          property: 'font',
          allowedProperties: 'padding, margin, top, right, bottom, left',
        },
      }],
    },
    {
      code: `.shadow-invalid { box-shadow: 0 0 0 1px var(--slds-g-font-scale-2); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'invalidProperty',
        data: {
          hook: '--slds-g-font-scale-2',
          property: 'box-shadow',
          allowedProperties: 'font-size',
        },
      }],
    },
  ],
});
