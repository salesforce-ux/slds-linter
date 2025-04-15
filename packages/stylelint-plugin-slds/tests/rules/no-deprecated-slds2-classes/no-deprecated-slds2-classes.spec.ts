
import stylelint, { LinterResult, LinterOptions } from 'stylelint';

const { lint }: typeof stylelint = stylelint;

xdescribe('no-deprecated-slds2-classes', () => {
  const ruleName = 'slds/no-deprecated-slds2-classes';

  const testCases = [
    //TODO:Kishore
    // {
    //   description: 'Reports warning for deprecated SLDS2 class selector',
    //   inputCss: `
    //     .slds-button {
    //       background-color: red;
    //     }
    //   `,
    //   expectedMessage: 'Selector: ".slds-button" is no longer available in SLDS2. Please update to a supported selector.',
    // },
    // {
    //   description: 'Reports warning for another deprecated SLDS2 class selector',
    //   inputCss: `
    //     .slds-input {
    //       border: 1px solid #ccc;
    //     }
    //   `,
    //   expectedMessage: 'Selector: ".slds-input" is no longer available in SLDS2. Please update to a supported selector.',
    // },
    {
      description: 'Does not report for a valid SLDS class selector',
      inputCss: `
        .slds-button_icon {
          margin: 10px;
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
        expect(messages[0]).toMatch(expectedMessage);
      } else {
        expect(messages).toHaveLength(0);
      }
    });
  });
});
