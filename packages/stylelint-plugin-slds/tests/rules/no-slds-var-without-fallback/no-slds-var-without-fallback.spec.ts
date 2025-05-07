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
          // Check that one of the warnings contains text about styling hooks being unavailable
          const warningTexts = messages.map(w => w.text);
          expect(warningTexts.some(text => text.includes('styling hook without a fallback value'))).toBeTruthy();
          
          // If we have specific expected fallbacks, verify them
          if (expectedFallbacks) {
            // Test that we have at least as many warnings as expected fallbacks
            expect(messages.length).toBeGreaterThanOrEqual(Object.keys(expectedFallbacks).length);
            
            // Log all warning texts for diagnostic purposes
            console.log('Warning texts:', warningTexts);

            // For each expected fallback, check if any warning includes it
            Object.entries(expectedFallbacks).forEach(([varName, expectedValue]) => {
              // The warning text will include the actual variable name in the format "varName"
              const hasMatchingWarning = warningTexts.some(text => 
                text.includes(`"${varName}"`) && text.includes(expectedValue) && text.includes('SLDS1 tokens page')
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

  // Test for fixing functionality - using a known variable from metadata
  it('Fixes var(--slds-*) without fallback by adding a fallback value for known variables', async () => {
    const inputCss = `
      .example {
        color: var(--slds-g-color-border-base-1);
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

    // Check that the fixed CSS contains a fallback value
    const fixedCss = linterResult.output;
    
    // Verify that the fix was applied correctly
    expect(fixedCss).toBeDefined();
    expect(fixedCss).toContain('var(--slds-g-color-border-base-1, #c9c9c9)');
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

  test('Shows new error message format for non-exact matches', async () => {
    const css = `
      .example {
        /* These variables don't exist in the metadata */
        color: var(--slds-g-color-border-custom);
        margin: var(--slds-g-spacing-custom);
        font-size: var(--slds-g-font-custom);
      }
    `;

    const result = await stylelint.lint({
      code: css,
      config: {
        plugins: ['./src/index.ts'],
        rules: {
          [ruleName]: true,
        },
      },
    });

    const warningTexts = result.results[0]?.warnings.map(w => w.text);
    console.log('Unknown variable warnings:', warningTexts);

    // Check that warnings were generated
    expect(warningTexts?.length).toBe(3);
    
    // All warnings should mention SLDS1 tokens page
    expect(warningTexts?.every(text => text.includes('SLDS1 tokens page'))).toBeTruthy();
    
    // All warnings should mention "add a fallback value"
    expect(warningTexts?.every(text => text.includes('add a fallback value'))).toBeTruthy();
    
    // All warnings should mention styling hooks being unavailable 
    expect(warningTexts?.every(text => text.includes('Styling hooks are unavailable in some Salesforce environments'))).toBeTruthy();
    
    // None of the warnings should contain specific fallback values
    expect(warningTexts?.every(text => !text.includes('add this fallback value:'))).toBeTruthy();
  });

  test('Shows updated error message for completely unknown variables', async () => {
    // Create a variable name that's unlikely to have any close matches
    const css = `
      .example {
        /* This variable is completely made up with no likely matches */
        transform: var(--slds-completely-unknown-variable);
      }
    `;

    const result = await stylelint.lint({
      code: css,
      config: {
        plugins: ['./src/index.ts'],
        rules: {
          [ruleName]: true,
        },
      },
    });

    const warningTexts = result.results[0]?.warnings.map(w => w.text);
    console.log('Unknown variable warning:', warningTexts);

    // Check that we get the updated message format
    expect(warningTexts?.length).toBe(1);
    expect(warningTexts?.[0]).toContain('SLDS1 tokens page');
    expect(warningTexts?.[0]).toContain('To make sure your component renders correctly in all environments, add a fallback value');
    expect(warningTexts?.[0]).toContain('Your code uses the "--slds-completely-unknown-variable" styling hook without a fallback value');
    
    // And check that it doesn't suggest a specific fallback value
    expect(warningTexts?.[0]).not.toContain('add this fallback value:');
  });

  it('Does not add fallback for non-metadata variables when fixing', async () => {
    const inputCss = `
      .example {
        transform: var(--slds-completely-unknown-variable);
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
    
    // Verify that the fix was not applied (output should be the same as input)
    expect(fixedCss).toBeDefined();
    
    // The variable should remain without a fallback
    expect(fixedCss.includes('var(--slds-completely-unknown-variable)')).toBeTruthy();
    expect(fixedCss.includes('var(--slds-completely-unknown-variable, ')).toBeFalsy();
  });
}); 