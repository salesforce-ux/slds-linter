import stylelint, { LinterResult, LinterOptions } from 'stylelint';
import sldsPlugin from '../../../src/index';

const { lint }: typeof stylelint = stylelint;

describe('no-sldshook-fallback-for-lwctoken', () => {
  const testCases = [
    {
      message:
        'Remove the --slds-g-color-border-1 styling hook that is used as a fallback value for --lwc-color-background-1.',
      code: `
        .example {
          color: var(--lwc-color-background-1, var(--slds-g-color-border-1));
        }
      `,
      ruleName: 'slds/no-sldshook-fallback-for-lwctoken'
    },
    {
      message:
        'Remove the --slds-g-color-border-1 styling hook that is used as a fallback value for --lwc-color-background-1.',
      code: `
        .example {
          color: var(--lwc-color-background-1, var(--slds-g-color-border-1));
        }
      `,
      ruleName: 'slds/no-sldshook-fallback-for-lwctoken'
    },
    {
      message:
        'Remove the --slds-g-color-border-1 styling hook that is used as a fallback value for --lwc-color-background-1.',
      code: `
        .example {
          color: var(--lwc-color-background-1, var(--slds-g-color-border-1, var(--lwc-color-background-2)));
        }
      `,
      ruleName: 'slds/no-sldshook-fallback-for-lwctoken'
    },
    {
      message: 'Remove the --slds-g-color-border-2 styling hook that is used as a fallback value for --lwc-color-background-1.',
      code: `
        .example {
          color: var(--slds-g-color-border-1, var(--lwc-color-background-1, var(--slds-g-color-border-2)));
        }
      `,
      ruleName: 'slds/no-sldshook-fallback-for-lwctoken'
    },
    {
      message: null,
      code: `
        .example {
          color: var(--myapp-color-background-1, var(--slds-g-color-border-1));
        }
      `,
      ruleName: 'slds/no-sldshook-fallback-for-lwctoken'
    },
    {
      message: null,
      code: `
        .example {
          color: var(--lwc-color-background-1, var(--myapp-color-border-1));
        }
      `,
      ruleName: 'slds/no-sldshook-fallback-for-lwctoken'
    },
    {
      message: null,
      code: `
        .example {
          color: var(--slds-g-color-border-1);
        }
      `,
      ruleName: 'slds/no-sldshook-fallback-for-lwctoken'
    },
    {
      message: null,
      code: `
        .example {
          color: var(--lwc-color-background-1);
        }
      `,
      ruleName: 'slds/no-sldshook-fallback-for-lwctoken'
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