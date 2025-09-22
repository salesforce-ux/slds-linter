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
        type: 'Identifier',
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
        type: 'Identifier',
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
        type: 'Identifier',
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
        type: 'Identifier',
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
        type: 'Identifier',
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
        type: 'Identifier',
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
          type: 'Identifier'
        },
        {
          messageId: 'errorWithReplacement',
          type: 'Identifier'
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
        type: 'Identifier'
      }]
    },

    // LWC token in calc() function
    {
      code: `.example { 
        width: calc(100% - var(--lwc-nubbinTriangleOffset)); 
      }`,
      output: `.example { 
        width: calc(100% - -0.1875rem); 
      }`,
      filename: 'test.css',
      errors: [{
        messageId: 'errorWithReplacement',
        type: 'Identifier'
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
        type: 'Identifier'
      }]
    },

    // Multiple occurrences of the same LWC token in a single property (similar to Stylelint test)
    {
      code: `.test { padding: var(--lwc-nubbinTriangleOffset) var(--lwc-nubbinTriangleOffset) var(--lwc-nubbinTriangleOffset) var(--lwc-nubbinTriangleOffset); }`,
      output: `.test { padding: -0.1875rem -0.1875rem -0.1875rem -0.1875rem; }`,
      filename: 'test.css',
      errors: [
        { messageId: 'errorWithReplacement', type: 'Identifier' },
        { messageId: 'errorWithReplacement', type: 'Identifier' },
        { messageId: 'errorWithReplacement', type: 'Identifier' },
        { messageId: 'errorWithReplacement', type: 'Identifier' }
      ]
    }
  ]
});
