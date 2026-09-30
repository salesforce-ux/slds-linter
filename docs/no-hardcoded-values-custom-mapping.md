# Custom Mapping Enhancement for `no-hardcoded-values-slds2` Rule

## Overview

This document explains the **Custom Mapping** enhancement made to the `no-hardcoded-values-slds2` ESLint rule. This feature allows teams to pre-configure specific styling hook replacements for hardcoded CSS values, providing more control over the linting and auto-fix behavior.

## What is Custom Mapping?

Custom Mapping is a configuration option that lets you define explicit mappings from hardcoded CSS values to SLDS styling hooks. When the linter encounters a hardcoded value that matches your custom mapping, it will:

1. **Prioritize your custom hook** over the default metadata lookup
2. **Provide auto-fix** with your specified hook (guaranteed single hook replacement)
3. **Override any default suggestions** from the metadata

This is particularly useful when:
- Your team has established conventions for specific hardcoded values
- You want consistent hook usage across your codebase
- You need to override default metadata suggestions with team-preferred hooks

## Configuration

### Basic Syntax

```javascript
{
  "rules": {
    "@salesforce-ux/slds/no-hardcoded-values-slds2": ["warn", {
      "customMapping": {
        "<hook-name>": {
          "properties": ["<property-pattern>", ...],
          "values": ["<value>", ...]
        }
      }
    }]
  }
}
```

### Configuration Properties

| Property | Type | Description |
|----------|------|-------------|
| `hookName` | `string` | The SLDS styling hook to use as replacement (e.g., `--slds-g-color-surface-container-1`) |
| `properties` | `string[]` | Array of CSS property patterns to match. Supports exact matches and wildcards (e.g., `background*`) |
| `values` | `string[]` | Array of hardcoded values to match. Matching is case-insensitive and whitespace is trimmed |

### Example Configuration

```javascript
{
  "rules": {
    "@salesforce-ux/slds/no-hardcoded-values-slds2": ["warn", {
      "customMapping": {
        "--slds-g-color-surface-container-1": {
          "properties": ["background*", "color"],
          "values": ["#fff", "#ffffff", "white"]
        },
        "--slds-g-spacing-custom": {
          "properties": ["padding", "margin"],
          "values": ["10px", "1rem"]
        },
        "--slds-g-font-size-custom": {
          "properties": ["font-size"],
          "values": ["14px", "0.875rem"]
        },
        "--slds-g-shadow-elevation-2": {
          "properties": ["box-shadow"],
          "values": ["0 2px 4px rgba(0,0,0,0.1)"]
        }
      }
    }]
  }
}
```

## How It Works

### High-Level Approach

The custom mapping enhancement follows a **priority-based lookup** pattern:

```
1. Check Custom Mapping
   ↓ (if found)
   Return custom hook → Auto-fixable ✓
   
   ↓ (if not found)
   
2. Fallback to Metadata Lookup
   ↓
   Search SLDS metadata for hooks
   ↓
   Return hooks (single or multiple)
```

### Implementation Architecture

The implementation consists of three main components:

#### 1. **Custom Mapping Utility** (`custom-mapping-utils.ts`)

A dedicated utility module that handles the custom mapping logic:

```typescript
function getCustomMapping(
  cssProperty: string,
  value: string,
  customMapping?: CustomHookMapping
): string | null
```

**Key Features:**
- **Property Pattern Matching**: Supports exact matches and wildcard patterns
- **Case-Insensitive**: Normalizes property and value comparisons
- **Whitespace Handling**: Automatically trims values
- **Fast Lookup**: Returns immediately when a match is found

#### 2. **Handler Integration**

All four value handlers check custom mapping before metadata lookup:

- **`colorHandler.ts`**: Colors (hex, rgb, rgba, named colors)
- **`densityHandler.ts`**: Spacing and sizing values (px, rem, em)
- **`fontHandler.ts`**: Font sizes and weights
- **`boxShadowHandler.ts`**: Box shadow values

