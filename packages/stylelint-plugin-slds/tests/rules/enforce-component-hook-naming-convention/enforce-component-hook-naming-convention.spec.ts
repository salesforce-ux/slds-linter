import stylelint, { LinterResult, LinterOptions } from 'stylelint';

const { lint }: typeof stylelint = stylelint;

describe('slds/enforce-component-hook-naming-convention', () => {
  const testCases = [
    {
      description: '#Left Side: should replace deprecated SLDS1 component hook',
      input: `
        :root {
          --slds-c-accordion-section-color-border: #000;
        }
      `,
      expectedOutput: `
        :root {
          --slds-c-accordion-section-color-border: #000;
        }
      `,
      expectedMessage: "Replace the deprecated --slds-c-accordion-section-color-border component styling hook with --slds-c-accordion-color-border. (slds/enforce-component-hook-naming-convention)"
    },
    {
      description: '#Left Side: should ignore non-deprecated hooks',
      input: `
        :root {
          --slds-c-accordion-section-color-border: #000;
        }
      `,
      expectedOutput: `
        :root {
          --slds-c-accordion-section-color-border: #000;
        }
      `
    }
  ];
  var flagFlipper = 0;
  testCases.forEach(
    ({ description, input, expectedOutput, expectedMessage }, index) => {
      it(`Test Case #${index + 1}: ${description}`, async () => {
        const linterOptions: LinterOptions = {
          code: input,
          config: {
            plugins: ['./src/index.ts'],
            rules: {
              'slds/enforce-component-hook-naming-convention': [true],
            },
            fix: flagFlipper == 0 ? false : true,
          },
        };
        flagFlipper++;
        const result: LinterResult = await lint(linterOptions);
        const lintResult = result.results[0];

        const reportedMessages = lintResult?._postcssResult?.messages.map(
          (message) => JSON.parse(message.text).message
        )||[];
        if (reportedMessages.length == 0) {
          expect(reportedMessages).toHaveLength(0);
        } else {
          expect(expectedMessage).toMatch(reportedMessages[0]);
        }
      });
    }
  );
});