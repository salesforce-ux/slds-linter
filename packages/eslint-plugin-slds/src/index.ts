/**
 * @fileoverview ESLint Plugin for Salesforce Lightning Design System (SLDS)
 * Provides custom linting rules for SLDS markup files with dual ESLint v8/v9 support
 * 
 * @author UXF Tooling Team
 * @version 0.2.1
 */

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
 * Determine configuration format based on environment
 * Uses ESLINT_USE_FLAT_CONFIG environment variable for explicit control
 */
function shouldUseFlatConfig(): boolean {
    const envVar = process.env.ESLINT_USE_FLAT_CONFIG;
    if (envVar !== undefined) {
        return envVar === 'true';
    }
    
    // Default to flat config for new installations
    // Can be overridden by environment variable for backward compatibility
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
 * Package metadata for consistent versioning
 */
const PLUGIN_META = {
    name: "@salesforce-ux/eslint-plugin-slds",
    version: "0.2.1"
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
 * Supports both ESLint v8 and v9 configurations
 */
const plugin = createPlugin();

export = plugin;
