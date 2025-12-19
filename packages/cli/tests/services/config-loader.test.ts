import { jest } from '@jest/globals';
import path from 'path';

describe('ConfigLoader.processConfig', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('returns input path unchanged when not .mjs', async () => {
    const { ConfigLoader } = await import('../../src/services/config-loader');
    await expect(ConfigLoader.processConfig('foo.js')).resolves.toBe('foo.js');
    await expect(ConfigLoader.processConfig(undefined)).resolves.toBeUndefined();
  });

  it('returns bundled eslint.config.mjs as-is (absolute path)', async () => {
    const { ConfigLoader } = await import('../../src/services/config-loader');

    const bundled = path.join(process.cwd(), 'node_modules', 'eslint-plugin-slds', 'eslint.config.mjs');
    const out = await ConfigLoader.processConfig(bundled);
    expect(out).toContain('eslint.config.mjs');
  });

  it('uses config as-is when dependencies are installed (non-win32)', async () => {
    const readFile = jest.fn<(...args: any[]) => Promise<string>>();
    const writeFile = jest.fn<(...args: any[]) => Promise<void>>();

    await jest.unstable_mockModule('fs/promises', () => ({
      readFile,
      writeFile,
    }));

    await jest.unstable_mockModule('os', () => ({
      tmpdir: () => '/tmp',
      platform: () => 'darwin',
    }));

    await jest.unstable_mockModule('module', () => ({
      createRequire: () => {
        const r: any = () => {};
        r.resolve = () => '/abs/resolved.js';
        return r;
      }
    }));

    const { ConfigLoader } = await import('../../src/services/config-loader');

    const out = await ConfigLoader.processConfig('./my.config.mjs');

    expect(out).toEqual(path.resolve('./my.config.mjs'));
    expect(readFile).not.toHaveBeenCalled();
    expect(writeFile).not.toHaveBeenCalled();
  });

  it('rewrites imports to bundled deps when dependencies are not installed', async () => {
    const readFile = jest
      .fn<(...args: any[]) => Promise<string>>()
      .mockResolvedValue(
      "import plugin from '@salesforce-ux/eslint-plugin-slds'\n" +
      "import { configs } from 'eslint/config'\n" +
      "import css from '@eslint/css'\n"
    );
    const writeFile = jest
      .fn<(...args: any[]) => Promise<void>>()
      .mockResolvedValue(undefined);

    await jest.unstable_mockModule('fs/promises', () => ({
      readFile,
      writeFile,
    }));

    await jest.unstable_mockModule('os', () => ({
      tmpdir: () => '/tmp',
      platform: () => 'darwin',
    }));

    await jest.unstable_mockModule('module', () => ({
      createRequire: () => {
        const r: any = () => {};
        let call = 0;
        r.resolve = (id: string) => {
          call += 1;
          if (id === '@salesforce-ux/eslint-plugin-slds') return '/bundled/plugin/index.js';
          if (id === 'eslint/config') return '/bundled/eslint/config.js';
          if (id === '@eslint/css') return '/bundled/css/dist/cjs/index.cjs';
          // first 3 resolves are isPackageInstalled checks -> throw
          if (call <= 3) throw new Error('not installed');
          return '/unknown';
        };
        return r;
      }
    }));

    const { ConfigLoader } = await import('../../src/services/config-loader');

    const out = await ConfigLoader.processConfig('./my.config.mjs');

    expect(out).toMatch(/^\/tmp\/slds-config-\d+\.mjs$/);
    expect(readFile).toHaveBeenCalledTimes(1);
    expect(writeFile).toHaveBeenCalledTimes(1);

    const rewritten = writeFile.mock.calls[0][1] as string;
    expect(rewritten).toContain("import plugin from '/bundled/plugin/index.js'");
    expect(rewritten).toContain("import { configs } from '/bundled/eslint/config.js'");
    expect(rewritten).toContain("import css from '/bundled/css/dist/esm/index.js'");
  });

  it('returns file:// URL on win32 when using config as-is and when writing temp config', async () => {
    const readFile = jest
      .fn<(...args: any[]) => Promise<string>>()
      .mockResolvedValue("import plugin from '@salesforce-ux/eslint-plugin-slds'\n");
    const writeFile = jest
      .fn<(...args: any[]) => Promise<void>>()
      .mockResolvedValue(undefined);

    await jest.unstable_mockModule('fs/promises', () => ({
      readFile,
      writeFile,
    }));

    await jest.unstable_mockModule('os', () => ({
      tmpdir: () => 'C:/tmp',
      platform: () => 'win32',
    }));

    await jest.unstable_mockModule('module', () => ({
      createRequire: () => {
        const r: any = () => {};
        let call = 0;
        r.resolve = (id: string) => {
          call += 1;
          if (id === '@salesforce-ux/eslint-plugin-slds') return 'C:/bundled/plugin/index.js';
          if (id === 'eslint/config') return 'C:/bundled/eslint/config.js';
          if (id === '@eslint/css') return 'C:/bundled/css/dist/cjs/index.cjs';
          if (call <= 3) throw new Error('not installed');
          return 'C:/unknown';
        };
        return r;
      }
    }));

    const { ConfigLoader } = await import('../../src/services/config-loader');

    const out = await ConfigLoader.processConfig('./my.config.mjs');
    expect(out).toMatch(/^file:\/\//);
    expect(writeFile).toHaveBeenCalledTimes(1);
  });
});
