import { jest } from '@jest/globals';
import { Command } from 'commander';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import { ESLint } from 'eslint';
import { ConfigLoader } from '../../src/services/config-loader';

describe('emitted ESLint config', () => {
  it('loads the existing and React SLDS rule sets', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'slds-emit-test-'));

    try {
      const { registerEmitCommand } = await import('../../src/commands/emit');
      const program = new Command();
      program.exitOverride();
      registerEmitCommand(program);

      await program.parseAsync(['node', 'test', 'emit', '--directory', directory]);

      const configPath = path.join(directory, 'eslint.config.mjs');
      const emittedConfig = await readFile(configPath, 'utf8');
      expect(emittedConfig).toContain('reactSldsPlugin.configs.recommended');
      expect(emittedConfig).toContain('"**/*.{jsx,tsx}"');
      expect(emittedConfig).toContain('"@salesforce-ux/slds/enforce-bem-usage": "error"');
      expect(emittedConfig.indexOf('reactSldsPlugin.configs.recommended'))
        .toBeLessThan(emittedConfig.lastIndexOf('"@salesforce-ux/slds/enforce-bem-usage": "error"'));

      const processedConfigPath = await ConfigLoader.processConfig(configPath);
      const eslint = new ESLint({ overrideConfigFile: processedConfigPath, cwd: directory });
      const [cssResult, htmlResult, jsxResult, tsxResult] = await Promise.all([
        eslint.lintText('.slds-button { background: red; }', { filePath: 'component.css' }),
        eslint.lintText('<div class="slds-action-overflow--touch"></div>', { filePath: 'component.html' }),
        eslint.lintText('<div className="slds-container--medium" />', { filePath: 'component.jsx' }),
        eslint.lintText('<div className="slds-container--medium" />', { filePath: 'component.tsx' }),
      ]);

      expect(cssResult[0].messages).toEqual(expect.arrayContaining([
        expect.objectContaining({ ruleId: '@salesforce-ux/slds/no-slds-class-overrides' }),
      ]));
      expect(cssResult[0].messages.every(message => message.ruleId?.startsWith('@salesforce-ux/slds/'))).toBe(true);
      expect(htmlResult[0].messages).toEqual(expect.arrayContaining([
        expect.objectContaining({ ruleId: '@salesforce-ux/slds/no-deprecated-classes-slds2' }),
      ]));
      for (const result of [jsxResult, tsxResult]) {
        expect(result[0].messages).toEqual(expect.arrayContaining([
          expect.objectContaining({ ruleId: '@salesforce-ux/slds/enforce-bem-usage' }),
        ]));
      }
    } finally {
      await rm(directory, { recursive: true, force: true });
      jest.restoreAllMocks();
    }
  });

  it('backs up an existing config and replaces it with a fresh generated config', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'slds-emit-replace-test-'));
    const configPath = path.join(directory, 'eslint.config.mjs');
    const originalConfig = 'export default [{ rules: { "custom/rule": "warn" } }];\n';

    try {
      await writeFile(configPath, originalConfig, 'utf8');
      const { registerEmitCommand } = await import('../../src/commands/emit');
      const program = new Command();
      program.exitOverride();
      registerEmitCommand(program);

      await program.parseAsync(['node', 'test', 'emit', '--directory', directory]);

      expect(await readFile(path.join(directory, 'eslint.config.backup.mjs'), 'utf8')).toBe(originalConfig);
      const emittedConfig = await readFile(configPath, 'utf8');
      expect(emittedConfig).toContain('reactSldsPlugin.configs.recommended');
      expect(emittedConfig).not.toContain('custom/rule');
    } finally {
      await rm(directory, { recursive: true, force: true });
      jest.restoreAllMocks();
    }
  });

  it('does not overwrite an existing backup or replace the active config', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'slds-emit-collision-test-'));
    const configPath = path.join(directory, 'eslint.config.mjs');
    const backupPath = path.join(directory, 'eslint.config.backup.mjs');
    const originalConfig = 'export default [{ rules: { "custom/active": "warn" } }];\n';
    const originalBackup = 'export default [{ rules: { "custom/backup": "error" } }];\n';

    try {
      await writeFile(configPath, originalConfig, 'utf8');
      await writeFile(backupPath, originalBackup, 'utf8');
      jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      const { registerEmitCommand } = await import('../../src/commands/emit');
      const program = new Command();
      program.exitOverride();
      registerEmitCommand(program);

      await program.parseAsync(['node', 'test', 'emit', '--directory', directory]);

      expect(await readFile(configPath, 'utf8')).toBe(originalConfig);
      expect(await readFile(backupPath, 'utf8')).toBe(originalBackup);
      expect((await readdir(directory)).filter(file => file.endsWith('.tmp'))).toEqual([]);
    } finally {
      await rm(directory, { recursive: true, force: true });
      jest.restoreAllMocks();
    }
  });
});
