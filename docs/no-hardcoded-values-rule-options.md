# Rule Options for `no-hardcoded-values-slds2`

## Overview

The `no-hardcoded-values-slds2` ESLint rule provides flexible configuration options to control when and how hardcoded CSS values are reported. This document covers two key options:

1. **`reportNumericValue`** - Control when numeric values are reported
2. **`deterministicOnly`** - Restrict color autofix to deterministic hook matches only

These options work alongside the **`customMapping`** feature (documented separately) to provide comprehensive control over the linting behavior.

---

## Table of Contents

1. [reportNumericValue Option](#reportnumericvalue-option)
2. [deterministicOnly Option](#deterministiconly-option)
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
      "deterministicOnly": true,
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

# `deterministicOnly` Option

## What is `deterministicOnly`?

The `deterministicOnly` option restricts color autofix to **deterministic** hook matches only. With context extraction (`@salesforce-ux/context-extractor`), hook selection is handled by `classifyIssue()`, which classifies each issue into one of four tiers:

| Tier | Meaning |
|------|---------|
| **deterministic** | Context unambiguously resolves to a single hook category |
| **semi-deterministic** | Multiple competing categories exist but a reasonable default can be picked |
| **llm** | Hooks exist but context alone cannot resolve; would need LLM assistance |
| **no-hooks** | No candidate hooks at all |

When `deterministicOnly` is enabled, `semi-deterministic` results are reported as suggestion-only instead of producing an autofix.

---

## Configuration

### Accepted Values

| Value | Behavior |
|-------|----------|
| `false` | Both `deterministic` and `semi-deterministic` produce autofix **(default)** |
| `true` | Only `deterministic` produces autofix; `semi-deterministic` becomes suggestion-only |

### Default Value

```javascript
false  // Both tiers produce autofix (backward-compatible)
```

---

## Basic Configuration

```javascript
{
  "rules": {
    "@salesforce-ux/slds/no-hardcoded-values-slds2": ["warn", {
      "deterministicOnly": true
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
│  classifyIssue() returns tier       │
└────────────────┬────────────────────┘
                 │
        ┌────────┴──────────┐
        │ Which tier?       │
        └──┬─────┬─────┬────┘
           │     │     │
    deterministic│  semi-deterministic
           │     │     │
           ▼     │     ▼
      ┌────────┐ │ ┌──────────────────────────┐
      │Autofix │ │ │deterministicOnly?         │
      └────────┘ │ └──────┬───────────────────┘
                 │  false │     │ true
           llm / │       │     │
         no-hooks│       ▼     ▼
           │     │ ┌────────┐ ┌──────────────┐
           ▼     │ │Autofix │ │Suggestion    │
      ┌────────┐ │ └────────┘ │only          │
      │Suggest │ │            └──────────────┘
      │only    │ │
      └────────┘ │
```

### Implementation Details

From `colorHandler.ts`:

```typescript
const { deterministicOnly: settingsDeterministicOnly } =
  (context?.context?.settings ?? {}) as Partial<ContextSettings>;
const allowSemiDeterministic =
  !(settingsDeterministicOnly ?? context.options?.deterministicOnly);

const classification = classifyIssue(issueWithContext, closestHooks);
if (
  classification?.tier === "deterministic" ||
  (allowSemiDeterministic && classification?.tier === "semi-deterministic")
) {
  // produce autofix
}
```

The CLI (`context.settings`) takes precedence over the rule option, with a final fallback to `false`.

---

## Usage Examples

### Example 1: Default Behavior (deterministicOnly: false)

**Configuration:**
```javascript
{
  "deterministicOnly": false  // or omit (default)
}
```

**CSS Input:**
```css
.example {
  background-color: #ffffff;
}
```

**Classification:** `semi-deterministic` with `selectedHook: --slds-g-color-surface-1`

**Auto-fixed Output:**
```css
.example {
  background-color: var(--slds-g-color-surface-1, #ffffff);
}
```

**Result:** Semi-deterministic tier is autofixed

---

### Example 2: Restrict to Deterministic Only (deterministicOnly: true)

**Configuration:**
```javascript
{
  "deterministicOnly": true
}
```

**CSS Input:**
```css
.example {
  background-color: #ffffff;
}
```

**Classification:** `semi-deterministic` with `selectedHook: --slds-g-color-surface-1`

**Linter Output:**
```
Warning: Hardcoded color #ffffff. Suggestions: --slds-g-color-surface-1, --slds-g-color-surface-2
```

**Result:** Semi-deterministic tier becomes suggestion-only (no auto-fix applied)

---

### Example 3: Deterministic Always Auto-fixes

Regardless of the `deterministicOnly` setting, `deterministic` classifications always produce autofix:

**CSS Input:**
```css
.example {
  color: #ffffff;
}
```

**Classification:** `deterministic` with `selectedHook: --slds-g-color-neutral-base-100`

**Auto-fixed Output (both settings):**
```css
.example {
  color: var(--slds-g-color-neutral-base-100, #ffffff);
}
```

---

## CLI Usage

The same option is available as a CLI flag:

```bash
# Default: both tiers autofixed
npx @salesforce-ux/slds-linter lint ./src --fix

# Restrict to deterministic only
npx @salesforce-ux/slds-linter lint ./src --fix --deterministic-only
```

The CLI flag takes precedence over the ESLint config file setting.

---

## When to Use Each Setting

### Use `deterministicOnly: false` (Default) When:

✅ **You want maximum autofix coverage**
- More values are auto-replaced with hooks
- Faster migration path

✅ **You trust the context-aware heuristics**
- Semi-deterministic picks a reasonable default from competing categories

---

### Use `deterministicOnly: true` When:

✅ **You want higher confidence in autofixes**
- Only unambiguous classifications are auto-applied
- Reduces risk of incorrect hook selection

✅ **Your team reviews semi-deterministic suggestions manually**
- Suggestions are still reported for human review
- Better for critical UI components

---

## Advanced Usage

### Combine with Custom Mapping

Custom mapping takes precedence over classification-based autofix:

```javascript
{
  "deterministicOnly": true,
  "customMapping": {
    "--my-surface-color": {
      "properties": ["background-color"],
      "values": ["#fff", "white"]
    }
  }
}
```

**Result:** Custom-mapped values are always autofixed, regardless of `deterministicOnly`.

---

### Integration with reportNumericValue

These options work independently:

```javascript
{
  "reportNumericValue": "hasReplacement",     // Affects numeric values
  "deterministicOnly": true                   // Affects color autofix tier
}
```

**CSS Input:**
```css
.example {
  padding: 16px;        /* Affected by reportNumericValue */
  color: #fff;          /* Affected by deterministicOnly */
}
```

---

# Combined Usage Examples

## Example 1: Recommended Configuration for SLDS 260

```javascript
{
  "rules": {
    "@salesforce-ux/slds/no-hardcoded-values-slds2": ["warn", {
      "reportNumericValue": "hasReplacement",
      "customMapping": {
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
- ✅ Both deterministic and semi-deterministic tiers autofixed (default)
- ✅ Team customization (custom mappings)

---

## Example 2: High-Confidence Autofix Only

```javascript
{
  "rules": {
    "@salesforce-ux/slds/no-hardcoded-values-slds2": ["warn", {
      "reportNumericValue": "hasReplacement",
      "deterministicOnly": true
    }]
  }
}
```

**Use Case:** Only autofix when the hook is unambiguously determined; review semi-deterministic suggestions manually.

---

## Example 3: Strict Mode (Maximum Coverage)

```javascript
{
  "rules": {
    "@salesforce-ux/slds/no-hardcoded-values-slds2": ["warn", {
      "reportNumericValue": "always"
    }]
  }
}
```

**Use Case:** New projects, strict compliance

---

## Example 4: Colors Only

```javascript
{
  "rules": {
    "@salesforce-ux/slds/no-hardcoded-values-slds2": ["warn", {
      "reportNumericValue": "never"
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
npx @salesforce-ux/slds-linter@internal lint path/to/css
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

**Want only high-confidence autofixes?**
```javascript
{ "deterministicOnly": true }
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
// eslint.config.mjs
{
  "rules": {
    "@salesforce-ux/slds/no-hardcoded-values-slds2": ["warn", {
      "reportNumericValue": "hasReplacement",
      "deterministicOnly": true
    }]
  }
}
```

---

## Step 4: Run Auto-fix

```bash
npx @salesforce-ux/slds-linter@internal lint path/to/css --fix --config-eslint eslint.config.mjs
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
- **Use `deterministicOnly: true`** when you need higher confidence in autofixes
- **Document your choices** in team guidelines
- **Run auto-fix** to quickly address violations
- **Combine with customMapping** for complete coverage

## ❌ Don't

- **Don't use `always` without team buy-in** (can be overwhelming)
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
1. Is the classification `semi-deterministic`? → Set `deterministicOnly: false` (or omit, it's the default) to enable auto-fix for this tier
2. Multiple hooks with no context extraction? → Only single-candidate hooks auto-fix
3. Use custom mapping for guaranteed single hook

---

# Summary

## reportNumericValue

- **Purpose**: Control when numeric values are reported
- **Values**: `'always'`, `'hasReplacement'`, `'never'`
- **Recommended**: `'hasReplacement'` for SLDS 260 compliance
- **Affects**: Numeric values (spacing, sizing, fonts)

## deterministicOnly

- **Purpose**: Restrict color autofix to deterministic hook matches only
- **Values**: `false` (default, both tiers) or `true` (deterministic only)
- **CLI Flag**: `--deterministic-only`
- **Affects**: Color values classified by context extraction

## Together

These options provide fine-grained control over linting behavior, enabling teams to adopt SLDS hooks progressively and consistently.

---

## Related Documentation

- [Custom Mapping](./no-hardcoded-values-custom-mapping.md) - Pre-configure hook replacements

---

## Support

For questions or issues:
- Review test cases in `/test/rules/`
- Check the implementation in `/src/rules/v9/no-hardcoded-values/`
- Open an issue in the repository
