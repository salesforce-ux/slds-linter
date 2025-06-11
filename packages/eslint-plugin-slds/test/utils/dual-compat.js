/**
 * @fileoverview Test utilities for dual ESLint v8/v9 compatibility
 * Provides RuleTester configuration based on environment variables
 * 
 * @author UXF Tooling Team
 */

const { RuleTester } = require("eslint");

/**
 * Configuration for HTML parser
 */
const HTML_PARSER_CONFIG = {
    parser: "@html-eslint/parser",
    parserOptions: {
        ecmaVersion: 2021,
        sourceType: "module"
    }
};

/**
 * Determine if flat config should be used
 * Based on ESLINT_USE_FLAT_CONFIG environment variable
 * 
 * @returns {boolean} Whether to use flat config format
 */
function shouldUseFlatConfig() {
    const envVar = process.env.ESLINT_USE_FLAT_CONFIG;
    if (envVar !== undefined) {
        return envVar === 'true';
    }
    
    // Default to flat config for consistency with main plugin
    return true;
}

/**
 * Create RuleTester with appropriate configuration format
 * Handles both ESLint v8 and v9 formats transparently
 * 
 * @returns {RuleTester} Configured RuleTester instance
 */
function createRuleTester() {
    const useFlatConfig = shouldUseFlatConfig();
    
    if (useFlatConfig) {
        // ESLint v9+ flat config format
        return new RuleTester({
            languageOptions: {
                parser: require("@html-eslint/parser"),
                ecmaVersion: 2021,
                sourceType: "module"
            }
        });
    } else {
        // ESLint v8 legacy format
        return new RuleTester({
            parser: require.resolve("@html-eslint/parser"),
            parserOptions: {
                ecmaVersion: 2021,
                sourceType: "module"
            }
        });
    }
}

/**
 * Get current configuration type for debugging
 * 
 * @returns {string} Configuration type ('flat' or 'legacy')
 */
function getConfigType() {
    return shouldUseFlatConfig() ? 'flat' : 'legacy';
}

module.exports = {
    createRuleTester,
    getConfigType,
    shouldUseFlatConfig,
    HTML_PARSER_CONFIG
}; 