# @no-slds-var-without-fallback

## Description
Identifies SLDS CSS variables used without fallback values. When a CSS variable isn't available in a browser, the styling breaks if no fallback is provided. This rule requires fallbacks for all SLDS variables.

## Severity Level
Error

## Example

### Existing Code:

```css
.example-container {
  padding: var(--slds-g-spacing-medium);
  color: var(--slds-g-link-color-focus);
}
```

### Recommended Code:

```css
.example-container {
  padding: var(--slds-g-spacing-medium, 1rem);
  color: var(--slds-g-link-color-focus, #014486);
}
```

The rule automatically adds appropriate fallback values for SLDS variables, improving cross-browser compatibility and rendering consistency. 