const { defineConfig } = require("eslint/config");
const htmlParser = require("@html-eslint/parser");
const sldsPlugin = require("@salesforce-ux/eslint-plugin-slds");

module.exports = defineConfig([
  {
    files: ["**/*.html", "**/*.cmp"],
    languageOptions: {
      parser: htmlParser,
      ecmaVersion: 2021,
      sourceType: "module"
    },
    plugins: {
      "@salesforce-ux/slds": sldsPlugin
    },
    rules: {
      "@salesforce-ux/slds/enforce-bem-usage": "error",
      "@salesforce-ux/slds/no-deprecated-classes-slds2": "error",
      "@salesforce-ux/slds/modal-close-button-issue": "error"
    }
  },
  {
    ignores: ["node_modules/"]
  }
]); 