import { messages } from './../../../../eslint-plugin-slds/src/rules/utils/rule';

import stylelint, { LinterResult, LinterOptions } from 'stylelint';

const { lint }: typeof stylelint = stylelint;

describe('slds/enforce-component-hook-naming-convention', () => {
  const testCases = [
    {
      description: '#Right Side: Should replace deprecated SLDS1 component hook',
      input: `
        .testClass {
          background-color: var(--slds-c-button-color-background);
        }
      `,
      expectedOutput: `
        .testClass {
          background-color: var(--slds-c-button-color-background-input);
        }
      `,
      expectedMessage: "This component hook is using a naming convention that is no longer supported. Please replace it with --slds-c-button-color-background-input styling hook."
    },
    {
      description: '#Right Side: Should ignore non-deprecated hooks',
      input: `
        .testClass {
          background-color: var(--slds-c-button-color-background-input);
        }
      `,
      expectedOutput: `
        .testClass {
          background-color: var(--slds-c-button-color-background-input);
        }
      `
    },
    {
      description: '#Left Side: should replace deprecated SLDS1 component hook',
      input: `
        :root {
          --slds-c-button-color-background: #000;
        }
      `,
      expectedOutput: `
        :root {
          --slds-c-button-color-background-input: #000;
        }
      `,
      expectedMessage: "This component hook is using a naming convention that is no longer supported. Please replace it with --slds-c-button-color-background-input styling hook."
    },
    {
      description: '#Left Side: should ignore non-deprecated hooks',
      input: `
        :root {
          --slds-c-button-color-background-input: #000;
        }
      `,
      expectedOutput: `
        :root {
          --slds-c-button-color-background-input: #000;
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
            plugins: ['./src/index.ts'],
            rules: {
              'slds/enforce-component-hook-naming-convention': [true],
            },
            fix: true,
          },
        };

        const result: LinterResult = await lint(linterOptions);
        const lintResult = result.results[0];

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