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

### ESLint v9 (Default)

The main entry point (`@salesforce-ux/eslint-plugin-slds`) always exports the ESLint v9+ (flat config) plugin by default.

```javascript
// eslint.config.js
import sldsPlugin from '@salesforce-ux/eslint-plugin-slds';

export default [
  sldsPlugin.configs.recommended
];
```

### ESLint v8

For ESLint v8 (legacy config), import from the explicit v8 entry point:

```javascript
// .eslintrc.js
module.exports = {
  plugins: ['@salesforce-ux/slds'],
  extends: ['plugin:@salesforce-ux/slds/recommended']
};
```

### Version-Specific Imports

You can also explicitly import version-specific configurations:

```javascript
// ESLint v9 (flat config)
import sldsPlugin from '@salesforce-ux/eslint-plugin-slds/v9';

// ESLint v8 (legacy config)
import sldsPlugin from '@salesforce-ux/eslint-plugin-slds/v8';
```

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