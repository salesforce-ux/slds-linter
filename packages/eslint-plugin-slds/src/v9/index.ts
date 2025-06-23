/**
 * ESLint v9 compatible plugin configuration
 * Uses flat config format with proper plugin structure
 */

// Define rules once to avoid duplication
const pluginRules = {
    "enforce-bem-usage": require('../rules/enforce-bem-usage'),
    "no-deprecated-classes-slds2": require('../rules/no-deprecated-classes-slds2'),
    "modal-close-button-issue": require('../rules/modal-close-button-issue')
};

// Plugin object
const plugin = {
    rules: pluginRules,
    meta: {
        name: "@salesforce-ux/eslint-plugin-slds",
        version: process.env.PLUGIN_VERSION
    }
};

export = {
    ...plugin,
    configs: {
        recommended: {
            languageOptions: {
                parser: "@html-eslint/parser",
                ecmaVersion: 2021,
                sourceType: "module"
            },
            plugins: {
                "@salesforce-ux/slds": plugin
            },
            files: ["**/*.html", "**/*.cmp"],
            rules: {
                "@salesforce-ux/slds/enforce-bem-usage": "error",
                "@salesforce-ux/slds/no-deprecated-classes-slds2": "error",
                "@salesforce-ux/slds/modal-close-button-issue": "error"
            }
        }
    }
}; 