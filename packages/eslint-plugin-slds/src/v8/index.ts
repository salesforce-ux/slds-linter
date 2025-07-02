/**
 * ESLint v8 compatible plugin configuration
 */
export = {
    rules: {
        "enforce-bem-usage": require('../rules/enforce-bem-usage'),
        "no-deprecated-classes-slds2": require('../rules/no-deprecated-classes-slds2'),
        "modal-close-button-issue": require('../rules/modal-close-button-issue')
    },
    configs: {
        recommended: {
            parser: "@html-eslint/parser", // Use HTML parser
            parserOptions: {
                ecmaVersion: 2021,
                sourceType: "module"
            },
            plugins: ["@salesforce-ux/slds"],
            rules: {
                "@salesforce-ux/slds/enforce-bem-usage": "error",
                "@salesforce-ux/slds/no-deprecated-classes-slds2": "error",
                "@salesforce-ux/slds/modal-close-button-issue": "error"
            },
        },
    },
}; 