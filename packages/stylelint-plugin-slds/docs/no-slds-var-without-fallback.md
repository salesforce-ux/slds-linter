# No SLDS Variable Without Fallback (`slds/no-slds-var-without-fallback`)

## Description

Enforces that all SLDS CSS variables (`--slds-*`) include a fallback value for better backwards compatibility and cross-browser support. When an appropriate fallback can be determined from the SLDS design system metadata, this rule can automatically add it.

## Severity Level

Error (default, can be configured)

## Examples

### ❌ Incorrect

```css
.example {
  color: var(--slds-g-link-color-focus);
  background-color: var(--slds-g-color-brand-base-20);
  margin: var(--slds-c-card-spacing-block);
}
```

### ✅ Correct

```css
.example {
  color: var(--slds-g-link-color-focus, #014486);
  background-color: var(--slds-g-color-brand-base-20, #0176d3);
  margin: var(--slds-c-card-spacing-block, 1rem);
}
```

## Rule Details

This rule identifies any SLDS CSS variables (variables starting with `--slds-`) that are used without fallback values in `var()` functions. When an appropriate fallback value can be determined from the SLDS design system metadata, the rule can automatically add it.

The fallback values are retrieved from the `slds1ExcludedVars` property in the SLDS metadata, which maps variable names to their appropriate fallback values.

## Options

This rule has no specific options beyond the standard Stylelint rule options.

## When Not To Use It

If you're confident that all browsers using your CSS fully support CSS variables and the SLDS design system variables will always be available, you might choose not to use this rule. However, using fallbacks is generally recommended for better browser compatibility.

## Fixes

This rule is automatically fixable. When a missing fallback is detected and an appropriate value is available in the metadata, the fix will:

1. Identify the CSS variable in a `var()` function
2. Find an appropriate fallback value from the SLDS metadata
3. Add the fallback value: `var(--slds-variable)` → `var(--slds-variable, fallback-value)`

## Further Reading

- [MDN: Using CSS custom properties (variables)](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [Salesforce Lightning Design System](https://www.lightningdesignsystem.com/) 