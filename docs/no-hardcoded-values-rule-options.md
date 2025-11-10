# Rule Options for `no-hardcoded-values-slds2`

## Overview

The `no-hardcoded-values-slds2` ESLint rule provides flexible configuration options to control when and how hardcoded CSS values are reported. This document covers two key options:

1. **`reportNumericValue`** - Control when numeric values are reported
2. **`preferPaletteHook`** - Prefer palette hooks for color auto-fixes

These options work alongside the **`customMapping`** feature (documented separately) to provide comprehensive control over the linting behavior.

---

## Table of Contents

1. [reportNumericValue Option](#reportnumericvalue-option)
2. [preferPaletteHook Option](#preferpalettehook-option)
3. [Combined Usage Examples](#combined-usage-examples)
4. [Migration Guide](#migration-guide)

---

# `reportNumericValue` Option

## What is `reportNumericValue`?

The `reportNumericValue` option controls **when** the linter reports hardcoded numeric values (dimensions, spacing, font sizes) as violations. This is particularly useful for SLDS 260 compliance, where values without recommended replacements should not be considered violations.

### Use Case

> ⚠️ **SLDS 260 Compliance**: Values which do not have a recommended replacement in SLDS 260 should not be considered violations and should be removed from the dashboard (or otherwise discrete from "violations"). We will revisit this specific selection of rules each release.

---

## Configuration

### Accepted Values

| Value | Behavior | Use Case |
|-------|----------|----------|
| `'always'` | Report all hardcoded numeric values | **Default**. Strict mode - report everything |
| `'hasReplacement'` | Report only if a replacement hook exists | **Recommended for 260**. Focus on actionable violations |
| `'never'` | Never report numeric values | Disable numeric value checking |

### Default Value

```javascript
'always'  // Reports all numeric values (existing behavior)
```

---

## Basic Configuration

### Minimal Configuration

```javascript
{
  "rules": {
    "@salesforce-ux/slds/no-hardcoded-values-slds2": ["warn", {
      "reportNumericValue": "hasReplacement"
    }]
  }
}
```

### Full Configuration with All Options

```javascript
{
  "rules": {
    "@salesforce-ux/slds/no-hardcoded-values-slds2": ["warn", {
      "reportNumericValue": "hasReplacement",
      "preferPaletteHook": true,
      "customMapping": {
        // ... custom mappings
      }
    }]
  }
}
```

---

## How It Works

### High-Level Approach

The `reportNumericValue` option applies a **filter** after value analysis:

```
┌─────────────────────────────────────┐
│  Detect hardcoded numeric value     │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  Check if replacement hook exists   │
└────────────┬────────────────────────┘
             │
    ┌────────┴────────┐
    │ Has hook?       │
    └─────┬─────┬─────┘
      Yes │     │ No
          │     │
          ▼     ▼
     ┌─────┐ ┌──────┐
     │ A   │ │  B   │
     └──┬──┘ └───┬──┘
        │        │
        └────┬───┘
             ▼
    ┌────────────────────────┐
    │ Apply reportNumericValue filter │
    └────────────────────────┘
             │
    ┌────────┴────────┐
    │ Report based on │
    │ setting:        │
    └─────────────────┘
    
    • 'always' → Report A & B
    • 'hasReplacement' → Report A only
    • 'never' → Report nothing
```

### Implementation Details

The filter is applied in `handleShorthandAutoFix` function:

```typescript
// From hardcoded-shared-utils.ts
const reportNumericValue = context.options?.reportNumericValue || 'always';

replacements.forEach(({ hasHook, isNumeric, ... }) => {
  // Check if we should skip reporting based on reportNumericValue option
  if (isNumeric) {
    if (reportNumericValue === 'never') {
      return; // Skip reporting numeric values
    }
    if (reportNumericValue === 'hasReplacement' && !hasHook) {
      return; // Skip reporting numeric values without replacements
    }
  }
  
  // Report the violation...
});
```

---

## Usage Examples

### Example 1: Default Behavior (`'always'`)

**Configuration:**
```javascript
{
  "reportNumericValue": "always"  // or omit (default)
}
```

**CSS Input:**
```css
.example {
  padding: 16px;       /* Has hook: --slds-g-sizing-border-16 */
  margin: 5px;         /* No hook available */
  font-size: 18px;     /* No hook available */
}
```

**Linter Output:**
```
Warning: Hardcoded value 16px. Consider using: --slds-g-sizing-border-16
Warning: Hardcoded value 5px (no replacement available)
Warning: Hardcoded value 18px (no replacement available)
```

**Result:** ✅ 3 violations reported

---

### Example 2: Report Only With Replacements (`'hasReplacement'`)

**Configuration:**
```javascript
{
  "reportNumericValue": "hasReplacement"  // RECOMMENDED for SLDS 260
}
```

**CSS Input:**
```css
.example {
  padding: 16px;       /* Has hook: --slds-g-sizing-border-16 */
  margin: 5px;         /* No hook available */
  font-size: 18px;     /* No hook available */
}
```

**Linter Output:**
```
Warning: Hardcoded value 16px. Consider using: --slds-g-sizing-border-16
```

**Auto-fixed Output:**
```css
.example {
  padding: var(--slds-g-sizing-border-16, 16px);
  margin: 5px;         /* Not reported - no replacement */
  font-size: 18px;     /* Not reported - no replacement */
}
```

**Result:** ✅ 1 violation (actionable), 2 ignored (no replacement)

---

### Example 3: Never Report Numeric Values (`'never'`)

**Configuration:**
```javascript
{
  "reportNumericValue": "never"
}
```

**CSS Input:**
```css
.example {
  padding: 16px;       /* Has hook: --slds-g-sizing-border-16 */
  margin: 5px;         /* No hook available */
  font-size: 18px;     /* No hook available */
  color: #fff;         /* Still reported (not numeric) */
}
```

**Linter Output:**
```
Warning: Hardcoded color #fff. Consider using: --slds-g-color-neutral-base-100
```

**Result:** ✅ Only color reported, all numeric values ignored

---

### Example 4: Shorthand Properties

The option works correctly with shorthand properties:

**Configuration:**
```javascript
{
  "reportNumericValue": "hasReplacement"
}
```

**CSS Input:**
```css
.card {
  padding: 8px 16px 5px;
  /*       ↓    ↓   ↓
   *     hook  hook  no-hook
   */
}
```

**Linter Output:**
```
Warning: Hardcoded value 8px. Consider using: --slds-g-spacing-8
Warning: Hardcoded value 16px. Consider using: --slds-g-spacing-16
(5px is NOT reported - no replacement available)
```

**Auto-fixed Output:**
```css
.card {
  padding: var(--slds-g-spacing-8, 8px) var(--slds-g-spacing-16, 16px) 5px;
}
```

---

## Value Types Affected

The `reportNumericValue` option affects these value types:

### ✅ Affected (Numeric Values)

- **Spacing**: `padding`, `margin`, `gap`, etc.
- **Sizing**: `width`, `height`, `min-width`, etc.
- **Border widths**: `border-width`, `outline-width`
- **Font sizes**: `font-size`, `line-height`
- **Font weights**: `font-weight: 400`, `font-weight: 700`

### ❌ Not Affected (Non-Numeric Values)

- **Colors**: `color: #fff`, `background-color: red`
- **Box shadows**: `box-shadow: 0 2px 4px rgba(0,0,0,0.1)`
- **Named values**: `font-weight: bold`, `font-family: Arial`

---

## Benefits by Setting

### `'always'` (Default)

✅ **Maximum Coverage**
- Catches all hardcoded values
- Useful for new projects starting fresh

❌ **Noise**
- Reports values without replacements
- Can overwhelm teams with non-actionable violations

---

### `'hasReplacement'` (Recommended)

✅ **Actionable Violations Only**
- Focus on values with available hooks
- Reduces noise in violation dashboard
- SLDS 260 compliant approach

✅ **Auto-fix Available**
- All reported violations have auto-fix
- Faster migration path

✅ **Team-Friendly**
- Developers only see fixable issues
- Better adoption rate

---

### `'never'`

✅ **Flexibility**
- Disable numeric checking while keeping colors
- Useful for gradual adoption

❌ **Less Coverage**
- May miss important violations
- Not recommended for full compliance

---

## Advanced Scenarios

### Scenario 1: Gradual Migration

**Phase 1: Start with visibility**
```javascript
{ "reportNumericValue": "always" }
```
→ See all violations, understand scope

**Phase 2: Focus on actionable items**
```javascript
{ "reportNumericValue": "hasReplacement" }
```
→ Fix values with available hooks

**Phase 3: Handle remaining cases**
```javascript
{
  "reportNumericValue": "hasReplacement",
  "customMapping": {
    // Add custom hooks for values without metadata
  }
}
```
→ Use custom mapping for edge cases

---

### Scenario 2: Per-Project Configuration

**Legacy Project** (existing codebase with many hardcoded values):
```javascript
{
  "reportNumericValue": "hasReplacement"  // Focus on fixable items
}
```

**New Project** (starting fresh):
```javascript
{
  "reportNumericValue": "always"  // Strict compliance from start
}
```

---

### Scenario 3: Combined with Custom Mapping

Custom mapping can make more values "have replacements":

```javascript
{
  "reportNumericValue": "hasReplacement",
  "customMapping": {
    "--custom-spacing-5": {
      "properties": ["padding", "margin"],
      "values": ["5px"]  // Now 5px has a replacement!
    }
  }
}
```

**CSS Input:**
```css
.example {
  padding: 5px;
}
```

**Result:** Now reported (because customMapping provides a replacement)

---

# `preferPaletteHook` Option

## What is `preferPaletteHook`?

The `preferPaletteHook` option controls **which hook** is used for auto-fixing when multiple color hooks match a hardcoded color value. When enabled, the linter prefers **palette hooks** (e.g., `--slds-g-color-palette-neutral-100`) over **theme hooks** (e.g., `--slds-g-color-neutral-base-100`).

### Background

In SLDS, many colors have multiple hook representations:
- **Theme Hooks**: Semantic, context-aware (e.g., `--slds-g-color-neutral-base-100`)
- **Palette Hooks**: Direct color references (e.g., `--slds-g-color-palette-neutral-100`)

When both exist for the same color, this option lets you choose which to prefer for auto-fix.

---

## Configuration

### Accepted Values

| Value | Behavior |
|-------|----------|
| `false` | Use first matched hook (default behavior) |
| `true` | Prefer palette hooks when multiple matches exist |

### Default Value

```javascript
false  // Use first matched hook
```

---

## Basic Configuration

```javascript
{
  "rules": {
    "@salesforce-ux/slds/no-hardcoded-values-slds2": ["warn", {
      "preferPaletteHook": true
    }]
  }
}
```

---

## How It Works

### High-Level Approach

```
┌─────────────────────────────────────┐
│  Detect hardcoded color value       │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  Find matching hooks from metadata  │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  Multiple hooks found?              │
└────────┬───────────────────┬────────┘
         │ No (1 hook)       │ Yes (2+ hooks)
         │                   │
         ▼                   ▼
    ┌─────────┐       ┌──────────────┐
    │ Use it  │       │ Check option │
    └─────────┘       └──────┬───────┘
                             │
                    ┌────────┴────────┐
                    │ preferPaletteHook? │
                    └────────┬────────┘
                         Yes │     │ No
                             │     │
                             ▼     ▼
                      ┌─────────┐ ┌──────────┐
                      │ Palette │ │ First    │
                      │ hook    │ │ hook     │
                      └─────────┘ └──────────┘
```

### Implementation Details

From `colorHandler.ts`:

```typescript
let paletteHook = null;

// Apply preferPaletteHook filter if enabled
if (context.options?.preferPaletteHook && closestHooks.length > 1) {
  paletteHook = closestHooks.filter(hook => 
    hook.includes('-palette-')
  )[0];
}

if (paletteHook) {
  replacement = `var(${paletteHook}, ${colorValue})`;
} else if (closestHooks.length === 1) {
  replacement = `var(${closestHooks[0]}, ${colorValue})`;
}
```

**Key Point:** Only affects auto-fix when multiple hooks exist. Doesn't change which violations are reported.

---

## Usage Examples

### Example 1: Default Behavior (preferPaletteHook: false)

**Configuration:**
```javascript
{
  "preferPaletteHook": false  // or omit (default)
}
```

**CSS Input:**
```css
.example {
  color: #ffffff;
}
```

**Available Hooks (from metadata):**
1. `--slds-g-color-neutral-base-100` (theme hook - first)
2. `--slds-g-color-palette-neutral-100` (palette hook)

**Auto-fixed Output:**
```css
.example {
  color: var(--slds-g-color-neutral-base-100, #ffffff);
}
```

**Result:** Uses first hook (theme hook)

---

### Example 2: Prefer Palette Hooks (preferPaletteHook: true)

**Configuration:**
```javascript
{
  "preferPaletteHook": true
}
```

**CSS Input:**
```css
.example {
  color: #ffffff;
}
```

**Available Hooks (from metadata):**
1. `--slds-g-color-neutral-base-100` (theme hook)
2. `--slds-g-color-palette-neutral-100` (palette hook)

**Auto-fixed Output:**
```css
.example {
  color: var(--slds-g-color-palette-neutral-100, #ffffff);
}
```

**Result:** Uses palette hook (filtered by `-palette-` string)

---

### Example 3: Single Hook (Option Has No Effect)

**CSS Input:**
```css
.example {
  color: #0070d2;
}
```

**Available Hooks:**
1. `--slds-g-color-brand-base-70` (only one hook)

**Auto-fixed Output (both settings produce same result):**
```css
.example {
  color: var(--slds-g-color-brand-base-70, #0070d2);
}
```

**Result:** When only one hook exists, the option has no effect

---

### Example 4: No Palette Hook Available

**Configuration:**
```javascript
{
  "preferPaletteHook": true
}
```

**CSS Input:**
```css
.example {
  color: #0070d2;
}
```

**Available Hooks (hypothetical):**
1. `--slds-g-color-brand-base-70` (theme hook)
2. `--slds-g-color-brand-secondary` (theme hook)

**Auto-fixed Output:**
```css
.example {
  color: var(--slds-g-color-brand-base-70, #0070d2);
}
```

**Result:** Falls back to first hook when no palette hook exists

---

## When to Use Each Setting

### Use `preferPaletteHook: false` (Default) When:

✅ **You prefer semantic, theme-based hooks**
- Better for components that should adapt to themes
- More context-aware color usage

✅ **You want predictable behavior**
- Always uses first hook from metadata
- Consistent with previous versions

---

### Use `preferPaletteHook: true` When:

✅ **You prefer direct color references**
- More explicit about which color is being used
- Easier to understand exact color value

✅ **Your design system emphasizes palettes**
- Team guidelines prefer palette hooks
- Better alignment with design tokens

✅ **You want color consistency**
- Palette hooks represent specific color values
- Less ambiguity than theme-based hooks

---

## Comparison Table

| Aspect | Theme Hooks (false) | Palette Hooks (true) |
|--------|---------------------|----------------------|
| **Semantic** | ✅ High (e.g., "neutral-base") | ❌ Lower (e.g., "neutral-100") |
| **Explicit Color** | ❌ Context-dependent | ✅ Direct color reference |
| **Theming Support** | ✅ Better for themes | ⚠️ Fixed color values |
| **Readability** | ✅ Purpose-clear | ⚠️ Number-based |
| **Consistency** | ⚠️ May vary by context | ✅ Always same color |

---

## Advanced Usage

### Combine with Custom Mapping

Custom mapping takes precedence over `preferPaletteHook`:

```javascript
{
  "preferPaletteHook": true,
  "customMapping": {
    "--my-white": {
      "properties": ["color", "background-color"],
      "values": ["#fff", "white"]
    }
  }
}
```

**CSS Input:**
```css
.example {
  color: #fff;
}
```

**Result:** Uses `--my-white` (custom mapping overrides preferPaletteHook)

---

### Integration with reportNumericValue

These options work independently:

```javascript
{
  "reportNumericValue": "hasReplacement",  // Affects numeric values
  "preferPaletteHook": true                // Affects color auto-fix
}
```

**CSS Input:**
```css
.example {
  padding: 16px;        /* Affected by reportNumericValue */
  color: #fff;          /* Affected by preferPaletteHook */
}
```

---

# Combined Usage Examples

## Example 1: Recommended Configuration for SLDS 260

```javascript
{
  "rules": {
    "@salesforce-ux/slds/no-hardcoded-values-slds2": ["warn", {
      "reportNumericValue": "hasReplacement",  // Only actionable violations
      "preferPaletteHook": true,               // Use palette hooks
      "customMapping": {
        // Add team-specific hooks
        "--team-spacing-5": {
          "properties": ["padding", "margin"],
          "values": ["5px"]
        }
      }
    }]
  }
}
```

**Benefits:**
- ✅ Reduces noise (only reports fixable items)
- ✅ Consistent color approach (palette hooks)
- ✅ Team customization (custom mappings)

---

## Example 2: Strict Mode (Maximum Coverage)

```javascript
{
  "rules": {
    "@salesforce-ux/slds/no-hardcoded-values-slds2": ["warn", {
      "reportNumericValue": "always",
      "preferPaletteHook": false
    }]
  }
}
```

**Use Case:** New projects, strict compliance

---

## Example 3: Colors Only

```javascript
{
  "rules": {
    "@salesforce-ux/slds/no-hardcoded-values-slds2": ["warn", {
      "reportNumericValue": "never",
      "preferPaletteHook": true
    }]
  }
}
```

**Use Case:** Focus on color consistency, ignore spacing

---

# Migration Guide

## Step 1: Assess Current State

Run linter to see current violations:

```bash
npx eslint-slds lint path/to/css
```

Note:
- How many violations have replacements?
- How many are numeric vs. colors?

---

## Step 2: Choose Configuration

Based on your findings:

**Many violations without replacements?**
```javascript
{ "reportNumericValue": "hasReplacement" }
```

**Prefer palette hooks?**
```javascript
{ "preferPaletteHook": true }
```

**Need custom hooks?**
```javascript
{
  "customMapping": {
    // Define custom hooks
  }
}
```

---

## Step 3: Apply Configuration

Update your ESLint config:

```javascript
// .eslintrc.js or eslint.config.js
{
  "rules": {
    "@salesforce-ux/slds/no-hardcoded-values-slds2": ["warn", {
      "reportNumericValue": "hasReplacement",
      "preferPaletteHook": true
    }]
  }
}
```

---

## Step 4: Run Auto-fix

```bash
npx eslint-slds lint path/to/css --fix
```

---

## Step 5: Review and Adjust

- Check auto-fixed files
- Verify hook usage is correct
- Adjust configuration if needed

---

# Best Practices

## ✅ Do

- **Start with `hasReplacement`** for existing codebases
- **Use `preferPaletteHook: true`** for color consistency
- **Document your choices** in team guidelines
- **Run auto-fix** to quickly address violations
- **Combine with customMapping** for complete coverage

## ❌ Don't

- **Don't use `always` without team buy-in** (can be overwhelming)
- **Don't switch `preferPaletteHook` mid-project** (causes inconsistency)
- **Don't ignore violations** - address them systematically
- **Don't forget fallback values** in var() expressions

---

# Troubleshooting

## Issue: Too Many Violations

**Solution:** Use `reportNumericValue: "hasReplacement"`

```javascript
{ "reportNumericValue": "hasReplacement" }
```

---

## Issue: Wrong Hook Used in Auto-fix

**Solution:** Use custom mapping for specific values

```javascript
{
  "customMapping": {
    "--my-preferred-hook": {
      "properties": ["color"],
      "values": ["#fff"]
    }
  }
}
```

---

## Issue: Auto-fix Not Applied

**Check:**
1. Multiple hooks exist? → Will show suggestions instead of auto-fix
2. Use `preferPaletteHook: true` to enable auto-fix
3. Or use custom mapping for guaranteed single hook

---

# Summary

## reportNumericValue

- **Purpose**: Control when numeric values are reported
- **Values**: `'always'`, `'hasReplacement'`, `'never'`
- **Recommended**: `'hasReplacement'` for SLDS 260 compliance
- **Affects**: Numeric values (spacing, sizing, fonts)

## preferPaletteHook

- **Purpose**: Choose which hook for color auto-fix
- **Values**: `true` (palette) or `false` (first/theme)
- **Recommended**: `true` for color consistency
- **Affects**: Color values with multiple hooks

## Together

These options provide fine-grained control over linting behavior, enabling teams to adopt SLDS hooks progressively and consistently.

---

## Related Documentation

- [Custom Mapping](./no-hardcoded-values-custom-mapping.md) - Pre-configure hook replacements
- [Custom Config](./custom-config.md) - Complete ESLint configuration guide

---

## Support

For questions or issues:
- Review test cases in `/test/rules/`
- Check the implementation in `/src/rules/v9/no-hardcoded-values/`
- Open an issue in the repository
