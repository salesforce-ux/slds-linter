const rule = require('../../src/rules/v9/no-deprecated-tokens-slds1').default;
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

ruleTester.run('no-deprecated-tokens-slds1', rule, {
  valid: [
    {
      code: `.example { color: var(--lwc-brandPrimary, #123456); }`,
      filename: 'test.css',
    },
    {
      code: `.example { background: #fff; }`,
      filename: 'test.css',
    },
    {
      code: `.example { color: red; }`,
      filename: 'test.css',
    },
    // Non-deprecated token functions should pass
    {
      code: `.example { color: var(--slds-c-button-brand-color-background); }`,
      filename: 'test.css',
    },
    // token function used as fallback to slds token
    {
      code: `.example { color: var(--slds-c-button-brand-color-background, token(brandPrimary)); }`,
      filename: 'test.css',
    },
    // Unknown/non-LWC tokens should not be flagged (following StyleLint behavior)
    {
      code: `.example { color: token(unknownToken); }`,
      filename: 'test.css',
    }
  ],

  invalid: [
    // Basic deprecated token usage
    {
      code: `.example { color: token(account); }`,
      output: `.example { color: var(--lwc-account, token(account)); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'deprecatedToken',
        type: 'Identifier'
      }]
    },
    
    // Shorthand 't' function
    {
      code: `.example { color: t(accountInfo); }`,
      output: `.example { color: var(--lwc-accountInfo, t(accountInfo)); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'deprecatedToken',
        type: 'Identifier'
      }]
    },

    // Multiple deprecated tokens in same declaration
    {
      code: `.example { 
        color: token(account); 
        background: token(accountInfo);
      }`,
      output: `.example { 
        color: var(--lwc-account, token(account)); 
        background: var(--lwc-accountInfo, token(accountInfo));
      }`,
      filename: 'test.css',
      errors: [
        {
          messageId: 'deprecatedToken',
          type: 'Identifier'
        },
        {
          messageId: 'deprecatedToken', 
          type: 'Identifier'
        }
      ]
    },

    // Complex CSS with deprecated token
    {
      code: `.container .example:hover { 
        border: 1px solid token(account); 
        margin: 10px;
      }`,
      output: `.container .example:hover { 
        border: 1px solid var(--lwc-account, token(account)); 
        margin: 10px;
      }`,
      filename: 'test.css',
      errors: [{
        messageId: 'deprecatedToken',
        type: 'Identifier'
      }]
    },

    // Token in calc() function
    {
      code: `.example { 
        width: calc(100% - token(account)); 
      }`,
      output: `.example { 
        width: calc(100% - var(--lwc-account, token(account))); 
      }`,
      filename: 'test.css',
      errors: [{
        messageId: 'deprecatedToken',
        type: 'Identifier'
      }]
    },

    // Simple token call (no parameters)
    {
      code: `.example { 
        color: token(brandPrimary); 
      }`,
      output: `.example { 
        color: var(--lwc-brandPrimary, token(brandPrimary)); 
      }`,
      filename: 'test.css',
      errors: [{
        messageId: 'deprecatedToken',
        type: 'Identifier'
      }]
    }
  ]
});
