const rule = require('../../src/rules/v9/enforce-component-hook-naming-convention').default;
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

ruleTester.run('enforce-component-hook-naming-convention', rule, {
  valid: [
    // Modern/non-deprecated component hooks should pass
    {
      code: `:root {
        --slds-c-accordion-section-color-border: #000;
      }`,
      filename: 'test.css',
    },
    // Non-SLDS component hooks should be ignored
    {
      code: `:root {
        --custom-c-accordion-section-color-border: #000;
      }`,
      filename: 'test.css',
    },
    // Non-component hooks should be ignored
    {
      code: `:root {
        --slds-g-color-border: #000;
      }`,
      filename: 'test.css',
    },
    // Modern SLDS component hooks should pass
    {
      code: `.example {
        background: var(--slds-c-accordion-section-color-border);
      }`,
      filename: 'test.css',
    },
    // Custom CSS properties that don't match pattern
    {
      code: `:root {
        --my-app-color: red;
        --custom-background: blue;
      }`,
      filename: 'test.css',
    },
    // Valid component hooks that are not deprecated
    {
      code: `:root {
        --slds-c-button-brand-color-background: #007db8;
        --slds-c-card-color-background: #fff;
      }`,
      filename: 'test.css',
    },
    // Modern component hook property with modern component hook in value
    {
      code: `.testClass {
        --slds-c-accordion-section-color-background: var(--slds-c-accordion-section-color-border);
      }`,
      filename: 'test.css',
    },
    // Your requested test case: modern component hook property with modern hook in value
    {
      code: `.testClass {
        --slds-c-accordion-section-color-border: var(--slds-c-accordion-section-color-border);
      }`,
      filename: 'test.css',
    }
  ],

  invalid: [
    // Basic deprecated component hook usage in declaration
    {
      code: `:root {
        --slds-c-accordion-color-border: #000;
      }`,
      output: `:root {
        --slds-c-accordion-section-color-border: #000;
      }`,
      filename: 'test.css',
      errors: [{
        messageId: 'replace',
        type: 'Declaration',
        data: {
          oldValue: '--slds-c-accordion-color-border',
          suggestedMatch: '--slds-c-accordion-section-color-border'
        }
      }]
    },

    // Deprecated component hook in var() function
    {
      code: `.example {
        color: var(--slds-c-accordion-color-border);
      }`,
      output: `.example {
        color: var(--slds-c-accordion-section-color-border);
      }`,
      filename: 'test.css',
      errors: [
        {
          messageId: 'replace',
          type: 'Declaration',
          data: {
            oldValue: '--slds-c-accordion-color-border',
            suggestedMatch: '--slds-c-accordion-section-color-border'
          }
        },
        {
          messageId: 'replace',
          type: 'Identifier',
          data: {
            oldValue: '--slds-c-accordion-color-border',
            suggestedMatch: '--slds-c-accordion-section-color-border'
          }
        }
      ]
    },

    // Multiple deprecated component hooks in same file
    {
      code: `:root {
        --slds-c-accordion-color-border: #000;
      }
      .example {
        background: var(--slds-c-accordion-color-border);
      }`,
      output: `:root {
        --slds-c-accordion-section-color-border: #000;
      }
      .example {
        background: var(--slds-c-accordion-section-color-border);
      }`,
      filename: 'test.css',
      errors: [
        {
          messageId: 'replace',
          type: 'Declaration',
          data: {
            oldValue: '--slds-c-accordion-color-border',
            suggestedMatch: '--slds-c-accordion-section-color-border'
          }
        },
        {
          messageId: 'replace',
          type: 'Declaration',
          data: {
            oldValue: '--slds-c-accordion-color-border',
            suggestedMatch: '--slds-c-accordion-section-color-border'
          }
        },
        {
          messageId: 'replace',
          type: 'Identifier',
          data: {
            oldValue: '--slds-c-accordion-color-border',
            suggestedMatch: '--slds-c-accordion-section-color-border'
          }
        }
      ]
    },

    // Complex CSS with deprecated component hook
    {
      code: `.container .example:hover {
        border: 1px solid var(--slds-c-accordion-color-border);
        margin: 10px;
      }`,
      output: `.container .example:hover {
        border: 1px solid var(--slds-c-accordion-section-color-border);
        margin: 10px;
      }`,
      filename: 'test.css',
      errors: [
        {
          messageId: 'replace',
          type: 'Declaration',
          data: {
            oldValue: '--slds-c-accordion-color-border',
            suggestedMatch: '--slds-c-accordion-section-color-border'
          }
        },
        {
          messageId: 'replace',
          type: 'Identifier',
          data: {
            oldValue: '--slds-c-accordion-color-border',
            suggestedMatch: '--slds-c-accordion-section-color-border'
          }
        }
      ]
    },

    // Deprecated component hook in calc() function
    {
      code: `.example {
        width: calc(100% - var(--slds-c-accordion-color-border));
      }`,
      output: `.example {
        width: calc(100% - var(--slds-c-accordion-section-color-border));
      }`,
      filename: 'test.css',
      errors: [
        {
          messageId: 'replace',
          type: 'Declaration',
          data: {
            oldValue: '--slds-c-accordion-color-border',
            suggestedMatch: '--slds-c-accordion-section-color-border'
          }
        },
        {
          messageId: 'replace',
          type: 'Identifier',
          data: {
            oldValue: '--slds-c-accordion-color-border',
            suggestedMatch: '--slds-c-accordion-section-color-border'
          }
        }
      ]
    },

    // Deprecated component hook with fallback value
    {
      code: `.example {
        color: var(--slds-c-accordion-color-border, #333);
      }`,
      output: `.example {
        color: var(--slds-c-accordion-section-color-border, #333);
      }`,
      filename: 'test.css',
      errors: [
        {
          messageId: 'replace',
          type: 'Declaration',
          data: {
            oldValue: '--slds-c-accordion-color-border',
            suggestedMatch: '--slds-c-accordion-section-color-border'
          }
        },
        {
          messageId: 'replace',
          type: 'Identifier',
          data: {
            oldValue: '--slds-c-accordion-color-border',
            suggestedMatch: '--slds-c-accordion-section-color-border'
          }
        }
      ]
    },



    // Complex CSS property value with deprecated hook (var function)
    {
      code: `.example {
        background-image: linear-gradient(to right, var(--slds-c-accordion-color-border), var(--custom-color));
      }`,
      output: `.example {
        background-image: linear-gradient(to right, var(--slds-c-accordion-section-color-border), var(--custom-color));
      }`,
      filename: 'test.css',
      errors: [
        {
          messageId: 'replace',
          type: 'Declaration',
          data: {
            oldValue: '--slds-c-accordion-color-border',
            suggestedMatch: '--slds-c-accordion-section-color-border'
          }
        },
        {
          messageId: 'replace',
          type: 'Identifier',
          data: {
            oldValue: '--slds-c-accordion-color-border',
            suggestedMatch: '--slds-c-accordion-section-color-border'
          }
        }
      ]
    },

    // Deprecated hook without var() wrapper (covering the limitation)
    {
      code: `.testClass {
        --custom-prop: --slds-c-accordion-color-border;
      }`,
      filename: 'test.css',
      errors: [{
        messageId: 'replace',
        type: 'Declaration',
        data: {
          oldValue: '--slds-c-accordion-color-border',
          suggestedMatch: '--slds-c-accordion-section-color-border'
        }
      }]
    },

    // Deprecated component hook property with deprecated hook in value
    // Note: Both the property name and the var() hook should be flagged
    {
      code: `.testClass {
        --slds-c-accordion-color-border: var(--slds-c-accordion-heading-text-color);
      }`,
      output: `.testClass {
        --slds-c-accordion-section-color-border: var(--slds-c-accordion-heading-text-color);
      }`,
      filename: 'test.css',
      errors: [
        {
          messageId: 'replace',
          type: 'Declaration',
          data: {
            oldValue: '--slds-c-accordion-heading-text-color',
            suggestedMatch: '--slds-c-accordion-heading-color'
          }
        },
        {
          messageId: 'replace',
          type: 'Declaration',
          data: {
            oldValue: '--slds-c-accordion-color-border',
            suggestedMatch: '--slds-c-accordion-section-color-border'
          }
        }
      ]
    }
  ]
});
