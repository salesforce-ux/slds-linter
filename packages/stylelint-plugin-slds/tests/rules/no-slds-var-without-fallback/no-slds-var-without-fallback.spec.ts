import stylelint, { LinterResult, LinterOptions } from 'stylelint';

const { lint }: typeof stylelint = stylelint;

describe('no-slds-var-without-fallback', () => {
  const ruleName = 'slds/no-slds-var-without-fallback';

  const testCases = [
    {
      description: 'Flags usage of var(--slds-*) without fallback',
      inputCss: `
        .example {
          color: var(--slds-color-brand);
        }
      `,
      expectedWarning: true,
    },
    {
      description: 'Does not flag var(--slds-*) with fallback',
      inputCss: `
        .example {
          color: var(--slds-color-brand, #0070d2);
        }
      `,
      expectedWarning: false,
    },
    {
      description: 'Does not flag non-SLDS variables without fallback',
      inputCss: `
        .example {
          color: var(--custom-color);
        }
      `,
      expectedWarning: false,
    },
    {
      description: 'Flags multiple occurrences of var(--slds-*) without fallback',
      inputCss: `
        .example {
          color: var(--slds-color-brand);
          background-color: var(--slds-color-background);
          font-size: var(--slds-font-size-text-large);
        }
      `,
      expectedWarning: true,
    }
  ];

  testCases.forEach(
    ({ description, inputCss, expectedWarning }) => {
      it(description, async () => {
        const linterResult: LinterResult = await lint({
          code: inputCss,
          config: {
            plugins: ['./src/index.ts'],
            rules: {
              [ruleName]: true,
            },
          },
        } as LinterOptions);

        const messages = linterResult.results[0].warnings;

        if (expectedWarning) {
          expect(messages.length).toBeGreaterThan(0);
          // Check that one of the warnings contains "must include a fallback value"
          const warningTexts = messages.map(w => w.text);
          expect(warningTexts.some(text => text.includes('must include a fallback value'))).toBeTruthy();
        } else {
          expect(messages).toHaveLength(0);
        }
      });
    }
  );

  // Test for fixing functionality
  it('Fixes var(--slds-*) without fallback by adding a fallback value', async () => {
    const inputCss = `
      .example {
        color: var(--slds-color-brand);
      }
    `;
    
    const linterResult: LinterResult = await lint({
      code: inputCss,
      config: {
        plugins: ['./src/index.ts'],
        rules: {
          [ruleName]: true,
        },
      },
      fix: true,
    } as LinterOptions);

    // Just check that the fixed CSS contains a fallback value
    const fixedCss = linterResult.output;
    
    // Verify that the fix was applied correctly
    expect(fixedCss).toBeDefined();
    expect(fixedCss).toContain('var(--slds-color-brand,');
    expect(fixedCss).toContain(')');
  });
}); 