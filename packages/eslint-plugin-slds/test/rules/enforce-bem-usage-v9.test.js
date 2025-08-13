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
    {
      code: `.slds-action-overflow_touch { font-size: 24px; }`,
      filename: 'test.css',
    },
    {
      code: `.slds-alert_error { display: block; }`,
      filename: 'test.css',
    },
    {
      code: `.slds-alert_warning { color: gray; }`,
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
    {
      code: `.slds-action-overflow--touch { font-size: 24px; }`,
      filename: 'test.css',
      output: `.slds-action-overflow_touch { font-size: 24px; }`,
      errors: [{
        messageId: 'bemDoubleDash',
        type: 'ClassSelector'
      }]
    },
    {
      code: `.slds-alert--error, .slds-alert--warning { display: none; }`,
      filename: 'test.css',
      output: `.slds-alert_error, .slds-alert_warning { display: none; }`,
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
    {
      code: `.slds-action-overflow--touch:last-of-type { border-bottom: none; }`,
      filename: 'test.css',
      output: `.slds-action-overflow_touch:last-of-type { border-bottom: none; }`,
      errors: [{
        messageId: 'bemDoubleDash',
        type: 'ClassSelector'
      }]
    },
    {
      code: `div.slds-alert--error { border-bottom: none; }`,
      filename: 'test.css',
      output: `div.slds-alert_error { border-bottom: none; }`,
      errors: [{
        messageId: 'bemDoubleDash',
        type: 'ClassSelector'
      }]
    },
    {
      code: `.slds-alert--warning div { border-bottom: none; }`,
      filename: 'test.css',
      output: `.slds-alert_warning div { border-bottom: none; }`,
      errors: [{
        messageId: 'bemDoubleDash',
        type: 'ClassSelector'
      }]
    },
    {
      code: `.slds-action-overflow--touch > div { border-bottom: none; }`,
      filename: 'test.css',
      output: `.slds-action-overflow_touch > div { border-bottom: none; }`,
      errors: [{
        messageId: 'bemDoubleDash',
        type: 'ClassSelector'
      }]
    },
    {
      code: `
.slds-alert--error, .slds-alert--warning {}

.slds-action-overflow--touch {}
      `,
      filename: 'test.css',
      output: `
.slds-alert_error, .slds-alert_warning {}

.slds-action-overflow_touch {}
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
