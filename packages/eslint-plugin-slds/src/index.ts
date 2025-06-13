import type { ESLint, Rule } from 'eslint';

/**
 * Plugin configuration interface for type safety
 */
interface PluginConfig {
    meta?: {
        name: string;
        version: string;
    };
    rules: Record<string, Rule.RuleModule>;
    configs: Record<string, any>;
}

/**
 * Determine configuration format based on environment variable
 * 
 * @returns {boolean} True for flat config (ESLint v9), false for legacy config (ESLint v8)
 * 
 * Behavior:
 * - ESLINT_USE_FLAT_CONFIG=true: Use flat config (ESLint v9 format)
 * - ESLINT_USE_FLAT_CONFIG=false: Use legacy config (ESLint v8 format)
 * - undefined: Defaults to flat config (ESLint v9 format)
 * 
 * Note: ESLint v8 users must explicitly set ESLINT_USE_FLAT_CONFIG=false
 */
function shouldUseFlatConfig(): boolean {
    const envVar = process.env.ESLINT_USE_FLAT_CONFIG;
    if (envVar !== undefined) {
        return envVar === 'true';
    }
    
    // Default to flat config (ESLint v9 format)
    // ESLint v8 users must set ESLINT_USE_FLAT_CONFIG=false for legacy format
    return true;
}

/**
 * Plugin rules definition
 * Centralized rules import for consistency
 */
const rules: Record<string, Rule.RuleModule> = {
    "enforce-bem-usage": require('./rules/enforce-bem-usage'),
    "no-deprecated-classes-slds2": require('./rules/no-deprecated-classes-slds2'),
    "modal-close-button-issue": require('./rules/modal-close-button-issue')
};

/**
 * Package metadata dynamically loaded from package.json
 * Ensures consistency between plugin metadata and package information
 */
const packageJson = require('../package.json');
const PLUGIN_META = {
    name: packageJson.name,
    version: packageJson.version
} as const;

/**
 * Shared rule configuration for consistency
 */
const RULE_CONFIG = {
    "@salesforce-ux/slds/enforce-bem-usage": "error",
    "@salesforce-ux/slds/no-deprecated-classes-slds2": "error",
    "@salesforce-ux/slds/modal-close-button-issue": "error"
} as const;

/**
 * File patterns for SLDS linting
 */
const FILE_PATTERNS = ["**/*.html", "**/*.cmp"] as const;

/**
 * Parser configuration for HTML files
 */
const PARSER_CONFIG = {
    parser: "@html-eslint/parser",
    parserOptions: {
        ecmaVersion: 2021,
        sourceType: "module"
    }
} as const;

/**
 * Create ESLint v9+ flat configuration
 */
function createFlatConfig(plugin: PluginConfig) {
    return {
        files: FILE_PATTERNS,
        plugins: {
            "@salesforce-ux/slds": plugin
        },
        languageOptions: {
            parser: require("@html-eslint/parser"),
            ecmaVersion: 2021,
            sourceType: "module"
        },
        rules: RULE_CONFIG
    };
}

/**
 * Create ESLint v8 legacy configuration
 */
function createLegacyConfig() {
    return {
        ...PARSER_CONFIG,
        plugins: ["@salesforce-ux/slds"],
        rules: RULE_CONFIG
    };
}

/**
 * Create plugin configuration based on format preference
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
    if (useFlatConfig) {
        Object.assign(plugin.configs, {
            recommended: createFlatConfig(plugin)
        });
    } else {
        Object.assign(plugin.configs, {
            recommended: createLegacyConfig()
        });
    }
    
    return plugin;
}

/**
 * Main plugin export
 * 
 * Supports both ESLint v8 and v9 configurations:
 * - ESLint v9: Uses flat config format by default
 * - ESLint v8: Requires ESLINT_USE_FLAT_CONFIG=false for legacy format
 */
const plugin = createPlugin();

export = plugin;
