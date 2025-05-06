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
    },
    {
      description: 'Provides specific fallback values for known SLDS variables from slds1ExcludedVars.json',
      inputCss: `
        .example {
          color: var(--slds-g-color-border-base-1);
          background-color: var(--slds-g-color-border-base-2);
          border-color: var(--slds-g-color-border-base-3);
          padding: var(--slds-g-spacing-4);
          font-size: var(--slds-g-font-scale-2);
        }
      `,
      expectedWarning: true,
      expectedFallbacks: {
        "--slds-g-color-border-base-1": "#c9c9c9",
        "--slds-g-color-border-base-2": "#aeaeae",
        "--slds-g-color-border-base-3": "#939393",
        "--slds-g-spacing-4": "1rem",
        "--slds-g-font-scale-2": "1rem"
      }
    }
  ];

  testCases.forEach(
    ({ description, inputCss, expectedWarning, expectedFallbacks }) => {
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
          
          // If we have specific expected fallbacks, verify them
          if (expectedFallbacks) {
            // Test that we have at least as many warnings as expected fallbacks
            expect(messages.length).toBeGreaterThanOrEqual(Object.keys(expectedFallbacks).length);
            
            // Log all warning texts for diagnostic purposes
            console.log('Warning texts:', warningTexts);

            // For each expected fallback, check if any warning includes it
            Object.entries(expectedFallbacks).forEach(([varName, expectedValue]) => {
              // The warning text will include the actual variable name in the format var(varName)
              const hasMatchingWarning = warningTexts.some(text => 
                text.includes(`var(${varName}`) && text.includes(expectedValue)
              );
              console.log(`Checking for "${varName}" with value "${expectedValue}": ${hasMatchingWarning}`);
              expect(hasMatchingWarning).toBeTruthy();
            });
          }
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
  
  // Test fixing specific SLDS variables with correct fallback values
  it('Fixes specific SLDS variables with correct fallback values from slds1ExcludedVars.json', async () => {
    const inputCss = `
      .example {
        color: var(--slds-g-color-border-base-1);
        background-color: var(--slds-g-color-border-base-2);
        border: var(--slds-g-sizing-border-1) solid var(--slds-g-color-border-base-3);
        padding: var(--slds-g-spacing-4);
        font-size: var(--slds-g-font-scale-2);
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

    const fixedCss = linterResult.output;
    
    // Verify that the fixes were applied correctly with specific values
    expect(fixedCss).toBeDefined();
    expect(fixedCss).toContain('var(--slds-g-color-border-base-1, #c9c9c9)');
    expect(fixedCss).toContain('var(--slds-g-color-border-base-2, #aeaeae)');
    expect(fixedCss).toContain('var(--slds-g-color-border-base-3, #939393)');
    expect(fixedCss).toContain('var(--slds-g-sizing-border-1, 1px)');
    expect(fixedCss).toContain('var(--slds-g-spacing-4, 1rem)');
    expect(fixedCss).toContain('var(--slds-g-font-scale-2, 1rem)');
  });
}); 