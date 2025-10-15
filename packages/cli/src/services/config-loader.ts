import { readFile, writeFile } from 'fs/promises';
import { createRequire } from 'module';
import { join } from 'path';
import { tmpdir } from 'os';
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
      // Check if dependencies already installed in user's workspace
      const userConfigUrl = `file://${configPath}`;
      const pluginInstalled = this.isPackageInstalled('@salesforce-ux/eslint-plugin-slds', userConfigUrl);
      const eslintInstalled = this.isPackageInstalled('eslint', userConfigUrl);
      
      if (pluginInstalled && eslintInstalled) {
        Logger.debug('Dependencies already installed, using config as-is');
        return configPath;
      }

      // Dependencies not installed - rewrite to use CLI's bundled versions
      Logger.debug('Dependencies not installed, rewriting imports');
      
      const configContent = await readFile(configPath, 'utf-8');
      const require = createRequire(import.meta.url);
      
      // Get CLI's bundled paths
      const pluginPath = require.resolve('@salesforce-ux/eslint-plugin-slds');
      const eslintConfigPath = require.resolve('eslint/config');
      
      // Rewrite imports
      const rewritten = configContent
        .replace(
          /import\s+(\w+)\s+from\s+['"]@salesforce-ux\/eslint-plugin-slds['"]/g,
          `import $1 from '${pluginPath}'`
        )
        .replace(
          /import\s+({[^}]+})\s+from\s+['"]eslint\/config['"]/g,
          `import $1 from '${eslintConfigPath}'`
        );
      
      // Write temp config
      const tempPath = join(tmpdir(), `slds-config-${Date.now()}.mjs`);
      await writeFile(tempPath, rewritten, 'utf-8');
      
      Logger.debug(`Rewritten config: ${tempPath}`);
      return tempPath;
      
    } catch (error: any) {
      Logger.error(`Config processing failed: ${error.message}`);
      throw error;
    }
  }
}

