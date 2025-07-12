// Unified ESLint plugin config for both v8 (legacy) and v9+ (flat)

import enforceBemUsage from './rules/enforce-bem-usage';
import noDeprecatedClassesSlds2 from './rules/no-deprecated-classes-slds2';
import modalCloseButtonIssue from './rules/modal-close-button-issue';
import htmlParser from "@html-eslint/parser";
import noHardcodedValuesSlds1 from './v9/rules/no-hardcoded-values-slds1';
import noHardcodedValuesSlds2 from './v9/rules/no-hardcoded-values-slds2';

const rules = {
  "enforce-bem-usage": enforceBemUsage,
  "no-deprecated-classes-slds2": noDeprecatedClassesSlds2,
  "modal-close-button-issue": modalCloseButtonIssue,
  "no-hardcoded-values-slds1": noHardcodedValuesSlds1,
  "no-hardcoded-values-slds2": noHardcodedValuesSlds2,
};

const plugin = {
  meta: {
    name: "@salesforce-ux/eslint-plugin-slds",
    version: process.env.PLUGIN_VERSION
  },
  rules,
  configs: {}
};

Object.assign(plugin.configs, {
  // Flat config for ESLint v9+
  "flat/recommended": [
    {
      plugins: {
        "@salesforce-ux/slds": plugin,
      },
      rules: {
        "@salesforce-ux/slds/enforce-bem-usage": "error",
        "@salesforce-ux/slds/no-deprecated-classes-slds2": "error",
        "@salesforce-ux/slds/modal-close-button-issue": "error",
        "@salesforce-ux/slds/no-hardcoded-values-slds1": "error",
        "@salesforce-ux/slds/no-hardcoded-values-slds2": "warn"
      },
      languageOptions: {
        parser: htmlParser,
        ecmaVersion: 2021,
        sourceType: "module"
      },
      files: ["**/*.html", "**/*.cmp", "**/*.css", "**/*.scss"]
    }
  ],
  // Legacy config for ESLint v8-
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
