const rule = require('../../src/rules/v9/no-deprecated-slds-classes').default;
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

// Verify deprecation metadata
describe('no-deprecated-slds-classes deprecation metadata', () => {
  it('should have deprecated metadata', () => {
    expect(rule.meta.deprecated).toBeDefined();
    expect(rule.meta.deprecated.message).toContain('no-deprecated-classes-slds2');
    expect(rule.meta.deprecated.replacedBy).toHaveLength(1);
    expect(rule.meta.deprecated.replacedBy[0].rule.name).toBe('no-deprecated-classes-slds2');
  });
});

ruleTester.run('no-deprecated-slds-classes', rule, {
  valid: [
    // Should skip reporting when the replacement rule (no-deprecated-classes-slds2) is also enabled
    {
      code: `.slds-has-icon_left-right { border: 0; }`,
      filename: 'test.css',
      settings: {
        sldsRules: {
          '@salesforce-ux/slds/no-deprecated-classes-slds2': 'warn',
        },
      },
    },
    {
      code: `.my-custom-class { color: red; }`,
      filename: 'test.css',
    },
    {
      code: `.app-button { background: blue; }`,
      filename: 'test.css',
    },
    {
      code: `.namespace-input { border: 1px solid black; }`,
      filename: 'test.css',
    },
    // Valid SLDS classes that are not deprecated
    {
      code: `.slds-button { background: blue; }`,
      filename: 'test.css',
    },
    {
      code: `.slds-input { border: 1px solid red; }`,
      filename: 'test.css',
    },
    // Element selectors
    {
      code: `div { margin: 0; }`,
      filename: 'test.css',
    },
    {
      code: `button { padding: 8px; }`,
      filename: 'test.css',
    },
    // Attribute selectors
    {
      code: `[data-slds="true"] { display: block; }`,
      filename: 'test.css',
    },
    // Complex selectors with non-deprecated classes
    {
      code: `.app-wrapper .slds-button:hover { background: red; }`,
      filename: 'test.css',
    },
    // Custom classes that might start with slds- but are not in deprecated list
    {
      code: `.slds-custom-app-class { color: green; }`,
      filename: 'test.css',
    },
  ],
  invalid: [
    // Deprecated SLDS class: slds-has-icon_left-right
    {
      code: `.slds-has-icon_left-right { border: 0; }`,
      filename: 'test.css',
      errors: [{
        messageId: 'deprecatedClass',
        type: 'ClassSelector'
      }]
    },
    // Complex selector with deprecated class
    {
      code: `.my-app .slds-has-icon_left-right { background: red; }`,
      filename: 'test.css',
      errors: [{
        messageId: 'deprecatedClass',
        type: 'ClassSelector'
      }]
    },
    // Deprecated class with pseudo-selector
    {
      code: `.slds-has-icon_left-right:hover { background: blue; }`,
      filename: 'test.css',
      errors: [{
        messageId: 'deprecatedClass',
        type: 'ClassSelector'
      }]
    },
    // Multiple deprecated classes in same file
    {
      code: `
        .slds-has-icon_left-right { background: red; }
        .some-other-deprecated-class { border: blue; }
      `,
      filename: 'test.css',
      errors: [
        {
          messageId: 'deprecatedClass',
          type: 'ClassSelector'
        }
        // Note: Only testing with one known deprecated class from the spec file
        // Additional deprecated classes would need to be verified from metadata
      ]
    },
    // Deprecated class in complex selector chain
    {
      code: `.container .slds-has-icon_left-right.modified { border: 2px solid red; }`,
      filename: 'test.css',
      errors: [{
        messageId: 'deprecatedClass',
        type: 'ClassSelector'
      }]
    }
  ]
});
