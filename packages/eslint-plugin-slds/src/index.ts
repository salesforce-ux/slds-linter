// Unified ESLint plugin config for both v8 (legacy) and v9+ (flat)

import enforceBemUsage from './rules/enforce-bem-usage';
import noDeprecatedClassesSlds2 from './rules/no-deprecated-classes-slds2';
import modalCloseButtonIssue from './rules/modal-close-button-issue';
import htmlParser from "@html-eslint/parser";

const rules = {
  "enforce-bem-usage": enforceBemUsage,
  "no-deprecated-classes-slds2": noDeprecatedClassesSlds2,
  "modal-close-button-issue": modalCloseButtonIssue
};

const plugin = {
  meta: {
    name: "@salesforce-ux/eslint-plugin-slds",
    version: process.env.PLUGIN_VERSION
  },
  rules,
  configs: {
    // Flat config for ESLint v9+
    "flat/recommended": [
      {
        languageOptions: {
          parser: htmlParser,
          ecmaVersion: 2021,
          sourceType: "module"
        },
        plugins: {
          "@salesforce-ux/slds": null // Will be replaced by plugin object at runtime
        },
        files: ["**/*.html", "**/*.cmp"],
        rules: {
          "@salesforce-ux/slds/enforce-bem-usage": "error",
          "@salesforce-ux/slds/no-deprecated-classes-slds2": "error",
          "@salesforce-ux/slds/modal-close-button-issue": "error"
        }
      }
    ],
    // Legacy config for ESLint v8-
    recommended: {
      parser: htmlParser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: "module"
      },
      plugins: ["@salesforce-ux/slds"],
      rules: {
        "@salesforce-ux/slds/enforce-bem-usage": "error",
        "@salesforce-ux/slds/no-deprecated-classes-slds2": "error",
        "@salesforce-ux/slds/modal-close-button-issue": "error"
      }
    }
  }
};

// For flat config, ESLint expects the plugin object in the plugins map
plugin.configs["flat/recommended"][0].plugins["@salesforce-ux/slds"] = plugin;

module.exports = plugin; //CommonJS plugin works out-of-the-box with both v8 and v9