**Integration Pattern:**
```typescript
// Check custom mapping first
const customHook = getCustomMapping(cssProperty, value, context.options?.customMapping);

if (customHook) {
  // Use custom mapping (guaranteed single hook)
  closestHooks = [customHook];
} else {
  // Fallback to metadata lookup
  closestHooks = findHooksFromMetadata(value, metadata, property);
}
```

#### 3. **Type-Safe Configuration**

TypeScript types ensure configuration correctness:

```typescript
interface CustomHookMapping {
  [hookName: string]: {
    properties: string[];
    values: string[];
  };
}
```

## Usage Examples

### Example 1: Color Mapping

**Before (without custom mapping):**

```css
.my-component {
  color: #fff;
  background-color: white;
}
```

**Linter Output:**
```
Warning: Hardcoded color #fff. Consider: --slds-g-color-neutral-base-100, --slds-g-color-palette-neutral-100
Warning: Hardcoded color white. Consider: --slds-g-color-neutral-base-100, --slds-g-color-palette-neutral-100
```
*Multiple suggestions, no auto-fix available*

**With Custom Mapping:**

```javascript
{
  "customMapping": {
    "--slds-g-color-surface-container-1": {
      "properties": ["color", "background-color"],
      "values": ["#fff", "white"]
    }
  }
}
```

**Auto-fixed Output:**
```css
.my-component {
  color: var(--slds-g-color-surface-container-1, #fff);
  background-color: var(--slds-g-color-surface-container-1, white);
}
```
✓ *Single hook, auto-fixable*

---

### Example 2: Wildcard Property Patterns

**Use Case:** Apply the same hook to all background-related properties

```javascript
{
  "customMapping": {
    "--my-bg-color": {
      "properties": ["background*"],  // Matches all background properties
      "values": ["#f0f0f0"]
    }
  }
}
```

**Matches:**
- `background: #f0f0f0`
- `background-color: #f0f0f0`
- `background-image: linear-gradient(#f0f0f0, ...)`

---

### Example 3: Spacing Consistency

**Goal:** Standardize padding/margin values across the codebase

```javascript
{
  "customMapping": {
    "--spacing-small": {
      "properties": ["padding", "margin"],
      "values": ["8px", "0.5rem"]
    },
    "--spacing-medium": {
      "properties": ["padding", "margin"],
      "values": ["16px", "1rem"]
    }
  }
}
```

**CSS Input:**
```css
.card {
  padding: 16px;
  margin: 8px;
}
```

**Auto-fixed Output:**
```css
.card {
  padding: var(--spacing-medium, 16px);
  margin: var(--spacing-small, 8px);
}
```

---

### Example 4: Font System

**Goal:** Enforce consistent font sizing

```javascript
{
  "customMapping": {
    "--text-small": {
      "properties": ["font-size"],
      "values": ["12px", "0.75rem"]
    },
    "--text-base": {
      "properties": ["font-size"],
      "values": ["14px", "0.875rem"]
    },
    "--text-large": {
      "properties": ["font-size"],
      "values": ["16px", "1rem"]
    }
  }
}
```

---

### Example 5: Box Shadow Library

**Goal:** Maintain consistent elevation levels

```javascript
{
  "customMapping": {
    "--shadow-level-1": {
      "properties": ["box-shadow"],
      "values": ["0 1px 3px rgba(0,0,0,0.1)"]
    },
    "--shadow-level-2": {
      "properties": ["box-shadow"],
      "values": ["0 2px 8px rgba(0,0,0,0.15)"]
    },
    "--shadow-level-3": {
      "properties": ["box-shadow"],
      "values": ["0 4px 16px rgba(0,0,0,0.2)"]
    }
  }
}
```

---

### Example 6: Shorthand Properties

**Shorthand properties are fully supported:**

