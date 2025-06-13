import type { PluginConfig } from '../types';

/**
 * File patterns for SLDS linting
 */
const FILE_PATTERNS = ["**/*.html", "**/*.cmp"] as const;

/**
 * Shared rule configuration for consistency
 */
const RULE_CONFIG = {
    "@salesforce-ux/slds/enforce-bem-usage": "error",
    "@salesforce-ux/slds/no-deprecated-classes-slds2": "error",
    "@salesforce-ux/slds/modal-close-button-issue": "error"
} as const;

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
 * 
 * @param plugin - The plugin instance
 * @returns Flat config object
 */
export function createFlatConfig(plugin: PluginConfig) {
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
 * 
 * @returns Legacy config object
 */
export function createLegacyConfig() {
    return {
        ...PARSER_CONFIG,
        plugins: ["@salesforce-ux/slds"],
        rules: RULE_CONFIG
    };
} 