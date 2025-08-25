const rule = require('../../src/rules/v9/no-hardcoded-values/no-hardcoded-values-slds1').default;
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
    // Color-mix function should be ignored
    {
      code: `.example { background-color: color-mix(in oklab, #a71e14 25%, white); }`,
      filename: 'test.css',
    },
    // Font shorthand with CSS variables should be ignored
    {
      code: `.example { font: var(--font-family); }`,
      filename: 'test.css',
    },
    {
      code: `.example { font: normal var(--slds-g-font-weight-bold) var(--slds-g-font-scale-2)/1.5 sans-serif; }`,
      filename: 'test.css',
    }
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
    // Font size with single suggestion
    {
      code: `.example { font-size: 16px; }`,
      filename: 'test.css',
      errors: [{ 
        messageId: 'hardcodedValue'
      }],
      output: `.example { font-size: var(--slds-g-font-scale-2, 16px); }`
    },
    // Background color with multiple suggestions
    {
      code: `.example { background-color: #123456; }`,
      filename: 'test.css',
      errors: [{
        messageId: 'hardcodedValue'
      }]
      // No output because multiple suggestions
    },
    // Padding with no suggestions
    {
      code: `.example { padding: 20px; }`,
      filename: 'test.css',
      errors: [{
        messageId: 'noReplacement'
      }]
      // No output because no auto-fix available
    },
    // RGB color values should be detected
    {
      code: `.example { color: rgb(255, 0, 0); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'hardcodedValue'
      }]
      // No output expected due to multiple suggestions for red color
    },
    // RGBA color values should be detected
    {
      code: `.example { background-color: rgba(18, 52, 86, 0.8); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'hardcodedValue'
      }]
      // No output expected due to potential multiple suggestions
    },
    // RGB percentage values should be detected
    {
      code: `.example { border-color: rgb(50%, 25%, 75%); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'hardcodedValue'
      }]
      // No output expected due to potential multiple suggestions
    },
    // HSL color values should be detected (using red which has known hooks)
    {
      code: `.example { color: hsl(0, 100%, 50%); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'hardcodedValue'
      }]
      // No output expected due to multiple suggestions for red color
    },
    // HSLA color values should be detected
    {
      code: `.example { background-color: hsla(240, 75%, 60%, 0.9); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'hardcodedValue'
      }]
      // No output expected due to potential multiple suggestions
    },
    // Font shorthand with hardcoded font-size
    {
      code: `.example { font: 16px Arial; }`,
      filename: 'test.css',
      errors: [{
        messageId: 'hardcodedValue'
      }]
      // No auto-fix for font shorthand due to complexity
    },
    // Font shorthand with hardcoded font-size in rem
    {
      code: `.example { font: 1rem Arial; }`,
      filename: 'test.css',
      errors: [{
        messageId: 'hardcodedValue'
      }]
      // No auto-fix for font shorthand due to complexity
    },
    // Font shorthand with hardcoded font-weight and font-size
    {
      code: `.example { font: 700 16px Arial; }`,
      filename: 'test.css',
      errors: [{
        messageId: 'hardcodedValue'
      }, {
        messageId: 'hardcodedValue'
      }]
      // Both font-size and font-weight should be flagged
    },
    // Font shorthand with small font-size
    {
      code: `.example { font: 0.875rem Arial; }`,
      filename: 'test.css',
      errors: [{
        messageId: 'hardcodedValue'
      }]
      // No auto-fix for font shorthand due to complexity
    },
    // Individual line-height properties with design tokens
    {
      code: `.example { line-height: 1.25; }`,
      filename: 'test.css',
      errors: [{
        messageId: 'hardcodedValue'
      }],
      output: `.example { line-height: var(--slds-g-font-lineheight-2, 1.25); }`
    },
    {
      code: `.example { line-height: 1.375; }`,
      filename: 'test.css',
      errors: [{
        messageId: 'hardcodedValue'
      }],
      output: `.example { line-height: var(--slds-g-font-lineheight-3, 1.375); }`
    },
    {
      code: `.example { line-height: 1.75; }`,
      filename: 'test.css',
      errors: [{
        messageId: 'hardcodedValue'
      }],
      output: `.example { line-height: var(--slds-g-font-lineheight-5, 1.75); }`
    },
    // Font shorthand with line-height
    {
      code: `.example { font: 16px/1.25 Arial; }`,
      filename: 'test.css',
      errors: [{
        messageId: 'hardcodedValue'
      }, {
        messageId: 'hardcodedValue'
      }]
      // Both font-size and line-height should be flagged, no auto-fix for font shorthand
    }
  ]
});

