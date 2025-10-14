import { readFile, writeFile } from 'fs/promises';
import { createRequire } from 'module';
import { join } from 'path';
import { tmpdir } from 'os';
import { Logger } from '../utils/logger';

/**
 * Config Loader - Simple import rewriter for custom configs
 * Rewrites plugin and eslint imports to use CLI's bundled versions
 */
export class ConfigLoader {
  /**
   * Process custom .mjs config to use bundled dependencies
   */
  static async processConfig(configPath: string): Promise<string> {
    if (!configPath?.endsWith('.mjs')) {
      return configPath;
    }

    try {
      const configContent = await readFile(configPath, 'utf-8');
      const require = createRequire(import.meta.url);
      
      // Get bundled paths
      const pluginPath = require.resolve('@salesforce-ux/eslint-plugin-slds');
      const eslintConfigPath = require.resolve('eslint/config');
      
      // Rewrite imports to use bundled versions
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

