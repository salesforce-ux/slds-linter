import stylelint, { LinterOptions, LinterResult } from 'stylelint';

const { lint }: typeof stylelint = stylelint;
const ruleName = 'slds/no-slds-var-without-fallback';

describe('no-slds-var-without-fallback', () => {
  test('Flags usage of var(--slds-*) without fallback', async () => {
    // Variable without fallback
    const css = `
      .example {
        color: var(--slds-g-color-border-base-1);
      }
    `;

    // Create a stylelint result
    const result = await stylelint.lint({
      code: css,
      config: {
        plugins: ['./src/index.ts'],
        rules: {
          [ruleName]: true,
        },
      },
    });

    const messages = result.results[0]?.warnings ?? [];
    
    // We expect a warning for this variable
    const expectedWarning = true;

    if (expectedWarning) {
      expect(messages.length).toBeGreaterThan(0);
      // Check that one of the warnings contains text about styling hooks being unavailable
      const warningTexts = messages.map(w => w.text);
      expect(warningTexts.some(text => text.includes('styling hook without a fallback value'))).toBeTruthy();
      expect(warningTexts.some(text => text.includes('add this fallback value'))).toBeTruthy();
      expect(warningTexts.some(text => text.includes('Styling hooks are unavailable in some Salesforce environments'))).toBeTruthy();
    } else {
      expect(messages.length).toBe(0);
    }
  });

  test('Flags multiple occurrences of var(--slds-*) without fallback', async () => {
    // Multiple variables without fallback
    const css = `
      .example {
        color: var(--slds-g-color-border-base-1);
        background-color: var(--slds-g-color-border-base-2);
        border-color: var(--slds-g-color-border-base-3);
        padding: var(--slds-g-spacing-4);
        font-size: var(--slds-g-font-scale-2);
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

    const messages = result.results[0]?.warnings ?? [];
    
    // We expect warnings for these variables
    const expectedWarning = true;

    if (expectedWarning) {
      expect(messages.length).toBeGreaterThan(0);
      // Check that one of the warnings contains text about styling hooks being unavailable
      const warningTexts = messages.map(w => w.text);
      console.log('Warning texts:', warningTexts);
      expect(warningTexts.some(text => text.includes('styling hook without a fallback value'))).toBeTruthy();
      
      // Check for each of the variables having the expected fallback value
      const variablesWithFallbacks = [
        { variable: '--slds-g-color-border-base-1', fallback: '#c9c9c9' },
        { variable: '--slds-g-color-border-base-2', fallback: '#aeaeae' },
        { variable: '--slds-g-color-border-base-3', fallback: '#939393' },
        { variable: '--slds-g-spacing-4', fallback: '1rem' },
        { variable: '--slds-g-font-scale-2', fallback: '1rem' },
      ];
      
      variablesWithFallbacks.forEach((item) => {
        const hasVarWithFallback = warningTexts.some(
          text => text.includes(item.variable) && text.includes(item.fallback)
        );
        console.log(`Checking for "${item.variable}" with value "${item.fallback}":`, hasVarWithFallback);
        expect(hasVarWithFallback).toBeTruthy();
      });
    } else {
      expect(messages.length).toBe(0);
    }
  });

  test('Does not flag var(--slds-*) with fallback', async () => {
    // Variable with fallback
    const css = `
      .example {
        color: var(--slds-g-color-border-base-1, #333);
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

    // Shouldn't have any warnings since the variable already has a fallback
    expect(result.results[0]?.warnings.length ?? 0).toBe(0);
  });

  test('Applies fallback value when fixing', async () => {
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

    const fixedCss = linterResult.output;
    
    // Verify that the fix was applied (output should include the fallback value)
    expect(fixedCss).toBeDefined();
    expect(fixedCss.includes('var(--slds-g-color-border-base-1, #c9c9c9)')).toBeTruthy();
  });

  test('Does not report issues for unknown SLDS variables', async () => {
    // Variables that don't exist in the metadata
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

    // Check that no warnings were generated for unknown variables
    expect(warningTexts?.length).toBe(0);
  });

  test('Does not report issues for completely unknown variables', async () => {
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

    // Check that no warnings were generated for the unknown variable
    expect(warningTexts?.length).toBe(0);
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

  xtest('Flags nested var() functions without fallback', async () => {
    // Nested variables
    const css = `
      .example {
        color: var(--lwc-color-background, var(--slds-g-color-border-base-1));
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

    const messages = result.results[0]?.warnings ?? [];
    
    // We expect a warning for the nested SLDS variable
    expect(messages.length).toBeGreaterThan(0);
    const warningTexts = messages.map(w => w.text);
    console.log('Nested var warning texts:', warningTexts);
    expect(warningTexts.some(text => text.includes('--slds-g-color-border-base-1'))).toBeTruthy();
    expect(warningTexts.some(text => text.includes('#c9c9c9'))).toBeTruthy();
  });

  xtest('Applies fallback value to nested var() functions when fixing', async () => {
    const inputCss = `
      .example {
        color: var(--lwc-color-background, var(--slds-g-color-border-base-1));
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
    
    // Verify that the fix was applied to the nested variable
    expect(fixedCss).toBeDefined();
    expect(fixedCss.includes('var(--slds-g-color-border-base-1, #c9c9c9)')).toBeTruthy();
  });
}); 