// Unified ESLint plugin config for both v8 (legacy) and v9+ (flat)

import enforceBemUsage from './rules/enforce-bem-usage';
import noDeprecatedClassesSlds2 from './rules/no-deprecated-classes-slds2';
import modalCloseButtonIssue from './rules/modal-close-button-issue';
import noSldsClassOverrides from './rules/v9/no-slds-class-overrides';
import noDeprecatedSldsClasses from './rules/v9/no-deprecated-slds-classes';
import noDeprecatedTokensSlds1 from './rules/v9/no-deprecated-tokens-slds1';
import lwcTokenToSldsHook from './rules/v9/lwc-token-to-slds-hook';
import enforceSdsToSldsHooks from './rules/v9/enforce-sds-to-slds-hooks';
import noSldshookFallbackForLwctoken from './rules/v9/no-sldshook-fallback-for-lwctoken';
import noUnsupportedHooksSlds2 from './rules/v9/no-unsupported-hooks-slds2';
import noSldsVarWithoutFallback from './rules/v9/no-slds-var-without-fallback';
import noSldsNamespaceForCustomHooks from './rules/v9/no-slds-namespace-for-custom-hooks';
import enforceComponentHookNamingConvention from './rules/v9/enforce-component-hook-naming-convention';
import reduceAnnotations from './rules/v9/reduce-annotations';
import noSldsPrivateVar from './rules/v9/no-slds-private-var';
import noHardcodedValuesSlds1 from './rules/v9/no-hardcoded-values/no-hardcoded-values-slds1';
import noHardcodedValuesSlds2 from './rules/v9/no-hardcoded-values/no-hardcoded-values-slds2';


import htmlParser from "@html-eslint/parser";
import cssPlugin from "@eslint/css";

// Import rule configurations based on persona
import ruleConfigs from '../eslint.rules.json';

const rules = {
  "enforce-bem-usage": enforceBemUsage,
  "no-deprecated-classes-slds2": noDeprecatedClassesSlds2,
  "modal-close-button-issue": modalCloseButtonIssue,
  "no-slds-class-overrides": noSldsClassOverrides,
  "no-deprecated-slds-classes": noDeprecatedSldsClasses,
  "no-deprecated-tokens-slds1": noDeprecatedTokensSlds1,
  "lwc-token-to-slds-hook": lwcTokenToSldsHook,
  "enforce-sds-to-slds-hooks": enforceSdsToSldsHooks,
  "no-sldshook-fallback-for-lwctoken": noSldshookFallbackForLwctoken,
  "no-unsupported-hooks-slds2": noUnsupportedHooksSlds2,
  "no-slds-var-without-fallback": noSldsVarWithoutFallback,
  "no-slds-namespace-for-custom-hooks": noSldsNamespaceForCustomHooks,
  "enforce-component-hook-naming-convention": enforceComponentHookNamingConvention,
  "no-slds-private-var": noSldsPrivateVar,
  "no-hardcoded-values-slds1": noHardcodedValuesSlds1,
  "no-hardcoded-values-slds2": noHardcodedValuesSlds2,
  "reduce-annotations": reduceAnnotations
};

const plugin = {
  meta: {
    name: "@salesforce-ux/eslint-plugin-slds",
    version: process.env.PLUGIN_VERSION
  },
  rules,
  configs: {}
};

const cssConfigArray = [
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
    rules: ruleConfigs.css,
    settings: {
      // Pass rules configuration to context for runtime access
      sldsRules: { ...ruleConfigs.css }
    }
  }
];

const htmlConfigArray = [
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
    rules: ruleConfigs.html
  }
];

Object.assign(plugin.configs, {
  // Flat config for ESLint v9+
  "flat/recommended-css": cssConfigArray,
  "flat/recommended-html": htmlConfigArray,
  "flat/recommended": [...cssConfigArray, ...htmlConfigArray],
  // legacy config for ESLint v8-
  recommended: {
    plugins: ["@salesforce-ux/slds"],
    rules: ruleConfigs.html,
    parser: htmlParser,
    parserOptions: {
      ecmaVersion: 2021,
      sourceType: "module"
    }
  }
});

module.exports = plugin;
