/**
 * ESLint v9 compatible plugin configuration
 * Uses flat config format with proper plugin structure
 */

import type { Rule } from 'eslint';

const htmlRules: Record<string, Rule.RuleModule> = {
  "enforce-bem-usage": require('../rules/enforce-bem-usage'),
  "no-deprecated-classes-slds2": require('../rules/no-deprecated-classes-slds2'),
  "modal-close-button-issue": require('../rules/modal-close-button-issue')
};

const styleRules: Record<string, Rule.RuleModule> = {
    "no-hardcoded-values-slds1": require('./rules/no-hardcoded-values-slds1').default,
};

const cssPlugin = require("@eslint/css").default;

export = {
    rules: { ...htmlRules, ...styleRules },
    meta: {
        name: "@salesforce-ux/eslint-plugin-slds",
        version: process.env.PLUGIN_VERSION
    },
    configs: {
        recommended: {
            files: ["**/*.html", "**/*.cmp"],
            languageOptions: {
                parser: "@html-eslint/parser",
                ecmaVersion: 2021,
                sourceType: "module"
            },
            plugins: {
                "@salesforce-ux/slds": {
                    rules: htmlRules,
                    meta: {
                        name: "@salesforce-ux/eslint-plugin-slds",
                        version: process.env.PLUGIN_VERSION
                    }
                }
            },
            rules: {
                "@salesforce-ux/slds/enforce-bem-usage": "error",
                "@salesforce-ux/slds/no-deprecated-classes-slds2": "error",
                "@salesforce-ux/slds/modal-close-button-issue": "error"
            }
        },
        recommendedCss: {
            files: ["**/*.{css,scss}"],
            language: "css/css",
            ...cssPlugin.configs.recommended,
            plugins: {
                css: cssPlugin,
                "@salesforce-ux/slds": {
                    rules: styleRules,
                    meta: {
                        name: "@salesforce-ux/eslint-plugin-slds",
                        version: process.env.PLUGIN_VERSION
                    }
                }
            },
            rules: {
                "@salesforce-ux/slds/no-hardcoded-values-slds1": "warn"
            }
        }
    }
}; 