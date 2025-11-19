import { readFile, writeFile } from 'fs/promises';
import { createRequire } from 'module';
import { join, resolve } from 'path';
import { tmpdir, platform } from 'os';
import { pathToFileURL } from 'url';
import { Logger } from '../utils/logger';

/**
 * Config Loader - Simple import rewriter for custom configs
 * Only rewrites imports if dependencies aren't already installed
 */
export class ConfigLoader {
  /**
   * Check if package is installed in user's workspace
   */
  private static isPackageInstalled(packageName: string, fromPath: string): boolean {
    try {
      const require = createRequire(fromPath);
      require.resolve(packageName);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Process custom .mjs config - only rewrite if dependencies not installed
   */
  static async processConfig(configPath: string | undefined): Promise<string | undefined> {
    if (!configPath?.endsWith('.mjs')) {
      return configPath;
    }

    try {
      // Resolve to absolute path first
      const absolutePath = resolve(configPath);
      
      // Skip special processing for bundled configs (part of CLI package)
      if (absolutePath.includes('eslint-plugin-slds') && absolutePath.includes('eslint.config.mjs')) {
        Logger.debug('Using bundled config as-is');
        return absolutePath;
      }
      
      // Check if dependencies already installed in user's workspace
      const userConfigUrl = pathToFileURL(absolutePath).href;
      const pluginInstalled = this.isPackageInstalled('@salesforce-ux/eslint-plugin-slds', userConfigUrl);
      const eslintInstalled = this.isPackageInstalled('eslint', userConfigUrl);
      const cssPluginInstalled = this.isPackageInstalled('@eslint/css', userConfigUrl);
      
      if (pluginInstalled && eslintInstalled && cssPluginInstalled) {
        Logger.debug('Dependencies already installed, using config as-is');
        // On Windows, convert to file:// URL directly
        return platform() === 'win32' ? userConfigUrl : absolutePath;
      }

      // Dependencies not installed - rewrite to use CLI's bundled versions
      Logger.debug('Dependencies not installed, rewriting imports');
      
      const configContent = await readFile(absolutePath, 'utf-8');
      const require = createRequire(import.meta.url);
      
      // Get CLI's bundled paths
      const pluginPath = require.resolve('@salesforce-ux/eslint-plugin-slds');
      const eslintConfigPath = require.resolve('eslint/config');
      
      // Resolve @eslint/css and convert to ESM path for .mjs imports
      // require.resolve returns CJS path, but we need ESM version
      const cssCjsPath = require.resolve('@eslint/css');
      const cssPackageDir = resolve(cssCjsPath, '../../..'); // dist/cjs/index.cjs -> package root
      const cssPluginPath = join(cssPackageDir, 'dist/esm/index.js');
      
      // On Windows, convert to file:// URLs for ESM
      const pluginImport = platform() === 'win32' 
        ? pathToFileURL(pluginPath).href 
        : pluginPath;
      const eslintConfigImport = platform() === 'win32'
        ? pathToFileURL(eslintConfigPath).href
        : eslintConfigPath;
      const cssPluginImport = platform() === 'win32'
        ? pathToFileURL(cssPluginPath).href
        : cssPluginPath;
      
      // Rewrite imports
      const rewritten = configContent
        .replace(
          /import\s+(\w+)\s+from\s+['"]@salesforce-ux\/eslint-plugin-slds['"]/g,
          `import $1 from '${pluginImport}'`
        )
        .replace(
          /import\s+({[^}]+})\s+from\s+['"]eslint\/config['"]/g,
          `import $1 from '${eslintConfigImport}'`
        )
        .replace(
          /import\s+(\w+)\s+from\s+['"]@eslint\/css['"]/g,
          `import $1 from '${cssPluginImport}'`
        );
      
      // Write temp config
      const tempPath = join(tmpdir(), `slds-config-${Date.now()}.mjs`);
      await writeFile(tempPath, rewritten, 'utf-8');
      
      Logger.debug(`Rewritten config: ${tempPath}`);
      // On Windows, convert temp path to file:// URL
      return platform() === 'win32' ? pathToFileURL(tempPath).href : tempPath;
      
    } catch (error: any) {
      Logger.error(`Config processing failed: ${error.message}`);
      throw error;
    }
  }
}

