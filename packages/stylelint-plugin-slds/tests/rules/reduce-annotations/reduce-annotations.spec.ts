
import stylelint, { LinterResult, LinterOptions } from 'stylelint';
import reduceAnnotations from '../../../src/rules/reduce-annotations';
const { lint }: typeof stylelint = stylelint;

describe('reduce-annotations', () => {
  const testCases = [
    {
      message:
        "Remove this annotation and update the code to SLDS best practices. For help, file an issue at https://github.com/salesforce-ux/slds-linter/",
      code: `
        /* @sldsValidatorAllow */
        .my-class {
          color: red;
        }
      `,
      ruleName: 'slds/reduce-annotations',
      expectedMessages: [
        "Remove this annotation and update the code to SLDS best practices. For help, file an issue at https://github.com/salesforce-ux/slds-linter/"
      ],
    },
    {
      message:
        "Remove this annotation and update the code to SLDS best practices. For help, file an issue at https://github.com/salesforce-ux/slds-linter/",
      code: `
        /* @sldsValidatorIgnore */
        .another-class {
          background: blue;
        }
      `,
      ruleName: 'slds/reduce-annotations',
      expectedMessages: [
       "Remove this annotation and update the code to SLDS best practices. For help, file an issue at https://github.com/salesforce-ux/slds-linter/"
      ],
    },
    {
      message:
        "Remove this annotation and update the code to SLDS best practices. For help, file an issue at https://github.com/salesforce-ux/slds-linter/",
      code: `
        /* @sldsValidatorIgnoreNextLine */
        .another-class {
          background: blue;
        }
      `,
      ruleName: 'slds/reduce-annotations',
      expectedMessages: [
        "Remove this annotation and update the code to SLDS best practices. For help, file an issue at https://github.com/salesforce-ux/slds-linter/"
      ],
    },
    {
      message: null,
      code: `
        .valid-class {
          color: green;
        }
      `,
      ruleName: 'slds/reduce-annotations',
      expectedMessages: [],
    },
    {
      message:
        "Remove this annotation and update the code to SLDS best practices. For help, file an issue at https://github.com/salesforce-ux/slds-linter/",
      code: `
        /* @sldsValidatorAllow */
        /* @sldsValidatorIgnore */
        .valid-class {
          color: yellow;
        }
      `,
      ruleName: 'slds/reduce-annotations',
      expectedMessages: [
        "Remove this annotation and update the code to SLDS best practices. For help, file an issue at https://github.com/salesforce-ux/slds-linter/",
        "Remove this annotation and update the code to SLDS best practices. For help, file an issue at https://github.com/salesforce-ux/slds-linter/"
      ],
    },
    {
      message: null,
      code: `
        .my-other-class {
          background: orange;
        }
      `,
      ruleName: 'slds/reduce-annotations',
      expectedMessages: [],
    },
  ];

  testCases.forEach((testCase, index) => {
    it(`test rule #${index}`, async () => {
      const linterResult: LinterResult = await lint({
        code: testCase.code,
        config: {
          plugins: [reduceAnnotations], // Adjust the path to your rule
          rules: {
            [testCase.ruleName]: true,
          },
        },
      } as LinterOptions);

      const messages = linterResult.results[0]._postcssResult.messages;

      // Test for the presence or absence of the message

      if (testCase.message) {
        //expect(messages.length).toEqual(1);
        expect(messages[0].text).toContain(testCase.message);
      } else {
        expect(messages.length).toEqual(0);
      }
    });
  });
});