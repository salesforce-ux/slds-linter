import stylelint, { LinterResult, LinterOptions, LintResult } from 'stylelint';
const { lint }: typeof stylelint = stylelint;
/**
 * Disableing tests for now. TODO: review later
 */
xdescribe('enforce-bem-usage', () => {
  
  [
    {
      description: 'should report and fix bem usage when sole selector',
      input: `
        .slds-text-heading_large {
          border-start-start-radius: 0;
        }
      `,
      expectedOutput: `
        .slds-text-heading--large {
          border-start-start-radius: 0;
        }
      `,
      messages: [
        "slds-text-heading_large has been retired. Update it to the new name slds-text-heading--large (slds/enforce-bem-usage)",
      ],
      messagePositions: [[1, 24]],
    },
    {
      description: 'should report and fix bem usage when multiple selectors',
      input: `
        .slds-dl_horizontal__label,
        .slds-dl_horizontal__detail {
          display: none;
        }
      `,
      expectedOutput: `
        .slds-dl--horizontal__label,
        .slds-dl--horizontal__detail {
          display: none;
        }
      `,
      messages: [
        "slds-dl_horizontal__label has been retired. Update it to the new name slds-dl--horizontal__label (slds/enforce-bem-usage)",
        "slds-dl_horizontal__detail has been retired. Update it to the new name slds-dl--horizontal__detail (slds/enforce-bem-usage)",
      ],
      messagePositions: [
        [1, 26],
        [37, 63],
      ],
    },
    {
      description: 'should report and fix bem usage in psuedo-selector',
      input: `
        .slds-dl_horizontal__label:last-of-type {
          border-bottom: none;
        }
      `,
      expectedOutput: `
        .slds-dl--horizontal__label:last-of-type {
          border-bottom: none;
        }
      `,
      messages: [
        "slds-dl_horizontal__label has been retired. Update it to the new name slds-dl--horizontal__label (slds/enforce-bem-usage)",
      ],
      messagePositions: [[1, 26]],
    },
    {
      description: 'should report and fix bem usage in complex selector',
      input: `
        div.slds-dl_horizontal__label {
          border-bottom: none;
        }
      `,
      expectedOutput: `
        div.slds-dl--horizontal__label {
          border-bottom: none;
        }
      `,
      messages: [
        "slds-dl_horizontal__label has been retired. Update it to the new name slds-dl--horizontal__label (slds/enforce-bem-usage)",
      ],
      messagePositions: [[4, 29]],
    },
    {
      description: 'should report and fix bem usage in chained selector',
      input: `
        .slds-dl_horizontal__label div {
          border-bottom: none;
        }
      `,
      expectedOutput: `
        .slds-dl--horizontal__label div {
          border-bottom: none;
        }
      `,
      messages: [
        "slds-dl_horizontal__label has been retired. Update it to the new name slds-dl--horizontal__label (slds/enforce-bem-usage)",
      ],
      messagePositions: [[1, 26]],
    },
    {
      description: 'should report and fix bem usage in chained direct selector',
      input: `
        .slds-dl_horizontal__label > div {
          border-bottom: none;
        }
      `,
      expectedOutput: `
        .slds-dl--horizontal__label > div {
          border-bottom: none;
        }
      `,
      messages: [
        "slds-dl_horizontal__label has been retired. Update it to the new name slds-dl--horizontal__label (slds/enforce-bem-usage)",
      ],
      messagePositions: [[1, 26]],
    },
    {
      description: 'should report and fix bem usage in chained direct selector',
      input: `
.slds-dl_horizontal__label, .slds-dl_horizontal__detail {}

.slds-dl_horizontal__label {}
      `,
      expectedOutput: `
.slds-dl--horizontal__label, .slds-dl--horizontal__detail {}

.slds-dl--horizontal__label {}
      `,
      messages: [
        "slds-dl_horizontal__label has been retired. Update it to the new name slds-dl--horizontal__label (slds/enforce-bem-usage)",
        "slds-dl_horizontal__detail has been retired. Update it to the new name slds-dl--horizontal__detail (slds/enforce-bem-usage)",
        "slds-dl_horizontal__label has been retired. Update it to the new name slds-dl--horizontal__label (slds/enforce-bem-usage)",
      ],
      messagePositions: [
        [1, 26],
        [29, 55],
        [1, 26],
      ],
    },
    /* Commented out temporarily due to TypeScript issues
    {
      description: 'should handle AURA expressions with BEM class names',
      input: `
        div[class="{! (v.hasErrors ? 'slds-theme_error' : 'slds-theme_success') + ' slds-modal__header slds-theme_alert-texture'}"] {
          color: red;
        }
      `,
      expectedOutput: `
        div[class="{! (v.hasErrors ? 'slds-theme--error' : 'slds-theme--success') + ' slds-modal__header slds-theme--alert-texture'}"] {
          color: red;
        }
      `,
      messages: [
        "slds-theme_error has been retired. Update it to the new name slds-theme--error (slds/enforce-bem-usage)",
        "slds-theme_success has been retired. Update it to the new name slds-theme--success (slds/enforce-bem-usage)",
        "slds-theme_alert-texture has been retired. Update it to the new name slds-theme--alert-texture (slds/enforce-bem-usage)",
      ],
      messagePositions: [
        [1, 50],
        [1, 93],
        [1, 154]
      ],
    },
    */
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
        );
        expect(messages).toContain(reportedMessages)
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
      plugins: ['./src/index.ts'], // Adjust path as needed
      rules: {
        'slds/enforce-bem-usage': true,
      },
      fix: fixable,
    },
  };

  const result: LinterResult = await lint(linterOptions);
  return result.results[0];
}