```javascript
{
  "customMapping": {
    "--spacing-xs": {
      "properties": ["padding"],
      "values": ["4px"]
    },
    "--spacing-sm": {
      "properties": ["padding"],
      "values": ["8px"]
    }
  }
}
```

**CSS Input:**
```css
.box {
  padding: 4px 8px;
}
```

**Auto-fixed Output:**
```css
.box {
  padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
}
```

---

## Advanced Features

### Property Pattern Matching

Custom mapping supports flexible property matching:

#### Exact Match
```javascript
"properties": ["color"]  // Matches only 'color'
```

#### Wildcard Match
```javascript
"properties": ["background*"]  // Matches 'background', 'background-color', 'background-image', etc.
```

#### Multiple Patterns
```javascript
"properties": ["color", "fill", "stroke"]  // Matches any of these properties
```

### Value Matching Behavior

- **Case-Insensitive**: `"#FFF"` matches `"#fff"`
- **Whitespace Trimmed**: `" #fff "` matches `"#fff"`
- **Exact Match**: `"#fff"` does NOT match `"#ffffff"` (specify both if needed)
- **Multiple Values**: One hook can map to multiple equivalent values

```javascript
"values": ["#fff", "#ffffff", "white", "rgb(255,255,255)"]
```

---

## Priority and Fallback Behavior

### Priority Order

1. **Custom Mapping** (Highest Priority)
   - Checked first for every hardcoded value
   - If found, immediately returns the custom hook
   - Results in auto-fixable violation

2. **Metadata Lookup** (Fallback)
   - Used when no custom mapping matches
   - Searches SLDS metadata for hooks
   - May return single or multiple suggestions

### Example: Override Metadata

Even if the metadata suggests different hooks, custom mapping takes precedence:

```javascript
{
  "customMapping": {
    "--my-preferred-font": {
      "properties": ["font-size"],
      "values": ["16px"]
    }
  }
}
```

**Without custom mapping:**
```
Warning: Use --slds-g-font-scale-2 for 16px
```

**With custom mapping:**
```
Warning: Use --my-preferred-font for 16px
```

---

## Technical Details

### Implementation Flow

```
┌─────────────────────────────────────────┐
│  Handler receives CSS declaration       │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Extract property and value             │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  getCustomMapping(property, value)      │
└────────────┬────────────────────────────┘
             │
    ┌────────┴────────┐
    │ Found?          │
    └─────┬─────┬─────┘
          │     │
      Yes │     │ No
          │     │
          ▼     ▼
     ┌─────┐ ┌──────────────────────┐
     │ Use │ │ Fallback to metadata │
     │ it  │ │ lookup               │
     └──┬──┘ └──────────┬───────────┘
        │               │
        └───────┬───────┘
                ▼
    ┌────────────────────────┐
    │ Create replacement     │
    │ Report violation       │
    │ Apply auto-fix         │
    └────────────────────────┘
```

### Files Modified

1. **New Utility**: `/src/utils/custom-mapping-utils.ts`
   - Core custom mapping logic
   - Property pattern matching
   - Value normalization

2. **Handler Updates**:
   - `/src/rules/v9/no-hardcoded-values/handlers/colorHandler.ts`
   - `/src/rules/v9/no-hardcoded-values/handlers/densityHandler.ts`
   - `/src/rules/v9/no-hardcoded-values/handlers/fontHandler.ts`
   - `/src/rules/v9/no-hardcoded-values/handlers/boxShadowHandler.ts`

3. **Type Definitions**: `/src/types/index.ts`
   - `CustomHookMapping` interface
   - `RuleOptions` interface update

4. **Schema**: `/src/rules/v9/no-hardcoded-values/ruleOptionsSchema.ts`
   - JSON schema validation for custom mapping

### Performance Considerations

- **Early Return**: Custom mapping check returns immediately on first match
- **No Parsing Overhead**: Uses simple string/pattern matching
- **Cached Configuration**: Rule options are parsed once per run
- **Minimal Memory**: No additional metadata loading required

