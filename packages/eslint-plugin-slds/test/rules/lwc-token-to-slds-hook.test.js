const rule = require('../../src/rules/v9/lwc-token-to-slds-hook').default;
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

ruleTester.run('lwc-token-to-slds-hook', rule, {
  valid: [
    // Non-LWC tokens should be ignored
    {
      code: `.example { color: var(--custom-color); }`,
      filename: 'test.css',
    },
    {
      code: `.example { --custom-prop: blue; }`,
      filename: 'test.css',
    },
    // Already correct SLDS tokens
    {
      code: `.example { color: var(--slds-g-color-palette-blue-10); }`,
      filename: 'test.css',
    },
    {
      code: `:root { --slds-g-spacing-1: 4px; }`,
      filename: 'test.css',
    },
    // Tokens marked as "continue to use" should be ignored
    {
      code: `.example { --lwc-brandHeader: #123456; }`,
      filename: 'test.css',
    },
    {
      code: `.example { color: var(--lwc-brandHeader); }`,
      filename: 'test.css',
    },
    // Customer-created tokens should be ignored
    {
      code: `.example { --lwc-customer-created: red; }`,
      filename: 'test.css',
    },
    {
      code: `.example { color: var(--lwc-customer-created); }`,
      filename: 'test.css',
    },
    // Standard CSS properties
    {
      code: `.example { background: #fff; color: red; }`,
      filename: 'test.css',
    }
  ],

  invalid: [
    // LWC token as CSS custom property (left-side) - SLDS token replacement
    {
      code: `:root { --lwc-brandDark: #123456; }`,
      output: `:root { --slds-g-color-accent-dark-1: #123456; }`,
      filename: 'test.css',
      errors: [{
        messageId: 'errorWithStyleHooks',
        type: 'Declaration',
        data: {
          oldValue: '--lwc-brandDark',
          newValue: '--slds-g-color-accent-dark-1'
        }
      }]
    },

    // LWC token in var() function (right-side) - SLDS token replacement
    {
      code: `.example { color: var(--lwc-brandDark); }`,
      output: `.example { color: var(--slds-g-color-accent-dark-1, var(--lwc-brandDark)); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'errorWithStyleHooks',
        type: 'Declaration',
        data: {
          oldValue: '--lwc-brandDark',
          newValue: '--slds-g-color-accent-dark-1'
        }
      }]
    },

    // LWC token with raw value replacement
    {
      code: `.example { color: var(--lwc-brandPrimaryTransparent); }`,
      output: `.example { color: transparent; }`,
      filename: 'test.css',
      errors: [{
        messageId: 'errorWithReplacement',
        type: 'Declaration',
        data: {
          oldValue: '--lwc-brandPrimaryTransparent',
          newValue: 'transparent'
        }
      }]
    },

    // LWC token with complex replacement value
    {
      code: `.example { padding: var(--lwc-cardBodyPadding); }`,
      output: `.example { padding: 0 var(--slds-g-spacing-4); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'errorWithReplacement',
        type: 'Declaration',
        data: {
          oldValue: '--lwc-cardBodyPadding',
          newValue: '0 var(--slds-g-spacing-4)'
        }
      }]
    },

    // LWC token with color-mix replacement
    {
      code: `.example { background: var(--lwc-brandPrimaryTransparent10); }`,
      output: `.example { background: color-mix(in oklab, var(--slds-g-color-accent-1), transparent 90%); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'errorWithReplacement',
        type: 'Declaration',
        data: {
          oldValue: '--lwc-brandPrimaryTransparent10',
          newValue: 'color-mix(in oklab, var(--slds-g-color-accent-1), transparent 90%)'
        }
      }]
    },

    // LWC token with array of recommendations (multiple options)
    {
      code: `.example { background: var(--lwc-colorBackgroundLight); }`,
      output: null, // No auto-fix for array recommendations
      filename: 'test.css',
      errors: [{
        messageId: 'errorWithStyleHooks',
        type: 'Declaration',
        data: {
          oldValue: '--lwc-colorBackgroundLight',
          newValue: '\n1. --slds-g-color-surface-1\n2. --slds-g-color-surface-container-1'
        }
      }]
    },

    // LWC token with no recommendation (empty replacement)
    {
      code: `.example { background: var(--lwc-brandBackgroundDark); }`,
      output: null, // No auto-fix when no recommendation
      filename: 'test.css',
      errors: [{
        messageId: 'errorWithNoRecommendation',
        type: 'Declaration',
        data: {
          oldValue: '--lwc-brandBackgroundDark'
        }
      }]
    },

    // Multiple LWC tokens in same declaration
    {
      code: `.example { 
        color: var(--lwc-brandDark);
        background: var(--lwc-brandPrimaryTransparent);
      }`,
      output: `.example { 
        color: var(--slds-g-color-accent-dark-1, var(--lwc-brandDark));
        background: transparent;
      }`,
      filename: 'test.css',
      errors: [
        {
          messageId: 'errorWithStyleHooks',
          type: 'Declaration'
        },
        {
          messageId: 'errorWithReplacement',
          type: 'Declaration'
        }
      ]
    },

    // Multiple CSS custom properties with LWC tokens
    {
      code: `:root { 
        --lwc-brandDark: #123456;
        --lwc-nubbinTriangleOffset: -0.2rem;
      }`,
      output: `:root { 
        --slds-g-color-accent-dark-1: #123456;
        --lwc-nubbinTriangleOffset: -0.2rem;
      }`,
      filename: 'test.css',
      errors: [
        {
          messageId: 'errorWithStyleHooks',
          type: 'Declaration'
        },
        {
          messageId: 'errorWithReplacement',
          type: 'Declaration'
        }
      ]
    },

    // Complex CSS selector with LWC token
    {
      code: `.container .example:hover { background: var(--lwc-brandDark); }`,
      output: `.container .example:hover { background: var(--slds-g-color-accent-dark-1, var(--lwc-brandDark)); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'errorWithStyleHooks',
        type: 'Declaration'
      }]
    },

    // LWC token in calc() function
    {
      code: `.example { 
        width: calc(100% - var(--lwc-nubbinTriangleOffset)); 
      }`,
      output: `.example { 
        width: calc(100% - calc(var(--slds-g-sizing-base) * -0.1875)); 
      }`,
      filename: 'test.css',
      errors: [{
        messageId: 'errorWithReplacement',
        type: 'Declaration'
      }]
    },

    // Mixed valid and invalid tokens
    {
      code: `.example { 
        color: var(--custom-color);
        background: var(--lwc-brandDark);
        border: 1px solid var(--slds-g-color-palette-blue-20);
      }`,
      output: `.example { 
        color: var(--custom-color);
        background: var(--slds-g-color-accent-dark-1, var(--lwc-brandDark));
        border: 1px solid var(--slds-g-color-palette-blue-20);
      }`,
      filename: 'test.css',
      errors: [{
        messageId: 'errorWithStyleHooks',
        type: 'Declaration'
      }]
    },

    // Multiple occurrences of the same LWC token in a single property (similar to Stylelint test)
    {
      code: `.test { padding: var(--lwc-nubbinTriangleOffset) var(--lwc-nubbinTriangleOffset) var(--lwc-nubbinTriangleOffset) var(--lwc-nubbinTriangleOffset); }`,
      output: `.test { padding: calc(var(--slds-g-sizing-base) * -0.1875) calc(var(--slds-g-sizing-base) * -0.1875) calc(var(--slds-g-sizing-base) * -0.1875) calc(var(--slds-g-sizing-base) * -0.1875); }`,
      filename: 'test.css',
      errors: [
        { messageId: 'errorWithReplacement', type: 'Declaration' },
        { messageId: 'errorWithReplacement', type: 'Declaration' },
        { messageId: 'errorWithReplacement', type: 'Declaration' },
        { messageId: 'errorWithReplacement', type: 'Declaration' }
      ]
      },

    // NEW: LWC tokens with fallback values - SLDS token replacement
    {
      code: `.lwcToSLDS {
        background: var(--lwc-pageHeaderColorBackground, rgb(243, 242, 242));
        border-radius: var(--lwc-borderRadiusMedium, 0.25rem);
        margin-bottom: var(--lwc-varSpacingVerticalMedium, 1rem);
      }`,
      output: `.lwcToSLDS {
        background: var(--slds-g-color-surface-container-2, var(--lwc-pageHeaderColorBackground, rgb(243, 242, 242)));
        border-radius: var(--slds-g-radius-border-2, var(--lwc-borderRadiusMedium, 0.25rem));
        margin-bottom: var(--slds-g-spacing-var-block-4, var(--lwc-varSpacingVerticalMedium, 1rem));
      }`,
      filename: 'test.css',
      errors: [
        {
          messageId: 'errorWithStyleHooks',
          type: 'Declaration',
          data: {
            oldValue: '--lwc-pageHeaderColorBackground',
            newValue: '--slds-g-color-surface-container-2'
          }
        },
        {
          messageId: 'errorWithStyleHooks',
          type: 'Declaration',
          data: {
            oldValue: '--lwc-borderRadiusMedium',
            newValue: '--slds-g-radius-border-2'
          }
        },
        {
          messageId: 'errorWithStyleHooks',
          type: 'Declaration',
          data: {
            oldValue: '--lwc-varSpacingVerticalMedium',
            newValue: '--slds-g-spacing-var-block-4'
          }
        }
      ]
    },

    // NEW: LWC token with fallback value - raw value replacement
    {
      code: `.example { color: var(--lwc-brandPrimaryTransparent, transparent); }`,
      output: `.example { color: transparent; }`,
      filename: 'test.css',
      errors: [{
        messageId: 'errorWithReplacement',
        type: 'Declaration',
        data: {
          oldValue: '--lwc-brandPrimaryTransparent',
          newValue: 'transparent'
        }
      }]
    },

    // NEW: LWC token with complex fallback value (nested var function)
    {
      code: `.example { background: var(--lwc-brandDark, var(--custom-fallback, #333)); }`,
      output: `.example { background: var(--slds-g-color-accent-dark-1, var(--lwc-brandDark, var(--custom-fallback, #333))); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'errorWithStyleHooks',
        type: 'Declaration',
        data: {
          oldValue: '--lwc-brandDark',
          newValue: '--slds-g-color-accent-dark-1'
        }
      }]
    },

    // NEW: LWC token with numeric fallback value
    {
      code: `.example { width: var(--lwc-nubbinTriangleOffset, -0.2rem); }`,
      output: `.example { width: calc(var(--slds-g-sizing-base) * -0.1875); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'errorWithReplacement',
        type: 'Declaration',
        data: {
          oldValue: '--lwc-nubbinTriangleOffset',
          newValue: 'calc(var(--slds-g-sizing-base) * -0.1875)'
        }
      }]
    },

    // NEW: LWC token with string fallback value
    {
      code: `.example { font-family: var(--lwc-fontFamily, 'Arial, sans-serif'); }`,
      output: `.example { font-family: var(--slds-g-font-family-base, var(--lwc-fontFamily, 'Arial, sans-serif')); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'errorWithStyleHooks',
        type: 'Declaration',
        data: {
          oldValue: '--lwc-fontFamily',
          newValue: '--slds-g-font-family-base'
        }
      }]
    },

    // NEW: Mixed LWC tokens with and without fallbacks
    {
      code: `.example { 
        color: var(--lwc-brandDark);
        background: var(--lwc-brandPrimaryTransparent, transparent);
        border: var(--lwc-borderWidthThin, 1px) solid;
      }`,
      output: `.example { 
        color: var(--slds-g-color-accent-dark-1, var(--lwc-brandDark));
        background: transparent;
        border: var(--slds-g-sizing-border-1, var(--lwc-borderWidthThin, 1px)) solid;
      }`,
      filename: 'test.css',
      errors: [
        {
          messageId: 'errorWithStyleHooks',
          type: 'Declaration',
          data: {
            oldValue: '--lwc-brandDark',
            newValue: '--slds-g-color-accent-dark-1'
          }
        },
        {
          messageId: 'errorWithReplacement',
          type: 'Declaration',
          data: {
            oldValue: '--lwc-brandPrimaryTransparent',
            newValue: 'transparent'
          }
        },
        {
          messageId: 'errorWithStyleHooks',
          type: 'Declaration',
          data: {
            oldValue: '--lwc-borderWidthThin',
            newValue: '--slds-g-sizing-border-1'
          }
        }
      ]
    },

    // NEW: LWC token with fallback in calc() function (using existing token)
    {
      code: `.example { 
        width: calc(100% - var(--lwc-nubbinTriangleOffset, -0.2rem)); 
      }`,
      output: `.example { 
        width: calc(100% - calc(var(--slds-g-sizing-base) * -0.1875)); 
      }`,
      filename: 'test.css',
      errors: [{
        messageId: 'errorWithReplacement',
        type: 'Declaration',
        data: {
          oldValue: '--lwc-nubbinTriangleOffset',
          newValue: 'calc(var(--slds-g-sizing-base) * -0.1875)'
        }
      }]
    },

    // NEW: LWC token with array recommendations and fallback (no auto-fix)
    {
      code: `.example { background: var(--lwc-colorBackgroundLight, #f3f2f2); }`,
      output: null, // No auto-fix for array recommendations
      filename: 'test.css',
      errors: [{
        messageId: 'errorWithStyleHooks',
        type: 'Declaration',
        data: {
          oldValue: '--lwc-colorBackgroundLight',
          newValue: '\n1. --slds-g-color-surface-1\n2. --slds-g-color-surface-container-1'
        }
      }]
    },

    // NEW: LWC token with no recommendation and fallback (no auto-fix)
    {
      code: `.example { background: var(--lwc-brandBackgroundDark, #000); }`,
      output: null, // No auto-fix when no recommendation
      filename: 'test.css',
      errors: [{
        messageId: 'errorWithNoRecommendation',
        type: 'Declaration',
        data: {
          oldValue: '--lwc-brandBackgroundDark'
        }
      }]
    },

    // NEW: LWC token in custom property value (limitation fix)
    // When a custom property has an LWC token in its value, it's not parsed as a Function node
    // This test ensures the Declaration handler catches it
    {
      code: `.testClass { --slds-c-icon-color-foreground-default: var(--lwc-brandDark); }`,
      output: `.testClass { --slds-c-icon-color-foreground-default: var(--slds-g-color-accent-dark-1, var(--lwc-brandDark)); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'errorWithStyleHooks',
        type: 'Declaration',
        data: {
          oldValue: '--lwc-brandDark',
          newValue: '--slds-g-color-accent-dark-1'
        }
      }]
    }
  ]
});