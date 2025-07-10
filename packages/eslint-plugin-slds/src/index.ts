const v8 = require('./v8');
const v9 = require('./v9');

const rules = v8.rules; // Both v8 and v9 use the same rules

const plugin = {
  meta: {
    name: "@salesforce-ux/eslint-plugin-slds",
    version: process.env.PLUGIN_VERSION
  },
  rules,
  configs: {
    // Flat config for ESLint v9+
    'flat/recommended': v9.configs.recommended,
    // Legacy config for ESLint v8-
    recommended: v8.configs.recommended,
  },
};

module.exports = plugin;