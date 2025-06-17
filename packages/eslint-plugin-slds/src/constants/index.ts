/**
 * Plugin metadata (updated by release script)
 * @public
 */
export const PLUGIN_META = {
    name: "@salesforce-ux/eslint-plugin-slds",
    version: "0.2.1"
} as const;

/**
 * File patterns for SLDS linting
 * @public
 */
export const FILE_PATTERNS = ["**/*.html", "**/*.cmp"] as const;

/**
 * Shared rule configuration
 * @public
 */
export const RULE_CONFIG = {
    "@salesforce-ux/slds/enforce-bem-usage": "error",
    "@salesforce-ux/slds/no-deprecated-classes-slds2": "error",
    "@salesforce-ux/slds/modal-close-button-issue": "error"
} as const;

/**
 * Parser configuration for HTML files
 * @public
 */
export const PARSER_CONFIG = {
    parser: "@html-eslint/parser",
    parserOptions: {
        ecmaVersion: 2021,
        sourceType: "module" as const
    }
} as const; 