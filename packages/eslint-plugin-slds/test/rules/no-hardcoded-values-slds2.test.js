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
    {
      code: `.example { font-weight: var(--slds-g-font-weight-bold, 700); }`,
      filename: 'test.css',
    },
    // Line-height with CSS variables should be ignored
    {
      code: `.example { line-height: var(--slds-g-font-line-height-base, 1.5); }`,
      filename: 'test.css',
    },
    // Invalid font-weight values should be ignored (450 is not a known font-weight)
    {
      code: `.example { font-weight: 450; }`,
      filename: 'test.css',
    },
    // CSS units other than px/rem/% should be ignored when they have zero values
    {
      code: `.example { width: 0ch; }`,
      filename: 'test.css',
    },
    {
      code: `.example { font-size: 0em; }`,
      filename: 'test.css',
    },
    // CSS custom property declarations should be ignored (these define the hooks, not use hardcoded values)
    {
      code: `.global-example { --slds-g-color-border-base-2: #dddbda; }`,
      filename: 'test.css',
    },
    {
      code: `.global-example { --slds-g-color-border-base-3: #c9c7c5; }`,
      filename: 'test.css',
    },
    {
      code: `.global-example { --slds-g-spacing-small: 0.5rem; }`,
      filename: 'test.css',
    },
    {
      code: `.global-example { --slds-g-font-size-1: 0.75rem; }`,
      filename: 'test.css',
    },
    {
      code: `.global-example { --slds-g-shadow-outset: 0 0 0 1px #e5e5e5; }`,
      filename: 'test.css',
    },
    // Multiple CSS custom property declarations in one rule
    {
      code: `.global-example {
        --slds-g-color-border-base-2: #dddbda;
        --slds-g-color-border-base-3: #c9c7c5;
        --slds-g-spacing-small: 0.5rem;
      }`,
      filename: 'test.css',
    },
    // Box-shadow with no hook match should be ignored (no replacement available)
    {
      code: `.example { box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3); }`,
      filename: 'test.css',
    },
    // Box-shadow already wrapped in SLDS shadow hook should be skipped
    // This prevents recursive wrapping when ESLint applies fixes in a loop
    {
      code: `.example { box-shadow: var(--slds-g-shadow-outset-focus-1, 0 0 0 2px var(--slds-g-color-neutral-base-100), 0 0 0 4px var(--slds-g-color-brand-base-15)); }`,
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
      output: `.example { line-height: var(--slds-g-font-line-height-2, 1.25); }`
    },
    // Line-height 1.375 with single suggestion (auto-fixable)
    {
      code: `.example { line-height: 1.375; }`,
      filename: 'test.css',
      errors: [{ 
        messageId: 'hardcodedValue'
      }],
      output: `.example { line-height: var(--slds-g-font-line-height-3, 1.375); }`
    },
    // Line-height 1.75 with single suggestion (auto-fixable)
    {
      code: `.example { line-height: 1.75; }`,
      filename: 'test.css',
      errors: [{ 
        messageId: 'hardcodedValue'
      }],
      output: `.example { line-height: var(--slds-g-font-line-height-5, 1.75); }`
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
      // Should detect #0000ff but no hook available for this color
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
      output: `.example { padding: 0 var(--slds-g-spacing-4, 1rem) 0.5rem 0; }`,
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
      output: `.example { margin: var(--slds-g-spacing-1, 0.25rem) 0.5rem 0.75rem 1rem; }`,
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
      // Should detect both 1px (has hook) and red color (mapped to border-color, has hooks)
    },

    // ADVANCED EXAMPLES - SLDS2 specific shorthand auto-fix
    // SLDS2 rem-based density shorthand with different values to avoid duplicates
    {
      code: `.example { padding: 0.25rem 0.75rem; }`,
      filename: 'test.css',
      output: `.example { padding: var(--slds-g-spacing-1, 0.25rem) 0.75rem; }`,
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
      output: `.example { border-width: 1rem var(--slds-g-sizing-3, 0.5rem); }`,
      errors: [{
        messageId: 'hardcodedValue'
      }, {
        messageId: 'hardcodedValue'
      }]
      // 1rem doesn't have a hook, only 0.5rem gets fixed
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
    // Color shorthand with identical values - not auto-fixed (color shorthand handling not implemented)
    {
      code: `.example { border-color: #001639 #001639 #001639 #001639; }`,
      filename: 'test.css',
      errors: [{
        messageId: 'hardcodedValue'
      }, {
        messageId: 'hardcodedValue'
      }, {
        messageId: 'hardcodedValue'
      }, {
        messageId: 'hardcodedValue'
      }]
      // All 4 values detected but not auto-fixed (shorthand colors not yet supported)
    },
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
    // Font-weight tests
    // Font-weight 400 (normal) with single suggestion
    {
      code: `.example { font-weight: 400; }`,
      filename: 'test.css',
      errors: [{ 
        messageId: 'hardcodedValue'
      }],
      output: `.example { font-weight: var(--slds-g-font-weight-4, 400); }`
    },
    // Font-weight 700 (bold) with single suggestion
    {
      code: `.example { font-weight: 700; }`,
      filename: 'test.css',
      errors: [{ 
        messageId: 'hardcodedValue'
      }],
      output: `.example { font-weight: var(--slds-g-font-weight-7, 700); }`
    },
    // Font-weight keyword 'normal' with single suggestion (converted to 400)
    {
      code: `.example { font-weight: normal; }`,
      filename: 'test.css',
      errors: [{ 
        messageId: 'hardcodedValue'
      }],
      output: `.example { font-weight: var(--slds-g-font-weight-4, 400); }`
    },
    // Font-weight keyword 'bold' - no hook available
    {
      code: `.example { font-weight: bold; }`,
      filename: 'test.css',
      errors: [{ 
        messageId: 'noReplacement'
      }]
    },

    // Font shorthand tests
    // Font shorthand: weight + size + family
    {
      code: `.example { font: 700 16px Arial; }`,
      filename: 'test.css',
      errors: [
        { messageId: 'hardcodedValue' }, // font-weight: 700
        { messageId: 'hardcodedValue' }  // font-size: 16px
      ],
      output: `.example { font: var(--slds-g-font-weight-7, 700) 16px Arial; }`
    },
    // Font shorthand: keyword weight + size + family (bold has no hook, but font-size does)
    {
      code: `.example { font: bold 1rem 'Helvetica Neue'; }`,
      filename: 'test.css',
      errors: [
        { messageId: 'noReplacement' }, // font-weight: bold (no hook available)
        { messageId: 'hardcodedValue' }  // font-size: 1rem
      ],
      output: `.example { font: bold var(--slds-g-font-scale-2, 1rem) 'Helvetica Neue'; }`
    },
    // Font shorthand: size/line-height + family (line-height not parsed from shorthand yet)
    {
      code: `.example { font: 16px/1.5 Arial; }`,
      filename: 'test.css',
      errors: [
        { messageId: 'hardcodedValue' }  // font-size: 16px only (line-height parsing not implemented)
      ],
      output: `.example { font: var(--slds-g-font-scale-2, 16px)/1.5 Arial; }`
    },
    // Font shorthand: weight + size/line-height + family (line-height not parsed from shorthand yet)
    {
      code: `.example { font: 400 14px/1.25 'Times New Roman'; }`,
      filename: 'test.css',
      errors: [
        { messageId: 'hardcodedValue' }, // font-weight: 400
        { messageId: 'hardcodedValue' }  // font-size: 14px (line-height parsing not implemented)
      ],
      output: `.example { font: var(--slds-g-font-weight-4, 400) 14px/1.25 'Times New Roman'; }`
    },
    // Font shorthand: normal weight + percentage size (normal has hook, percentage doesn't)
    {
      code: `.example { font: normal 120% Georgia; }`,
      filename: 'test.css',
      errors: [
        { messageId: 'hardcodedValue' }, // font-weight: normal (converted to 400)
        { messageId: 'noReplacement' }   // font-size: 120% (no hook available)
      ],
      output: `.example { font: var(--slds-g-font-weight-4, 400) 120% Georgia; }`
    },
    // Font shorthand: complex with multiple values (bold has no hook, font-size does)
    {
      code: `.example { font: bold 0.875rem/1.375 'Segoe UI', sans-serif; }`,
      filename: 'test.css',
      errors: [
        { messageId: 'noReplacement' }, // font-weight: bold (no hook available)
        { messageId: 'hardcodedValue' } // font-size: 0.875rem (line-height parsing not implemented)
      ],
      output: `.example { font: bold var(--slds-g-font-scale-1, 0.875rem)/1.375 'Segoe UI', sans-serif; }`
    },

    // Edge cases and mixed scenarios
    // Font shorthand with only some hardcoded values
    {
      code: `.example { font: var(--weight-variable) 16px Arial; }`,
      filename: 'test.css',
      errors: [
        { messageId: 'hardcodedValue' }  // font-size: 16px only
      ],
      output: `.example { font: var(--weight-variable) var(--slds-g-font-scale-2, 16px) Arial; }`
    },

    // Font shorthand with line-height (line-height parsing from shorthand not implemented yet)
    {
      code: `.example { font: 700 1rem/1.5 Arial; }`,
      filename: 'test.css',
      errors: [
        { messageId: 'hardcodedValue' }, // font-weight: 700
        { messageId: 'hardcodedValue' }  // font-size: 1rem (line-height parsing not implemented)
      ],
      output: `.example { font: var(--slds-g-font-weight-7, 700) 1rem/1.5 Arial; }`
    },

    // NEW UNIT TESTS - CH and EM units
    // Width with ch unit (character width) - should be detected and suggest sizing hook
    {
      code: `.example { width: 45ch; }`,
      filename: 'test.css',
      errors: [{ 
        messageId: 'hardcodedValue'
      }],
      output: `.example { width: var(--slds-g-sizing-content-2, 45ch); }`
    },
    // Font-size with em unit - should be detected but no hook available
    {
      code: `.example { font-size: 1.2em; }`,
      filename: 'test.css',
      errors: [{ 
        messageId: 'noReplacement'
      }]
    },
    // Max-width with ch unit - should be detected but no hook available
    {
      code: `.example { max-width: 80ch; }`,
      filename: 'test.css',
      errors: [{ 
        messageId: 'noReplacement'
      }]
    },
    // Line-height with em unit - should be detected but no hook available
    {
      code: `.example { line-height: 1.5em; }`,
      filename: 'test.css',
      errors: [{ 
        messageId: 'noReplacement'
      }]
    },
    // Box-shadow with var() color functions - should be detected and wrapped with shadow hook
    {
      code: `.example { box-shadow: 0 0 0 2px var(--slds-g-color-neutral-base-100), 0 0 0 4px var(--slds-g-color-brand-base-15); }`,
      filename: 'test.css',
      output: `.example { box-shadow: var(--slds-g-shadow-outset-focus-1, 0 0 0 2px var(--slds-g-color-neutral-base-100), 0 0 0 4px var(--slds-g-color-brand-base-15)); }`,
      errors: [{
        messageId: 'hardcodedValue'
      }]
    },
    {
      code: `.example { box-shadow: 0 0 0 2px var(--slds-g-color-brand-base-15) inset, 0 0 0 4px var(--slds-g-color-neutral-base-100) inset; }`,
      filename: 'test.css',
      output: `.example { box-shadow: var(--slds-g-shadow-inset-inverse-focus-1, 0 0 0 2px var(--slds-g-color-brand-base-15) inset, 0 0 0 4px var(--slds-g-color-neutral-base-100) inset); }`,
      errors: [{
        messageId: 'hardcodedValue'
      }]
    }
  ]
});
