import stylelint, { LinterResult, LinterOptions } from 'stylelint';

const { lint }: typeof stylelint = stylelint;

describe('slds/enforce-sds-to-slds-hooks', () => {
  const testCases = [
    {
      description: '#Right Side: Should replace sds token',
      input: `
        .testClass {
          background-color: var(--sds-g-color-surface-1);
        }
      `,
      expectedOutput: `
        .testClass {
          background-color: var(--slds-g-color-surface-1);
        }
      `,
      expectedMessage: "Replace --sds-g-color-surface-1 with --slds-g-color-surface-1 styling hook."
    },{
      description: '#Right Side: Should ignore custom created',
      input: `
        .testClass {
          background-color: var(--sds-my-own);
        }
      `,
      expectedOutput: `
        .testClass {
          background-color: var(--slds-my-own);
        }
      `
    }, {
      description: '#Left Side: should replace sds token',
      input: `
        :root {
          --sds-s-input-color-background: #000;
        }
      `,
      expectedOutput: `
        :root {
          --slds-s-input-color-background: #000;
        }
      `,
      expectedMessage: "Replace --sds-s-input-color-background with --slds-s-input-color-background styling hook."
    }, {
      description: '#Left Side: should ignore custom created hook',
      input: `
        :root {
          --sds-my-own: 30px;
        }
      `,
      expectedOutput: `
        :root {
          --sds-my-own: 30px;
        }
      `
    }
  ];

  testCases.forEach(
    ({ description, input, expectedOutput, expectedMessage }, index) => {
      it(`Test Case #${index + 1}: ${description}`, async () => {
        const linterOptions: LinterOptions = {
          code: input,
          config: {
            plugins: ['./src/index.ts'], // Adjust path as needed
            rules: {
              'slds/enforce-sds-to-slds-hooks': [true],
            },
            fix: true, // Enable fixing
          },
        };

        const result: LinterResult = await lint(linterOptions);
        const lintResult = result.results[0];

        // Verify the reported messages
        const reportedMessages = lintResult?._postcssResult?.messages.map(
          (message) => JSON.parse(message.text).message
        )||[];
        if (expectedMessage) {
          expect(expectedMessage).toMatch(reportedMessages[0]||'');
        } else {
          expect(reportedMessages).toHaveLength(0);
        }
      });
    }
  );
});
