import { defineConfig } from "eslint/config";
import { sldsCssPlugin } from "@salesforce-ux/eslint-plugin-slds";

export default defineConfig([
  {
    plugins: {
      ...sldsCssPlugin()
    },
    extends: ["@salesforce-ux/slds/recommended"]
  },
]);