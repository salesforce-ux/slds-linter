# Persona-Based Rule Configuration Mapping

This document shows the rule severity mappings between external and internal personas, aligned with the shared stylelint configuration.

## Rule Severity Comparison

| Rule | External | Internal | Notes |
|------|----------|----------|-------|
| `enforce-bem-usage` | warn | warn | Consistent across personas |
| `no-deprecated-classes-slds2` | error | error | Critical rule - always error |
| `modal-close-button-issue` | error | error | Critical rule - always error |
| `no-slds-class-overrides` | warn | **error** | Stricter for internal |
| `no-deprecated-slds-classes` | warn | **error** | Stricter for internal |
| `no-deprecated-tokens-slds1` | error | error | Critical rule - always error |
| `lwc-token-to-slds-hook` | warn | warn | Consistent across personas |
| `enforce-sds-to-slds-hooks` | warn | **error** | Stricter for internal |
| `no-sldshook-fallback-for-lwctoken` | warn | **error** | Stricter for internal |
| `no-unsupported-hooks-slds2` | warn | **error** | Stricter for internal |
| `no-slds-var-without-fallback` | warn | **error** | Stricter for internal |
| `no-slds-namespace-for-custom-hooks` | warn | **error** | Stricter for internal |
| `enforce-component-hook-naming-convention` | error | error | Critical rule - always error |
| `no-slds-private-var` | warn | **error** | Stricter for internal |
| `no-hardcoded-values-slds1` | error | error | Critical rule - always error |
| `no-hardcoded-values-slds2` | warn | **error** | Stricter for internal |
| `reduce-annotations` | warn | **error** | Stricter for internal |

## Alignment with Shared Configuration

The rule configurations have been updated to align with the shared stylelint rule list:

### Rules that remain "error" for both personas:
- `no-deprecated-classes-slds2`
- `modal-close-button-issue` 
- `no-deprecated-tokens-slds1`
- `enforce-component-hook-naming-convention`
- `no-hardcoded-values-slds1`

### Rules that are "warn" for external, "error" for internal:
- `no-slds-class-overrides`
- `no-deprecated-slds-classes`
- `enforce-sds-to-slds-hooks`
- `no-sldshook-fallback-for-lwctoken`
- `no-unsupported-hooks-slds2`
- `no-slds-var-without-fallback`
- `no-slds-namespace-for-custom-hooks`
- `no-slds-private-var`
- `no-hardcoded-values-slds2`
- `reduce-annotations`

### Rules that remain "warn" for both personas:
- `enforce-bem-usage`
- `lwc-token-to-slds-hook`

## Build System Integration

The persona-based configuration is implemented using:

1. **Rule Configuration Files:**
   - `eslint.rules.json` - External persona rules
   - `eslint.rules.internal.json` - Internal persona rules

2. **Build-Time Replacement:**
   - Environment variable `TARGET_PERSONA=internal` switches to internal rules
   - Uses `conditionalReplacePlugin` in gulpfile.mjs
   - Replaces import statements during build process

3. **ESLint v9 Compatibility:**
   - Flat configuration format
   - Dynamic rule loading based on persona
   - Maintains backward compatibility with ESLint v8

## Usage Examples

```bash
# Build for external users (default)
npm run build

# Build for internal users  
TARGET_PERSONA=internal npm run build
```

The implementation follows the same pattern as the [stylelint plugin](https://github.com/salesforce-ux/slds-linter/tree/main/packages/stylelint-plugin-slds) for consistency across the codebase.
