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

ruleTester.run('no-hardcoded-values-slds2 (customMapping)', rule, {
  valid: [
    // With custom mapping, this should be valid (no error, auto-fixable)
    {
      code: `.example { background-color: var(--slds-g-color-custom, #fff); }`,
      filename: 'test.css',
      options: [{
        customMapping: {
          '--slds-g-color-custom': {
            properties: ['background-color'],
            values: ['#fff']
          }
        }
      }]
    }
  ],
  invalid: [
    // Color: Custom mapping with exact match - auto-fixable
    {
      code: `.example { color: #fff; }`,
      filename: 'test.css',
      options: [{
        customMapping: {
          '--slds-g-color-custom': {
            properties: ['color'],
            values: ['#fff']
          }
        }
      }],
      errors: [{
        messageId: 'hardcodedValue'
      }],
      output: `.example { color: var(--slds-g-color-custom, #fff); }`
    },
    
    // Color: Custom mapping with wildcard property pattern
    {
      code: `.example { background-color: white; }`,
      filename: 'test.css',
      options: [{
        customMapping: {
          '--slds-g-color-surface-container-1': {
            properties: ['background*'],
            values: ['white', '#fff']
          }
        }
      }],
      errors: [{
        messageId: 'hardcodedValue'
      }],
      output: `.example { background-color: var(--slds-g-color-surface-container-1, white); }`
    },

    // Density: Custom mapping for padding
    {
      code: `.example { padding: 10px; }`,
      filename: 'test.css',
      options: [{
        customMapping: {
          '--slds-g-spacing-custom': {
            properties: ['padding'],
            values: ['10px']
          }
        }
      }],
      errors: [{
        messageId: 'hardcodedValue'
      }],
      output: `.example { padding: var(--slds-g-spacing-custom, 10px); }`
    },

    // Density: Custom mapping for margin with multiple properties
    {
      code: `.example { margin: 1rem; }`,
      filename: 'test.css',
      options: [{
        customMapping: {
          '--slds-g-spacing-custom-rem': {
            properties: ['margin', 'padding'],
            values: ['1rem']
          }
        }
      }],
      errors: [{
        messageId: 'hardcodedValue'
      }],
      output: `.example { margin: var(--slds-g-spacing-custom-rem, 1rem); }`
    },

    // Font: Custom mapping for font-size
    {
      code: `.example { font-size: 14px; }`,
      filename: 'test.css',
      options: [{
        customMapping: {
          '--slds-g-font-size-custom': {
            properties: ['font-size'],
            values: ['14px']
          }
        }
      }],
      errors: [{
        messageId: 'hardcodedValue'
      }],
      output: `.example { font-size: var(--slds-g-font-size-custom, 14px); }`
    },

    // Font: Custom mapping for font-weight
    {
      code: `.example { font-weight: 400; }`,
      filename: 'test.css',
      options: [{
        customMapping: {
          '--slds-g-font-weight-custom': {
            properties: ['font-weight'],
            values: ['400']
          }
        }
      }],
      errors: [{
        messageId: 'hardcodedValue'
      }],
      output: `.example { font-weight: var(--slds-g-font-weight-custom, 400); }`
    },

    // Box-shadow: Custom mapping
    {
      code: `.example { box-shadow: 0 2px 4px rgba(0,0,0,0.1); }`,
      filename: 'test.css',
      options: [{
        customMapping: {
          '--slds-g-shadow-custom': {
            properties: ['box-shadow'],
            values: ['0 2px 4px rgba(0,0,0,0.1)']
          }
        }
      }],
      errors: [{
        messageId: 'hardcodedValue'
      }],
      output: `.example { box-shadow: var(--slds-g-shadow-custom, 0 2px 4px rgba(0,0,0,0.1)); }`
    },

    // Shorthand: Custom mapping in padding shorthand
    {
      code: `.example { padding: 10px 20px; }`,
      filename: 'test.css',
      options: [{
        customMapping: {
          '--slds-g-spacing-10': {
            properties: ['padding'],
            values: ['10px']
          },
          '--slds-g-spacing-20': {
            properties: ['padding'],
            values: ['20px']
          }
        }
      }],
      errors: [{
        messageId: 'hardcodedValue'
      }, {
        messageId: 'hardcodedValue'
      }],
      output: `.example { padding: var(--slds-g-spacing-10, 10px) 20px; }`
    },

    // Mixed: Custom mapping overrides metadata - custom mapping takes precedence
    {
      code: `.example { font-size: 16px; }`,
      filename: 'test.css',
      options: [{
        customMapping: {
          '--my-custom-font-16': {
            properties: ['font-size'],
            values: ['16px']
          }
        }
      }],
      errors: [{
        messageId: 'hardcodedValue'
      }],
      // Should use custom mapping, not metadata hook (--slds-g-font-scale-2)
      output: `.example { font-size: var(--my-custom-font-16, 16px); }`
    },

    // Fallback: No custom mapping, falls back to metadata
    {
      code: `.example { font-size: 0.875rem; }`,
      filename: 'test.css',
      options: [{
        customMapping: {
          '--slds-g-font-size-custom': {
            properties: ['font-size'],
            values: ['14px']
          }
        }
      }],
      errors: [{
        messageId: 'hardcodedValue'
      }],
      // No custom mapping for 0.875rem, falls back to metadata
      output: `.example { font-size: var(--slds-g-font-scale-1, 0.875rem); }`
    }
  ]
});
