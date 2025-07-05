import stylelint from 'stylelint';
import { describe, it, expect } from '@jest/globals';

const ruleName = 'slds/lwc-token-to-slds-hook';

describe(ruleName, () => {
  it('should handle multiple occurrences of the same LWC token in a single property', async () => {
    const config = {
      plugins: ['./src/index.ts'],
      rules: {
        [ruleName]: true,
      },
    };

    const testCases = [
      {
        code: `
          .test {
            padding: var(--lwc-spacingXxSmall) var(--lwc-spacingXxSmall) var(--lwc-spacingXxSmall) var(--lwc-spacingXxSmall);
          }
        `,
        description: 'Multiple occurrences of the same LWC token in padding property',
        expectedWarnings: 4, // Should report each occurrence
      },
      {
        code: `
          .test {
            margin: var(--lwc-spacingSmall) var(--lwc-spacingSmall);
          }
        `,
        description: 'Two occurrences of the same LWC token in margin property',
        expectedWarnings: 2, // Should report each occurrence
      },
      {
        code: `
          .test {
            border: 1px solid var(--lwc-colorBorder) var(--lwc-colorBorder);
          }
        `,
        description: 'Multiple occurrences in border property',
        expectedWarnings: 2, // Should report each occurrence
      }
    ];

    for (const testCase of testCases) {
      const result = await stylelint.lint({
        code: testCase.code,
        config,
      });

      expect(result.results[0].warnings).toHaveLength(testCase.expectedWarnings);
      
      // Verify that each warning is for the same token
      const warnings = result.results[0].warnings;
      const firstWarning = warnings[0];
      const tokenName = firstWarning.text.match(/--lwc-[a-zA-Z]+/)?.[0];
      
      warnings.forEach(warning => {
        expect(warning.text).toContain(tokenName);
        expect(warning.rule).toBe(ruleName);
      });
    }
  });

  it('should fix multiple occurrences correctly', async () => {
    const config = {
      plugins: ['./src/index.ts'],
      rules: {
        [ruleName]: true,
      },
    };

    const code = `
      .test {
        padding: var(--lwc-spacingXxSmall) var(--lwc-spacingXxSmall) var(--lwc-spacingXxSmall) var(--lwc-spacingXxSmall);
      }
    `;

    const result = await stylelint.lint({
      code,
      config,
      fix: true,
    });

    const fixedCode = result.results[0]._postcssResult?.root?.toString() || '';
    
    // Should replace all occurrences with the SLDS token
    expect(fixedCode).toContain('var(--slds-g-spacing-1, var(--lwc-spacingXxSmall))');
    
    // Should have 4 replacements (one for each occurrence)
    const replacementCount = (fixedCode.match(/var\(--slds-g-spacing-1/g) || []).length;
    expect(replacementCount).toBe(4);
  });
}); 