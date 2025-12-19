import { jest } from '@jest/globals';

describe('LintRunner', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('passes worker script and config to BatchProcessor and returns normalized results', async () => {
    const processBatches = jest
      .fn<(...args: any[]) => Promise<any[]>>()
      .mockResolvedValue([
      {
        success: true,
        results: [
          {
            filePath: 'a.css',
            lintResult: { filePath: 'a.css', messages: [], errorCount: 0, warningCount: 0, fixableErrorCount: 0, fixableWarningCount: 0, fatalErrorCount: 0, suppressedMessages: [], usedDeprecatedRules: [] }
          },
          {
            filePath: 'b.css',
            error: 'bad',
            lintResult: null
          }
        ]
      },
      {
        success: false,
        error: 'batch failed',
        results: []
      }
    ]);

    const processConfig = jest
      .fn<(...args: any[]) => Promise<string | undefined>>()
      .mockResolvedValue('/abs/config.mjs');
    const resolveDirName = jest.fn().mockReturnValue('/abs/dir');

    await jest.unstable_mockModule('../../src/services/batch-processor', () => ({
      BatchProcessor: { processBatches },
    }));

    await jest.unstable_mockModule('../../src/services/config-loader', () => ({
      ConfigLoader: { processConfig },
    }));

    await jest.unstable_mockModule('../../src/utils/nodeVersionUtil', () => ({
      resolveDirName,
    }));

    await jest.unstable_mockModule('../../src/utils/logger', () => ({
      Logger: { error: jest.fn(), warning: jest.fn() },
    }));

    const { LintRunner } = await import('../../src/services/lint-runner');

    const out = await LintRunner.runLinting([['a.css']], { configPath: './config.mjs', fix: true, maxWorkers: 2, timeoutMs: 10 });

    expect(processConfig).toHaveBeenCalledWith('./config.mjs');
    expect(processBatches).toHaveBeenCalledWith(
      [['a.css']],
      expect.stringContaining('eslint.worker.js'),
      { configPath: '/abs/config.mjs', fix: true },
      { maxWorkers: 2, timeoutMs: 10 }
    );

    expect(out).toHaveLength(1);
    expect(out[0].filePath).toBe('a.css');
  });

  it('logs and rethrows on BatchProcessor failure', async () => {
    const processBatches = jest
      .fn<(...args: any[]) => Promise<any[]>>()
      .mockRejectedValue(new Error('boom'));

    await jest.unstable_mockModule('../../src/services/batch-processor', () => ({
      BatchProcessor: { processBatches },
    }));

    await jest.unstable_mockModule('../../src/services/config-loader', () => ({
      ConfigLoader: { processConfig: jest.fn<(...args: any[]) => Promise<string | undefined>>().mockResolvedValue(undefined) },
    }));

    await jest.unstable_mockModule('../../src/utils/nodeVersionUtil', () => ({
      resolveDirName: jest.fn().mockReturnValue('/abs/dir'),
    }));

    const error = jest.fn();
    await jest.unstable_mockModule('../../src/utils/logger', () => ({
      Logger: { error, warning: jest.fn() },
    }));

    const { LintRunner } = await import('../../src/services/lint-runner');

    await expect(LintRunner.runLinting([['a.css']], {})).rejects.toThrow('boom');
    expect(error).toHaveBeenCalled();
  });

  it('skips batches with missing results even if marked successful', async () => {
    const processBatches = jest
      .fn<(...args: any[]) => Promise<any[]>>()
      .mockResolvedValue([
        { success: true, results: undefined },
      ]);

    await jest.unstable_mockModule('../../src/services/batch-processor', () => ({
      BatchProcessor: { processBatches },
    }));

    await jest.unstable_mockModule('../../src/services/config-loader', () => ({
      ConfigLoader: { processConfig: jest.fn<(...args: any[]) => Promise<string | undefined>>().mockResolvedValue(undefined) },
    }));

    await jest.unstable_mockModule('../../src/utils/nodeVersionUtil', () => ({
      resolveDirName: jest.fn().mockReturnValue('/abs/dir'),
    }));

    const warning = jest.fn();
    await jest.unstable_mockModule('../../src/utils/logger', () => ({
      Logger: { error: jest.fn(), warning },
    }));

    const { LintRunner } = await import('../../src/services/lint-runner');

    const out = await LintRunner.runLinting([['a.css']], {});
    expect(out).toEqual([]);
    expect(warning).toHaveBeenCalled();
  });

  it('defaults options when undefined', async () => {
    const processBatches = jest
      .fn<(...args: any[]) => Promise<any[]>>()
      .mockResolvedValue([{ success: true, results: [] }]);

    await jest.unstable_mockModule('../../src/services/batch-processor', () => ({
      BatchProcessor: { processBatches },
    }));

    await jest.unstable_mockModule('../../src/services/config-loader', () => ({
      ConfigLoader: { processConfig: jest.fn<(...args: any[]) => Promise<string | undefined>>().mockResolvedValue(undefined) },
    }));

    await jest.unstable_mockModule('../../src/utils/nodeVersionUtil', () => ({
      resolveDirName: jest.fn().mockReturnValue('/abs/dir'),
    }));

    await jest.unstable_mockModule('../../src/utils/logger', () => ({
      Logger: { error: jest.fn(), warning: jest.fn() },
    }));

    const { LintRunner } = await import('../../src/services/lint-runner');

    await expect(LintRunner.runLinting([['a.css']], undefined as any)).resolves.toEqual([]);
    expect(processBatches).toHaveBeenCalledWith(
      [['a.css']],
      expect.any(String),
      { configPath: undefined, fix: undefined },
      { maxWorkers: undefined, timeoutMs: undefined }
    );
  });
});
