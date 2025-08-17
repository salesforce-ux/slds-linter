const rule = require('../../src/rules/v9/no-slds-var-without-fallback').default;
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

ruleTester.run('no-slds-var-without-fallback', rule, {
  valid: [
    // Non-SLDS tokens should be ignored
    {
      code: `.example { color: var(--custom-color); }`,
      filename: 'test.css',
    },
    {
      code: `.example { color: var(--lwc-brandHeader); }`,
      filename: 'test.css',
    },
    // SLDS tokens with fallback values should be valid
    {
      code: `.example { color: var(--slds-g-color-border-base-1, #333); }`,
      filename: 'test.css',
    },
    {
      code: `.example { color: var(--slds-g-color-border-base-1, var(--fallback-color)); }`,
      filename: 'test.css',
    },
    // Non-var functions
    {
      code: `.example { color: red; background: #fff; }`,
      filename: 'test.css',
    },
    // SLDS tokens that don't have metadata fallback values should be ignored
    {
      code: `.example { color: var(--slds-unknown-token); }`,
      filename: 'test.css',
    },
    // Custom SLDS tokens (not in metadata) should be ignored
    {
      code: `.example { color: var(--slds-custom-token); }`,
      filename: 'test.css',
    }
  ],

  invalid: [
    // SLDS token without fallback - should add fallback from metadata
    {
      code: `.example { color: var(--slds-g-color-border-base-1); }`,
      output: `.example { color: var(--slds-g-color-border-base-1, #c9c9c9); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'varWithoutFallback',
        type: 'Identifier',
        data: {
          cssVar: '--slds-g-color-border-base-1',
          recommendation: '#c9c9c9'
        }
      }]
    },

    // Multiple SLDS tokens without fallback
    {
      code: `.example { 
        color: var(--slds-g-color-border-base-1);
        background-color: var(--slds-g-color-border-base-2);
        border-color: var(--slds-g-color-border-base-3);
        padding: var(--slds-g-spacing-4);
        font-size: var(--slds-g-font-scale-2);
      }`,
      output: `.example { 
        color: var(--slds-g-color-border-base-1, #c9c9c9);
        background-color: var(--slds-g-color-border-base-2, #aeaeae);
        border-color: var(--slds-g-color-border-base-3, #939393);
        padding: var(--slds-g-spacing-4, 1rem);
        font-size: var(--slds-g-font-scale-2, 1rem);
      }`,
      filename: 'test.css',
      errors: [
        {
          messageId: 'varWithoutFallback',
          type: 'Identifier',
          data: {
            cssVar: '--slds-g-color-border-base-1',
            recommendation: '#c9c9c9'
          }
        },
        {
          messageId: 'varWithoutFallback',
          type: 'Identifier',
          data: {
            cssVar: '--slds-g-color-border-base-2',
            recommendation: '#aeaeae'
          }
        },
        {
          messageId: 'varWithoutFallback',
          type: 'Identifier',
          data: {
            cssVar: '--slds-g-color-border-base-3',
            recommendation: '#939393'
          }
        },
        {
          messageId: 'varWithoutFallback',
          type: 'Identifier',
          data: {
            cssVar: '--slds-g-spacing-4',
            recommendation: '1rem'
          }
        },
        {
          messageId: 'varWithoutFallback',
          type: 'Identifier',
          data: {
            cssVar: '--slds-g-font-scale-2',
            recommendation: '1rem'
          }
        }
      ]
    },

    // SLDS token in complex selector
    {
      code: `.container .example:hover { background: var(--slds-g-color-border-base-1); }`,
      output: `.container .example:hover { background: var(--slds-g-color-border-base-1, #c9c9c9); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'varWithoutFallback',
        type: 'Identifier',
        data: {
          cssVar: '--slds-g-color-border-base-1',
          recommendation: '#c9c9c9'
        }
      }]
    },

    // SLDS token in calc() function
    {
      code: `.example { width: calc(100% - var(--slds-g-spacing-4)); }`,
      output: `.example { width: calc(100% - var(--slds-g-spacing-4, 1rem)); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'varWithoutFallback',
        type: 'Identifier',
        data: {
          cssVar: '--slds-g-spacing-4',
          recommendation: '1rem'
        }
      }]
    },

    // Multiple SLDS tokens in same property value
    {
      code: `.example { 
        box-shadow: var(--slds-g-spacing-4) var(--slds-g-spacing-4) var(--slds-g-color-border-base-1);
      }`,
      output: `.example { 
        box-shadow: var(--slds-g-spacing-4, 1rem) var(--slds-g-spacing-4, 1rem) var(--slds-g-color-border-base-1, #c9c9c9);
      }`,
      filename: 'test.css',
      errors: [
        {
          messageId: 'varWithoutFallback',
          type: 'Identifier',
          data: {
            cssVar: '--slds-g-spacing-4',
            recommendation: '1rem'
          }
        },
        {
          messageId: 'varWithoutFallback',
          type: 'Identifier',
          data: {
            cssVar: '--slds-g-spacing-4',
            recommendation: '1rem'
          }
        },
        {
          messageId: 'varWithoutFallback',
          type: 'Identifier',
          data: {
            cssVar: '--slds-g-color-border-base-1',
            recommendation: '#c9c9c9'
          }
        }
      ]
    },

    // Mixed valid and invalid tokens
    {
      code: `.example { 
        color: var(--custom-color);
        background: var(--slds-g-color-border-base-1);
        border: 1px solid var(--slds-g-color-border-base-2, #existing-fallback);
      }`,
      output: `.example { 
        color: var(--custom-color);
        background: var(--slds-g-color-border-base-1, #c9c9c9);
        border: 1px solid var(--slds-g-color-border-base-2, #existing-fallback);
      }`,
      filename: 'test.css',
      errors: [{
        messageId: 'varWithoutFallback',
        type: 'Identifier',
        data: {
          cssVar: '--slds-g-color-border-base-1',
          recommendation: '#c9c9c9'
        }
      }]
    }
  ]
});
