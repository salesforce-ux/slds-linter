# Persona-Based Configuration for ESLint Plugin SLDS

This ESLint plugin now supports persona-based configurations similar to the stylelint plugin, allowing different rule severities for internal and external users.

## Overview

The plugin provides two personas:
- **External** (default): For external developers using SLDS
- **Internal**: For internal Salesforce developers with stricter rules

## Configuration Files

### Rule Configuration Files
- `eslint.rules.json` - External user rules (warnings for most style issues)
- `eslint.rules.internal.json` - Internal user rules (errors for most style issues)

### ESLint v9 Flat Config Files
- `eslint.config.external.mjs` - Ready-to-use external configuration
- `eslint.config.internal.mjs` - Ready-to-use internal configuration
- `eslint.config.mjs` - Default configuration (uses external rules)

## Usage

### Method 1: Use Pre-configured Files

For **external users**:
```javascript
// eslint.config.js
import config from '@salesforce-ux/eslint-plugin-slds/eslint.config.external.mjs';
export default config;
```

For **internal users**:
```javascript
// eslint.config.js
import config from '@salesforce-ux/eslint-plugin-slds/eslint.config.internal.mjs';
export default config;
```

### Method 2: Build with Persona Environment Variable

When building the plugin from source:

```bash
# Build for external users (default)
npm run build

# Build for internal users
TARGET_PERSONA=internal npm run build
```

The build process will automatically:
1. Replace rule configuration imports based on the `TARGET_PERSONA` environment variable
2. Use appropriate metadata sources for internal builds
3. Generate the correct rule severities in the compiled output

### Method 3: Manual Configuration

You can also manually configure rules by importing the plugin and setting rules according to your needs:

```javascript
// eslint.config.js
import plugin from '@salesforce-ux/eslint-plugin-slds';
import cssPlugin from '@eslint/css';

export default [
  {
    files: ["**/*.{css,scss}"],
    language: "css/css",
    ...cssPlugin.configs.recommended,
    plugins: {
      css: cssPlugin,
      "@salesforce-ux/slds": plugin
    },
    rules: {
      // Customize rule severities as needed
      "@salesforce-ux/slds/no-hardcoded-values-slds2": "warn", // or "error"
      "@salesforce-ux/slds/no-slds-class-overrides": "error",
      // ... other rules
    }
  }
];
```

## Rule Differences Between Personas

| Rule | External | Internal |
|------|----------|----------|
| `no-slds-class-overrides` | warn | error |
| `no-deprecated-slds-classes` | warn | error |
| `enforce-sds-to-slds-hooks` | warn | error |
| `no-sldshook-fallback-for-lwctoken` | warn | error |
| `no-unsupported-hooks-slds2` | warn | error |
| `no-slds-var-without-fallback` | warn | error |
| `no-slds-namespace-for-custom-hooks` | warn | error |
| `no-slds-private-var` | warn | error |
| `no-hardcoded-values-slds2` | warn | error |
| `reduce-annotations` | warn | error |

*Note: Rules marked as "error" in both personas remain as "error" (e.g., `no-deprecated-tokens-slds1`, `lwc-token-to-slds-hook`, `enforce-component-hook-naming-convention`, `no-hardcoded-values-slds1`)*

## ESLint v9 Compatibility

This implementation is fully compatible with ESLint v9's flat configuration system. The configurations use:

- **Flat config format** for ESLint v9+
- **Legacy format support** for ESLint v8 (maintained in the plugin)
- **File-specific configurations** for different file types (HTML, CSS, SCSS)
- **Language-specific parsers** (HTML parser for components, CSS parser for stylesheets)

## Build System Integration

The persona-based system integrates with the existing build pipeline:

1. **Development builds**: Use default external persona
2. **Internal builds**: Set `TARGET_PERSONA=internal` environment variable
3. **CI/CD**: Configure environment variables based on deployment target
4. **Package publishing**: Different packages can be built for different audiences

## Migration from Previous Versions

If you were using the plugin without persona-based configuration:

1. **No changes needed** - the default behavior uses external persona rules
2. **For stricter linting** - switch to internal configuration files
3. **Custom configurations** - continue to work as before

## Examples

### Package.json Scripts
```json
{
  "scripts": {
    "lint:external": "eslint --config eslint.config.external.mjs .",
    "lint:internal": "eslint --config eslint.config.internal.mjs .",
    "build:external": "npm run build",
    "build:internal": "TARGET_PERSONA=internal npm run build"
  }
}
```

### CI/CD Integration
```yaml
# GitHub Actions example
- name: Build for Internal
  run: TARGET_PERSONA=internal npm run build
  if: github.ref == 'refs/heads/internal'

- name: Build for External  
  run: npm run build
  if: github.ref == 'refs/heads/main'
```
