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
    // Font shorthand with CSS variables - TODO: 1rem should be ignored when adjacent to variables  
    // {
    //   code: `.example { font: var(--font-weight-bold) 1rem var(--font-family-base); }`,
    //   filename: 'test.css',
    // },
    // Font shorthand with zero font-size should be ignored
    {
      code: `.example { font: 0 Arial; }`,
      filename: 'test.css',
    },
    // Font shorthand with SLDS variables should be ignored
    {
      code: `.example { font: var(--slds-g-font-weight-bold, 700) var(--slds-g-font-scale-2, 1rem) sans-serif; }`,
      filename: 'test.css',
    },
    // Box-shadow with SLDS variables should be ignored
    {
      code: `.example { box-shadow: var(--slds-g-shadow-1, 0px 0px 1.5px 0px #00000017); }`,
      filename: 'test.css',
    },
    // Box-shadow with nested fallbacks should be ignored
    {
      code: `.example { box-shadow: var(--slds-g-shadow-2, var(--custom-shadow, 2px 2px 4px rgba(0,0,0,0.1))); }`,
      filename: 'test.css',
    },
    // Box-shadow with 'none' value should be ignored
    {
      code: `.example { box-shadow: none; }`,
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
      code: `.example { font: bold 1rem "Helvetica Neue"; }`,
      filename: 'test.css',
      output: `.example { font: 700 var(--slds-g-font-scale-2, 1rem) "Helvetica Neue"; }`,
      errors: [{
        messageId: 'noReplacement'
      }, {
        messageId: 'hardcodedValue'
      }]
      // Font-weight 700 (bold) has no hook, font-size 1rem auto-fixed
    },
    // Font shorthand with numeric font-weight (larger size)
    {
      code: `.example { font: 600 1.25rem Georgia; }`,
      filename: 'test.css',
      output: `.example { font: 600 var(--slds-g-font-scale-3, 1.25rem) Georgia; }`,
      errors: [{
        messageId: 'noReplacement'
      }, {
        messageId: 'hardcodedValue'
      }]
      // Font-weight 600 has no hook, but font-size 1.25rem has a hook in SLDS2
    },
    // Font shorthand with font-weight keyword 'normal'
    {
      code: `.example { font: normal 0.875rem sans-serif; }`,
      filename: 'test.css',
      output: `.example { font: 400 var(--slds-g-font-scale-1, 0.875rem) sans-serif; }`,
      errors: [{
        messageId: 'noReplacement'
      }, {
        messageId: 'hardcodedValue'
      }]
      // Normal (400) has no hook, 0.875rem auto-fixed
    },
    // Complex font shorthand with all properties
    {
      code: `.example { font: italic small-caps 700 1.125rem/1.6 "Times New Roman", serif; }`,
      filename: 'test.css',
      errors: [{
        messageId: 'noReplacement'
      }, {
        messageId: 'noReplacement'
      }]
      // Both font-weight 700 and font-size 1.125rem have no hooks in SLDS2
    },
    // Font shorthand with line-height and rem units
    {
      code: `.example { font: bold 0.875rem/1.5 Arial, sans-serif; }`,
      filename: 'test.css',
      output: `.example { font: 700 var(--slds-g-font-scale-1, 0.875rem)/1.5 Arial, sans-serif; }`,
      errors: [{
        messageId: 'noReplacement'
      }, {
        messageId: 'hardcodedValue'
      }]
      // Font-weight 700 has no hook, font-size 0.875rem auto-fixed
    },
    // Font shorthand with mixed valid and invalid values
    {
      code: `.example { font: 500 2rem "Custom Font"; }`,
      filename: 'test.css',
      output: `.example { font: 500 var(--slds-g-font-scale-6, 2rem) "Custom Font"; }`,
      errors: [{
        messageId: 'noReplacement'
      }, {
        messageId: 'hardcodedValue'
      }]
      // Font-weight 500 has no hook, but font-size 2rem has a hook in SLDS2
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
    
    // BOX-SHADOW TESTS
    // Box-shadow with exact hook match (auto-fixable)
    {
      code: `.test-cls2 { box-shadow: 0px 0px 1.5px 0px #00000017, 0px 1.4px 1.5px 0px #00000017, 0px -1px 1px 0px #00000009; }`,
      filename: 'test.css',
      output: `.test-cls2 { box-shadow: var(--slds-g-shadow-1, 0px 0px 1.5px 0px #00000017, 0px 1.4px 1.5px 0px #00000017, 0px -1px 1px 0px #00000009); }`,
      errors: [{
        messageId: 'hardcodedValue'
      }]
      // Complex box-shadow with exact hook match should be auto-fixed
    },
    // Box-shadow with another exact hook match (auto-fixable)
    {
      code: `.test-cls2 { box-shadow: 0px 0px 4.5px 0px #00000014, 0px 4.2px 4.5px 0px #00000017, 0px -1px 1.44px 0px #00000008; }`,
      filename: 'test.css',
      output: `.test-cls2 { box-shadow: var(--slds-g-shadow-3, 0px 0px 4.5px 0px #00000014, 0px 4.2px 4.5px 0px #00000017, 0px -1px 1.44px 0px #00000008); }`,
      errors: [{
        messageId: 'hardcodedValue'
      }]
      // Another complex box-shadow with exact hook match should be auto-fixed
    },
    // Box-shadow with no hook match
    {
      code: `.example { box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'noReplacement'
      }]
      // Custom box-shadow with no matching hook should report no replacement
    }
  ]
});

