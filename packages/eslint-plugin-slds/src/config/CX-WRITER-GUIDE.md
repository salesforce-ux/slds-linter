# CX Writer Guide: All Rule Messages

Quick guide for updating ALL rule messages in [`rule-messages.yml`](./rule-messages.yml).

**This file now contains messages for all rules** - ESLint v8, ESLint v9, and Stylelint rules.

## File Structure

```yaml
rule-name:
  description: "Brief rule description"
  url: "https://docs.url" # optional
  messages:
    primaryMessage: "Error message with {{placeholder}}"
    fixMessage: "How to fix it"
```

## Placeholder Syntax

Use `{{placeholder}}` for dynamic values:

```yaml
messages:
  error: "Class {{className}} is not allowed"
  fix: "Replace {{oldValue}} with {{newValue}}"
```

**✅ Correct:** `{{className}}`, `{{oldValue}}`  
**❌ Incorrect:** `{className}`, `${oldValue}`, `%s`

## Writing Good Messages

1. **Be specific:** Say what's wrong and how to fix it
2. **Include context:** Explain why it matters
3. **Use examples:** `"Use 'my-app-{{className}}' instead"`

```yaml
# ✅ Good
unexpectedImportant: "Unexpected !important flag found. Use specific selectors instead."

# ❌ Bad  
noImportant: "Don't use !important"
```

## Common Placeholders

- `{{className}}` - CSS class names
- `{{oldValue}}` / `{{newValue}}` - Values being replaced
- `{{cssVar}}` - CSS variables
- `{{property}}` - CSS properties

## Testing Changes

```bash
npm test
```

## Quick Examples

**CSS Rule:**
```yaml
no-important-tag:
  description: "Disallow !important flags"
  messages:
    unexpectedImportant: "Use specific selectors instead of !important"
```

**Component Rule:**
```yaml
modal-close-button-issue:
  description: "Ensure proper modal close button"
  messages:
    missingIcon: "Modal close button needs a close icon"
```

**Design Token Rule:**
```yaml
no-hardcoded-values:
  description: "Use design tokens instead of static values"
  messages:
    hardcodedValue: "Replace {{oldValue}} with design token {{newValue}}"
```

That's it! 🎉 