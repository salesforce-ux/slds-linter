/**
 * ESLint v8 compatible plugin configuration
 */
import { rules as sharedRules } from '../rules';

const allRules = { ...sharedRules };

export = {
    rules: allRules,
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