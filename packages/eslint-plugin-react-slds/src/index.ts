import enforceBemUsage from './rules/enforce-bem-usage';
import noDeprecatedClassesSlds2 from './rules/no-deprecated-classes-slds2';
import noSldsClassOverrides from './rules/no-slds-class-overrides';
import noDeprecatedTokensSlds1 from './rules/no-deprecated-tokens-slds1';
import lwcTokenToSldsHook from './rules/lwc-token-to-slds-hook';
import enforceSdsToSldsHooks from './rules/enforce-sds-to-slds-hooks';
import noSldshookFallbackForLwctoken from './rules/no-sldshook-fallback-for-lwctoken';
import noSldsVarWithoutFallback from './rules/no-slds-var-without-fallback';
import noUnsupportedHooksSlds2 from './rules/no-unsupported-hooks-slds2';
import noSldsNamespaceForCustomHooks from './rules/no-slds-namespace-for-custom-hooks';
import enforceComponentHookNamingConvention from './rules/enforce-component-hook-naming-convention';
import noSldsPrivateVar from './rules/no-slds-private-var';
import noHardcodedValuesSlds2 from './rules/no-hardcoded-values-slds2';
import noInvalidHookPropertyUsage from './rules/no-invalid-hook-property-usage';
import foundationPlugin from '@salesforce-ux/eslint-plugin-slds';
import tsParser from '@typescript-eslint/parser';
import type { Linter, Rule } from "eslint";
import ruleConfigs from '../eslint.rules.json';

const rules = {
  "enforce-bem-usage": enforceBemUsage,
  "no-deprecated-classes-slds2": noDeprecatedClassesSlds2,
  "no-slds-class-overrides": noSldsClassOverrides,
  "no-deprecated-tokens-slds1": noDeprecatedTokensSlds1,
  "lwc-token-to-slds-hook": lwcTokenToSldsHook,
  "enforce-sds-to-slds-hooks": enforceSdsToSldsHooks,
  "no-sldshook-fallback-for-lwctoken": noSldshookFallbackForLwctoken,
  "no-slds-var-without-fallback": noSldsVarWithoutFallback,
  "no-unsupported-hooks-slds2": noUnsupportedHooksSlds2,
  "no-slds-namespace-for-custom-hooks": noSldsNamespaceForCustomHooks,
  "enforce-component-hook-naming-convention": enforceComponentHookNamingConvention,
  "no-slds-private-var": noSldsPrivateVar,
  "no-hardcoded-values-slds2": noHardcodedValuesSlds2,
  "no-invalid-hook-property-usage": noInvalidHookPropertyUsage,
};

type ReactSldsPlugin = {
  meta: { name: string; version: string; namespace: string };
  rules: Record<string, Rule.RuleModule>;
  configs: Record<"recommended" | "recommended-css", Linter.FlatConfig[]>;
};

type FoundationSldsPlugin = {
  configs: Record<"flat/recommended-css", Linter.FlatConfig[]>;
};

const plugin: ReactSldsPlugin = {
  meta: {
    name: "@salesforce-ux/eslint-plugin-react-slds",
    version: process.env.PLUGIN_VERSION,
    namespace: "@salesforce-ux/slds"
  },
  rules: rules as unknown as Record<string, Rule.RuleModule>,
  configs: {} as ReactSldsPlugin["configs"]
};

const reactConfigArray = [{
  name: "@salesforce-ux/slds/recommended",
  files: ["**/*.{jsx,tsx}"],
  languageOptions: {
    parser: tsParser,
    parserOptions: { ecmaVersion: "latest", sourceType: "module", ecmaFeatures: { jsx: true } },
  },
  plugins: { "@salesforce-ux/slds": plugin },
  rules: ruleConfigs.react as Linter.RulesRecord,
}];

Object.assign(plugin.configs, {
  recommended: reactConfigArray,
  "recommended-css": (foundationPlugin as unknown as FoundationSldsPlugin).configs["flat/recommended-css"],
});

function sldsReactPlugin() {
  return {
    "@salesforce-ux/slds": plugin,
  };
}

export { sldsReactPlugin };
export default plugin;
