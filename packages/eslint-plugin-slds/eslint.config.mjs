import { defineConfig } from "eslint/config";
import slds from "@salesforce-ux/eslint-plugin-slds";

export default defineConfig([
  {
    plugins: {
      "@salesforce-ux/slds": slds
    },
    //@salesforce-ux/slds/flat/recommended-css-cssplugin: CSS config with only @eslint/css recommended rules (no SLDS rules)
    extends: ["@salesforce-ux/slds/recommended"]
    //defineConfig() helper helps which config to use internally.
  },
]);