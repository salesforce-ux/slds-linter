
import stylelint, { LinterResult, LinterOptions, LintResult } from 'stylelint';
import plugins from '../../../src/index';
const { lint }: typeof stylelint = stylelint;
describe('enforce-bem-usage', () => {
  
  [
    {
      description: 'should report and fix bem usage when sole selector',
      input: `
        .slds-text-heading--large {
          border-start-start-radius: 0;
        }
      `,
      expectedOutput: `
        .slds-text-heading_large {
          border-start-start-radius: 0;
        }
      `,
      messages: [
        "slds-text-heading--large has been retired. Update it to the new name slds-text-heading_large (slds/enforce-bem-usage)",
      ],
      messagePositions: [[1, 25]],
    },
    {
      description: 'should report and fix bem usage when multiple selectors',
      expectedOutput: `
        .slds-dl_horizontal__label,
        .slds-dl_horizontal__detail {
          display: none;
        }
      `,
      input: `
        .slds-dl--horizontal__label,
        .slds-dl--horizontal__detail {
          display: none;
        }
      `,
      messages: [
        "slds-dl--horizontal__label has been retired. Update it to the new name slds-dl_horizontal__label (slds/enforce-bem-usage)",
        "slds-dl--horizontal__detail has been retired. Update it to the new name slds-dl_horizontal__detail (slds/enforce-bem-usage)",
      ],
      messagePositions: [
        [1, 27],
        [38, 65],
      ],
    },
    {
      description: 'should report and fix bem usage in psuedo-selector',
      expectedOutput: `
        .slds-dl_horizontal__label:last-of-type {
          border-bottom: none;
        }
      `,
      input: `
        .slds-dl--horizontal__label:last-of-type {
          border-bottom: none;
        }
      `,
      messages: [
        "slds-dl--horizontal__label has been retired. Update it to the new name slds-dl_horizontal__label (slds/enforce-bem-usage)",
      ],
      messagePositions: [[1, 27]],
    },
    {
      description: 'should report and fix bem usage in complex selector',
      expectedOutput: `
        div.slds-dl_horizontal__label {
          border-bottom: none;
        }
      `,
      input: `
        div.slds-dl--horizontal__label {
          border-bottom: none;
        }
      `,
      messages: [
        "slds-dl--horizontal__label has been retired. Update it to the new name slds-dl_horizontal__label (slds/enforce-bem-usage)",
      ],
      messagePositions: [[4, 30]],
    },
    {
      description: 'should report and fix bem usage in chained selector',
      expectedOutput: `
        .slds-dl_horizontal__label div {
          border-bottom: none;
        }
      `,
      input: `
        .slds-dl--horizontal__label div {
          border-bottom: none;
        }
      `,
      messages: [
        "slds-dl--horizontal__label has been retired. Update it to the new name slds-dl_horizontal__label (slds/enforce-bem-usage)",
      ],
      messagePositions: [[1, 27]],
    },
    {
      description: 'should report and fix bem usage in chained direct selector',
      expectedOutput: `
        .slds-dl_horizontal__label > div {
          border-bottom: none;
        }
      `,
      input: `
        .slds-dl--horizontal__label > div {
          border-bottom: none;
        }
      `,
      messages: [
        "slds-dl--horizontal__label has been retired. Update it to the new name slds-dl_horizontal__label (slds/enforce-bem-usage)",
      ],
      messagePositions: [[1, 27]],
    },
    {
      description: 'should report and fix bem usage in chained direct selector',
      expectedOutput: `
.slds-dl_horizontal__label, .slds-dl_horizontal__detail {}

.slds-dl_horizontal__label {}
      `,
      input: `
.slds-dl--horizontal__label, .slds-dl--horizontal__detail {}

.slds-dl--horizontal__label {}
      `,
      messages: [
        "slds-dl--horizontal__label has been retired. Update it to the new name slds-dl_horizontal__label (slds/enforce-bem-usage)",
        "slds-dl--horizontal__detail has been retired. Update it to the new name slds-dl_horizontal__detail (slds/enforce-bem-usage)",
        "slds-dl--horizontal__label has been retired. Update it to the new name slds-dl_horizontal__label (slds/enforce-bem-usage)",
      ],
      messagePositions: [
        [1, 27],
        [30, 57],
        [1, 27],
      ],
    },
  ].forEach(
    (
      { description, input, expectedOutput, messages, messagePositions },
      index
    ) => {
      it(`Test Case #${index + 1}: ${description}`, async () => {
        let lintResult = await processLint(input, false);

        // Verify the reported messages
        const reportedMessages = lintResult._postcssResult?.messages.map(
          (message) => message.text
        ) as string[];

        reportedMessages.forEach((message, index) => {
          expect(messages[index]).toEqual(message);
        });
        const reportedPositions = lintResult._postcssResult?.messages.map(
          (message) => [message.index, message.endIndex]
        );
        expect(messagePositions).toEqual(expect.arrayContaining(reportedPositions));
        lintResult = await processLint(input, true);

        expect(lintResult._postcssResult?.root.toString()).toEqual(
          expectedOutput
        );
      });
    }
  );
});

async function processLint(input: string, fixable = false) {
  const linterOptions: LinterOptions = {
    code: input,
    config: {
      plugins, // Adjust path as needed
      rules: {
        'slds/enforce-bem-usage': true,
      },
      fix: fixable,
    },
  };

  const result: LinterResult = await lint(linterOptions);
  return result.results[0];
}
