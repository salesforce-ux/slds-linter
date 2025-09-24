const rule = require('../../src/rules/v9/enforce-sds-to-slds-hooks').default;
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

ruleTester.run('enforce-sds-to-slds-hooks', rule, {
  valid: [
    // Custom classes (should be ignored)
    {
      code: `.my-custom-class { color: red; }`,
      filename: 'test.css',
    },
    {
      code: `.testClass { background-color: var(--sds-my-own); }`,
      filename: 'test.css',
    },
    {
      code: `:root { --sds-my-own: 30px; }`,
      filename: 'test.css',
    },
    // Already correct SLDS tokens
    {
      code: `.testClass { background-color: var(--slds-g-color-palette-blue-10); }`,
      filename: 'test.css',
    },
    {
      code: `:root { --slds-g-spacing-1: 4px; }`,
      filename: 'test.css',
    },
    // Non-SDS tokens
    {
      code: `.example { color: var(--custom-color); }`,
      filename: 'test.css',
    },
    {
      code: `:root { --custom-prop: blue; }`,
      filename: 'test.css',
    },
    // Standard CSS properties
    {
      code: `.example { background: #fff; color: red; }`,
      filename: 'test.css',
    }
  ],

  invalid: [
    // Right side: SDS token in var() function
    {
      code: `.testClass { background-color: var(--sds-g-color-palette-blue-10); }`,
      output: `.testClass { background-color: var(--slds-g-color-palette-blue-10); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'replaceSdsWithSlds',
        type: 'Identifier',
        data: {
          oldValue: '--sds-g-color-palette-blue-10',
          suggestedMatch: '--slds-g-color-palette-blue-10'
        }
      }]
    },

    // Left side: SDS token as CSS custom property
    {
      code: `:root { --sds-g-spacing-1: 4px; }`,
      output: `:root { --slds-g-spacing-1: 4px; }`,
      filename: 'test.css',
      errors: [{
        messageId: 'replaceSdsWithSlds',
        type: 'Declaration',
        data: {
          oldValue: '--sds-g-spacing-1',
          suggestedMatch: '--slds-g-spacing-1'
        }
      }]
    },

    // Multiple SDS tokens in same declaration
    {
      code: `.testClass { 
        background-color: var(--sds-g-color-palette-blue-10);
        border-color: var(--sds-g-color-palette-blue-20);
      }`,
      output: `.testClass { 
        background-color: var(--slds-g-color-palette-blue-10);
        border-color: var(--slds-g-color-palette-blue-20);
      }`,
      filename: 'test.css',
      errors: [
        {
          messageId: 'replaceSdsWithSlds',
          type: 'Identifier'
        },
        {
          messageId: 'replaceSdsWithSlds',
          type: 'Identifier'
        }
      ]
    },

    // Multiple CSS custom properties with SDS tokens
    {
      code: `:root { 
        --sds-g-spacing-1: 4px;
        --sds-g-spacing-2: 8px;
      }`,
      output: `:root { 
        --slds-g-spacing-1: 4px;
        --slds-g-spacing-2: 8px;
      }`,
      filename: 'test.css',
      errors: [
        {
          messageId: 'replaceSdsWithSlds',
          type: 'Declaration'
        },
        {
          messageId: 'replaceSdsWithSlds',
          type: 'Declaration'
        }
      ]
    },

    // Complex CSS selector with SDS token
    {
      code: `.container .testClass:hover { background: var(--sds-g-color-palette-blue-10); }`,
      output: `.container .testClass:hover { background: var(--slds-g-color-palette-blue-10); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'replaceSdsWithSlds',
        type: 'Identifier'
      }]
    },

    // SDS token in calc() function
    {
      code: `.example { 
        width: calc(100% - var(--sds-g-spacing-4)); 
      }`,
      output: `.example { 
        width: calc(100% - var(--slds-g-spacing-4)); 
      }`,
      filename: 'test.css',
      errors: [{
        messageId: 'replaceSdsWithSlds',
        type: 'Identifier'
      }]
    },

    // Mixed valid and invalid tokens
    {
      code: `.example { 
        color: var(--custom-color);
        background: var(--sds-g-color-palette-blue-10);
        border: 1px solid var(--slds-g-color-palette-blue-20);
      }`,
      output: `.example { 
        color: var(--custom-color);
        background: var(--slds-g-color-palette-blue-10);
        border: 1px solid var(--slds-g-color-palette-blue-20);
      }`,
      filename: 'test.css',
      errors: [{
        messageId: 'replaceSdsWithSlds',
        type: 'Identifier'
      }]
    }
  ]
});
