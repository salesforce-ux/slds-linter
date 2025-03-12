import { expect } from 'chai';
import stylelint, { LinterResult, LinterOptions } from 'stylelint';

const { lint }: typeof stylelint = stylelint;

describe('no-hardcoded-values-slds2', () => {
  const ruleName = 'slds/no-hardcoded-values-slds2';

  const testCases = [
    {
      description:
        'Reports warning for hardcoded color value with replacement hook',
      inputCss: `
        .example {
          color: #ff0000;
        }
      `,
      expectedMessage:
      "There’s no replacement SLDS 2 styling hook for the #ff0000 static value. Remove the static value."
    },
    {
      description: 'Does not report 0 as a value',
      inputCss: `
        .example {
          width: 0;
        }
      `,
      expectedMessage: null,
    },
    {
      description: 'Does not report 0px as a value',
      inputCss: `
        .example {
          width: 0px;
        }
      `,
      expectedMessage: null,
    },
    {
      description: 'Does not report 0.0 as a value',
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
      expectedMessage: "Consider replacing the 0.875rem static value with an SLDS 2 styling hook that has a similar value: --slds-g-font-scale-1 (slds/no-hardcoded-values-slds2)",
    },
    {
      description: 'Reports warning for hardcoded box-shadow value with replacement hook',
      inputCss: `
        .example {
          box-shadow: 2px 2px 5px 0px rgba(0, 0, 0, 0.08) inset, 0px 0.5px 2px 0px rgba(0, 0, 0, 0.35) inset, 0px 1px 0px 0px rgba(0, 0, 0, 0.15) inset, 0 0 0 2px var(--slds-g-color-surface-1), 0 0 0 4px var(—slds-g-color-brand-base-15);
        }
      `,
      expectedMessage: "Consider replacing the 2px 2px 5px 0px rgba(0, 0, 0, 0.08) inset, 0px 0.5px 2px 0px rgba(0, 0, 0, 0.35) inset, 0px 1px 0px 0px rgba(0, 0, 0, 0.15) inset, 0 0 0 2px var(--slds-g-color-surface-1), 0 0 0 4px var(—slds-g-color-brand-base-15) static value with an SLDS 2 styling hook that has a similar value: --slds-s-input-shadow-focus (slds/no-hardcoded-values-slds2)"
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
      "Consider replacing the 16px static value with an SLDS 2 styling hook that has a similar value: --slds-g-font-scale-2"
    },
    {
      description:
        'Suggests replacement for hardcoded color with no styling hook',
      inputCss: `
        .example {
          background-color: #123456;
        }
      `,
      expectedMessage:`Consider replacing the #123456 static value with an SLDS 2 styling hook that has a similar value: 
1. --slds-g-color-surface-inverse-2 
2. --slds-g-color-surface-container-inverse-2 
3. --slds-g-color-surface-inverse-1 
4. --slds-g-color-surface-container-inverse-1 
 (slds/no-hardcoded-values-slds2)`,
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
  ];

  testCases.forEach(({ description, inputCss, expectedMessage }, index) => {
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
        expect(messages[0]).to.include(expectedMessage);
      } else {
        expect(messages).to.be.empty;
      }
    });
  });
});
