import { defineConfig } from "eslint/config";
import reactSldsPlugin from "@salesforce-ux/eslint-plugin-react-slds";

export default defineConfig([
  ...reactSldsPlugin.configs.recommended,
  ...reactSldsPlugin.configs["recommended-css"],
]);
