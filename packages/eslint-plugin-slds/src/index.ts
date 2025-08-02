// Unified ESLint plugin config for both v8 (legacy) and v9+ (flat)

import enforceBemUsage from './rules/enforce-bem-usage';
import noDeprecatedClassesSlds2 from './rules/no-deprecated-classes-slds2';
import modalCloseButtonIssue from './rules/modal-close-button-issue';
import noImportantTag from './rules/v9/rules/no-important-tag';
import noSldsClassOverrides from './rules/v9/rules/no-slds-class-overrides';
import htmlParser from "@html-eslint/parser";
import cssPlugin from "@eslint/css";

const rules = {
  "enforce-bem-usage": enforceBemUsage,
  "no-deprecated-classes-slds2": noDeprecatedClassesSlds2,
  "modal-close-button-issue": modalCloseButtonIssue,
  "no-important-tag": noImportantTag,
  "no-slds-class-overrides": noSldsClassOverrides,
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
    // HTML/Component config
    {
      files: ["**/*.html", "**/*.cmp"],
      languageOptions: {
        parser: htmlParser,
        ecmaVersion: 2021,
        sourceType: "module"
      },
      plugins: {
        "@salesforce-ux/slds": plugin
      },
      rules: {
        "@salesforce-ux/slds/enforce-bem-usage": "error",
        "@salesforce-ux/slds/no-deprecated-classes-slds2": "error",
        "@salesforce-ux/slds/modal-close-button-issue": "error"
      }
    },
    // CSS/SCSS config
    {
      files: ["**/*.{css,scss}"],
      language: "css/css",
      ...cssPlugin.configs.recommended,
      plugins: {
        css: cssPlugin,
        "@salesforce-ux/slds": plugin
      },
      rules: {
        "@salesforce-ux/slds/no-important-tag": "error",
        "@salesforce-ux/slds/no-slds-class-overrides": "warn"
      }
    },
    {
      ignores: ["node_modules/"]
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
