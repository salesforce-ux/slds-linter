// Custom ESLint configuration for v9 rules testing
import plugin from '@salesforce-ux/eslint-plugin-slds';
import cssPlugin from '@eslint/css';

export default [
  {
    files: ['**/*.css'],
    language: 'css/css',
    ...cssPlugin.configs.recommended,
    plugins: {
      css: cssPlugin,
      slds: plugin
    },
    rules: {
      // v9 no-hardcoded-values rules
      'slds/no-hardcoded-values-slds1': 'error',
      'slds/no-hardcoded-values-slds2': 'error',
      
      // Additional v9 rules
      'slds/enforce-component-hook-naming-convention': 'error',
      'slds/enforce-sds-to-slds-hooks': 'error', 
      'slds/lwc-token-to-slds-hook': 'error',
      'slds/no-deprecated-slds-classes': 'error',
      'slds/no-deprecated-tokens-slds1': 'error',
      'slds/no-slds-class-overrides': 'error',
      'slds/no-slds-namespace-for-custom-hooks': 'error',
      'slds/no-slds-private-var': 'error',
      'slds/no-slds-var-without-fallback': 'error',
      'slds/no-sldshook-fallback-for-lwctoken': 'error',
      'slds/no-unsupported-hooks-slds2': 'error',
      'slds/reduce-annotations': 'error'
    }
  }
];
