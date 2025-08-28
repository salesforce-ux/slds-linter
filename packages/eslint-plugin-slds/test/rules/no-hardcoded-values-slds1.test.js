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
    // Gradient functions should be skipped - colors inside gradients are not flagged
    {
      code: `.example { background: linear-gradient(#ff0000, rgba(0, 255, 0, 0.8)); }`,
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
    // Background shorthand with color - validates css-tree parsing fix
    {
      code: `.example { background: url(image.png) #ff0000 no-repeat center; }`,
      filename: 'test.css',
      errors: [{
        messageId: 'hardcodedValue'
      }]
    },
    // Border shorthand with both dimension and color - validates combined handler
    {
      code: `.example { border: 2px solid #0000ff; }`,
      filename: 'test.css',
      errors: [{
        messageId: 'noReplacement'
      }, {
        messageId: 'noReplacement'
      }]
      // Both 2px dimension and #0000ff color should be flagged
    },
    // Mixed value with color and CSS variable - review comment case
    {
      code: `.example { background: #fff var(--custom-token); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'hardcodedValue'
      }]
      // Should detect #fff but ignore var() content
    }
  ]
});

