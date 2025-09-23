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

- `no-hardcoded-values-slds2`: Replace static values with SLDS 2 styling hooks. For more information, look up design tokens on lightningdesignsystem.com.
- `no-slds-class-overrides`: Create new custom CSS classes instead of overriding SLDS selectors.
- `no-slds-var-without-fallback`: Add fallback values to SLDS styling hooks. The fallback values are used in Salesforce environments where styling hooks are unavailable.
- `no-slds-namespace-for-custom-hooks`: To differentiate custom styling hooks from SLDS styling hooks, create custom styling hooks in your namespace.
- `no-slds-private-var`: Some SLDS styling hooks are private and reserved only for internal Salesforce use. Private SLDS styling hooks have prefixes --_slds- and --slds-s-.
- `no-unsupported-hooks-slds2`: Identifies styling hooks that aren't present in SLDS 2. They must be replaced with styling hooks that have a similar effect, or they must be removed.
- `no-sldshook-fallback-for-lwctoken`: Avoid using --slds styling hooks as fallback values for --lwc tokens.
- `enforce-sds-to-slds-hooks`: Convert your existing --sds styling hooks to --slds styling hooks. See lightningdesignsystem.com for more info.
- `enforce-component-hook-naming-convention`: Replace component styling hooks that use a deprecated naming convention.
- `no-deprecated-slds-classes`: Please replace the deprecated classes with a modern equivalent.
- `reduce-annotations`: Remove your annotations and update your code.

## License

ISC