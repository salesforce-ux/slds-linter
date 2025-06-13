import type { ESLint, Rule } from 'eslint';

/**
 * Plugin configuration interface
 * @public
 */
export interface PluginConfig {
    /** Plugin metadata for ESLint v9+ */
    meta?: {
        name: string;
        version: string;
    };
    /** Plugin rules */
    rules: Record<string, Rule.RuleModule>;
    /** Plugin configurations */
    configs: Record<string, any>;
}

/**
 * Rule configuration type
 * @public
 */
export interface RuleConfig {
    [key: string]: string | [string, ...any[]];
}

/**
 * Parser configuration type
 * @public
 */
export interface ParserConfig {
    parser: string;
    parserOptions?: {
        ecmaVersion?: number;
        sourceType?: 'script' | 'module';
        [key: string]: any;
    };
}

/**
 * Flat configuration type for ESLint v9+
 * @public
 */
export interface FlatConfig {
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
export interface LegacyConfig extends ParserConfig {
    plugins: string[];
    rules: RuleConfig;
} 