# @salesforce-ux/eslint-plugin-slds

ESLint plugin provides custom linting rules specifically built for Salesforce Lightning Design System 2 (SLDS 2 beta).

## Installation

```bash
npm install @salesforce-ux/eslint-plugin-slds --save-dev
```

## Requirements

- **Node.js**: 18.18.0 or higher
- **ESLint**: 8.0.0 or 9.0.0+

## Configuration

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
    extends: ['@salesforce-ux/slds/flat/recommended']
  }
]);
```

## Migration Note

> Always import the plugin from the root (`@salesforce-ux/eslint-plugin-slds`).
> The plugin automatically supports both legacy and flat config systems.

## Rules

- `enforce-bem-usage`: Enforces proper BEM methodology usage
- `no-deprecated-classes-slds2`: Prevents usage of deprecated SLDS classes
- `modal-close-button-issue`: Ensures proper modal close button implementation

## License

ISC