// This entry point exports the ESLint v9+ (flat config) plugin by default.
// For ESLint v8 (legacy config), import from '@salesforce-ux/eslint-plugin-slds/v8'.
// For ESLint v9+ (flat config), import from '@salesforce-ux/eslint-plugin-slds/v9'.
// 
// Version-specific rules:
// - v8: Basic rules (enforce-bem-usage, no-deprecated-classes-slds2, modal-close-button-issue)
// - v9: All v8 rules + no-slds-var-without-fallback (supports CSS/SCSS/HTML/CMP files)
// 
// See package.json "exports" field for details.

module.exports = require('./v9');