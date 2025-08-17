const rule = require('../../src/rules/v9/no-unsupported-hooks-slds2').default;
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

ruleTester.run('no-unsupported-hooks-slds2', rule, {
  valid: [
    // Valid CSS that doesn't use deprecated hooks
    {
      code: `.example { color: red; background: blue; }`,
      filename: 'test.css',
    },
    {
      code: `.example { margin: 10px; padding: 5px; }`,
      filename: 'test.css',
    },
    // Valid SLDS hooks that are NOT deprecated
    {
      code: `.example { --slds-c-button-color-background: #fff; }`,
      filename: 'test.css',
    },
    {
      code: `.example { color: var(--slds-c-button-color-background); }`,
      filename: 'test.css',
    },
    // Custom namespaced hooks should not be flagged
    {
      code: `.example { --myapp-custom-color: red; }`,
      filename: 'test.css',
    },
    {
      code: `.example { color: var(--myapp-custom-color); }`,
      filename: 'test.css',
    },
  ],

  invalid: [
    // Deprecated component hooks - Declaration (left-side)
    {
      code: `.div-modal-cls { --slds-c-breadcrumbs-spacing-inline-start: 1rem; }`,
      filename: 'test.css',
      errors: [{
        messageId: 'deprecated',
        type: 'Declaration',
        data: {
          token: '--slds-c-breadcrumbs-spacing-inline-start'
        }
      }]
    },
    
    // Deprecated component hooks - in var() function (right-side)
    {
      code: `.global-example { border: 1px solid var(--slds-g-color-border-base-2); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'deprecated',
        type: 'Identifier',
        data: {
          token: '--slds-g-color-border-base-2'
        }
      }]
    },

    // Multiple deprecated hooks in same rule block
    {
      code: `.global-example {
        --slds-g-color-border-base-2: #dddbda;
        --slds-g-color-border-base-3: #c9c7c5;
        border: 1px solid var(--slds-g-color-border-base-2);
      }`,
      filename: 'test.css',
      errors: [
        {
          messageId: 'deprecated',
          type: 'Declaration',
          data: {
            token: '--slds-g-color-border-base-2'
          }
        },
        {
          messageId: 'deprecated',
          type: 'Declaration',
          data: {
            token: '--slds-g-color-border-base-3'
          }
        },
        {
          messageId: 'deprecated',
          type: 'Identifier',
          data: {
            token: '--slds-g-color-border-base-2'
          }
        }
      ]
    },

    // Global deprecated hooks
    {
      code: `.global-link {
        --slds-g-link-color: #0070d2;
        --slds-g-link-color-hover: #005fb2;
        color: var(--slds-g-link-color);
      }`,
      filename: 'test.css',
      errors: [
        {
          messageId: 'deprecated',
          type: 'Declaration',
          data: {
            token: '--slds-g-link-color'
          }
        },
        {
          messageId: 'deprecated',
          type: 'Declaration',
          data: {
            token: '--slds-g-link-color-hover'
          }
        },
        {
          messageId: 'deprecated',
          type: 'Identifier',
          data: {
            token: '--slds-g-link-color'
          }
        }
      ]
    },

    // Kynatic deprecated hooks
    {
      code: `.kynatic-button {
        --slds-kx-button-underline-scale-x: 1;
        --slds-kx-button-underline-base-y: 0;
        --slds-kx-button-underline-offset-y: 0;
        transform: scaleX(var(--slds-kx-button-underline-scale-x));
      }`,
      filename: 'test.css',
      errors: [
        {
          messageId: 'deprecated',
          type: 'Declaration',
          data: {
            token: '--slds-kx-button-underline-scale-x'
          }
        },
        {
          messageId: 'deprecated',
          type: 'Declaration',
          data: {
            token: '--slds-kx-button-underline-base-y'
          }
        },
        {
          messageId: 'deprecated',
          type: 'Declaration',
          data: {
            token: '--slds-kx-button-underline-offset-y'
          }
        },
        {
          messageId: 'deprecated',
          type: 'Identifier',
          data: {
            token: '--slds-kx-button-underline-scale-x'
          }
        }
      ]
    },

    // SDS shared deprecated hooks
    {
      code: `.shared-nav {
        --sds-s-navigation-radius-border: 0.25rem;
        --sds-s-label-sizing-gap: 0.5rem;
        border-radius: var(--sds-s-navigation-radius-border);
      }`,
      filename: 'test.css',
      errors: [
        {
          messageId: 'deprecated',
          type: 'Declaration',
          data: {
            token: '--sds-s-navigation-radius-border'
          }
        },
        {
          messageId: 'deprecated',
          type: 'Declaration',
          data: {
            token: '--sds-s-label-sizing-gap'
          }
        },
        {
          messageId: 'deprecated',
          type: 'Identifier',
          data: {
            token: '--sds-s-navigation-radius-border'
          }
        }
      ]
    },

    // Accordion component deprecated hooks
    {
      code: `.accordion {
        --slds-c-accordion-heading-text-color: #333;
        --slds-c-accordion-section-spacing-block-end: 1rem;
        color: var(--slds-c-accordion-heading-text-color);
      }`,
      filename: 'test.css',
      errors: [
        {
          messageId: 'deprecated',
          type: 'Declaration',
          data: {
            token: '--slds-c-accordion-heading-text-color'
          }
        },
        {
          messageId: 'deprecated',
          type: 'Declaration',
          data: {
            token: '--slds-c-accordion-section-spacing-block-end'
          }
        },
        {
          messageId: 'deprecated',
          type: 'Identifier',
          data: {
            token: '--slds-c-accordion-heading-text-color'
          }
        }
      ]
    },

    // Alert component deprecated hooks
    {
      code: `.alert-container {
        --slds-c-alert-spacing-inline-start: 1rem;
        --slds-c-alert-spacing-block-end: 2rem;
        padding-left: var(--slds-c-alert-spacing-inline-start);
      }`,
      filename: 'test.css',
      errors: [
        {
          messageId: 'deprecated',
          type: 'Declaration',
          data: {
            token: '--slds-c-alert-spacing-inline-start'
          }
        },
        {
          messageId: 'deprecated',
          type: 'Declaration',
          data: {
            token: '--slds-c-alert-spacing-block-end'
          }
        },
        {
          messageId: 'deprecated',
          type: 'Identifier',
          data: {
            token: '--slds-c-alert-spacing-inline-start'
          }
        }
      ]
    },

    // Button component deprecated hooks
    {
      code: `.button-group {
        --slds-c-button-spacing-inline-end: 0.5rem;
        --slds-c-button-spacing-block-start: 1rem;
        margin-right: var(--slds-c-button-spacing-inline-end);
      }`,
      filename: 'test.css',
      errors: [
        {
          messageId: 'deprecated',
          type: 'Declaration',
          data: {
            token: '--slds-c-button-spacing-inline-end'
          }
        },
        {
          messageId: 'deprecated',
          type: 'Declaration',
          data: {
            token: '--slds-c-button-spacing-block-start'
          }
        },
        {
          messageId: 'deprecated',
          type: 'Identifier',
          data: {
            token: '--slds-c-button-spacing-inline-end'
          }
        }
      ]
    },

    // Toast component deprecated hooks
    {
      code: `.toast-notification {
        --slds-c-toast-sizing-min-width: 320px;
        --slds-c-toast-spacing-block-start: 1rem;
        min-width: var(--slds-c-toast-sizing-min-width);
      }`,
      filename: 'test.css',
      errors: [
        {
          messageId: 'deprecated',
          type: 'Declaration',
          data: {
            token: '--slds-c-toast-sizing-min-width'
          }
        },
        {
          messageId: 'deprecated',
          type: 'Declaration',
          data: {
            token: '--slds-c-toast-spacing-block-start'
          }
        },
        {
          messageId: 'deprecated',
          type: 'Identifier',
          data: {
            token: '--slds-c-toast-sizing-min-width'
          }
        }
      ]
    },

    // Complex CSS selector with deprecated hook
    {
      code: `.container .modal-container:hover { padding-top: var(--slds-c-modal-header-spacing-block-start); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'deprecated',
        type: 'Identifier',
        data: {
          token: '--slds-c-modal-header-spacing-block-start'
        }
      }]
    },

    // Deprecated hook in calc() function
    {
      code: `.example { 
        width: calc(100% - var(--slds-c-pill-container-spacing-inline-start)); 
      }`,
      filename: 'test.css',
      errors: [{
        messageId: 'deprecated',
        type: 'Identifier',
        data: {
          token: '--slds-c-pill-container-spacing-inline-start'
        }
      }]
    }
  ]
});
