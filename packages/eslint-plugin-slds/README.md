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

- `enforce-bem-usage`: Identifies instances that use the double-dash (--) syntax for block-element-modifier (BEM) in classes.
- `no-deprecated-classes-slds2`: Identifies classes that aren’t available in SLDS 2.
- `modal-close-button-issue`: Identifies instances where the CSS classes or component attributes for the modal close button must be changed to follow the modal component blueprint.

## License

ISC