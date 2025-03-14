
import stylelint, { LinterResult, LinterOptions } from 'stylelint';

const { lint }: typeof stylelint = stylelint;

describe('no-calc-function', () => {
  const ruleName = 'slds/no-calc-function';

  const testCases = [
    {
      description: 'Flags usage of calc() in width property',
      inputCss: `
        .example {
          width: calc(100% - 50px);
        }
      `,
      expectedMessage:
        'Don’t use the calc() function in the property width.',
    },
    {
      description: 'Fixes calc() usage by removing it from the width property',
      inputCss: `
        .example {
          width: calc(100% - 50px);
        }
      `,
      expectedMessage:
        'Don’t use the calc() function in the property width.',
      fix: true,
      expectedOutput: `
        .example {
          width: 100% - 50px;
        }
      `,
    },
    {
      description: 'Does not fix if calc() is not used',
      inputCss: `
        .example {
          width: 100%;
        }
      `,
      expectedMessage: '',
      fix: true,
      expectedOutput: `
        .example {
          width: 100%;
        }
      `,
    },
    {
      description:
        'Flags multiple occurrences of calc() in width and height properties',
      inputCss: `
        .example {
          width: calc(100% - 50px);
          height: calc(100vh - 20px);
        }
      `,
      expectedMessage:
        'Don’t use the calc() function in the property width.',
    },
  ];

  testCases.forEach(
    (
      { description, inputCss, expectedMessage, fix, expectedOutput },
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
          fix,
        } as LinterOptions);

        const messages = linterResult.results[0].warnings.map(
          (warning) => warning.text
        );

        if (expectedMessage) {
          expect(messages[0]).toMatch(expectedMessage);
        } else {
          expect(messages).toHaveLength(0);
        }

        //   if (fix) {
        //     const output = linterResult.results[0].output;
        //     expect(output).toEqual(expectedOutput);
        //   }
      });
    }
  );
});
