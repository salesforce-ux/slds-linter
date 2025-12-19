import { jest } from '@jest/globals';

describe('ESLintWorker', () => {
  const originalExit = process.exit;
  const originalConsoleError = console.error;

  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    process.exit = originalExit;
    console.error = originalConsoleError;
  });

  it('constructs ESLint with configPath/fix and returns lint result; applies fixes when requested', async () => {
    const lintFiles = jest.fn(async () => [{ output: 'fixed', rulesMeta: {}, messages: [] }]);
    const outputFixes = jest.fn(async () => undefined);
    const ESLintCtor = jest.fn(() => ({ lintFiles }));

    await jest.unstable_mockModule('eslint', () => ({
      ESLint: Object.assign(ESLintCtor, { outputFixes }),
    }));

    await jest.unstable_mockModule('worker_threads', () => ({
      isMainThread: true,
      parentPort: undefined,
      workerData: {
        files: ['a.css'],
        config: { configPath: '/abs/eslint.config.mjs', fix: true },
      },
    }));

    const { ESLintWorker } = await import('../../src/workers/eslint.worker');

    const worker = new ESLintWorker();

    const out = await (worker as any).processFile('a.css');

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

    await jest.unstable_mockModule('worker_threads', () => ({
      isMainThread: true,
      parentPort: undefined,
      workerData: {
        files: ['a.css'],
        config: { configPath: '/abs/eslint.config.mjs', fix: false },
      },
    }));

    const { ESLintWorker } = await import('../../src/workers/eslint.worker');

    const worker = new ESLintWorker();
    await (worker as any).processFile('a.css');

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

    await jest.unstable_mockModule('worker_threads', () => ({
      isMainThread: true,
      parentPort: undefined,
      workerData: {
        files: ['a.css'],
        config: { configPath: '/abs/eslint.config.mjs', fix: true },
      },
    }));

    const { ESLintWorker } = await import('../../src/workers/eslint.worker');

    const worker = new ESLintWorker();
    const out = await (worker as any).processFile('a.css');

    expect(out).toEqual({ filePath: 'a.css', error: 'lint fail' });
  });

  it('auto-runs in worker thread and triggers catch handler when process() rejects', async () => {
    const lintFiles = jest.fn(async () => [{ output: undefined, rulesMeta: {}, messages: [] }]);
    const outputFixes = jest.fn(async () => undefined);
    const ESLintCtor = jest.fn(() => ({ lintFiles }));

    await jest.unstable_mockModule('eslint', () => ({
      ESLint: Object.assign(ESLintCtor, { outputFixes }),
    }));

    // Make the BaseWorker.process() reject by throwing from process.exit(0) in finally.
    process.exit = jest.fn((code?: any) => {
      if (code === 0) throw new Error('exit0');
      return undefined as any;
    }) as any;

    console.error = jest.fn();

    await jest.unstable_mockModule('worker_threads', () => ({
      isMainThread: false,
      parentPort: { postMessage: jest.fn() },
      workerData: {
        files: ['a.css'],
        config: { configPath: '/abs/eslint.config.mjs', fix: false },
      },
    }));

    // Importing should execute the auto-run block.
    await import('../../src/workers/eslint.worker');

    expect(console.error).toHaveBeenCalledWith('Worker failed:', expect.any(Error));
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});
