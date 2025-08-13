const rule = require('../../src/rules/enforce-bem-usage');
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

ruleTester.run('enforce-bem-usage-css', rule, {
  valid: [
    {
      code: `.my-custom-class { color: red; }`,
      filename: 'test.css',
    },
    {
      code: `.app-button { background: blue; }`,
      filename: 'test.css',
    },
    // Classes that already use modern BEM naming
    {
      code: `.slds-text-heading--large { font-size: 24px; }`,
      filename: 'test.css',
    },
    {
      code: `.slds-dl--horizontal__label { display: block; }`,
      filename: 'test.css',
    },
    {
      code: `.slds-dl--horizontal__detail { color: gray; }`,
      filename: 'test.css',
    },
    // Element selectors
    {
      code: `div { margin: 0; }`,
      filename: 'test.css',
    },
    {
      code: `button { padding: 8px; }`,
      filename: 'test.css',
    },
    // Attribute selectors
    {
      code: `[data-slds="true"] { display: block; }`,
      filename: 'test.css',
    },
    // Classes that don't have BEM mappings
    {
      code: `.slds-button { background: blue; }`,
      filename: 'test.css',
    },
    {
      code: `.slds-input { border: 1px solid red; }`,
      filename: 'test.css',
    },
  ],
  invalid: [
    // Old BEM naming that should be updated
    {
      code: `.slds-text-heading_large { font-size: 24px; }`,
      filename: 'test.css',
      output: `.slds-text-heading--large { font-size: 24px; }`,
      errors: [{
        messageId: 'bemDoubleDash',
        type: 'ClassSelector'
      }]
    },
    // Multiple selectors with old BEM naming
    {
      code: `.slds-dl_horizontal__label, .slds-dl_horizontal__detail { display: none; }`,
      filename: 'test.css',
      output: `.slds-dl--horizontal__label, .slds-dl--horizontal__detail { display: none; }`,
      errors: [
        {
          messageId: 'bemDoubleDash',
          type: 'ClassSelector'
        },
        {
          messageId: 'bemDoubleDash',
          type: 'ClassSelector'
        }
      ]
    },
    // Old BEM naming in pseudo-selector
    {
      code: `.slds-dl_horizontal__label:last-of-type { border-bottom: none; }`,
      filename: 'test.css',
      output: `.slds-dl--horizontal__label:last-of-type { border-bottom: none; }`,
      errors: [{
        messageId: 'bemDoubleDash',
        type: 'ClassSelector'
      }]
    },
    // Old BEM naming in complex selector
    {
      code: `div.slds-dl_horizontal__label { border-bottom: none; }`,
      filename: 'test.css',
      output: `div.slds-dl--horizontal__label { border-bottom: none; }`,
      errors: [{
        messageId: 'bemDoubleDash',
        type: 'ClassSelector'
      }]
    },
    // Old BEM naming in chained selector
    {
      code: `.slds-dl_horizontal__label div { border-bottom: none; }`,
      filename: 'test.css',
      output: `.slds-dl--horizontal__label div { border-bottom: none; }`,
      errors: [{
        messageId: 'bemDoubleDash',
        type: 'ClassSelector'
      }]
    },
    // Old BEM naming in chained direct selector
    {
      code: `.slds-dl_horizontal__label > div { border-bottom: none; }`,
      filename: 'test.css',
      output: `.slds-dl--horizontal__label > div { border-bottom: none; }`,
      errors: [{
        messageId: 'bemDoubleDash',
        type: 'ClassSelector'
      }]
    },
    // Multiple rules with old BEM naming
    {
      code: `
.slds-dl_horizontal__label, .slds-dl_horizontal__detail {}

.slds-dl_horizontal__label {}
      `,
      filename: 'test.css',
      output: `
.slds-dl--horizontal__label, .slds-dl--horizontal__detail {}

.slds-dl--horizontal__label {}
      `,
      errors: [
        {
          messageId: 'bemDoubleDash',
          type: 'ClassSelector'
        },
        {
          messageId: 'bemDoubleDash',
          type: 'ClassSelector'
        },
        {
          messageId: 'bemDoubleDash',
          type: 'ClassSelector'
        }
      ]
    }
  ]
});
