/**
 * ESLint v9 compatible plugin configuration
 * Uses flat config format with proper plugin structure
 */

import { rules as sharedRules } from '../rules';
import { rules as v9OnlyRules } from './rules';

const allRules = { ...sharedRules, ...v9OnlyRules };

export = {
    rules: allRules,
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
                    rules: allRules,
                    meta: {
                        name: "@salesforce-ux/eslint-plugin-slds",
                        version: process.env.PLUGIN_VERSION
                    }
                }
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