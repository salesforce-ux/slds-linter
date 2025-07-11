// Unified ESLint plugin config for both v8 (legacy) and v9+ (flat)

import enforceBemUsage from './rules/enforce-bem-usage';
import noDeprecatedClassesSlds2 from './rules/no-deprecated-classes-slds2';
import modalCloseButtonIssue from './rules/modal-close-button-issue';
import htmlParser from "@html-eslint/parser";

const plugin = {
  meta: {
    name: "@salesforce-ux/eslint-plugin-slds",
    version: process.env.PLUGIN_VERSION
  },
  configs: {},
  rules: {
    "enforce-bem-usage": enforceBemUsage,
    "no-deprecated-classes-slds2": noDeprecatedClassesSlds2,
    "modal-close-button-issue": modalCloseButtonIssue
  }
};

Object.assign(plugin.configs, {
  // flat config format for ESLint v9+
  "flat/recommended": [
    {
      plugins: {
        "@salesforce-ux/slds": plugin,
      },
      rules: {
        "@salesforce-ux/slds/enforce-bem-usage": "error",
        "@salesforce-ux/slds/no-deprecated-classes-slds2": "error",
        "@salesforce-ux/slds/modal-close-button-issue": "error"
      },
      languageOptions: {
        parser: htmlParser,
        ecmaVersion: 2021,
        sourceType: "module"
      },
      files: ["**/*.html", "**/*.cmp"]
    }
  ],
  // legacy config for ESLint v8-
  recommended: {
    plugins: ["@salesforce-ux/slds"],
    rules: {
      "@salesforce-ux/slds/enforce-bem-usage": "error",
      "@salesforce-ux/slds/no-deprecated-classes-slds2": "error",
      "@salesforce-ux/slds/modal-close-button-issue": "error"
    },
    parser: htmlParser,
    parserOptions: {
      ecmaVersion: 2021,
      sourceType: "module"
    }
  }
});

module.exports = plugin;
