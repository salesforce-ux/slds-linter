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

### Default Export (ESLint v8)

The main entry point (`@salesforce-ux/eslint-plugin-slds`) exports the ESLint v8 (legacy config) plugin by default for backward compatibility.

```javascript
// .eslintrc.js
module.exports = {
  plugins: ['@salesforce-ux/slds'],
  extends: ['plugin:@salesforce-ux/slds/recommended']
};
```

### ESLint v9 (Flat Config)

For ESLint v9+ (flat config), import from the explicit v9 entry point:

```javascript
// eslint.config.js
const sldsPlugin = require('@salesforce-ux/eslint-plugin-slds/v9');

module.exports = [
  {
    files: ['**/*.html', '**/*.cmp'],
    plugins: {
      '@salesforce-ux/slds': sldsPlugin
    },
    rules: {
      '@salesforce-ux/slds/enforce-bem-usage': 'error',
      '@salesforce-ux/slds/no-deprecated-classes-slds2': 'error',
      '@salesforce-ux/slds/modal-close-button-issue': 'error'
    }
  }
];
```

### Version-Specific Imports

You can explicitly import version-specific configurations:

```javascript
// ESLint v9 (flat config)
const sldsPlugin = require('@salesforce-ux/eslint-plugin-slds/v9');

// ESLint v8 (legacy config)
import sldsPlugin from '@salesforce-ux/eslint-plugin-slds/v8';
```

## Package Exports

This package provides multiple entry points:

- **`.`** (default): ESLint v8 plugin (legacy config format)
- **`./v8`**: ESLint v8 plugin (legacy config format)
- **`./v9`**: ESLint v9 plugin (flat config format)
- **`./eslint.config.js`**: Pre-configured flat config file

## Peer Dependency: ESLint

This plugin lists `eslint` as a peer dependency. This means:
- **You must install `eslint` in your project.**
- You can choose the version (v8 or v9) that matches your project needs.
- This avoids version conflicts and ensures compatibility.

## Rules

- `enforce-bem-usage`: Enforces proper BEM methodology usage
- `no-deprecated-classes-slds2`: Prevents usage of deprecated SLDS classes
- `modal-close-button-issue`: Ensures proper modal close button implementation

## License

ISC