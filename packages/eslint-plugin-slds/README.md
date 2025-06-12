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

### Quick Start (Recommended)

```javascript
// eslint.config.js (ESLint v9)
const slds = require("@salesforce-ux/eslint-plugin-slds");

module.exports = [slds.configs.recommended];
```

```javascript
// .eslintrc.js (ESLint v8)
module.exports = {
    extends: ["plugin:@salesforce-ux/slds/recommended"]
};
```

## Rules

- `enforce-bem-usage`: Enforces proper BEM methodology usage
- `no-deprecated-classes-slds2`: Prevents usage of deprecated SLDS classes
- `modal-close-button-issue`: Ensures proper modal close button implementation

## Compatibility

- Supports both ESLint v8 and v9
- Automatic configuration format detection
- No breaking changes to existing rules

## License

ISC