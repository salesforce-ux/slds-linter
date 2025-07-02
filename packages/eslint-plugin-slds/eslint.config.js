const htmlParser = require("@html-eslint/parser");
const cssPlugin = require("@eslint/css").default;
const sldsPlugin = require("@salesforce-ux/eslint-plugin-slds/v9");

module.exports = [
    {
        files: ["**/*.html", "**/*.cmp"],
        languageOptions: {
            parser: htmlParser,
            ecmaVersion: 2021,
            sourceType: "module"
        },
        plugins: {
            "@salesforce-ux/slds": sldsPlugin
        },
        rules: {
            "@salesforce-ux/slds/enforce-bem-usage": "error",
            "@salesforce-ux/slds/no-deprecated-classes-slds2": "error",
            "@salesforce-ux/slds/modal-close-button-issue": "error"
        }
    },
    {
        files: ["**/*.{css,scss}"],
        language: "css/css",
        ...cssPlugin.configs.recommended,
        plugins: {
            css: cssPlugin,
            "@salesforce-ux/slds": sldsPlugin
        },
        rules: {
            "@salesforce-ux/slds/no-hardcoded-values-slds1": "warn"
        }
    },
    {
        ignores: ["node_modules/"]
    }
];