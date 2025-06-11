# @salesforce-ux/eslint-plugin-slds

ESLint plugin provides custom linting rules specifically built for Salesforce Lightning Design System 2 (SLDS 2 beta).

## Installation

```bash
npm install @salesforce-ux/eslint-plugin-slds --save-dev
```

## ESLint Version Compatibility

This plugin supports both **ESLint v8** and **ESLint v9** during the transition period. The plugin automatically detects your ESLint version and provides the appropriate configuration format.

### Requirements

- **Node.js**: 18.18.0 or higher
- **ESLint**: 8.0.0 or 9.0.0+

## Configuration

### ESLint v9 (Flat Config)

```javascript
// eslint.config.js
import slds from "@salesforce-ux/eslint-plugin-slds";

export default [
    {
        files: ["**/*.html", "**/*.cmp"],
        plugins: {
            "@salesforce-ux/slds": slds
        },
        languageOptions: {
            parser: "@html-eslint/parser"
        },
        rules: {
            "@salesforce-ux/slds/enforce-bem-usage": "error",
            "@salesforce-ux/slds/no-deprecated-classes-slds2": "error",
            "@salesforce-ux/slds/modal-close-button-issue": "error"
        }
    }
];
```

### ESLint v8 (Legacy Configuration)

```javascript
// .eslintrc.js
module.exports = {
    extends: ["plugin:@salesforce-ux/slds/recommended"],
    // or manually configure:
    plugins: ["@salesforce-ux/slds"],
    parser: "@html-eslint/parser",
    overrides: [
        {
            files: ["**/*.html", "**/*.cmp"],
            rules: {
                "@salesforce-ux/slds/enforce-bem-usage": "error",
                "@salesforce-ux/slds/no-deprecated-classes-slds2": "error",
                "@salesforce-ux/slds/modal-close-button-issue": "error"
            }
        }
    ]
};
```

## Migration from ESLint v8 to v9

### Using Compatibility Utilities

If you encounter issues with ESLint v9, you can use the ESLint compatibility utilities:

```javascript
// eslint.config.js
import { fixupPluginRules } from "@eslint/compat";
import slds from "@salesforce-ux/eslint-plugin-slds";

export default [
    {
        files: ["**/*.html", "**/*.cmp"],
        plugins: {
            "@salesforce-ux/slds": fixupPluginRules(slds)
        },
        languageOptions: {
            parser: "@html-eslint/parser"
        },
        rules: {
            "@salesforce-ux/slds/enforce-bem-usage": "error",
            "@salesforce-ux/slds/no-deprecated-classes-slds2": "error",
            "@salesforce-ux/slds/modal-close-button-issue": "error"
        }
    }
];
```

### Gradual Migration Strategy

1. **Keep using ESLint v8** until all your dependencies (like Skanilo) support ESLint v9
2. **Test with ESLint v9** in a separate branch using the compatibility utilities
3. **Migrate incrementally** when all dependencies are ready

## Usage Examples

### With Skanilo (ESLint v8)

If you're using Skanilo which currently requires ESLint v8:

```javascript
// .eslintrc.js
module.exports = {
    extends: [
        "plugin:@salesforce-ux/slds/recommended",
        // ... other Skanilo configs
    ],
    plugins: ["@salesforce-ux/slds"],
    overrides: [
        {
            files: ["**/*.html", "**/*.cmp"],
            parser: "@html-eslint/parser"
        }
    ]
};
```

## Rules

- `enforce-bem-usage`: Enforces proper BEM methodology usage
- `no-deprecated-classes-slds2`: Prevents usage of deprecated SLDS classes
- `modal-close-button-issue`: Ensures proper modal close button implementation

## Troubleshooting

### Version Detection Issues

If the plugin doesn't detect your ESLint version correctly, you can force a specific configuration:

```javascript
// For ESLint v8 users who want to use v9 format
process.env.ESLINT_USE_FLAT_CONFIG = "false";

// For ESLint v9 users who want to use legacy format
process.env.ESLINT_USE_FLAT_CONFIG = "true";
```

### Dependency Conflicts

If you encounter peer dependency warnings, you can use npm's `overrides` or yarn's `resolutions`:

```json
{
  "overrides": {
    "eslint": "^8.0.0"
  }
}
```

## Compatibility Notes

- The plugin automatically detects ESLint version at runtime
- Both configuration formats are supported simultaneously
- Tests run with the appropriate RuleTester format based on ESLint version
- No breaking changes to existing rule behavior

## Contributing

When contributing to this plugin, ensure your changes work with both ESLint v8 and v9:

1. Run tests with both ESLint versions
2. Update configurations in both formats
3. Document any version-specific behavior

## License

ISC