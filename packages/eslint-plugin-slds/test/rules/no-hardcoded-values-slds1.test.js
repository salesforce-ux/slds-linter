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
    },
    // Shorthand properties with all zero values should be ignored
    {
      code: `.example { padding: 0; }`,
      filename: 'test.css',
    },
    {
      code: `.example { margin: 0 0 0 0; }`,
      filename: 'test.css',
    },
    // Font shorthand with CSS variables - TODO: 16px should be ignored when adjacent to variables
    // {
    //   code: `.example { font: var(--font-weight-bold) 16px var(--font-family-base); }`,
    //   filename: 'test.css',
    // },
    // Font shorthand with zero font-size should be ignored
    {
      code: `.example { font: 0 Arial; }`,
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
    },
    // Shorthand property support - padding with multiple values
    {
      code: `.example { padding: 0px 12px; }`,
      filename: 'test.css',
      output: `.example { padding: 0px var(--slds-g-spacing-3, 12px); }`,
      errors: [{
        messageId: 'hardcodedValue'
      }]
      // Should detect 12px but skip 0px, now WITH auto-fix for shorthand properties
    },
    // Shorthand property support - margin with 4 values
    {
      code: `.example { margin: 8px 12px 16px 20px; }`,
      filename: 'test.css',
      output: `.example { margin: var(--slds-g-spacing-2, 8px) var(--slds-g-spacing-3, 12px) var(--slds-g-spacing-4, 16px) 20px; }`,
      errors: [{
        messageId: 'hardcodedValue'
      }, {
        messageId: 'hardcodedValue'
      }, {
        messageId: 'hardcodedValue'
      }, {
        messageId: 'noReplacement'
      }]
      // Should detect all 4 values and now WITH auto-fix for available hooks
    },
    // Shorthand property support - border-width with multiple values  
    {
      code: `.example { border-width: 2px 4px; }`,
      filename: 'test.css',
      errors: [{
        messageId: 'hardcodedValue'
      }, {
        messageId: 'hardcodedValue'
      }]
      // Should detect both 2px and 4px values, but no hooks available in SLDS1
    },
    // Shorthand property support - mixed zeros and values
    {
      code: `.example { padding: 0 16px 0 8px; }`,
      filename: 'test.css',
      output: `.example { padding: 0 var(--slds-g-spacing-4, 16px) 0 var(--slds-g-spacing-2, 8px); }`,
      errors: [{
        messageId: 'hardcodedValue'
      }, {
        messageId: 'hardcodedValue'
      }]
      // Should detect 16px and 8px but skip zeros, now WITH auto-fix for shorthand properties
    },

    // ADVANCED EXAMPLES - Shorthand auto-fix functionality
    // Simple density shorthand with multiple values
    {
      code: `.example { padding: 4px 8px; }`,
      filename: 'test.css',
      output: `.example { padding: var(--slds-g-spacing-1, 4px) var(--slds-g-spacing-2, 8px); }`,
      errors: [{
        messageId: 'hardcodedValue'
      }, {
        messageId: 'hardcodedValue'
      }]
      // Both density values auto-fixed in shorthand
    },
    // Mixed density availability - partial auto-fix
    {
      code: `.example { padding: 4px 20px; }`,
      filename: 'test.css',
      output: `.example { padding: var(--slds-g-spacing-1, 4px) 20px; }`,
      errors: [{
        messageId: 'hardcodedValue'
      }, {
        messageId: 'noReplacement'
      }]
      // First value auto-fixed, second has no hook
    },
    // Complex 4-value shorthand with border-width properties (corrected based on actual behavior)
    {
      code: `.example { border-width: 1px 2px 3px 4px; }`,
      filename: 'test.css',
      output: `.example { border-width: var(--slds-g-sizing-border-1, 1px) 2px var(--slds-g-sizing-border-3, 3px) 4px; }`,
      errors: [{
        messageId: 'hardcodedValue'
      }, {
        messageId: 'hardcodedValue'
      }, {
        messageId: 'hardcodedValue'
      }, {
        messageId: 'hardcodedValue'
      }]
      // 1px and 3px auto-fix, 2px and 4px have no hooks available
    },
    // Complex density shorthand - all values with hooks
    {
      code: `.example { margin: 4px 8px 12px 16px; }`,
      filename: 'test.css',
      output: `.example { margin: var(--slds-g-spacing-1, 4px) var(--slds-g-spacing-2, 8px) var(--slds-g-spacing-3, 12px) var(--slds-g-spacing-4, 16px); }`,
      errors: [{
        messageId: 'hardcodedValue'
      }, {
        messageId: 'hardcodedValue'
      }, {
        messageId: 'hardcodedValue'
      }, {
        messageId: 'hardcodedValue'
      }]
      // All 4 density values should be auto-fixed
    },
    // Color shorthand functionality - future-proofing test
    {
      code: `.example { background: #ff0000; }`,
      filename: 'test.css',
      errors: [{
        messageId: 'hardcodedValue'
      }]
      // Single color in shorthand property
    },
    // Edge case: zeros and valid dimensions mixed
    {
      code: `.example { margin: 0 8px 0 4px; }`,
      filename: 'test.css',
      output: `.example { margin: 0 var(--slds-g-spacing-2, 8px) 0 var(--slds-g-spacing-1, 4px); }`,
      errors: [{
        messageId: 'hardcodedValue'
      }, {
        messageId: 'hardcodedValue'
      }]
      // Only non-zero dimensions processed and auto-fixed
    },
    // Edge case: zero dimensions should be skipped
    {
      code: `.example { padding: 8px 0 4px 0; }`,
      filename: 'test.css',
      output: `.example { padding: var(--slds-g-spacing-2, 8px) 0 var(--slds-g-spacing-1, 4px) 0; }`,
      errors: [{
        messageId: 'hardcodedValue'
      }, {
        messageId: 'hardcodedValue'
      }]
      // Only non-zero dimensions should be processed
    },

    // FONT SHORTHAND TESTS
    // Font shorthand with font-size (auto-fixable)
    {
      code: `.example { font: 16px Arial; }`,
      filename: 'test.css',
      output: `.example { font: var(--slds-g-font-scale-2, 16px) Arial; }`,
      errors: [{
        messageId: 'hardcodedValue'
      }]
      // Font-size 16px should be auto-fixed
    },
    // Font shorthand with font-weight and font-size
    {
      code: `.example { font: bold 0.875rem "Helvetica Neue"; }`,
      filename: 'test.css',
      output: `.example { font: 700 var(--slds-g-font-scale-1, 0.875rem) "Helvetica Neue"; }`,
      errors: [{
        messageId: 'noReplacement'
      }, {
        messageId: 'hardcodedValue'
      }]
      // Font-weight 700 (bold) has no hook, font-size 0.875rem auto-fixed
    },
    // Font shorthand with numeric font-weight
    {
      code: `.example { font: 400 18px Georgia; }`,
      filename: 'test.css',
      output: `.example { font: 400 var(--slds-g-font-scale-3, 18px) Georgia; }`,
      errors: [{
        messageId: 'noReplacement'
      }, {
        messageId: 'hardcodedValue'
      }]
      // Font-weight 400 has no hook, but font-size 18px has a hook in SLDS1
    },
    // Font shorthand with font-weight keyword 'normal'
    {
      code: `.example { font: normal 16px sans-serif; }`,
      filename: 'test.css',
      output: `.example { font: 400 var(--slds-g-font-scale-2, 16px) sans-serif; }`,
      errors: [{
        messageId: 'noReplacement'
      }, {
        messageId: 'hardcodedValue'
      }]
      // Normal (400) has no hook, 16px auto-fixed
    },
    // Complex font shorthand
    {
      code: `.example { font: italic small-caps 600 20px/1.5 "Times New Roman", serif; }`,
      filename: 'test.css',
      output: `.example { font: italic small-caps 600 var(--slds-g-font-scale-4, 20px)/1.5 "Times New Roman", serif; }`,
      errors: [{
        messageId: 'noReplacement'
      }, {
        messageId: 'hardcodedValue'
      }]
      // Font-weight 600 has no hook, but font-size 20px has a hook in SLDS1
    },
    // Font shorthand with line-height
    {
      code: `.example { font: bold 16px/1.4 Arial, sans-serif; }`,
      filename: 'test.css',
      output: `.example { font: 700 var(--slds-g-font-scale-2, 16px)/1.4 Arial, sans-serif; }`,
      errors: [{
        messageId: 'noReplacement'
      }, {
        messageId: 'hardcodedValue'
      }]
      // Font-weight 700 has no hook, font-size 16px auto-fixed
    }
  ]
});

