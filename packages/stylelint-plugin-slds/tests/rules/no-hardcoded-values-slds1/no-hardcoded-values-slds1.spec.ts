
import stylelint, { LinterResult, LinterOptions } from 'stylelint';

const { lint }: typeof stylelint = stylelint;

describe('no-hardcoded-values-slds1', () => {
  const ruleName = 'slds/no-hardcoded-values-slds1';

  const testCases = [
    {
      description:
        'Reports warning for hardcoded color value with replacement hook',
      inputCss: `
        .example {
          color: #ff0000;
        }
      `,
      expectedMessage:`Replace the #ff0000 static value with an SLDS 1 styling hook: \n1. --slds-g-color-palette-red-50\n2. --slds-g-color-error-base-50\n3. --slds-g-color-palette-hot-orange-50\n4. --slds-g-color-palette-hot-orange-60. (slds/no-hardcoded-values-slds1)`,
      expectedReplacement: '--slds-g-color-error-base-50',
    },
    {
      description: 'Does not report for 0 as a value',
      inputCss: `
        .example {
          width: 0;
        }
      `,
      expectedMessage: null,
    },
    {
      description: 'Does not report for 0px as a value',
      inputCss: `
        .example {
          width: 0px;
        }
      `,
      expectedMessage: null,
    },
    {
      description: 'Does not report for 0.0 as a value',
      inputCss: `
        .example {
          width: 0.0;
        }
      `,
      expectedMessage: null,
    },
    {
      description: 'Reports warning for hardcoded font-size value with replacement hook',
      inputCss: `
        .example {
          font-size: 0.875rem;
        }
      `,
      expectedMessage: "Replace the 0.875rem static value with an SLDS 1 styling hook: --slds-g-font-scale-1. (slds/no-hardcoded-values-slds1)",
    },
    {
      description: 'Reports warning for hardcoded box-shadow value with replacement hook',
      inputCss: `
        .example {
          box-shadow: 0px 2px 3px 0px #00000027;
        }
      `,
      expectedMessage: "Replace the 0px 2px 3px 0px #00000027 static value with an SLDS 1 styling hook: --slds-g-shadow-2. (slds/no-hardcoded-values-slds1)"
    },
    {
      description:
        'Reports warning for hardcoded font size with replacement hook',
      inputCss: `
        .example {
          font-size: 16px;
        }
      `,
      expectedMessage:
        'Replace the 16px static value with an SLDS 1 styling hook: --slds-g-font-scale-2.',
    },
    {
      description:
        'Suggests replacement for hardcoded color with no styling hook',
      inputCss: `
        .example {
          background-color: #123456;
        }
      `,
      expectedMessage:`Replace the #123456 static value with an SLDS 1 styling hook: \n1. --slds-g-color-palette-cloud-blue-20\n2. --slds-g-color-palette-blue-15\n3. --slds-g-color-brand-base-15\n4. --slds-g-color-palette-cloud-blue-30\n5. --slds-g-color-palette-blue-20. (slds/no-hardcoded-values-slds1)`,
    },
    {
      description:
        'Does not report for valid CSS property with hook replacement',
      inputCss: `
        .example {
          background-color: var(--color-brand);
        }
      `,
      expectedMessage: null, // No warning expected
    },
    {
      description: 'Does not report for densified value not matching any hook',
      inputCss: `
        .example {
          padding: 20px;
        }
      `,
      //expectedMessage: null, // No warning expected
      expectedMessage:
        "There's no replacement styling hook for the 20px static value. Remove the static value.",
    },
  ];

  testCases.forEach(
    (
      { description, inputCss, expectedMessage, expectedReplacement },
      index
    ) => {
      it(description, async () => {
        const linterResult: LinterResult = await lint({
          code: inputCss,
          config: {
            plugins: ['./src/index.ts'], // Adjust the plugin path if needed
            rules: {
              [ruleName]: true,
            },
          },
        } as LinterOptions);

        const messages = linterResult.results[0].warnings.map(
          (warning) => warning.text
        );
        if (expectedMessage) {
          expect(messages[0]).toMatch(expectedMessage);
        } else {
          expect(messages).toHaveLength(0);
        }
        if (expectedReplacement) {
          expect(messages[0]).toMatch(expectedReplacement);
        }
      });
    }
  );
});
