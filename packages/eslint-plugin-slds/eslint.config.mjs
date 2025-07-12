import { defineConfig } from "eslint/config";
import htmlParser from "@html-eslint/parser";
import cssPlugin from "@eslint/css";
import slds from "@salesforce-ux/eslint-plugin-slds";

export default defineConfig([
  {
    files: ["**/*.html", "**/*.cmp"],
    languageOptions: {
      parser: htmlParser,
      ecmaVersion: 2021,
      sourceType: "module"
    },
    plugins: {
      "@salesforce-ux/slds": slds
    },
    rules: {
      "@salesforce-ux/slds/enforce-bem-usage": "error",
      "@salesforce-ux/slds/no-deprecated-classes-slds2": "error",
      "@salesforce-ux/slds/modal-close-button-issue": "error"
    }
  },
  {
    files: ["**/*.{css,scss}"],
    language: "css/css",
    ...cssPlugin.configs.recommended,
    plugins: {
      css: cssPlugin,
      "@salesforce-ux/slds": slds
    },
    rules: {
      ...cssPlugin.configs.recommended.rules,
      "@salesforce-ux/slds/no-hardcoded-values-slds1": "error",
      "@salesforce-ux/slds/no-hardcoded-values-slds2": "warn"
    }
  },
  {
    ignores: ["node_modules/"]
  }
]);
