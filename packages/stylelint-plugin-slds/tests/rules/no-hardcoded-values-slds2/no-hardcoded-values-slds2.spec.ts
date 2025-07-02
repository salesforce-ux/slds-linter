import stylelint, { LinterResult, LinterOptions } from 'stylelint';
import stylelintPluginSlds from '../../../src/index';
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
      expectedMessage:"Consider replacing the #ff0000 static value with an SLDS 2 styling hook that has a similar value: \n1. --slds-g-color-palette-red-50\n2. --slds-g-color-palette-hot-orange-50\n3. --slds-g-color-palette-hot-orange-60 (slds/no-hardcoded-values-slds2)",
    },
    {
      description:
        'Does not report warning for hardcoded color value in fallback',
      inputCss: `
        .example {
          background-color: var(--slds-g-color-palette-neutral-100, #fff);
        }
      `,
      expectedMessage: null,
    },
    {
      description:
        'Does not report warning for hardcoded density value in fallback',
      inputCss: `
        .example {
          border: var(--slds-g-sizing-border-1, 1px) solid;
        }
      `,
      expectedMessage: null,
    },
    {
      description:
        'Does not report warning for hardcoded density value in nested var fallback',
      inputCss: `
        .example {
          border: var(--slds-g-sizing-border-1, var(--lwc-borderWidthThin, 1px)) solid;
        }
      `,
      expectedMessage: null,
    },
    {
      description:
        'Does not report warning for color-mix function',
      inputCss: `
        .example {
           background-color: color-mix(in oklab, #a71e14 25%, white);
        }
      `,
      expectedMessage: null,
    },
    {
      description: 'Does not report 0 as a value',
      inputCss: `
        .example {
          width: 0;
        }
      `,
      expectedMessage: "There's no replacement styling hook for the 0 static value. Remove the static value. (slds/no-hardcoded-values-slds2)",
    },
    {
      description: 'Does not report 0px as a value',
      inputCss: `
        .example {
          width: 0px;
        }
      `,
      expectedMessage: "There's no replacement styling hook for the 0px static value. Remove the static value. (slds/no-hardcoded-values-slds2)",
    },
    {
      description: 'Does not report 0.0 as a value',
      inputCss: `
        .example {
          width: 0.0;
        }
      `,
      expectedMessage: "There's no replacement styling hook for the 0.0 static value. Remove the static value. (slds/no-hardcoded-values-slds2)",
    },
    {
      description:
        'Reports warning for hardcoded font-size value with replacement hook',
      inputCss: `
        .example {
          font-size: 0.875rem;
        }
      `,
      expectedMessage:
        'Consider replacing the 0.875rem static value with an SLDS 2 styling hook that has a similar value: --slds-g-font-scale-1 (slds/no-hardcoded-values-slds2)',
    },
    /*{
      description:
        'Reports warning for hardcoded box-shadow value with replacement hook',
      inputCss: `
        .example {
          box-shadow: 2px 2px 5px 0px rgba(0, 0, 0, 0.08) inset, 0px 0.5px 2px 0px rgba(0, 0, 0, 0.35) inset, 0px 1px 0px 0px rgba(0, 0, 0, 0.15) inset, 0 0 0 2px var(--slds-g-color-surface-1), 0 0 0 4px var(—slds-g-color-brand-base-15);
        }
      `,
      expectedMessage: 'There's no replacement styling hook for the 2px static value. Remove the static value. (slds/no-hardcoded-values-slds2)',
    },*/
    {
      description:
        'Reports warning for hardcoded background-color value with replacement hook',
      inputCss: `
        .example {
          background-color: #ffffff;
        }
      `,
      expectedMessage: "Consider replacing the #ffffff static value with an SLDS 2 styling hook that has a similar value: \n1. --slds-g-color-palette-neutral-100\n2. --slds-g-color-brand-base-100\n3. --slds-g-color-error-base-100\n4. --slds-g-color-warning-base-100\n5. --slds-g-color-success-base-100 (slds/no-hardcoded-values-slds2)",
    },
    {
      description:
        'Reports warning for hardcoded color value with replacement hook',
      inputCss: `
        .example {
          color: #ffffff;
        }
      `,
      expectedMessage: "Consider replacing the #ffffff static value with an SLDS 2 styling hook that has a similar value: \n1. --slds-g-color-palette-neutral-100\n2. --slds-g-color-brand-base-100\n3. --slds-g-color-error-base-100\n4. --slds-g-color-warning-base-100\n5. --slds-g-color-success-base-100 (slds/no-hardcoded-values-slds2)",
    },
    {
      description:
        'Reports warning for hardcoded border-color value with replacement hook',
      inputCss: `
        .example {
          border-color: #fff;
        }
      `,
      expectedMessage: `Consider replacing the #fff static value with an SLDS 2 styling hook that has a similar value: \n1. --slds-g-color-palette-neutral-100\n2. --slds-g-color-brand-base-100\n3. --slds-g-color-error-base-100\n4. --slds-g-color-warning-base-100\n5. --slds-g-color-success-base-100 (slds/no-hardcoded-values-slds2)`,    
    },
    {
      description:
        'Reports warning for hardcoded font size with replacement hook',
      inputCss: `
        .example {
          font-size: 16px;
        }
      `,
      expectedMessage:"Consider replacing the 16px static value with an SLDS 2 styling hook that has a similar value: --slds-g-font-scale-2 (slds/no-hardcoded-values-slds2)"
    },{
      description:
        'Reports warning for hardcoded font size with replacement hook',
      inputCss: `
        .example {
          font-size: 1rem;
        }
      `,
      expectedMessage:"Consider replacing the 1rem static value with an SLDS 2 styling hook that has a similar value: --slds-g-font-scale-2 (slds/no-hardcoded-values-slds2)"
    },
    {
      description:
        'Suggests replacement for hardcoded color with no styling hook',
      inputCss: `
        .example {
          background-color: #123456;
        }
      `,
      expectedMessage:`Consider replacing the #123456 static value with an SLDS 2 styling hook that has a similar value: \n1. --slds-g-color-palette-cloud-blue-20\n2. --slds-g-color-palette-blue-15\n3. --slds-g-color-palette-cloud-blue-30\n4. --slds-g-color-palette-blue-20\n5. --slds-g-color-palette-cloud-blue-15 (slds/no-hardcoded-values-slds2)`,
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
          plugins: [stylelintPluginSlds], // Adjust the plugin path if needed
          rules: {
            [ruleName]: true,
          },
        },
      } as LinterOptions);

      const messages = linterResult.results[0].warnings.map(
        (warning) => JSON.parse(warning.text).message
      );

      if (expectedMessage) {
        expect(messages[0]).toMatch(expectedMessage);
      } else {
        expect(messages).toHaveLength(0);
      }
    });
  });
});
