import { defineConfig } from "eslint/config";
import cssPlugin from "@eslint/css";
import slds from "@salesforce-ux/eslint-plugin-slds";

export default defineConfig([
  {
    language: "css/css",
    languageOptions: {
      tolerant: true
    },
    plugins: {
      "@salesforce-ux/slds": slds,
      css: cssPlugin
    },
    extends: ["@salesforce-ux/slds/recommended", "css/recommended"]
    //defineConfig() helper helps which config to use internally.
  },
]);