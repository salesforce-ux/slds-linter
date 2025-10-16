const rule = require('../../src/rules/v9/no-slds-namespace-for-custom-hooks').default;
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

ruleTester.run('no-slds-namespace-for-custom-hooks', rule, {
  valid: [
    // Valid custom hooks in proper namespace
    {
      code: `.example { --myapp-valid-token: #fff; }`,
      filename: 'test.css',
    },
    {
      code: `.example { color: var(--myapp-valid-token); }`,
      filename: 'test.css',
    },
    // Valid SLDS hooks that are documented/allowed
    {
      code: `.example { --slds-c-button-color-background: #fff; }`,
      filename: 'test.css',
    },
    {
      code: `.example { color: var(--slds-c-button-color-background); }`,
      filename: 'test.css',
    },
    // Valid SDS hooks that are documented/allowed (converted to SLDS)
    {
      code: `.example { --sds-c-button-color-background: #fff; }`,
      filename: 'test.css',
    },
    {
      code: `.example { color: var(--sds-c-button-color-background); }`,
      filename: 'test.css',
    },
    // Valid shared SLDS hooks (private/undocumented but legitimate)
    {
      code: `.example { box-shadow: var(--slds-s-button-shadow-focus, var(--lwc-shadowButtonFocus)); }`,
      filename: 'test.css',
    },
    {
      code: `.example { --slds-s-button-shadow-focus: 0 0 0 4px blue; }`,
      filename: 'test.css',
    },
    // Test limitation fix: var() in declaration values should be detected
    {
      code: `.example { --slds-c-button-color-background: var(--slds-s-button-shadow-focus); }`,
      filename: 'test.css',
    },
    {
      code: `.example { --slds-g-color-brand-base-100: var(--slds-g-color-neutral-base-100); }`,
      filename: 'test.css',
    },
    // Other custom namespaces should be allowed
    {
      code: `.example { --custom-color: red; color: var(--custom-color); }`,
      filename: 'test.css',
    },
    // Standard CSS properties
    {
      code: `.example { background: #fff; color: red; }`,
      filename: 'test.css',
    }
  ],

  invalid: [
    // Custom hook using SLDS namespace - Declaration (left-side)
    {
      code: `.example { --slds-my-own-token: #fff; }`,
      output: null, // This rule doesn't provide auto-fix
      filename: 'test.css',
      errors: [{
        messageId: 'customHookNamespace',
        type: 'Declaration',
        data: {
          token: '--slds-my-own-token',
          tokenWithoutNamespace: 'my-own-token'
        }
      }]
    },

    // Custom hook using SLDS namespace - in var() function (right-side)
    {
      code: `.example { color: var(--slds-custom-color); }`,
      output: null, // This rule doesn't provide auto-fix
      filename: 'test.css',
      errors: [{
        messageId: 'customHookNamespace',
        type: 'Declaration',
        data: {
          token: '--slds-custom-color',
          tokenWithoutNamespace: 'custom-color'
        }
      }]
    },

    // Custom hook using SDS namespace - Declaration (left-side)
    {
      code: `.example { --sds-my-custom-hook: blue; }`,
      output: null, // This rule doesn't provide auto-fix
      filename: 'test.css',
      errors: [{
        messageId: 'customHookNamespace',
        type: 'Declaration',
        data: {
          token: '--sds-my-custom-hook',
          tokenWithoutNamespace: 'my-custom-hook'
        }
      }]
    },

    // Custom hook using SDS namespace - in var() function (right-side)
    {
      code: `.example { background: var(--sds-my-background); }`,
      output: null, // This rule doesn't provide auto-fix
      filename: 'test.css',
      errors: [{
        messageId: 'customHookNamespace',
        type: 'Declaration',
        data: {
          token: '--sds-my-background',
          tokenWithoutNamespace: 'my-background'
        }
      }]
    },

    // Multiple custom hooks in same rule block
    {
      code: `.example { 
        --slds-custom-prop1: red;
        --slds-custom-prop2: blue;
        color: var(--slds-custom-color);
      }`,
      output: null, // This rule doesn't provide auto-fix
      filename: 'test.css',
      errors: [
        {
          messageId: 'customHookNamespace',
          type: 'Declaration',
          data: {
            token: '--slds-custom-prop1',
            tokenWithoutNamespace: 'custom-prop1'
          }
        },
        {
          messageId: 'customHookNamespace',
          type: 'Declaration',
          data: {
            token: '--slds-custom-prop2',
            tokenWithoutNamespace: 'custom-prop2'
          }
        },
        {
          messageId: 'customHookNamespace',
          type: 'Declaration',
          data: {
            token: '--slds-custom-color',
            tokenWithoutNamespace: 'custom-color'
          }
        }
      ]
    },

    // Mixed valid and invalid hooks
    {
      code: `.example { 
        --myapp-valid: #fff;
        --slds-invalid-custom: red;
        color: var(--slds-c-button-color-background);
        background: var(--slds-my-custom-bg);
      }`,
      output: null, // This rule doesn't provide auto-fix
      filename: 'test.css',
      errors: [
        {
          messageId: 'customHookNamespace',
          type: 'Declaration',
          data: {
            token: '--slds-invalid-custom',
            tokenWithoutNamespace: 'invalid-custom'
          }
        },
        {
          messageId: 'customHookNamespace',
          type: 'Declaration',
          data: {
            token: '--slds-my-custom-bg',
            tokenWithoutNamespace: 'my-custom-bg'
          }
        }
      ]
    },

    // Complex CSS selector with custom SLDS hook
    {
      code: `.container .example:hover { background: var(--slds-hover-color); }`,
      output: null, // This rule doesn't provide auto-fix
      filename: 'test.css',
      errors: [{
        messageId: 'customHookNamespace',
        type: 'Declaration',
        data: {
          token: '--slds-hover-color',
          tokenWithoutNamespace: 'hover-color'
        }
      }]
    },

    // Custom hook in calc() function
    {
      code: `.example { 
        width: calc(100% - var(--slds-my-offset)); 
      }`,
      output: null, // This rule doesn't provide auto-fix
      filename: 'test.css',
      errors: [{
        messageId: 'customHookNamespace',
        type: 'Declaration',
        data: {
          token: '--slds-my-offset',
          tokenWithoutNamespace: 'my-offset'
        }
      }]
    },

    // Multiple occurrences of the same custom hook - report each occurrence
    {
      code: `.test { padding: var(--slds-spacing) var(--slds-spacing) var(--slds-spacing) var(--slds-spacing); }`,
      output: null, // This rule doesn't provide auto-fix
      filename: 'test.css',
      errors: [
        {
          messageId: 'customHookNamespace',
          type: 'Declaration',
          data: {
            token: '--slds-spacing',
            tokenWithoutNamespace: 'spacing'
          }
        },
        {
          messageId: 'customHookNamespace',
          type: 'Declaration',
          data: {
            token: '--slds-spacing',
            tokenWithoutNamespace: 'spacing'
          }
        },
        {
          messageId: 'customHookNamespace',
          type: 'Declaration',
          data: {
            token: '--slds-spacing',
            tokenWithoutNamespace: 'spacing'
          }
        },
        {
          messageId: 'customHookNamespace',
          type: 'Declaration',
          data: {
            token: '--slds-spacing',
            tokenWithoutNamespace: 'spacing'
          }
        }
      ]
    },

    // Test limitation fix: Custom hooks in declaration values ARE detected
    {
      code: `.example { --slds-c-button-color-background: var(--slds-my-custom-color); }`,
      output: null,
      filename: 'test.css',
      errors: [{
        messageId: 'customHookNamespace',
        type: 'Declaration',
        data: {
          token: '--slds-my-custom-color',
          tokenWithoutNamespace: 'my-custom-color'
        }
      }]
    },

    // Multiple custom hooks in declaration value
    {
      code: `.example { background: var(--slds-custom-one) var(--slds-custom-two); }`,
      output: null,
      filename: 'test.css',
      errors: [
        {
          messageId: 'customHookNamespace',
          type: 'Declaration',
          data: {
            token: '--slds-custom-one',
            tokenWithoutNamespace: 'custom-one'
          }
        },
        {
          messageId: 'customHookNamespace',
          type: 'Declaration',
          data: {
            token: '--slds-custom-two',
            tokenWithoutNamespace: 'custom-two'
          }
        }
      ]
    }
  ]
});
