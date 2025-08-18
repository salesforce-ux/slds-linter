const rule = require('../../src/rules/v9/no-sldshook-fallback-for-lwctoken').default;
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

ruleTester.run('no-sldshook-fallback-for-lwctoken', rule, {
  valid: [
    // Non-LWC tokens should be ignored  
    {
      code: `.example { color: var(--myapp-color-background-1, var(--slds-g-color-border-1)); }`,
      filename: 'test.css',
    },
    // LWC tokens with non-SLDS fallbacks should be valid
    {
      code: `.example { color: var(--lwc-color-background-1, var(--myapp-color-border-1)); }`,
      filename: 'test.css',
    },
    // SLDS tokens without LWC prefix should be valid
    {
      code: `.example { color: var(--slds-g-color-border-1); }`,
      filename: 'test.css',
    },
    // LWC tokens without fallback should be valid
    {
      code: `.example { color: var(--lwc-color-background-1); }`,
      filename: 'test.css',
    },
    // LWC tokens with static value fallbacks should be valid
    {
      code: `.example { color: var(--lwc-color-background-1, #333); }`,
      filename: 'test.css',
    },
    // Non-var functions should be ignored
    {
      code: `.example { color: red; background: #fff; }`,
      filename: 'test.css',
    },
    // LWC tokens with fallback to tokens not in SLDS metadata should be valid
    {
      code: `.example { color: var(--lwc-color-background-1, var(--slds-unknown-token)); }`,
      filename: 'test.css',
    }
  ],

  invalid: [
    // LWC token with SLDS hook fallback - basic case
    {
      code: `.example { color: var(--lwc-color-background-1, var(--slds-g-color-border-1)); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'unsupportedFallback',
        type: 'Identifier',
        data: {
          lwcToken: '--lwc-color-background-1',
          sldsToken: '--slds-g-color-border-1'
        }
      }]
    },

    // Complex selector with LWC token using SLDS fallback
    {
      code: `.container .example:hover { background: var(--lwc-color-background-1, var(--slds-g-color-border-1)); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'unsupportedFallback',
        type: 'Identifier',
        data: {
          lwcToken: '--lwc-color-background-1',
          sldsToken: '--slds-g-color-border-1'
        }
      }]
    },

    // Multiple LWC tokens with SLDS fallbacks in same declaration
    {
      code: `.example { 
        color: var(--lwc-color-background-1, var(--slds-g-color-border-1));
        background: var(--lwc-color-background-2, var(--slds-g-color-border-2));
      }`,
      filename: 'test.css',
      errors: [
        {
          messageId: 'unsupportedFallback',
          type: 'Identifier',
          data: {
            lwcToken: '--lwc-color-background-1',
            sldsToken: '--slds-g-color-border-1'
          }
        },
        {
          messageId: 'unsupportedFallback',
          type: 'Identifier', 
          data: {
            lwcToken: '--lwc-color-background-2',
            sldsToken: '--slds-g-color-border-2'
          }
        }
      ]
    },

    // Nested var() functions - deeper nesting (matching stylelint test case)
    {
      code: `.example { color: var(--lwc-color-background-1, var(--slds-g-color-border-1, var(--lwc-color-background-2))); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'unsupportedFallback',
        type: 'Identifier',
        data: {
          lwcToken: '--lwc-color-background-1',
          sldsToken: '--slds-g-color-border-1'
        }
      }]
    },

    // Mixed valid and invalid - some with SLDS fallbacks, some without
    {
      code: `.example { 
        color: var(--custom-color);
        background: var(--lwc-color-background-1, var(--slds-g-color-border-1));
        border: var(--lwc-color-background-2, #static-value);
      }`,
      filename: 'test.css',
      errors: [{
        messageId: 'unsupportedFallback',
        type: 'Identifier',
        data: {
          lwcToken: '--lwc-color-background-1',
          sldsToken: '--slds-g-color-border-1'
        }
      }]
    },

    // SDS token converted to SLDS - testing toSldsToken function
    {
      code: `.example { color: var(--lwc-color-background-1, var(--sds-g-color-border-1)); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'unsupportedFallback',
        type: 'Identifier',
        data: {
          lwcToken: '--lwc-color-background-1',
          sldsToken: '--sds-g-color-border-1'
        }
      }]
    },

    // LWC token in calc() function
    {
      code: `.example { width: calc(100% - var(--lwc-spacing-4, var(--slds-g-spacing-4))); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'unsupportedFallback',
        type: 'Identifier',
        data: {
          lwcToken: '--lwc-spacing-4',
          sldsToken: '--slds-g-spacing-4'
        }
      }]
    }
  ]
});
