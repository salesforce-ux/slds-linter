import type { PluginConfig, RuleConfig, ParserConfig } from '../types';
import { FILE_PATTERNS, RULE_CONFIG, PARSER_CONFIG } from '../constants';

/**
 * Flat configuration type for ESLint v9+
 * @public
 */
interface FlatConfig {
    files: readonly string[];
    plugins: Record<string, any>;
    languageOptions: {
        parser: any;
        ecmaVersion: number;
        sourceType: 'module';
    };
    rules: RuleConfig;
}

/**
 * Legacy configuration type for ESLint v8
 * @public
 */
interface LegacyConfig extends ParserConfig {
    plugins: string[];
    rules: RuleConfig;
}

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
        rules: RULE_CONFIG
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
        rules: RULE_CONFIG
    };
}

/**
 * Determine configuration format based on environment variable
 * @public
 * @returns {boolean} True for flat config (ESLint v9), false for legacy config (ESLint v8)
 */
export function shouldUseFlatConfig(): boolean {
    const envVar = process.env.ESLINT_USE_FLAT_CONFIG;
    if (envVar !== undefined) {
        return envVar === 'true';
    }
    return true;
} 