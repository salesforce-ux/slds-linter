import { jest } from '@jest/globals';

describe('ESLint Worker (Piscina)', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('lints a file and returns result; applies fixes when requested', async () => {
    const lintFiles = jest.fn(async () => [{ output: 'fixed', rulesMeta: {}, messages: [] }]);
    const outputFixes = jest.fn(async () => undefined);
    const ESLintCtor = jest.fn(() => ({ lintFiles }));

    await jest.unstable_mockModule('eslint', () => ({
      ESLint: Object.assign(ESLintCtor, { outputFixes }),
    }));

    const { default: lint } = await import('../../src/workers/eslint.worker');

    const out = await lint({
      filePath: 'a.css',
      config: { configPath: '/abs/eslint.config.mjs', fix: true },
    });

    expect(ESLintCtor).toHaveBeenCalledWith({
      overrideConfigFile: '/abs/eslint.config.mjs',
      fix: true,
    });

    expect(lintFiles).toHaveBeenCalledWith(['a.css']);
    expect(outputFixes).toHaveBeenCalled();
    expect(out).toEqual({ filePath: 'a.css', lintResult: expect.any(Object) });
  });

  it('does not apply fixes when fix is false or output is missing', async () => {
    const lintFiles = jest.fn(async () => [{ output: undefined, rulesMeta: {}, messages: [] }]);
    const outputFixes = jest.fn(async () => undefined);
    const ESLintCtor = jest.fn(() => ({ lintFiles }));

    await jest.unstable_mockModule('eslint', () => ({
      ESLint: Object.assign(ESLintCtor, { outputFixes }),
    }));

    const { default: lint } = await import('../../src/workers/eslint.worker');

    await lint({
      filePath: 'a.css',
      config: { configPath: '/abs/eslint.config.mjs', fix: false },
    });

    expect(outputFixes).not.toHaveBeenCalled();
  });

  it('returns error object when eslint.lintFiles throws', async () => {
    const lintFiles = jest.fn(async () => {
      throw new Error('lint fail');
    });
    const outputFixes = jest.fn(async () => undefined);
    const ESLintCtor = jest.fn(() => ({ lintFiles }));

    await jest.unstable_mockModule('eslint', () => ({
      ESLint: Object.assign(ESLintCtor, { outputFixes }),
    }));

    const { default: lint } = await import('../../src/workers/eslint.worker');

    const out = await lint({
      filePath: 'a.css',
      config: { configPath: '/abs/eslint.config.mjs', fix: true },
    });

    expect(out).toEqual({ filePath: 'a.css', error: 'lint fail' });
  });

  it('caches ESLint instance across calls with same config', async () => {
    const lintFiles = jest.fn(async () => [{ output: undefined, rulesMeta: {}, messages: [] }]);
    const outputFixes = jest.fn(async () => undefined);
    const ESLintCtor = jest.fn(() => ({ lintFiles }));

    await jest.unstable_mockModule('eslint', () => ({
      ESLint: Object.assign(ESLintCtor, { outputFixes }),
    }));

    const { default: lint } = await import('../../src/workers/eslint.worker');

    const config = { configPath: '/abs/eslint.config.mjs', fix: false };

    await lint({ filePath: 'a.css', config });
    await lint({ filePath: 'b.css', config });

    // ESLint should only be constructed once since config is the same
    expect(ESLintCtor).toHaveBeenCalledTimes(1);
    expect(lintFiles).toHaveBeenCalledTimes(2);
  });

  it('includes cwd in ESLint options when provided', async () => {
    const lintFiles = jest.fn(async () => [{ output: undefined, rulesMeta: {}, messages: [] }]);
    const outputFixes = jest.fn(async () => undefined);
    const ESLintCtor = jest.fn(() => ({ lintFiles }));

    await jest.unstable_mockModule('eslint', () => ({
      ESLint: Object.assign(ESLintCtor, { outputFixes }),
    }));

    const { default: lint } = await import('../../src/workers/eslint.worker');

    await lint({
      filePath: 'a.css',
      config: { configPath: '/abs/eslint.config.mjs', fix: false, cwd: '/tmp/project' },
    });

    expect(ESLintCtor).toHaveBeenCalledWith({
      overrideConfigFile: '/abs/eslint.config.mjs',
      fix: false,
      cwd: '/tmp/project',
    });
  });
});
