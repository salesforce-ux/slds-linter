import { jest } from '@jest/globals';
import { Command } from 'commander';
import { constants } from 'fs';

describe('emit command', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const sourceConfig = [
    'import { defineConfig } from "eslint/config";',
    'import { sldsCssPlugin } from "@salesforce-ux/eslint-plugin-slds";',
    '',
    'export default defineConfig([',
    '  {',
    '    plugins: {',
    '      ...sldsCssPlugin()',
    '    },',
    '    extends: ["@salesforce-ux/slds/flat/recommended"],',
    '    rules: { "custom/existing-rule": "warn" },',
    '    customSetting: true',
    '  },',
    ']);',
    '',
  ].join('\n');

  async function emitConfig(options: {
    targetExists: boolean;
    configError?: Error;
    accessError?: NodeJS.ErrnoException;
    copyError?: NodeJS.ErrnoException;
  }): Promise<{
    config: string;
    readFile: jest.Mock;
    writeFile: jest.Mock;
    copyFile: jest.Mock;
    rename: jest.Mock;
    rm: jest.Mock;
    loggerInfo: jest.Mock;
    loggerError: jest.Mock;
  }> {
    const readFile = jest.fn<(...args: any[]) => Promise<string>>().mockResolvedValue(sourceConfig);
    const writeFile = jest.fn<(...args: any[]) => Promise<void>>().mockResolvedValue(undefined);
    const copyFile = jest.fn<(...args: any[]) => Promise<void>>();
    if (options.accessError) copyFile.mockRejectedValue(options.accessError);
    else if (options.copyError) copyFile.mockRejectedValue(options.copyError);
    else if (!options.targetExists) copyFile.mockRejectedValue(Object.assign(new Error('missing'), { code: 'ENOENT' }));
    else copyFile.mockResolvedValue(undefined);
    const rename = jest.fn<(...args: any[]) => Promise<void>>().mockResolvedValue(undefined);
    const rm = jest.fn<(...args: any[]) => Promise<void>>().mockResolvedValue(undefined);
    const loggerInfo = jest.fn();
    const loggerError = jest.fn();
    if (options.configError || options.accessError || options.copyError) {
      jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    }

    await jest.unstable_mockModule('fs/promises', () => ({ copyFile, readFile, rename, rm, writeFile }));
    await jest.unstable_mockModule('../../src/services/config.resolver', () => ({
      EMIT_ESLINT_CONFIG_PATH: '/package/eslint.config.mjs',
    }));
    await jest.unstable_mockModule('@salesforce-ux/eslint-plugin-slds', () => ({
      default: {
        configs: options.configError ? new Proxy({}, {
          get() {
            throw options.configError;
          },
        }) : {
          'flat/recommended': [{
            rules: {
              '@salesforce-ux/slds/existing-rule': 'error',
              '@salesforce-ux/slds/foundation-options': ['warn', { allow: ['token'] }],
            },
          }],
        },
      },
    }));
    await jest.unstable_mockModule('@salesforce-ux/eslint-plugin-react-slds', () => ({
      default: {
        configs: {
          recommended: [{
            rules: {
              '@salesforce-ux/slds/react-existing-rule': 'warn',
              '@salesforce-ux/slds/react-options': ['error', { reportNumericValue: 'hasReplacement' }],
            },
          }],
        },
      },
    }));
    await jest.unstable_mockModule('../../src/utils/config-utils', () => ({
      normalizeCliOptions: (options: any, defaults: any) => ({
        ...defaults,
        ...options,
        directory: options.directory || '/project',
      }),
    }));
    await jest.unstable_mockModule('../../src/utils/logger', () => ({
      Logger: { info: loggerInfo, success: jest.fn(), error: loggerError },
    }));

    const { registerEmitCommand } = await import('../../src/commands/emit');
    const program = new Command();
    program.exitOverride();
    registerEmitCommand(program);
    await program.parseAsync(['node', 'test', 'emit', '--directory', '/project']);

    return {
      config: writeFile.mock.calls[0]?.[1],
      readFile,
      writeFile,
      copyFile,
      rename,
      rm,
      loggerInfo,
      loggerError,
    };
  }

  it('emits the packaged config without making a backup when the target does not exist', async () => {
    const { config, copyFile, readFile, rename, writeFile } = await emitConfig({ targetExists: false });

    expect(readFile).toHaveBeenCalledWith('/package/eslint.config.mjs', 'utf8');
    expect(writeFile).toHaveBeenCalledWith(expect.stringMatching(/^\/project\/\.eslint\.config\.mjs\..+\.tmp$/), config, {
      encoding: 'utf8',
      flag: 'wx',
      mode: 0o600,
    });
    expect(copyFile).toHaveBeenCalledWith(
      '/project/eslint.config.mjs',
      '/project/eslint.config.backup.mjs',
      constants.COPYFILE_EXCL
    );
    expect(rename).toHaveBeenCalledWith(writeFile.mock.calls[0][0], '/project/eslint.config.mjs');
    expect(config).toContain('import reactSldsPlugin from "@salesforce-ux/eslint-plugin-react-slds";');
    expect(config).toContain('...reactSldsPlugin.configs.recommended');
  });

  it('backs up an existing target and replaces it with a fresh generated config', async () => {
    const { config, copyFile, loggerInfo, readFile, rename, writeFile } = await emitConfig({ targetExists: true });

    expect(readFile).toHaveBeenCalledWith('/package/eslint.config.mjs', 'utf8');
    expect(copyFile).toHaveBeenCalledWith(
      '/project/eslint.config.mjs',
      '/project/eslint.config.backup.mjs',
      constants.COPYFILE_EXCL
    );
    expect(rename).toHaveBeenCalledWith(writeFile.mock.calls[0][0], '/project/eslint.config.mjs');
    expect(loggerInfo).toHaveBeenCalledWith(expect.stringContaining('/project/eslint.config.backup.mjs'));
    expect(config).toContain('"@salesforce-ux/slds/foundation-options"');
  });

  it('preserves complete editable rule options for both plugins', async () => {
    const { config } = await emitConfig({ targetExists: false });

    expect(config).toContain('"@salesforce-ux/slds/foundation-options": [');
    expect(config).toContain('"allow": [');
    expect(config).toContain('"@salesforce-ux/slds/react-options": [');
    expect(config).toContain('"reportNumericValue": "hasReplacement"');
  });

  it('reports plugin configuration failures instead of silently omitting rules', async () => {
    const configError = new Error('preset unavailable');

    const { copyFile, loggerError, rename, rm, writeFile } = await emitConfig({ targetExists: false, configError });

    expect(loggerError).toHaveBeenCalledWith(expect.stringContaining(
      'Failed to load @salesforce-ux/eslint-plugin-slds configuration "flat/recommended".'
    ));
    expect(writeFile).not.toHaveBeenCalled();
    expect(copyFile).not.toHaveBeenCalled();
    expect(rename).not.toHaveBeenCalled();
    expect(rm).not.toHaveBeenCalled();
  });

  it('does not replace either config when the exclusive backup collides', async () => {
    const copyError = Object.assign(new Error('backup exists'), { code: 'EEXIST' });

    const { copyFile, loggerError, rename, rm, writeFile } = await emitConfig({ targetExists: true, copyError });

    expect(copyFile).toHaveBeenCalledWith(
      '/project/eslint.config.mjs',
      '/project/eslint.config.backup.mjs',
      constants.COPYFILE_EXCL
    );
    expect(rename).not.toHaveBeenCalled();
    expect(rm).toHaveBeenCalledWith(writeFile.mock.calls[0][0], { force: true });
    expect(loggerError).toHaveBeenCalledWith(expect.stringContaining('backup exists'));
  });

  it('reports non-ENOENT backup failures without replacing the active config', async () => {
    const accessError = Object.assign(new Error('permission denied'), { code: 'EACCES' });

    const { copyFile, loggerError, rename, rm, writeFile } = await emitConfig({ targetExists: false, accessError });

    expect(copyFile).toHaveBeenCalledWith(
      '/project/eslint.config.mjs',
      '/project/eslint.config.backup.mjs',
      constants.COPYFILE_EXCL
    );
    expect(rename).not.toHaveBeenCalled();
    expect(rm).toHaveBeenCalledWith(writeFile.mock.calls[0][0], { force: true });
    expect(loggerError).toHaveBeenCalledWith(expect.stringContaining('permission denied'));
  });
});
