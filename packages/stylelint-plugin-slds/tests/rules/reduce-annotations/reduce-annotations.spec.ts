import { expect } from 'chai';
import stylelint, { LinterResult, LinterOptions } from 'stylelint';
import reduceAnnotations from '../../../src/rules/reduce-annotations';
const { lint }: typeof stylelint = stylelint;

describe('reduce-annotations', () => {
  const testCases = [
    {
      message:
        "Avoid using '@sldsValidatorAllow'. This is a temporary bypass and should be removed in the future.",
      code: `
        /* @sldsValidatorAllow */
        .my-class {
          color: red;
        }
      `,
      ruleName: 'slds/reduce-annotations',
      expectedMessages: [
        "Avoid using '@sldsValidatorAllow'. This is a temporary bypass and should be removed in the future. (slds/reduce-annotations)"
      ],
    },
    {
      message:
        "Avoid using '@sldsValidatorIgnore'. This is a temporary bypass and should be removed in the future.",
      code: `
        /* @sldsValidatorIgnore */
        .another-class {
          background: blue;
        }
      `,
      ruleName: 'slds/reduce-annotations',
      expectedMessages: [
        "Avoid using '@sldsValidatorIgnore'. This is a temporary bypass and should be removed in the future. (slds/reduce-annotations)"
      ],
    },
    {
      message:
        "Avoid using '@sldsValidatorIgnoreNextLine'. This is a temporary bypass and should be removed in the future.",
      code: `
        /* @sldsValidatorIgnoreNextLine */
        .another-class {
          background: blue;
        }
      `,
      ruleName: 'slds/reduce-annotations',
      expectedMessages: [
        "Avoid using '@sldsValidatorIgnoreNextLine'. This is a temporary bypass and should be removed in the future. (slds/reduce-annotations)"
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
        "Avoid using '@sldsValidatorAllow'. This is a temporary bypass and should be removed in the future.",
      code: `
        /* @sldsValidatorAllow */
        /* @sldsValidatorIgnore */
        .valid-class {
          color: yellow;
        }
      `,
      ruleName: 'slds/reduce-annotations',
      expectedMessages: [
        "Avoid using '@sldsValidatorAllow'. This is a temporary bypass and should be removed in the future. (slds/reduce-annotations)",
        "Avoid using '@sldsValidatorIgnore'. This is a temporary bypass and should be removed in the future. (slds/reduce-annotations)"
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
        //expect(messages.length).to.equal(1);
        expect(messages[0].text).to.contain(testCase.message);
      } else {
        expect(messages.length).to.equal(0);
      }
    });
  });
});