const rule = require('../../src/rules/v9/no-hardcoded-values/no-hardcoded-values-slds2').default;
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
    // Shorthand properties with all zero values should be ignored
    {
      code: `.example { padding: 0; }`,
      filename: 'test.css',
    },
    {
      code: `.example { margin: 0 0 0 0; }`,
      filename: 'test.css',
    },
    // Line-height with CSS variables should be ignored
    {
      code: `.example { line-height: var(--slds-g-font-lineheight-base, 1.5); }`,
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
    // Line-height 1.25 with single suggestion (auto-fixable)
    {
      code: `.example { line-height: 1.25; }`,
      filename: 'test.css',
      errors: [{ 
        messageId: 'hardcodedValue'
      }],
      output: `.example { line-height: var(--slds-g-font-lineheight-2, 1.25); }`
    },
    // Line-height 1.375 with single suggestion (auto-fixable)
    {
      code: `.example { line-height: 1.375; }`,
      filename: 'test.css',
      errors: [{ 
        messageId: 'hardcodedValue'
      }],
      output: `.example { line-height: var(--slds-g-font-lineheight-3, 1.375); }`
    },
    // Line-height 1.75 with single suggestion (auto-fixable)
    {
      code: `.example { line-height: 1.75; }`,
      filename: 'test.css',
      errors: [{ 
        messageId: 'hardcodedValue'
      }],
      output: `.example { line-height: var(--slds-g-font-lineheight-5, 1.75); }`
    },
    // Line-height 1.5 with multiple suggestions (no auto-fix)
    {
      code: `.example { line-height: 1.5; }`,
      filename: 'test.css',
      errors: [{ 
        messageId: 'hardcodedValue'
      }]
      // No output because multiple suggestions (--slds-g-font-lineheight-base and --slds-g-font-lineheight-4)
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
    // Mixed value with color and CSS variable - review comment case
    {
      code: `.example { border: #0000ff var(--fallback-width, 2px) solid; }`,
      filename: 'test.css',
      errors: [{
        messageId: 'noReplacement'
      }]
      // Should detect #0000ff but ignore var() content
    },
    // Line-height with no styling hook available
    {
      code: `.example { line-height: 2.5; }`,
      filename: 'test.css',
      errors: [{
        messageId: 'noReplacement'
      }]
      // No styling hook exists for 2.5 line-height
    },
    // Shorthand property support - padding with rem units
    {
      code: `.example { padding: 0 1rem 0.5rem 0; }`,
      filename: 'test.css',
      output: `.example { padding: 0 var(--slds-g-spacing-4, 1rem) var(--slds-g-spacing-2, 0.5rem) 0; }`,
      errors: [{
        messageId: 'hardcodedValue'
      }, {
        messageId: 'hardcodedValue'
      }]
      // Should detect 1rem and 0.5rem but skip zeros, now WITH auto-fix for shorthand properties
    },
    // Shorthand property support - margin with mixed units
    {
      code: `.example { margin: 0.25rem 0.5rem 0.75rem 1rem; }`,
      filename: 'test.css',
      output: `.example { margin: var(--slds-g-spacing-1, 0.25rem) var(--slds-g-spacing-2, 0.5rem) var(--slds-g-spacing-3, 0.75rem) var(--slds-g-spacing-4, 1rem); }`,
      errors: [{
        messageId: 'hardcodedValue'
      }, {
        messageId: 'hardcodedValue'
      }, {
        messageId: 'hardcodedValue'
      }, {
        messageId: 'hardcodedValue'
      }]
      // Should detect all 4 rem values, now WITH auto-fix for shorthand properties
    },
    // Shorthand property support - background with multiple colors
    {
      code: `.example { background: url(bg.png) #ffffff no-repeat, linear-gradient(#000000, #cccccc); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'hardcodedValue'
      }]
      // Should detect #ffffff but skip colors inside linear-gradient
    },
    // Shorthand property support - border with dimension and color
    {
      code: `.example { outline: 1px solid red; }`,
      filename: 'test.css',
      output: `.example { outline: var(--slds-g-sizing-border-1, 1px) solid red; }`,
      errors: [{
        messageId: 'hardcodedValue'
      }, {
        messageId: 'hardcodedValue'
      }]
      // Should detect both #ffffff color (has hook) and 1px (no hook in SLDS2)
    },

    // ADVANCED EXAMPLES - SLDS2 specific shorthand auto-fix
    // SLDS2 rem-based density shorthand with different values to avoid duplicates
    {
      code: `.example { padding: 0.25rem 0.75rem; }`,
      filename: 'test.css',
      output: `.example { padding: var(--slds-g-spacing-1, 0.25rem) var(--slds-g-spacing-3, 0.75rem); }`,
      errors: [{
        messageId: 'hardcodedValue'
      }, {
        messageId: 'hardcodedValue'
      }]
      // Both rem values have single hooks and auto-fix in SLDS2
    },
    // Mixed density units in SLDS2 (corrected to use actual sizing hooks)
    {
      code: `.example { border-width: 1rem 0.5rem; }`,
      filename: 'test.css',
      output: `.example { border-width: var(--slds-g-sizing-5, 1rem) var(--slds-g-sizing-3, 0.5rem); }`,
      errors: [{
        messageId: 'hardcodedValue'
      }, {
        messageId: 'hardcodedValue'
      }]
      // Different rem values with sizing hooks in SLDS2
    },
    // Edge case: Mixed rem and invalid values
    {
      code: `.example { padding: 0.25rem 0.125rem; }`,
      filename: 'test.css',
      output: `.example { padding: var(--slds-g-spacing-1, 0.25rem) 0.125rem; }`,
      errors: [{
        messageId: 'hardcodedValue'
      }, {
        messageId: 'noReplacement'
      }]
      // First has hook, second doesn't in SLDS2
    },
    // Color shorthand with identical values that have single hooks - should autofix
    {
      code: `.example { border-color: #001639 #001639 #001639 #001639; }`,
      filename: 'test.css',
      output: `.example { border-color: var(--slds-g-color-palette-blue-10, #001639) var(--slds-g-color-palette-blue-10, #001639) var(--slds-g-color-palette-blue-10, #001639) var(--slds-g-color-palette-blue-10, #001639); }`,
      errors: [{
        messageId: 'hardcodedValue'
      }, {
        messageId: 'hardcodedValue'
      }, {
        messageId: 'hardcodedValue'
      }, {
        messageId: 'hardcodedValue'
      }]
      // All 4 values have single hooks, should provide autofix
    },
    // Note: Font shorthand parsing not yet implemented, 
    // individual font properties (font-size, line-height, etc.) are supported separately
  ]
});

