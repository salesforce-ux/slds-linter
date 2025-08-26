const rule = require('../../src/rules/v9/reduce-annotations').default;
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

ruleTester.run('reduce-annotations', rule, {
  valid: [
    {
      code: `
        .valid-class {
          color: green;
        }
      `,
      filename: 'test.css',
    },
    {
      code: `
        /* Regular comment */
        .my-other-class {
          background: orange;
        }
      `,
      filename: 'test.css',
    },
    {
      code: `
        /* stylelint-disable */
        .example-class {
          color: red;
        }
      `,
      filename: 'test.css',
    },
    {
      code: `
        /* Some other comment */
        /* Not an annotation */
        .another-class {
          margin: 10px;
        }
      `,
      filename: 'test.css',
    },
  ],

  invalid: [
    // @sldsValidatorAllow annotation
    {
      code: `
        /* @sldsValidatorAllow */
        .my-class {
          color: red;
        }
      `,
      filename: 'test.css',
      errors: [{
        messageId: 'removeAnnotation'
      }]
    },
    
    // @sldsValidatorIgnore annotation
    {
      code: `
        /* @sldsValidatorIgnore */
        .another-class {
          background: blue;
        }
      `,
      filename: 'test.css',
      errors: [{
        messageId: 'removeAnnotation'
      }]
    },

    // @sldsValidatorIgnoreNextLine annotation
    {
      code: `
        /* @sldsValidatorIgnoreNextLine */
        .another-class {
          background: blue;
        }
      `,
      filename: 'test.css',
      errors: [{
        messageId: 'removeAnnotation'
      }]
    },

    // Multiple annotations in same file
    {
      code: `
        /* @sldsValidatorAllow */
        /* @sldsValidatorIgnore */
        .valid-class {
          color: yellow;
        }
      `,
      filename: 'test.css',
      errors: [
        {
          messageId: 'removeAnnotation'
        },
        {
          messageId: 'removeAnnotation'
        }
      ]
    },

    // Annotation with additional text
    {
      code: `
        /* @sldsValidatorAllow some extra text */
        .test-class {
          padding: 5px;
        }
      `,
      filename: 'test.css',
      errors: [{
        messageId: 'removeAnnotation'
      }]
    },

    // Mixed valid and invalid comments
    {
      code: `
        /* Regular comment */
        /* @sldsValidatorIgnoreNextLine */
        .mixed-example {
          border: 1px solid red;
        }
      `,
      filename: 'test.css',
      errors: [{
        messageId: 'removeAnnotation'
      }]
    },

    // Single-line comment style
    {
      code: `
        /* @sldsValidatorIgnore */
        .single-line-annotation {
          width: 100%;
        }
      `,
      filename: 'test.css',
      errors: [{
        messageId: 'removeAnnotation'
      }]
    }
  ]
});
