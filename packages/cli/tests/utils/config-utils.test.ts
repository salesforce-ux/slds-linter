import { jest } from '@jest/globals';

describe('config-utils', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('normalizeAndValidatePath defaults to cwd when no path provided', async () => {
    const debug = jest.fn();

    await jest.unstable_mockModule('../../src/utils/logger', () => ({
      Logger: { debug, error: jest.fn() },
    }));

    const { normalizeAndValidatePath } = await import('../../src/utils/config-utils');

    expect(normalizeAndValidatePath(undefined)).toBe(process.cwd());
    expect(debug).toHaveBeenCalled();
  });

  it('normalizeAndValidatePath resolves and validates path, and throws with logging when inaccessible', async () => {
    const error = jest.fn();
    const debug = jest.fn();

    await jest.unstable_mockModule('../../src/utils/logger', () => ({
      Logger: { debug, error },
    }));

    const accessSync = jest.fn();
    await jest.unstable_mockModule('fs', () => ({
      accessSync,
    }));

    const { normalizeAndValidatePath } = await import('../../src/utils/config-utils');

    accessSync.mockImplementationOnce(() => undefined);
    const out = normalizeAndValidatePath('./some/path');
    expect(out).toContain('some');

    accessSync.mockImplementationOnce(() => {
      throw new Error('no');
    });

    expect(() => normalizeAndValidatePath('./bad')).toThrow('Invalid path: ./bad');
    expect(error).toHaveBeenCalledWith('Invalid path: ./bad');
  });

  it('normalizeDirectoryPath handles undefined, glob patterns, and normal paths', async () => {
    const debug = jest.fn();

    await jest.unstable_mockModule('../../src/utils/logger', () => ({
      Logger: { debug },
    }));

    await jest.unstable_mockModule('globby', () => ({
      isDynamicPattern: (s: string) => s.includes('*'),
    }));

    const { normalizeDirectoryPath } = await import('../../src/utils/config-utils');

    expect(normalizeDirectoryPath(undefined)).toBe(process.cwd());
    expect(normalizeDirectoryPath('src/**/*.css')).toBe('src/**/*.css');

    const resolved = normalizeDirectoryPath('./src');
    expect(resolved).toContain('src');
  });

  it('normalizeCliOptions applies defaults, user options, and normalizes directory', async () => {
    await jest.unstable_mockModule('../../src/utils/editorLinkUtil', () => ({
      detectCurrentEditor: () => 'vscode',
    }));

    await jest.unstable_mockModule('globby', () => ({
      isDynamicPattern: () => false,
    }));

    await jest.unstable_mockModule('../../src/utils/logger', () => ({
      Logger: { debug: jest.fn(), error: jest.fn() },
    }));

    const { normalizeCliOptions } = await import('../../src/utils/config-utils');

    const normalized = normalizeCliOptions(
      { directory: './x', fix: true } as any,
      { format: 'csv' } as any
    );

    expect(normalized.fix).toBe(true);
    expect(normalized.format).toBe('csv');
    expect(normalized.editor).toBe('vscode');
    expect(normalized.directory).toContain('x');
  });

  it('normalizeCliOptions preserves directory when it is a glob pattern', async () => {
    await jest.unstable_mockModule('../../src/utils/editorLinkUtil', () => ({
      detectCurrentEditor: () => 'vscode',
    }));

    await jest.unstable_mockModule('globby', () => ({
      isDynamicPattern: () => true,
    }));

    await jest.unstable_mockModule('../../src/utils/logger', () => ({
      Logger: { debug: jest.fn(), error: jest.fn() },
    }));

    const { normalizeCliOptions } = await import('../../src/utils/config-utils');

    const normalized = normalizeCliOptions(
      { directory: 'src/**/*.css' } as any,
      {} as any
    );

    expect(normalized.directory).toBe('src/**/*.css');
  });

  it('normalizeCliOptions works when defaultOptions is omitted', async () => {
    await jest.unstable_mockModule('../../src/utils/editorLinkUtil', () => ({
      detectCurrentEditor: () => 'vscode',
    }));

    await jest.unstable_mockModule('globby', () => ({
      isDynamicPattern: () => false,
    }));

    await jest.unstable_mockModule('../../src/utils/logger', () => ({
      Logger: { debug: jest.fn(), error: jest.fn() },
    }));

    const { normalizeCliOptions } = await import('../../src/utils/config-utils');
    const normalized = normalizeCliOptions({ directory: './y' } as any);
    expect(normalized.directory).toContain('y');
  });
});
