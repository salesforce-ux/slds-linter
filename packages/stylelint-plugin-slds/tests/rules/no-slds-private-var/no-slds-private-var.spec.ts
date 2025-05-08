
import stylelint, { LinterResult, LinterOptions } from 'stylelint';

const { lint }: typeof stylelint = stylelint;

describe('no-slds-private-var', () => {
  const testCases = [
    {
      message:
        'This styling hook is reserved for internal Salesforce use. Remove the --_slds- or –slds-s private variable within selector --_slds-deprecated-var. For more information, look up private CSS in lightningdesignsystem.com. (slds/no-slds-private-var)',
      code: `
        .example {
          --_slds-deprecated-var: #fff;
        }
      `,
      ruleName: 'slds/no-slds-private-var',
      expectedMessages: [
        'This styling hook is reserved for internal Salesforce use. Remove the --_slds- or –slds-s private variable within selector --_slds-deprecated-var. For more information, look up private CSS in lightningdesignsystem.com. (slds/no-slds-private-var)',
      ],
    },
    {
      message: null,
      code: `
        .example {
          --slds-valid-var: #fff;
        }
      `,
      ruleName: 'slds/no-slds-private-var',
      expectedMessages: [],
    },
  ];

  testCases.forEach((testCase, index) => {
    it(`test rule #${index}`, async () => {
      const linterResult: LinterResult = await lint({
        code: testCase.code,
        config: {
          plugins: ['./src/index.ts'], // Adjust the path to your rule
          rules: {
            [testCase.ruleName]: true,
          },
        },
      } as LinterOptions);

      const messages = linterResult.results[0]._postcssResult.messages;

      // Test for the presence or absence of the message
      if (testCase.message) {
        expect(messages.length).toEqual(1);
        expect(messages[0].text).toEqual(testCase.message);
      } else {
        expect(messages.length).toEqual(0);
      }
    });
  });
});
