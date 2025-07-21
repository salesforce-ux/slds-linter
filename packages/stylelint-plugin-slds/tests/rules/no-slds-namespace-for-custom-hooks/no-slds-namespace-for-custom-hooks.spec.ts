import stylelint, { LinterResult, LinterOptions } from 'stylelint';
import sldsPlugin from '../../../src/index';

const { lint }: typeof stylelint = stylelint;

describe('no-slds-namespace-for-custom-hooks', () => {
  const testCases = [
    {
      message:
        'Using the --slds namespace for --slds-my-own-token isn\'t supported. Create the custom styling hook in your namespace. Example: --myapp-my-own-token',
      code: `
        .example {
          --slds-my-own-token: #fff;
        }
      `,
      ruleName: 'slds/no-slds-namespace-for-custom-hooks'
    },
    {
      message:
        'Using the --slds namespace for --slds-custom-color isn\'t supported. Create the custom styling hook in your namespace. Example: --myapp-custom-color',
      code: `
        .example {
          color: var(--slds-custom-color);
        }
      `,
      ruleName: 'slds/no-slds-namespace-for-custom-hooks'
    },
    {
      message: null,
      code: `
        .example {
          --myapp-valid-token: #fff;
        }
      `,
      ruleName: 'slds/no-slds-namespace-for-custom-hooks'
    },
    {
      message: null,
      code: `
        .example {
          color: var(--myapp-valid-token);
        }
      `,
      ruleName: 'slds/no-slds-namespace-for-custom-hooks'
    },
    {
      message: null,
      code: `
        .example {
          --slds-c-button-color-background: #fff;
        }
      `,
      ruleName: 'slds/no-slds-namespace-for-custom-hooks'
    },
    {
      message: null,
      code: `
        .example {
          color: var(--slds-c-button-color-background);
        }
      `,
      ruleName: 'slds/no-slds-namespace-for-custom-hooks'
    },
  ];

  testCases.forEach((testCase, index) => {
    it(`test rule #${index}`, async () => {
      const linterResult: LinterResult = await lint({
        code: testCase.code,
        config: {
          plugins: [sldsPlugin],
          rules: {
            [testCase.ruleName]: true,
          },
        },
      } as LinterOptions);

      const messages = linterResult.results[0]._postcssResult?.messages || [];

      // Test for the presence or absence of the message
      if (testCase.message) {
        expect(messages.length).toEqual(1);
        expect(messages[0].text).toContain(testCase.message);
      } else {
        expect(messages.length).toEqual(0);
      }
    });
  });
}); 