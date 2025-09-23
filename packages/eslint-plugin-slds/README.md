# @salesforce-ux/eslint-plugin-slds

ESLint plugin provides custom linting rules specifically built for Salesforce Lightning Design System 2 (SLDS 2 beta).

## Requirements

- **Node.js**: 18.18.0 or higher
- **ESLint**: 8.0.0 or 9.0.0+

## Install

```bash
npm install @salesforce-ux/eslint-plugin-slds --save-dev
```

## Configure

### ESLint v8 (Legacy Config)

```javascript
// .eslintrc.js
module.exports = {
  plugins: ['@salesforce-ux/slds'],
  extends: ['plugin:@salesforce-ux/slds/recommended']
};
```

### ESLint v9+ (Flat Config)

```javascript
// eslint.config.js
const { defineConfig } = require('eslint/config');
const sldsPlugin = require('@salesforce-ux/eslint-plugin-slds');

module.exports = defineConfig([
  {
    plugins: {
      '@salesforce-ux/slds': sldsPlugin
    },
    extends: ['@salesforce-ux/slds/recommended']
  }
]);
```

## Migrate to the Latest Version

By default, the latest version of the plugin supports legacy and flat config systems.

## Supported Rules

### HTML/Component Rules

- `enforce-bem-usage`: Identifies instances that use the double-dash (--) syntax for block-element-modifier (BEM) in classes.
- `no-deprecated-classes-slds2`: Identifies classes that aren't available in SLDS 2.
- `modal-close-button-issue`: Identifies instances where the CSS classes or component attributes for the modal close button must be changed to follow the modal component blueprint.

### CSS Rules

- `no-hardcoded-values-slds2`: Identifies static or hard-coded values that must be replaced with SLDS 2 styling hooks.
- `no-slds-class-overrides`: Identifies existing class names that must be replaced with new custom CSS classes, instead of overriding SLDS selectors.
- `no-slds-var-without-fallback`: Identifies SLDS styling hooks that are specified without fallback values and recommends suitable fallback values based on the SLDS metadata. The fallback values are used in Salesforce environments where styling hooks are unavailable.
- `no-slds-namespace-for-custom-hooks`: Identifies custom styling hooks that use the --slds or --sds namespaces, which are reserved for SLDS styling hooks. To differentiate custom styling hooks from SLDS styling hooks, create custom styling hooks in your namespace.
- `no-slds-private-var`: Identifies SLDS styling hooks that are reserved only for internal Salesforce use. Private SLDS styling hooks have prefixes --_slds- and --slds-s-.
- `no-unsupported-hooks-slds2`: Identifies styling hooks that aren't present in SLDS 2. They must be replaced with styling hooks that have a similar effect, or they must be removed.
- `no-sldshook-fallback-for-lwctoken`: Identifies instances where --slds styling hooks are provided as fallback values for --lwc tokens.
- `enforce-sds-to-slds-hooks`: Identifies Salesforce Design System (SDS) styling hooks that must be replaced with the suggested SLDS 2 styling hooks. For more information, see lightningdesignsystem.com.
- `enforce-component-hook-naming-convention`: Identifies --slds-c component-level styling hooks that use a deprecated naming convention.
- `no-deprecated-slds-classes`: Please replace the deprecated classes with a modern equivalent.
- `reduce-annotations`: Identifies annotations that must be removed from the code.

## License

ISC