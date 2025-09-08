// Custom Stylelint configuration for v9 rules testing
import plugin from '@salesforce-ux/eslint-plugin-slds';

export default {
  plugins: [
    '@salesforce-ux/eslint-plugin-slds'
  ],
  rules: {
    // v9 no-hardcoded-values rules
    'slds/v9/no-hardcoded-values-slds1': 'error',
    'slds/v9/no-hardcoded-values-slds2': 'error',
    
    // Additional v9 rules
    'slds/v9/enforce-component-hook-naming-convention': 'error',
    'slds/v9/enforce-sds-to-slds-hooks': 'error',
    'slds/v9/lwc-token-to-slds-hook': 'error',
    'slds/v9/no-deprecated-slds-classes': 'error',
    'slds/v9/no-deprecated-tokens-slds1': 'error',
    'slds/v9/no-slds-class-overrides': 'error',
    'slds/v9/no-slds-namespace-for-custom-hooks': 'error',
    'slds/v9/no-slds-private-var': 'error',
    'slds/v9/no-slds-var-without-fallback': 'error',
    'slds/v9/no-sldshook-fallback-for-lwctoken': 'error',
    'slds/v9/no-unsupported-hooks-slds2': 'error',
    'slds/v9/reduce-annotations': 'error'
  }
};

