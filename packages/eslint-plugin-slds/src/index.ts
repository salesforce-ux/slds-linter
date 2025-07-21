// Unified ESLint plugin config for both v8 (legacy) and v9+ (flat)

import enforceBemUsage from './rules/enforce-bem-usage';
import noDeprecatedClassesSlds2 from './rules/no-deprecated-classes-slds2';
import modalCloseButtonIssue from './rules/modal-close-button-issue';
import htmlParser from "@html-eslint/parser";
import noHardcodedValuesSlds1 from './v9/rules/no-hardcoded-values-slds1';
import noHardcodedValuesSlds2 from './v9/rules/no-hardcoded-values-slds2';
import noImportantTag from './v9/rules/no-important-tag';
import noSldsClassOverrides from './v9/rules/no-slds-class-overrides';
import cssPlugin from "@eslint/css";

// HTML-specific rules
const htmlRules = {
  "enforce-bem-usage": enforceBemUsage,
  "no-deprecated-classes-slds2": noDeprecatedClassesSlds2,
  "modal-close-button-issue": modalCloseButtonIssue,
};

// CSS-specific rules (v9 only)
const styleRules = {
  "no-hardcoded-values-slds1": noHardcodedValuesSlds1,
  "no-hardcoded-values-slds2": noHardcodedValuesSlds2,
  "no-important-tag": noImportantTag,
  "no-slds-class-overrides": noSldsClassOverrides,
};

// Combined rules for the plugin
const rules = {
  ...htmlRules,
  ...styleRules,
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
    // HTML and CMP files configuration
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
    // CSS/SCSS files configuration
    {
      files: ["**/*.{css,scss}"],
      language: "css/css",
      ...cssPlugin.configs.recommended,
      plugins: {
        css: cssPlugin,
        "@salesforce-ux/slds": plugin
      },
      rules: {
        ...cssPlugin.configs.recommended.rules,
        "@salesforce-ux/slds/no-hardcoded-values-slds1": "error",
        "@salesforce-ux/slds/no-hardcoded-values-slds2": "warn",
        "@salesforce-ux/slds/no-important-tag": "warn",
        "@salesforce-ux/slds/no-slds-class-overrides": "warn"
      }
    },
    {
      ignores: ["node_modules/"]
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
