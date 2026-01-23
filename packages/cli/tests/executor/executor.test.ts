/**
 * Tests for executor module functionality
 */

import { jest } from '@jest/globals';
import { Readable } from 'stream';

describe('Executor functions', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe('lint', () => {
    it('scans style + component files, logs counts, and runs linting with combined batches', async () => {
      const scanFiles = jest
        .fn<(...args: any[]) => Promise<any>>()
        .mockResolvedValueOnce({ filesCount: 2, batches: [['a.css'], ['b.css']] })
        .mockResolvedValueOnce({ filesCount: 1, batches: [['c.html']] });

      const runLinting = jest
        .fn<(...args: any[]) => Promise<any[]>>()
        .mockResolvedValue([{ filePath: 'a.css', messages: [] }]);

      const info = jest.fn();
      const debug = jest.fn();
      const error = jest.fn();

      await jest.unstable_mockModule('../../src/services/file-scanner', () => ({
        FileScanner: { scanFiles },
      }));

      await jest.unstable_mockModule('../../src/services/lint-runner', () => ({
        LintRunner: { runLinting },
      }));

      await jest.unstable_mockModule('../../src/utils/logger', () => ({
        Logger: { info, debug, error },
      }));

      await jest.unstable_mockModule('../../src/utils/config-utils', () => ({
        normalizeCliOptions: (cfg: any, defaults: any) => ({
          ...defaults,
          ...cfg,
          directory: cfg.directory ?? process.cwd(),
        }),
      }));

      await jest.unstable_mockModule('../../src/services/config.resolver', () => ({
        DEFAULT_ESLINT_CONFIG_PATH: '/abs/default-eslint.mjs',
        getRuleDescription: () => 'desc',
        LINTER_CLI_VERSION: '0.0.0',
      }));

      const { lint } = await import('../../src/executor');

      const results = await lint({ directory: './src', fix: true } as any);

      expect(results).toEqual([{ filePath: 'a.css', messages: [] }]);
      expect(scanFiles).toHaveBeenCalledTimes(2);
      expect(info).toHaveBeenCalledWith('Total style files: 2');
      expect(info).toHaveBeenCalledWith('Total component files: 1');
      expect(runLinting).toHaveBeenCalledWith(
        [['a.css'], ['b.css'], ['c.html']],
        { fix: true, configPath: '/abs/default-eslint.mjs' }
      );
      expect(debug).toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();
    });

    it('does not log counts when both file counts are zero', async () => {
      const scanFiles = jest
        .fn<(...args: any[]) => Promise<any>>()
        .mockResolvedValueOnce({ filesCount: 0, batches: [] })
        .mockResolvedValueOnce({ filesCount: 0, batches: [] });

      const runLinting = jest
        .fn<(...args: any[]) => Promise<any[]>>()
        .mockResolvedValue([]);

      const info = jest.fn();

      await jest.unstable_mockModule('../../src/services/file-scanner', () => ({
        FileScanner: { scanFiles },
      }));

      await jest.unstable_mockModule('../../src/services/lint-runner', () => ({
        LintRunner: { runLinting },
      }));

      await jest.unstable_mockModule('../../src/utils/logger', () => ({
        Logger: { info, debug: jest.fn(), error: jest.fn() },
      }));

      await jest.unstable_mockModule('../../src/utils/config-utils', () => ({
        normalizeCliOptions: (cfg: any, defaults: any) => ({
          ...defaults,
          ...cfg,
          directory: cfg.directory ?? process.cwd(),
        }),
      }));

      await jest.unstable_mockModule('../../src/services/config.resolver', () => ({
        DEFAULT_ESLINT_CONFIG_PATH: '/abs/default-eslint.mjs',
        getRuleDescription: () => 'desc',
        LINTER_CLI_VERSION: '0.0.0',
      }));

      const { lint } = await import('../../src/executor');
      await lint({ directory: './src', fix: false } as any);
      expect(info).not.toHaveBeenCalled();
      expect(runLinting).toHaveBeenCalledWith([], { fix: false, configPath: '/abs/default-eslint.mjs' });
    });

    it('wraps errors with context and logs', async () => {
      const scanFiles = jest.fn<(...args: any[]) => Promise<any>>().mockRejectedValue(new Error('scan failed'));
      const error = jest.fn();

      await jest.unstable_mockModule('../../src/services/file-scanner', () => ({
        FileScanner: { scanFiles },
      }));

      await jest.unstable_mockModule('../../src/services/lint-runner', () => ({
        LintRunner: { runLinting: jest.fn() },
      }));

      await jest.unstable_mockModule('../../src/utils/logger', () => ({
        Logger: { info: jest.fn(), debug: jest.fn(), error },
      }));

      await jest.unstable_mockModule('../../src/utils/config-utils', () => ({
        normalizeCliOptions: (cfg: any, defaults: any) => ({
          ...defaults,
          ...cfg,
          directory: cfg.directory ?? process.cwd(),
        }),
      }));

      await jest.unstable_mockModule('../../src/services/config.resolver', () => ({
        DEFAULT_ESLINT_CONFIG_PATH: '/abs/default-eslint.mjs',
        getRuleDescription: () => 'desc',
        LINTER_CLI_VERSION: '0.0.0',
      }));

      const { lint } = await import('../../src/executor');

      await expect(lint({ directory: './src' } as any)).rejects.toThrow('Linting failed: scan failed');
      expect(error).toHaveBeenCalledWith('Linting failed: scan failed');
    });
  });

  describe('lintFiles', () => {
    it('batches file list and runs linting with cwd from normalized config', async () => {
      const createBatches = jest.fn().mockReturnValue([['a.css', 'b.css'], ['c.html']]);
      const runLinting = jest
        .fn<(...args: any[]) => Promise<any[]>>()
        .mockResolvedValue([{ filePath: 'a.css', messages: [] }]);

      const debug = jest.fn();
      const error = jest.fn();

      await jest.unstable_mockModule('../../src/services/file-scanner', () => ({
        FileScanner: { createBatches, DEFAULT_BATCH_SIZE: 2 },
      }));

      await jest.unstable_mockModule('../../src/services/lint-runner', () => ({
        LintRunner: { runLinting },
      }));

      await jest.unstable_mockModule('../../src/utils/logger', () => ({
        Logger: { info: jest.fn(), debug, error },
      }));

      await jest.unstable_mockModule('../../src/utils/config-utils', () => ({
        normalizeCliOptions: (cfg: any, defaults: any) => ({
          ...defaults,
          ...cfg,
          directory: cfg.directory ?? process.cwd(),
        }),
      }));

      await jest.unstable_mockModule('../../src/services/config.resolver', () => ({
        DEFAULT_ESLINT_CONFIG_PATH: '/abs/default-eslint.mjs',
        getRuleDescription: () => 'desc',
        LINTER_CLI_VERSION: '0.0.0',
      }));

      const { lintFiles } = await import('../../src/executor');

      const results = await lintFiles(
        ['a.css', 'b.css', 'c.html'],
        { directory: '/tmp/project', fix: true } as any
      );

      expect(results).toEqual([{ filePath: 'a.css', messages: [] }]);
      expect(createBatches).toHaveBeenCalledWith(['a.css', 'b.css', 'c.html'], 2);
      expect(runLinting).toHaveBeenCalledWith([
        ['a.css', 'b.css'],
        ['c.html'],
      ], {
        fix: true,
        configPath: '/abs/default-eslint.mjs',
        cwd: '/tmp/project',
      });
      expect(debug).toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();
    });

    it('wraps errors with context and logs', async () => {
      const createBatches = jest.fn().mockReturnValue([['a.css']]);
      const runLinting = jest
        .fn<(...args: any[]) => Promise<any[]>>()
        .mockRejectedValue(new Error('lint failed'));

      const error = jest.fn();

      await jest.unstable_mockModule('../../src/services/file-scanner', () => ({
        FileScanner: { createBatches, DEFAULT_BATCH_SIZE: 100 },
      }));

      await jest.unstable_mockModule('../../src/services/lint-runner', () => ({
        LintRunner: { runLinting },
      }));

      await jest.unstable_mockModule('../../src/utils/logger', () => ({
        Logger: { info: jest.fn(), debug: jest.fn(), error },
      }));

      await jest.unstable_mockModule('../../src/utils/config-utils', () => ({
        normalizeCliOptions: (cfg: any, defaults: any) => ({
          ...defaults,
          ...cfg,
          directory: cfg.directory ?? process.cwd(),
        }),
      }));

      await jest.unstable_mockModule('../../src/services/config.resolver', () => ({
        DEFAULT_ESLINT_CONFIG_PATH: '/abs/default-eslint.mjs',
        getRuleDescription: () => 'desc',
        LINTER_CLI_VERSION: '0.0.0',
      }));

      const { lintFiles } = await import('../../src/executor');

      await expect(lintFiles(['a.css'], { directory: './src' } as any)).rejects.toThrow(
        'Linting failed: lint failed'
      );
      expect(error).toHaveBeenCalledWith('Linting failed: lint failed');
    });
  });

  describe('report', () => {
    it('defaults format to sarif and calls lint when results are not provided', async () => {
      const sarifStream = new Readable({ read() {} });

      const scanFiles = jest
        .fn<(...args: any[]) => Promise<any>>()
        .mockResolvedValueOnce({ filesCount: 0, batches: [] })
        .mockResolvedValueOnce({ filesCount: 0, batches: [] });

      const runLinting = jest
        .fn<(...args: any[]) => Promise<any[]>>()
        .mockResolvedValue([]);

      await jest.unstable_mockModule('../../src/services/file-scanner', () => ({
        FileScanner: { scanFiles },
      }));

      await jest.unstable_mockModule('../../src/services/lint-runner', () => ({
        LintRunner: { runLinting },
      }));

      await jest.unstable_mockModule('../../src/utils/logger', () => ({
        Logger: { debug: jest.fn(), error: jest.fn(), info: jest.fn() },
      }));

      await jest.unstable_mockModule('../../src/utils/config-utils', () => ({
        normalizeCliOptions: (cfg: any, defaults: any) => ({
          ...defaults,
          ...cfg,
          directory: cfg.directory ?? process.cwd(),
        }),
      }));

      const generateSarifReportStream = jest
        .fn<(...args: any[]) => Readable>()
        .mockReturnValue(sarifStream);

      await jest.unstable_mockModule('../../src/services/report-generator', () => ({
        ReportGenerator: { generateSarifReportStream },
        CsvReportGenerator: { generateCsvString: jest.fn() },
      }));

      await jest.unstable_mockModule('../../src/services/config.resolver', () => ({
        DEFAULT_ESLINT_CONFIG_PATH: '/abs/default-eslint.mjs',
        getRuleDescription: () => 'desc',
        LINTER_CLI_VERSION: '9.9.9',
      }));

      const { report } = await import('../../src/executor');

      const out = await report({ directory: './src' } as any);
      expect(out).toBe(sarifStream);
      expect(scanFiles).toHaveBeenCalledTimes(2);
      expect(runLinting).toHaveBeenCalledWith([], { fix: undefined, configPath: '/abs/default-eslint.mjs' });
      expect(generateSarifReportStream).toHaveBeenCalledWith([], { toolName: 'slds-linter', toolVersion: '9.9.9' });
    });

    it('generates sarif report stream by calling ReportGenerator when format is sarif', async () => {
      const sarifStream = new Readable({ read() {} });

      await jest.unstable_mockModule('../../src/utils/logger', () => ({
        Logger: { debug: jest.fn(), error: jest.fn() },
      }));

      await jest.unstable_mockModule('../../src/utils/config-utils', () => ({
        normalizeCliOptions: (cfg: any, defaults: any) => ({
          ...defaults,
          ...cfg,
          directory: cfg.directory ?? process.cwd(),
        }),
      }));

      await jest.unstable_mockModule('../../src/services/config.resolver', () => ({
        DEFAULT_ESLINT_CONFIG_PATH: '/abs/default-eslint.mjs',
        getRuleDescription: () => 'desc',
        LINTER_CLI_VERSION: '9.9.9',
      }));

      const generateSarifReportStream = jest
        .fn<(...args: any[]) => Readable>()
        .mockReturnValue(sarifStream);

      await jest.unstable_mockModule('../../src/services/report-generator', () => ({
        ReportGenerator: { generateSarifReportStream },
        CsvReportGenerator: { generateCsvString: jest.fn() },
      }));

      const { report } = await import('../../src/executor');

      const out = await report({ directory: './src', format: 'sarif' } as any, []);
      expect(out).toBe(sarifStream);
      expect(generateSarifReportStream).toHaveBeenCalledWith([], { toolName: 'slds-linter', toolVersion: '9.9.9' });
    });

    it('generates csv stream when format is csv', async () => {
      await jest.unstable_mockModule('../../src/utils/logger', () => ({
        Logger: { debug: jest.fn(), error: jest.fn() },
      }));

      await jest.unstable_mockModule('../../src/utils/config-utils', () => ({
        normalizeCliOptions: (cfg: any, defaults: any) => ({
          ...defaults,
          ...cfg,
          directory: cfg.directory ?? process.cwd(),
        }),
      }));

      await jest.unstable_mockModule('../../src/services/config.resolver', () => ({
        DEFAULT_ESLINT_CONFIG_PATH: '/abs/default-eslint.mjs',
        getRuleDescription: () => 'desc',
        LINTER_CLI_VERSION: '9.9.9',
      }));

      await jest.unstable_mockModule('../../src/services/report-generator', () => ({
        ReportGenerator: { generateSarifReportStream: jest.fn() },
        CsvReportGenerator: { generateCsvString: jest.fn(() => 'a,b,c') },
      }));

      const { report } = await import('../../src/executor');
      const stream = await report({ directory: './src', format: 'csv' } as any, []);
      expect(stream).toBeInstanceOf(Readable);
    });

    it('throws unsupported format and wraps errors with context', async () => {
      const error = jest.fn();

      await jest.unstable_mockModule('../../src/utils/logger', () => ({
        Logger: { debug: jest.fn(), error },
      }));

      await jest.unstable_mockModule('../../src/utils/config-utils', () => ({
        normalizeCliOptions: (cfg: any, defaults: any) => ({
          ...defaults,
          ...cfg,
          directory: cfg.directory ?? process.cwd(),
        }),
      }));

      await jest.unstable_mockModule('../../src/services/config.resolver', () => ({
        DEFAULT_ESLINT_CONFIG_PATH: '/abs/default-eslint.mjs',
        getRuleDescription: () => 'desc',
        LINTER_CLI_VERSION: '9.9.9',
      }));

      await jest.unstable_mockModule('../../src/services/report-generator', () => ({
        ReportGenerator: { generateSarifReportStream: jest.fn() },
        CsvReportGenerator: { generateCsvString: jest.fn(() => 'a,b,c') },
      }));

      const { report } = await import('../../src/executor');

      await expect(report({ directory: './src', format: 'nope' } as any, [])).rejects.toThrow(
        'Report generation failed: Unsupported format: nope'
      );
      expect(error).toHaveBeenCalledWith('Unsupported format: nope');
    });
  });
});
