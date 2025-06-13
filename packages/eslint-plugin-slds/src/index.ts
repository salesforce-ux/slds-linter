import type { ESLint, Rule } from 'eslint';
import type { PluginConfig } from './types';
import { PLUGIN_META } from './constants';
import { createFlatConfig, createLegacyConfig, shouldUseFlatConfig } from './config';
import { rules } from './rules';

/**
 * Creates the plugin configuration based on the ESLint version
 * @returns The plugin configuration in the appropriate format
 */
function createPlugin(): PluginConfig {
    const useFlatConfig = shouldUseFlatConfig();
    
    // Base plugin structure
    const plugin: PluginConfig = {
        rules,
        configs: {}
    };
    
    // Add metadata for ESLint v9+ compatibility
    if (useFlatConfig) {
        plugin.meta = PLUGIN_META;
    }
    
    // Configure recommended preset
    Object.assign(plugin.configs, {
        recommended: useFlatConfig 
            ? createFlatConfig(plugin)
            : createLegacyConfig()
    });
    
    return plugin;
}

// Export the plugin configuration directly
module.exports = createPlugin(); 