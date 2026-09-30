import { jest } from '@jest/globals';

describe('LintRunner', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  function setupCommonMocks(overrides: {
    processConfig?: jest.Mock<(...args: any[]) => Promise<string | undefined>>;
    poolRun?: jest.Mock<(task: any) => Promise<any>>;
    poolDestroy?: jest.Mock<() => Promise<void>>;
    masterLint?: jest.Mock<(task: any) => Promise<any>>;
  } = {}) {
    const processConfig = overrides.processConfig ??
      jest.fn<(...args: any[]) => Promise<string | undefined>>().mockResolvedValue('/abs/config.mjs');
    const resolveDirName = jest.fn().mockReturnValue('/abs/dir');
    const poolRun = overrides.poolRun ?? jest.fn<(task: any) => Promise<any>>();
    const poolDestroy = overrides.poolDestroy ?? jest.fn<() => Promise<void>>().mockResolvedValue(undefined);

    const PiscinaMock = jest.fn().mockImplementation(() => ({
      run: poolRun,
      destroy: poolDestroy,
    }));

    const masterLint = overrides.masterLint ?? jest.fn<(task: any) => Promise<any>>();
    const resetESLintCache = jest.fn();

    const warning = jest.fn();
    const error = jest.fn();
    const debug = jest.fn();

    return { processConfig, resolveDirName, PiscinaMock, poolRun, poolDestroy, masterLint, resetESLintCache, warning, error, debug };
  }

  async function mockAndImport(mocks: ReturnType<typeof setupCommonMocks>) {
    await jest.unstable_mockModule('piscina', () => ({
      default: mocks.PiscinaMock,
    }));

    await jest.unstable_mockModule('../../src/services/config-loader', () => ({
      ConfigLoader: { processConfig: mocks.processConfig },
    }));

    await jest.unstable_mockModule('../../src/utils/nodeVersionUtil', () => ({
      resolveDirName: mocks.resolveDirName,
    }));

    await jest.unstable_mockModule('../../src/utils/logger', () => ({
      Logger: { error: mocks.error, warning: mocks.warning, debug: mocks.debug },
    }));

    await jest.unstable_mockModule('../../src/services/progress-handler', () => ({
      ProgressHandler: class {
        increment() {}
        stop() {}
      },
    }));

    await jest.unstable_mockModule('../../src/workers/master.worker', () => ({
      default: mocks.masterLint,
    }));

    await jest.unstable_mockModule('../../src/workers/eslint.worker', () => ({
      default: jest.fn(),
      resetESLintCache: mocks.resetESLintCache,
    }));

    const { LintRunner } = await import('../../src/services/lint-runner');
    return { LintRunner };
  }

  it('creates Piscina pool and returns normalized results when files >= maxWorkers', async () => {
    const mocks = setupCommonMocks();
    mocks.poolRun
      .mockResolvedValueOnce({
        filePath: 'a.css',
        lintResult: { filePath: 'a.css', messages: [], errorCount: 0, warningCount: 0, fixableErrorCount: 0, fixableWarningCount: 0, fatalErrorCount: 0, suppressedMessages: [], usedDeprecatedRules: [] }
      })
      .mockResolvedValueOnce({
        filePath: 'b.css',
        error: 'bad',
        lintResult: null
      });

    const { LintRunner } = await mockAndImport(mocks);

    const out = await LintRunner.runLinting(['a.css', 'b.css'], { configPath: './config.mjs', fix: true, maxWorkers: 2, timeoutMs: 10 });

    expect(mocks.processConfig).toHaveBeenCalledWith('./config.mjs');
    expect(mocks.PiscinaMock).toHaveBeenCalledWith(expect.objectContaining({
      filename: expect.stringContaining('master.worker.js'),
      maxThreads: 2,
    }));
    expect(mocks.poolRun).toHaveBeenCalledTimes(2);
    expect(mocks.poolRun).toHaveBeenCalledWith({ filePath: 'a.css', config: { configPath: '/abs/config.mjs', fix: true, cwd: undefined } });

    expect(out).toHaveLength(1);
    expect(out[0].filePath).toBe('a.css');

    await LintRunner.destroy();
    expect(mocks.poolDestroy).toHaveBeenCalled();
  });

  it('uses direct execution for small batches (files < maxWorkers)', async () => {
    const mocks = setupCommonMocks();
    mocks.masterLint.mockResolvedValue({
      filePath: 'a.css',
      lintResult: { filePath: 'a.css', messages: [], errorCount: 0, warningCount: 0, fixableErrorCount: 0, fixableWarningCount: 0, fatalErrorCount: 0, suppressedMessages: [], usedDeprecatedRules: [] }
    });

    const { LintRunner } = await mockAndImport(mocks);

    const out = await LintRunner.runLinting(['a.css'], {});

    expect(mocks.PiscinaMock).not.toHaveBeenCalled();
    expect(mocks.masterLint).toHaveBeenCalledTimes(1);
    expect(mocks.masterLint).toHaveBeenCalledWith({
      filePath: 'a.css',
      config: { configPath: '/abs/config.mjs', fix: undefined, cwd: undefined }
    });
    expect(mocks.resetESLintCache).toHaveBeenCalled();
    expect(out).toHaveLength(1);
    expect(out[0].filePath).toBe('a.css');
  });

  it('resets ESLint cache after direct execution', async () => {
    const mocks = setupCommonMocks();
    mocks.masterLint.mockResolvedValue({
      filePath: 'a.css',
      lintResult: { filePath: 'a.css', messages: [] }
    });

    const { LintRunner } = await mockAndImport(mocks);
    await LintRunner.runLinting(['a.css'], {});

    expect(mocks.resetESLintCache).toHaveBeenCalledTimes(1);
  });

  it('logs warning when direct execution fails for a file', async () => {
    const mocks = setupCommonMocks();
    mocks.masterLint.mockRejectedValue(new Error('parse error'));

    const { LintRunner } = await mockAndImport(mocks);

    const out = await LintRunner.runLinting(['a.css'], {});
    expect(out).toEqual([]);
    expect(mocks.warning).toHaveBeenCalled();
    expect(mocks.resetESLintCache).toHaveBeenCalled();
  });

  it('logs and handles when pool.run rejects for all files', async () => {
    const mocks = setupCommonMocks();
    mocks.poolRun.mockRejectedValue(new Error('boom'));

    const { LintRunner } = await mockAndImport(mocks);

    const out = await LintRunner.runLinting(['a.css'], { maxWorkers: 1 });
    expect(out).toEqual([]);
    expect(mocks.warning).toHaveBeenCalled();
  });

  it('skips results with errors and logs warnings', async () => {
    const mocks = setupCommonMocks();
    mocks.masterLint.mockResolvedValue({
      filePath: 'a.css',
      error: 'parse error',
      lintResult: null
    });

    const { LintRunner } = await mockAndImport(mocks);

    const out = await LintRunner.runLinting(['a.css'], {});
    expect(out).toEqual([]);
    expect(mocks.warning).toHaveBeenCalled();
  });

  it('returns empty array for empty file list', async () => {
    const mocks = setupCommonMocks();
    const { LintRunner } = await mockAndImport(mocks);

    const out = await LintRunner.runLinting([], {});
    expect(out).toEqual([]);
    expect(mocks.PiscinaMock).not.toHaveBeenCalled();
    expect(mocks.masterLint).not.toHaveBeenCalled();
  });

  it('defaults options when undefined', async () => {
    const mocks = setupCommonMocks();
    mocks.masterLint.mockResolvedValue({
      filePath: 'a.css',
      lintResult: { filePath: 'a.css', messages: [] }
    });

    const { LintRunner } = await mockAndImport(mocks);

    await LintRunner.runLinting(['a.css'], undefined as any);

    expect(mocks.PiscinaMock).not.toHaveBeenCalled();
    expect(mocks.masterLint).toHaveBeenCalledWith({
      filePath: 'a.css',
      config: { configPath: '/abs/config.mjs', fix: undefined, cwd: undefined }
    });
    expect(mocks.resetESLintCache).toHaveBeenCalled();
  });

  it('reuses pool across multiple runLinting calls', async () => {
    const mocks = setupCommonMocks();
    mocks.poolRun.mockResolvedValue({
      filePath: 'a.css',
      lintResult: { filePath: 'a.css', messages: [] }
    });

    const { LintRunner } = await mockAndImport(mocks);

    await LintRunner.runLinting(['a.css', 'b.css', 'c.css', 'd.css'], { maxWorkers: 4 });
    await LintRunner.runLinting(['e.css', 'f.css', 'g.css', 'h.css'], { maxWorkers: 4 });

    expect(mocks.PiscinaMock).toHaveBeenCalledTimes(1);
    expect(mocks.poolRun).toHaveBeenCalledTimes(8);

    await LintRunner.destroy();
    expect(mocks.poolDestroy).toHaveBeenCalledTimes(1);
  });

  it('destroy is safe to call when no pool exists', async () => {
    const mocks = setupCommonMocks();
    const { LintRunner } = await mockAndImport(mocks);

    await LintRunner.destroy();
    expect(mocks.poolDestroy).not.toHaveBeenCalled();
  });
});
