import { defineConfig } from "eslint/config";
import slds from "@salesforce-ux/eslint-plugin-slds";

export default defineConfig([
  {
    plugins: {
      "@salesforce-ux/slds": slds,
    },
    extends: ["@salesforce-ux/slds/recommended"]
    //defineConfig() helper helps which config to use internally.
  },
]);