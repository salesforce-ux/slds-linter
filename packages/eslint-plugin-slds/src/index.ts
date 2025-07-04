// This entry point exports the ESLint v8 (legacy config) plugin by default.
// For ESLint v8 (legacy config), import from '@salesforce-ux/eslint-plugin-slds/v8'.
// For ESLint v9+ (flat config), import from '@salesforce-ux/eslint-plugin-slds/v9'.
// See package.json "exports" field for details.
//
// v8 and v9 rules are now organized for scalability:
// - Shared rules: src/rules/
// - v8-only rules: src/v8/rules/
// - v9-only rules: src/v9/rules/

export = require('./v8');