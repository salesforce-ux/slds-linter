# ESLint v8/v9 Dual Compatibility Guide

## Overview

This guide explains how `@salesforce-ux/eslint-plugin-slds` maintains compatibility with both ESLint v8 and v9 during the ecosystem transition period.

## Architecture

The plugin uses **environment-based configuration switching** rather than runtime version detection to ensure:

- **Reliability**: No dependency on ESLint version detection at runtime
- **Predictability**: Explicit control via environment variables
- **Performance**: No runtime overhead for version detection
- **Testability**: Easy to test both configurations

## Configuration Control

### Environment Variable

The plugin behavior is controlled by the `ESLINT_USE_FLAT_CONFIG` environment variable:

```bash
# Use ESLint v9 flat config (default)
ESLINT_USE_FLAT_CONFIG=true

# Use ESLint v8 legacy config
ESLINT_USE_FLAT_CONFIG=false
```

### Default Behavior

- **Default**: Flat config format (ESLint v9+)
- **Override**: Set environment variable to use legacy format

## Usage Patterns

### For ESLint v9 Projects

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

### For ESLint v8 Projects (e.g., with Skanilo)

```bash
# Set environment variable
export ESLINT_USE_FLAT_CONFIG=false
```

```javascript
// .eslintrc.js
module.exports = {
    extends: ["plugin:@salesforce-ux/slds/recommended"],
    // ... other configuration
};
```

### Using Compatibility Utilities (Optional)

For additional compatibility assurance:

```bash
npm install @eslint/compat --save-dev
```

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
        // ... rest of config
    }
];
``` 