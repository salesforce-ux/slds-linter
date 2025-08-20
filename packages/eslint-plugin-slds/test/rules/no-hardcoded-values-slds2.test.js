const rule = require('../../src/rules/v9/no-hardcoded-values-slds2').default;
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
    // CSS variables with fallbacks should be ignored
    {
      code: `.example { background-color: var(--slds-g-color-palette-neutral-100, #fff); }`,
      filename: 'test.css',
    },
    {
      code: `.example { border: var(--slds-g-sizing-border-1, 1px) solid; }`,
      filename: 'test.css',
    },
    // Nested fallbacks should be ignored
    {
      code: `.example { border: var(--slds-g-sizing-border-1, var(--lwc-borderWidthThin, 1px)) solid; }`,
      filename: 'test.css',
    },
    // Color-mix function should be ignored
    {
      code: `.example { background-color: color-mix(in oklab, #a71e14 25%, white); }`,
      filename: 'test.css',
    },
    // Zero values should be ignored
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
    // CSS variables should be ignored
    {
      code: `.example { background-color: var(--color-brand); }`,
      filename: 'test.css',
    },
    // Transparent color should be ignored
    {
      code: `.example { color: transparent; }`,
      filename: 'test.css',
    },
  ],
  invalid: [
    // Hardcoded color with multiple suggestions
    {
      code: `.example { color: #ff0000; }`,
      filename: 'test.css',
      errors: [{ 
        messageId: 'hardcodedValue'
      }]
      // No output because multiple suggestions
    },
    // Font size with single suggestion (auto-fixable)
    {
      code: `.example { font-size: 0.875rem; }`,
      filename: 'test.css',
      errors: [{ 
        messageId: 'hardcodedValue'
      }],
      output: `.example { font-size: var(--slds-g-font-scale-1, 0.875rem); }`
    },
    // White background with multiple suggestions
    {
      code: `.example { background-color: #ffffff; }`,
      filename: 'test.css',
      errors: [{ 
        messageId: 'hardcodedValue'
      }]
      // No output because multiple suggestions
    },
    // White text color with multiple suggestions
    {
      code: `.example { color: #ffffff; }`,
      filename: 'test.css',
      errors: [{ 
        messageId: 'hardcodedValue'
      }]
      // No output because multiple suggestions
    },
    // White border color with multiple suggestions
    {
      code: `.example { border-color: #fff; }`,
      filename: 'test.css',
      errors: [{ 
        messageId: 'hardcodedValue'
      }]
      // No output because multiple suggestions
    },
    // Font size 16px with single suggestion
    {
      code: `.example { font-size: 16px; }`,
      filename: 'test.css',
      errors: [{ 
        messageId: 'hardcodedValue'
      }],
      output: `.example { font-size: var(--slds-g-font-scale-2, 16px); }`
    },
    // Font size 1rem with single suggestion
    {
      code: `.example { font-size: 1rem; }`,
      filename: 'test.css',
      errors: [{ 
        messageId: 'hardcodedValue'
      }],
      output: `.example { font-size: var(--slds-g-font-scale-2, 1rem); }`
    },
    // Background color with multiple suggestions
    {
      code: `.example { background-color: #123456; }`,
      filename: 'test.css',
      errors: [{ 
        messageId: 'hardcodedValue'
      }]
      // No output because multiple suggestions
    }
  ]
});

