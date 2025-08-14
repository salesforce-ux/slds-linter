// Unified ESLint plugin config for both v8 (legacy) and v9+ (flat)

import enforceBemUsage from './rules/enforce-bem-usage';
import noDeprecatedClassesSlds2 from './rules/no-deprecated-classes-slds2';
import modalCloseButtonIssue from './rules/modal-close-button-issue';
import noSldsClassOverrides from './rules/v9/no-slds-class-overrides';
import noDeprecatedSldsClasses from './rules/v9/no-deprecated-slds-classes';
import noDeprecatedTokensSlds1 from './rules/v9/no-deprecated-tokens-slds1';
import lwcTokenToSldsHook from './rules/v9/lwc-token-to-slds-hook';
import enforceSdsToSldsHooks from './rules/v9/enforce-sds-to-slds-hooks';


import htmlParser from "@html-eslint/parser";
import cssPlugin from "@eslint/css";

const rules = {
  "enforce-bem-usage": enforceBemUsage,
  "no-deprecated-classes-slds2": noDeprecatedClassesSlds2,
  "modal-close-button-issue": modalCloseButtonIssue,
  "no-slds-class-overrides": noSldsClassOverrides,
  "no-deprecated-slds-classes": noDeprecatedSldsClasses,
  "no-deprecated-tokens-slds1": noDeprecatedTokensSlds1,
  "lwc-token-to-slds-hook": lwcTokenToSldsHook,
  "enforce-sds-to-slds-hooks": enforceSdsToSldsHooks
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
    // CSS config - Standard CSS files
    {
      files: ["**/*.{css,scss}"],
      language: "css/css",
      ...cssPlugin.configs.recommended,
      languageOptions: {
        tolerant: true  // Allow recoverable parsing errors for SCSS syntax
      },
      plugins: {
        css: cssPlugin,
        "@salesforce-ux/slds": plugin
      },
      rules: {
        "@salesforce-ux/slds/no-slds-class-overrides": "warn",
        "@salesforce-ux/slds/no-deprecated-slds-classes": "warn",
        "@salesforce-ux/slds/no-deprecated-tokens-slds1": "error",
        "@salesforce-ux/slds/lwc-token-to-slds-hook": "error"
        "@salesforce-ux/slds/enforce-bem-usage": "warn"
        "@salesforce-ux/slds/enforce-sds-to-slds-hooks": "warn"
      }
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
