import { jest } from '@jest/globals';
import path from 'path';

describe('FileScanner branch coverage', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('handles single file path (has extension) and filters by extensions', async () => {
    const globby = jest
      .fn<(...args: any[]) => Promise<string[]>>()
      .mockResolvedValue([
        path.join(process.cwd(), 'a.css'),
        path.join(process.cwd(), 'a.txt'),
      ]);

    await jest.unstable_mockModule('globby', () => ({
      globby,
      isDynamicPattern: () => false,
    }));

    const access = jest
      .fn<(...args: any[]) => Promise<void>>()
      .mockResolvedValue(undefined);

    await jest.unstable_mockModule('fs', () => ({
      promises: { access, constants: { R_OK: 4 } },
      constants: { R_OK: 4 },
    }));

    const { FileScanner } = await import('../../src/services/file-scanner');

    const out = await FileScanner.scanFiles('some/file.css', {
      patterns: { extensions: ['css'], exclude: [] },
      gitignore: false,
      batchSize: 100,
    });

    expect(globby).toHaveBeenCalledWith('file.css', expect.objectContaining({ onlyFiles: true }));
    expect(out.filesCount).toBe(1);
    expect(out.batches).toHaveLength(1);
  });

  it('handles absolute single file path (has extension) and uses absolute cwd', async () => {
    const globby = jest
      .fn<(...args: any[]) => Promise<string[]>>()
      .mockResolvedValue([path.join(process.cwd(), 'a.css')]);

    await jest.unstable_mockModule('globby', () => ({
      globby,
      isDynamicPattern: () => false,
    }));

    const access = jest
      .fn<(...args: any[]) => Promise<void>>()
      .mockResolvedValue(undefined);

    await jest.unstable_mockModule('fs', () => ({
      promises: { access, constants: { R_OK: 4 } },
      constants: { R_OK: 4 },
    }));

    const { FileScanner } = await import('../../src/services/file-scanner');

    const absFile = path.join(process.cwd(), 'abs-file.css');
    const out = await FileScanner.scanFiles(absFile, {
      patterns: { extensions: ['css'], exclude: [] },
      gitignore: false,
    });

    // pattern should be basename and cwd should be dirname (absolute)
    expect(globby).toHaveBeenCalledWith('abs-file.css', expect.objectContaining({ cwd: process.cwd() }));
    expect(out.filesCount).toBe(1);
  });

  it('handles dynamic glob pattern with no directory portion (lastDirectoryIndex === -1)', async () => {
    const globby = jest
      .fn<(...args: any[]) => Promise<string[]>>()
      .mockResolvedValue([path.join(process.cwd(), 'a.css')]);

    await jest.unstable_mockModule('globby', () => ({
      globby,
      isDynamicPattern: () => true,
    }));

    const access = jest
      .fn<(...args: any[]) => Promise<void>>()
      .mockResolvedValue(undefined);

    await jest.unstable_mockModule('fs', () => ({
      promises: { access, constants: { R_OK: 4 } },
      constants: { R_OK: 4 },
    }));

    const { FileScanner } = await import('../../src/services/file-scanner');

    const out = await FileScanner.scanFiles('*.css', {
      patterns: { extensions: ['css'], exclude: [] },
      gitignore: false,
    });

    expect(out.filesCount).toBe(1);
  });

  it('handles dynamic glob pattern with directory portion (lastDirectoryIndex !== -1) and relative basePath', async () => {
    const globby = jest
      .fn<(...args: any[]) => Promise<string[]>>()
      .mockResolvedValue([path.join(process.cwd(), 'a.css')]);

    await jest.unstable_mockModule('globby', () => ({
      globby,
      isDynamicPattern: () => true,
    }));

    const access = jest
      .fn<(...args: any[]) => Promise<void>>()
      .mockResolvedValue(undefined);

    await jest.unstable_mockModule('fs', () => ({
      promises: { access, constants: { R_OK: 4 } },
      constants: { R_OK: 4 },
    }));

    const { FileScanner } = await import('../../src/services/file-scanner');

    const out = await FileScanner.scanFiles('rel/**/*.css', {
      patterns: { extensions: ['css'], exclude: [] },
      gitignore: false,
    });

    // cwd should be process.cwd()/rel
    expect(globby).toHaveBeenCalledWith('**/*.css', expect.objectContaining({ cwd: path.join(process.cwd(), 'rel') }));
    expect(out.filesCount).toBe(1);
  });

  it('handles dynamic glob pattern with directory portion and absolute basePath', async () => {
    const globby = jest
      .fn<(...args: any[]) => Promise<string[]>>()
      .mockResolvedValue([path.join(process.cwd(), 'a.css')]);

    await jest.unstable_mockModule('globby', () => ({
      globby,
      isDynamicPattern: () => true,
    }));

    const access = jest
      .fn<(...args: any[]) => Promise<void>>()
      .mockResolvedValue(undefined);

    await jest.unstable_mockModule('fs', () => ({
      promises: { access, constants: { R_OK: 4 } },
      constants: { R_OK: 4 },
    }));

    const { FileScanner } = await import('../../src/services/file-scanner');

    const out = await FileScanner.scanFiles('/abs/**/*.css', {
      patterns: { extensions: ['css'], exclude: [] },
      gitignore: false,
    });

    expect(globby).toHaveBeenCalledWith('**/*.css', expect.objectContaining({ cwd: '/abs' }));
    expect(out.filesCount).toBe(1);
  });

  it('skips inaccessible files and still returns batches', async () => {
    const globby = jest
      .fn<(...args: any[]) => Promise<string[]>>()
      .mockResolvedValue([
        path.join(process.cwd(), 'a.css'),
        path.join(process.cwd(), 'b.css'),
      ]);

    await jest.unstable_mockModule('globby', () => ({
      globby,
      isDynamicPattern: () => false,
    }));

    const access = jest
      .fn<(...args: any[]) => Promise<void>>()
      .mockImplementation(async (file: string) => {
        if (file.endsWith('b.css')) throw new Error('no access');
      });

    const warning = jest.fn();
    await jest.unstable_mockModule('../../src/utils/logger', () => ({
      Logger: { debug: jest.fn(), warning, error: jest.fn() },
    }));

    await jest.unstable_mockModule('fs', () => ({
      promises: { access, constants: { R_OK: 4 } },
      constants: { R_OK: 4 },
    }));

    const { FileScanner } = await import('../../src/services/file-scanner');

    const out = await FileScanner.scanFiles('src', {
      patterns: { extensions: ['css'], exclude: [] },
      gitignore: false,
      batchSize: 1,
    });

    expect(out.filesCount).toBe(1);
    expect(out.batches).toHaveLength(1);
    expect(warning).toHaveBeenCalled();
  });

  it('throws and logs on globby failure', async () => {
    const globby = jest
      .fn<(...args: any[]) => Promise<string[]>>()
      .mockRejectedValue(new Error('globby fail'));

    await jest.unstable_mockModule('globby', () => ({
      globby,
      isDynamicPattern: () => false,
    }));

    await jest.unstable_mockModule('fs', () => ({
      promises: { access: jest.fn(), constants: { R_OK: 4 } },
      constants: { R_OK: 4 },
    }));

    const error = jest.fn();
    await jest.unstable_mockModule('../../src/utils/logger', () => ({
      Logger: { debug: jest.fn(), warning: jest.fn(), error },
    }));

    const { FileScanner } = await import('../../src/services/file-scanner');

    await expect(
      FileScanner.scanFiles('src', {
        patterns: { extensions: ['css'], exclude: [] },
        gitignore: false,
      })
    ).rejects.toThrow('globby fail');

    expect(error).toHaveBeenCalled();
  });
});
