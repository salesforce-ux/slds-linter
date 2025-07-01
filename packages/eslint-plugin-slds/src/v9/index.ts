/**
 * ESLint v9 compatible plugin configuration
 * Uses flat config format with proper plugin structure
 */

import type { Rule } from 'eslint';

const rules: Record<string, Rule.RuleModule> = {
  "enforce-bem-usage": require('../rules/enforce-bem-usage'),
  "no-deprecated-classes-slds2": require('../rules/no-deprecated-classes-slds2'),
  "modal-close-button-issue": require('../rules/modal-close-button-issue'),
  // Add v9-only rules here, e.g.:
  // "no-slds-var-without-fallback": require('./rules/no-slds-var-without-fallback'),
};

export = {
    rules,
    meta: {
        name: "@salesforce-ux/eslint-plugin-slds",
        version: process.env.PLUGIN_VERSION
    },
    configs: {
        recommended: {
            languageOptions: {
                parser: "@html-eslint/parser",
                ecmaVersion: 2021,
                sourceType: "module"
            },
            plugins: {
                "@salesforce-ux/slds": {
                    rules,
                    meta: {
                        name: "@salesforce-ux/eslint-plugin-slds",
                        version: process.env.PLUGIN_VERSION
                    }
                }
            },
            files: ["**/*.html", "**/*.cmp"],
            rules: {
                // Explicitly list all rules for clarity
                "@salesforce-ux/slds/enforce-bem-usage": "error",
                "@salesforce-ux/slds/no-deprecated-classes-slds2": "error",
                "@salesforce-ux/slds/modal-close-button-issue": "error"
            }
        }
    }
}; 