---

## Testing

### Unit Tests

**File**: `/test/utils/custom-mapping-utils.test.js`

Tests cover:
- Property pattern matching (exact and wildcard)
- Value normalization (case, whitespace)
- Edge cases (empty config, no matches)

### Integration Tests

**File**: `/test/rules/no-hardcoded-values-custom-mapping.test.js`

Tests cover:
- All value types (color, density, font, box-shadow)
- Shorthand property support
- Priority over metadata
- Fallback behavior

**Test Results**: ✅ 410 tests pass (26 new tests added)

---

## Migration Guide

### Adding Custom Mapping to Your Project

1. **Identify Common Hardcoded Values**
   ```bash
   # Run linter to see violations
   npx @salesforce-ux/slds-linter@internal lint path/to/css
   ```

2. **Create Custom Mapping Configuration**
   ```javascript
   // eslint.config.mjs
   {
     "rules": {
       "@salesforce-ux/slds/no-hardcoded-values-slds2": ["warn", {
         "customMapping": {
           // Add your mappings here
         }
       }]
     }
   }
   ```

3. **Run Linter with Auto-fix**
   ```bash
   npx @salesforce-ux/slds-linter@internal lint path/to/css --fix --config-eslint eslint.config.mjs
   ```

4. **Verify Results**
   - Check auto-fixed files
   - Ensure custom hooks are applied correctly

---

## Best Practices

### ✅ Do

- **Use semantic hook names** that describe purpose (e.g., `--spacing-card-padding`)
- **Group related values** under a single hook
- **Document your custom mappings** in team documentation
- **Use wildcards** for related properties (e.g., `background*`)
- **Start small** and expand as patterns emerge

### ❌ Don't

- **Over-specify** - Don't create a hook for every single value
- **Duplicate metadata** - Only use custom mapping when needed
- **Use inconsistent naming** - Follow SLDS naming conventions
- **Forget fallback values** - Always include fallback in var()

---

## Troubleshooting

### Custom Mapping Not Applied

**Problem**: Custom mapping doesn't seem to work

**Solutions**:
1. Check property spelling and casing
2. Verify value matches exactly (use lowercase)
3. Ensure configuration is in correct location
4. Check for JSON syntax errors

### Wildcard Not Matching

**Problem**: `background*` doesn't match `background-color`

**Solutions**:
1. Verify wildcard is at the end: `background*` ✓ vs `*background` ✗
2. Check property name spelling
3. Use exact match if wildcard doesn't work: `["background-color"]`

### Multiple Hooks Conflict

**Problem**: Value matches multiple custom mappings

**Solution**: Custom mapping returns the **first match** found. Order matters if using multiple mappings for the same value.

---

## Future Enhancements

Potential future additions to custom mapping:

- **Regular Expression Support**: More flexible value matching
- **Conditional Mappings**: Apply based on file path or context
- **Shared Configurations**: Import from external files
- **Validation Tools**: CLI to validate custom mapping configs

---

## Related Features

This enhancement works alongside other `no-hardcoded-values-slds2` options:

- **`reportNumericValue`**: Control when numeric values are reported
- **`preferPaletteHook`**: Prefer palette hooks over theme hooks

See the main [custom-config.md](./custom-config.md) for complete configuration options.

---

## Support

For questions or issues:
- Check existing test cases for examples
- Review `CUSTOM_MAPPING_IMPLEMENTATION.md` for technical details
- Open an issue in the repository

---

## Summary

Custom Mapping provides:
- ✅ **Pre-configured replacements** for hardcoded values
- ✅ **Guaranteed auto-fix** (single hook always)
- ✅ **Team consistency** through shared configuration
- ✅ **Override capability** for metadata suggestions
- ✅ **Flexible matching** with wildcards and multiple values

This enhancement makes the linter more adaptable to team-specific conventions while maintaining the benefits of automated hook replacement.
