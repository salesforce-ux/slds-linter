# @salesforce-ux/eslint-plugin-slds

ESLint plugin to lint markup files against SLDS linter rules

## Requirements

- ESLint 9.x or higher
- Node.js 18.18.0 or higher

## Installation

```bash
npm install --save-dev @salesforce-ux/eslint-plugin-slds eslint @html-eslint/parser
```

## Usage

### ESLint v9 (Flat Config)

Create an `eslint.config.js` file in your project root:

```javascript
const htmlParser = require("@html-eslint/parser");
const sldsPlugin = require("@salesforce-ux/eslint-plugin-slds");

module.exports = [
    {
        files: ["**/*.html", "**/*.cmp"],
        languageOptions: {
            parser: htmlParser,
            ecmaVersion: 2021,
            sourceType: "module"
        },
        plugins: {
            "@salesforce-ux/slds": sldsPlugin
        },
        rules: {
            "@salesforce-ux/slds/enforce-bem-usage": "error",
            "@salesforce-ux/slds/no-deprecated-classes-slds2": "error",
            "@salesforce-ux/slds/modal-close-button-issue": "error"
        }
    }
];
```

Or use the recommended config:

```javascript
const sldsPlugin = require("@salesforce-ux/eslint-plugin-slds");

module.exports = [
    sldsPlugin.configs.recommended
];
```

### Legacy ESLint v8.x

For ESLint v8.x, set the environment variable `ESLINT_USE_FLAT_CONFIG=false` and use a `.eslintrc.yml` file:

```yaml
root: true
env:
  es2021: true
  node: true
parser: "@html-eslint/parser"
parserOptions:
  ecmaVersion: 2021
  sourceType: module
ignorePatterns:
  - "node_modules/"
overrides:
  - files:
      - "*.html"
      - "*.cmp"
    parser: "@html-eslint/parser"
    plugins:
      - "@html-eslint"
      - "@salesforce-ux/slds"
    rules:
      "@salesforce-ux/slds/enforce-bem-usage": "error"
      "@salesforce-ux/slds/no-deprecated-classes-slds2": "error"
      "@salesforce-ux/slds/modal-close-button-issue": "error"
```

## Rules

- `@salesforce-ux/slds/enforce-bem-usage` - Enforces proper BEM naming conventions for SLDS classes
- `@salesforce-ux/slds/no-deprecated-classes-slds2` - Prevents usage of deprecated SLDS classes
- `@salesforce-ux/slds/modal-close-button-issue` - Enforces proper modal close button implementation