import type { PluginConfig, RuleConfig, ParserConfig, FlatConfig, LegacyConfig } from '../types';
import { FILE_PATTERNS, V9_RULE_CONFIG, V8_RULE_CONFIG, PARSER_CONFIG } from '../constants';

/**
 * Create ESLint v9+ flat configuration
 * @public
 * @param plugin - The plugin instance
 * @returns Flat config object
 */
export function createFlatConfig(plugin: PluginConfig): FlatConfig {
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
        rules: V9_RULE_CONFIG
    };
}

/**
 * Create ESLint v8 legacy configuration
 * @public
 * @returns Legacy config object
 */
export function createLegacyConfig(): LegacyConfig {
    return {
        ...PARSER_CONFIG,
        plugins: ["@salesforce-ux/slds"],
        rules: V8_RULE_CONFIG
    };
} 