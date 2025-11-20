import { defineConfig } from "eslint/config";
import cssPlugin from "@eslint/css";
import slds from "@salesforce-ux/eslint-plugin-slds";

export default defineConfig([
  {
    plugins: {
      "@salesforce-ux/slds": slds,
      css: cssPlugin
    },
    extends: ["@salesforce-ux/slds/recommended"]
    //defineConfig() helper helps which config to use internally.
  },
]);