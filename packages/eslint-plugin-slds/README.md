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

```javascript
// eslint.config.js
const slds = require("@salesforce-ux/eslint-plugin-slds");

module.exports = [slds.configs.recommended];
```

### ESLint v8 (Legacy)

**Important**: ESLint v8 users must set the environment variable to use legacy configuration format.

```bash
# Set environment variable for ESLint v8
export ESLINT_USE_FLAT_CONFIG=false
```

```javascript
// .eslintrc.js
module.exports = {
    extends: ["plugin:@salesforce-ux/slds/recommended"]
};
```

Or run ESLint with the environment variable:

```bash
ESLINT_USE_FLAT_CONFIG=false npx eslint .
```

## Rules

- `enforce-bem-usage`: Enforces proper BEM methodology usage
- `no-deprecated-classes-slds2`: Prevents usage of deprecated SLDS classes
- `modal-close-button-issue`: Ensures proper modal close button implementation

## Compatibility

- **ESLint v9**: Works out of the box (default flat config format)
- **ESLint v8**: Requires `ESLINT_USE_FLAT_CONFIG=false` environment variable
- **Configuration Format**: Defaults to ESLint v9 flat config format
- **Legacy Support**: ESLint v8 users must explicitly enable legacy format
- **Rules**: No breaking changes to existing rule behavior

## Troubleshooting

### ESLint v8 Configuration Issues

If you're using ESLint v8 and encountering configuration errors, ensure you've set the environment variable:

```bash
# In your package.json scripts
{
  "scripts": {
    "lint": "ESLINT_USE_FLAT_CONFIG=false eslint ."
  }
}

# Or in your shell profile (.bashrc, .zshrc, etc.)
export ESLINT_USE_FLAT_CONFIG=false
```

### Verifying Configuration Format

You can verify which configuration format the plugin is using:

```javascript
const plugin = require('@salesforce-ux/eslint-plugin-slds');
console.log('Format:', plugin.configs.recommended.languageOptions ? 'Flat Config (v9)' : 'Legacy Config (v8)');
```

## License

ISC