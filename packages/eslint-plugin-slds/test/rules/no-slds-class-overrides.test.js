const rule = require('../../src/rules/v9/rules/no-slds-class-overrides').default;
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
      code: `.my-custom-class { color: red; }`,
      filename: 'test.css',
    },
    {
      code: `.app-button { background: blue; }`,
      filename: 'test.css',
    },
    {
      code: `.namespace-input { border: 1px solid black; }`,
      filename: 'test.css',
    },
    // Non-SLDS classes that start with slds-
    {
      code: `.slds-custom-class { color: blue; }`,
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
    // Complex selectors without SLDS classes
    {
      code: `.app-wrapper .custom-button:hover { background: red; }`,
      filename: 'test.css',
    },
  ],
  invalid: [
    // Valid SLDS classes that should trigger warnings
    {
      code: `.slds-button { background: red; }`,
      filename: 'test.css',
      errors: [{
        messageId: 'sldsClassOverride',
        type: 'ClassSelector',
        suggestions: [
          {
            messageId: 'addDisableComment',
            output: `/* eslint-disable-next-line slds/no-slds-class-overrides */\n.slds-button { background: red; }`
          }
        ]
      }]
    },
    {
      code: `.slds-input { border-color: blue; }`,
      filename: 'test.css',
      errors: [{
        messageId: 'sldsClassOverride',
        type: 'ClassSelector',
        suggestions: [
          {
            messageId: 'addDisableComment',
            output: `/* eslint-disable-next-line slds/no-slds-class-overrides */\n.slds-input { border-color: blue; }`
          }
        ]
      }]
    },
    {
      code: `.slds-card { padding: 20px; }`,
      filename: 'test.css',
      errors: [{
        messageId: 'sldsClassOverride',
        type: 'ClassSelector',
        suggestions: [
          {
            messageId: 'addDisableComment',
            output: `/* eslint-disable-next-line slds/no-slds-class-overrides */\n.slds-card { padding: 20px; }`
          }
        ]
      }]
    },
    {
      code: `.my-app .slds-button { background: red; }`,
      filename: 'test.css',
      errors: [{
        messageId: 'sldsClassOverride',
        type: 'ClassSelector',
        suggestions: [
          {
            messageId: 'addDisableComment',
            output: `.my-app /* eslint-disable-next-line slds/no-slds-class-overrides */\n.slds-button { background: red; }`
          }
        ]
      }]
    },
    {
      code: `.slds-button:hover { background: blue; }`,
      filename: 'test.css',
      errors: [{
        messageId: 'sldsClassOverride',
        type: 'ClassSelector',
        suggestions: [
          {
            messageId: 'addDisableComment',
            output: `/* eslint-disable-next-line slds/no-slds-class-overrides */\n.slds-button:hover { background: blue; }`
          }
        ]
      }]
    },
    {
      code: `.container .slds-input.modified { border: 2px solid red; }`,
      filename: 'test.css',
      errors: [{
        messageId: 'sldsClassOverride',
        type: 'ClassSelector',
        suggestions: [
          {
            messageId: 'addDisableComment',
            output: `.container /* eslint-disable-next-line slds/no-slds-class-overrides */\n.slds-input.modified { border: 2px solid red; }`
          }
        ]
      }]
    },
    {
      code: `.slds-button.slds-button_brand { background: red; }`,
      filename: 'test.css',
      errors: [
        {
          messageId: 'sldsClassOverride',
          type: 'ClassSelector',
          suggestions: [
            {
              messageId: 'addDisableComment',
              output: `/* eslint-disable-next-line slds/no-slds-class-overrides */\n.slds-button.slds-button_brand { background: red; }`
            }
          ]
        },
        {
          messageId: 'sldsClassOverride',
          type: 'ClassSelector',
          suggestions: [
            {
              messageId: 'addDisableComment',
              output: `.slds-button/* eslint-disable-next-line slds/no-slds-class-overrides */\n.slds-button_brand { background: red; }`
            }
          ]
        }
      ]
    },
    {
      code: `
        .slds-button { background: red; }
        .slds-input { border: blue; }
      `,
      filename: 'test.css',
      errors: [
        {
          messageId: 'sldsClassOverride',
          type: 'ClassSelector',
          suggestions: [
            {
              messageId: 'addDisableComment',
              output: `
        /* eslint-disable-next-line slds/no-slds-class-overrides */\n.slds-button { background: red; }
        .slds-input { border: blue; }
      `
            }
          ]
        },
        {
          messageId: 'sldsClassOverride',
          type: 'ClassSelector',
          suggestions: [
            {
              messageId: 'addDisableComment',
              output: `
        .slds-button { background: red; }
        /* eslint-disable-next-line slds/no-slds-class-overrides */\n.slds-input { border: blue; }
      `
            }
          ]
        }
      ]
    },
  ]
}); 