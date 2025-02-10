import { describe, it } from 'mocha';
import { expect } from 'chai';
import stylelint from 'stylelint';
import path from 'path';

const ruleName = 'slds/no-aura-tokens';
const config = {
  plugins: ['./src/index.ts'],
  rules: {
    [ruleName]: [true],
  },
};

// Mock token mapping
const mockTokenMapping = {
  brandPrimary: '--lwc-brandPrimary',
  brandSecondary: '--lwc-brandSecondary',
};

describe('no-aura-tokens Stylelint Rule', () => {
  it('should flag deprecated Aura tokens and suggest replacements', async () => {
    const result = await stylelint.lint({
      code: `
        .example {
          color: token(brandPrimary);
        }
      `,
      config,
    });

    const warnings = result.results[0].warnings;
    expect(warnings).to.have.lengthOf(1);

    expect(warnings[0].text).to.include(
      "The 'token(brandPrimary)' design token is deprecated. To avoid breaking changes, replace it with 'var(--lwc-brandPrimary, token(brandPrimary))'"
    );
  });

  it('should flag deprecated Aura tokens and suggest replacements', async () => {
    const result = await stylelint.lint({
      code: `
        .example {
          color: t(brandPrimary);
        }
      `,
      config,
    });

    const warnings = result.results[0].warnings;
    expect(warnings).to.have.lengthOf(1);

    expect(warnings[0].text).to.include(
      "The 't(brandPrimary)' design token is deprecated. To avoid breaking changes, replace it with 'var(--lwc-brandPrimary, t(brandPrimary))'"
    );
  });

  it('should automatically fix issues when fix is enabled', async () => {
    const result = await stylelint.lint({
      code: `
        .example {
          color: token(brandPrimary);
        }
      `,
      config: { ...config, fix: true },
    });

    const fixedCode = result.output;
    expect(fixedCode).to.include(
      'color: var(--lwc-brandPrimary, token(brandPrimary));'
    );
  });

  it('should not flag valid CSS', async () => {
    const result = await stylelint.lint({
      code: `
        .example {
          color: var(--lwc-brandPrimary, #123456);
          background: #fff;
        }
      `,
      config,
    });

    const warnings = result.results[0].warnings;
    expect(warnings).to.have.lengthOf(0);
  });

  it('should handle unknown tokens gracefully', async () => {
    const result = await stylelint.lint({
      code: `
        .example {
          color: token(unknownToken);
        }
      `,
      config,
    });

    const warnings = result.results[0].warnings;
    expect(warnings).to.have.lengthOf(1);
    expect(warnings[0].text).to.include(
      'Aura tokens are deprecated. Please migrate to SLDS Design Tokens.'
    );
  });
});
