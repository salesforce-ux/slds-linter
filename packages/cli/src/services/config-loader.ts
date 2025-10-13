import { createRequire } from 'module';
import { dirname } from 'path';
import { Logger } from '../utils/logger';

/**
 * Config Loader Service
 * Sets up NODE_PATH to make CLI's bundled dependencies available to user configs
 * This allows users to import @salesforce-ux/eslint-plugin-slds without installing it
 */
export class ConfigLoader {
  private static nodePath: string | null = null;
  
  /**
   * Initialize module resolution to include CLI's bundled dependencies
   * This allows user configs to import the plugin directly from CLI's node_modules
   */
  static setupBundledDependencies(): void {
    if (this.nodePath) {
      return; // Already set up
    }
    
    try {
      // Get the path to CLI's node_modules
      const require = createRequire(import.meta.url);
      
      // Resolve the main entry point of the plugin
      const pluginMainPath = require.resolve('@salesforce-ux/eslint-plugin-slds');
      
      // Navigate up to find node_modules: 
      // -> /path/to/node_modules/@salesforce-ux/eslint-plugin-slds
      // -> /path/to/node_modules/@salesforce-ux
      // -> /path/to/node_modules
      const pluginDir = dirname(pluginMainPath); // .../build
      const pluginRoot = dirname(pluginDir); // .../@salesforce-ux/eslint-plugin-slds
      const scopeDir = dirname(pluginRoot); // .../@salesforce-ux
      const cliNodeModules = dirname(scopeDir); // .../node_modules
      
      // Add CLI's node_modules to NODE_PATH
      const existingPath = process.env.NODE_PATH || '';
      process.env.NODE_PATH = existingPath ? `${existingPath}:${cliNodeModules}` : cliNodeModules;
      
      // Reinitialize module paths to pick up the new NODE_PATH
      require('module').Module._initPaths();
      
      this.nodePath = cliNodeModules;
      Logger.debug(`Using bundled dependencies from: ${cliNodeModules}`);
      Logger.debug('User configs can now import @salesforce-ux/eslint-plugin-slds');
      
    } catch (error: any) {
      Logger.error(`Failed to setup bundled dependencies: ${error.message}`);
      throw new Error(`Could not initialize bundled dependencies: ${error.message}`);
    }
  }
  
  /**
   * Get the path to CLI's node_modules (for reference)
   */
  static getBundledModulesPath(): string | null {
    return this.nodePath;
  }
}

