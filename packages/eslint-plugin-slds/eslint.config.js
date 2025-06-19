const htmlParser = require('@html-eslint/parser');
const sldsPlugin = require('./build/index.js');

module.exports = [
  {
    files: ['**/*.{css,scss,html,cmp}'],
    languageOptions: {
      parser: htmlParser,
      ecmaVersion: 2021,
      sourceType: 'module'
    },
    plugins: {
      '@salesforce-ux/slds': sldsPlugin
    },
    rules: {
      '@salesforce-ux/slds/enforce-bem-usage': 'error',
      '@salesforce-ux/slds/no-deprecated-classes-slds2': 'error',
      '@salesforce-ux/slds/modal-close-button-issue': 'error',
      '@salesforce-ux/slds/no-slds-var-without-fallback': 'error'
    }
  },
  {
    ignores: ['node_modules/']
  }
]; 