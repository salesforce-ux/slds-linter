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
export const FILE_PATTERNS = ["**/*.html", "**/*.cmp", "**/*.css", "**/*.scss"] as const;

/**
 * ESLint v8 rule configuration (legacy config)
 * @public
 */
export const V8_RULE_CONFIG = {
    "@salesforce-ux/slds/enforce-bem-usage": "error",
    "@salesforce-ux/slds/no-deprecated-classes-slds2": "error",
    "@salesforce-ux/slds/modal-close-button-issue": "error"
} as const;

/**
 * ESLint v9+ rule configuration (flat config)
 * @public
 */
export const V9_RULE_CONFIG = {
    "@salesforce-ux/slds/enforce-bem-usage": "error",
    "@salesforce-ux/slds/no-deprecated-classes-slds2": "error",
    "@salesforce-ux/slds/modal-close-button-issue": "error",
    "@salesforce-ux/slds/no-slds-var-without-fallback": "error"
} as const;

/**
 * Shared rule configuration (for backward compatibility)
 * @public
 * @deprecated Use V8_RULE_CONFIG or V9_RULE_CONFIG instead
 */
export const RULE_CONFIG = V9_RULE_CONFIG;

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