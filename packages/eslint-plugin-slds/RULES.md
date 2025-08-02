# ESLint Plugin SLDS Rules

This ESLint plugin provides custom linting rules specifically built for Salesforce Lightning Design System 2 (SLDS 2 beta). It supports both HTML/Component linting and **ESLint v9 CSS linting** using the native `@eslint/css` parser.

## CSS Rules (ESLint v9+)

These rules work with the ESLint v9 flat configuration and native CSS parsing using `@eslint/css`.

### no-important-tag

Disallows the use of `!important` in CSS declarations to maintain low specificity.

**Rationale**: Using `!important` makes CSS harder to maintain and debug. SLDS promotes keeping specificity as low as possible.

**Examples:**

❌ **Invalid**
```css
.example {
  color: red !important; /* Error: Remove !important */
  background: var(--slds-g-color-brand) !important; /* Error: Remove !important */
}
```

✅ **Valid**
```css
.example {
  color: red;
  background: var(--slds-g-color-brand);
}
```

**Auto-fix**: Yes - removes the `!important` declaration

**Configuration:**
```javascript
// eslint.config.js (ESLint v9)
export default [
  {
    files: ["**/*.css"],
    plugins: {
      "@salesforce-ux/slds": sldsPlugin,
    },
    rules: {
      "@salesforce-ux/slds/no-important-tag": "error"
    }
  }
];
```

### no-slds-class-overrides

Disallows overriding SLDS CSS classes to prevent breaking design system consistency.

**Rationale**: Overriding SLDS classes can break the design system and cause issues when SLDS updates. Create custom classes with your namespace instead.

**Examples:**

❌ **Invalid**
```css
.slds-button {
  background: red; /* Error: Don't override SLDS classes */
}

.my-app .slds-input {
  border-color: blue; /* Error: Don't override SLDS classes */
}

.slds-card:hover {
  box-shadow: none; /* Error: Don't override SLDS classes */
}
```

✅ **Valid**
```css
.my-app-button {
  background: red; /* Use custom class names */
}

.my-app-input {
  border-color: blue; /* Use custom class names */
}

.my-app-card:hover {
  box-shadow: none; /* Use custom class names */
}
```

**Auto-fix**: No - requires manual intervention to choose appropriate class names

**Configuration:**
```javascript
// eslint.config.js (ESLint v9)
export default [
  {
    files: ["**/*.css"],
    plugins: {
      "@salesforce-ux/slds": sldsPlugin,
    },
    rules: {
      "@salesforce-ux/slds/no-slds-class-overrides": "warning"
    }
  }
];
```

## HTML/Component Rules (ESLint v8 & v9)

### enforce-bem-usage

Replace BEM double-dash syntax in class names with single underscore syntax.

### no-deprecated-classes-slds2

Replace classes that aren't available with SLDS 2 classes.

### modal-close-button-issue

Ensures proper modal close button implementation.

## CX Writer Support

### YAML-Based Message System

All rule messages are maintained in a centralized YAML file (`src/v9/config/rule-messages.yml`) following [ESLint v9 messageId conventions](https://eslint.org/docs/latest/extend/custom-rules#suggestion-messageids). This allows CX writers to easily update rule messages without touching code.

**Features:**
- ✅ **Native ESLint v9 message interpolation** using `{{placeholder}}` syntax
- ✅ **Centralized message management** in YAML format
- ✅ **CX writer-friendly** structure with clear guidelines
- ✅ **No dependency on custom placeholder utilities**
- ✅ **Fallback support** if YAML loading fails

**Example YAML structure:**
```yaml
no-important-tag:
  meta:
    type: "problem"
    docs:
      description: "Disallow !important flags in CSS declarations"
      category: "Best Practices"
    fixable: "code"
    severity: "error"
  
  messages:
    unexpectedImportant: "Unexpected !important flag found. Use specific selectors instead of !important to maintain low CSS specificity."
    removeImportant: "Remove !important flag"
```

**For CX Writers:**
- See [`src/v9/config/CX-WRITER-GUIDE.md`](src/v9/config/CX-WRITER-GUIDE.md) for detailed instructions
- Use ESLint v9 native `{{placeholder}}` syntax for dynamic values
- Test changes with `npm test` to ensure proper integration
- Follow established patterns for consistency

## Configuration

### ESLint v9 Flat Config (Recommended)

```javascript
import slds from '@salesforce-ux/eslint-plugin-slds';

// Use the pre-configured recommended setup
export default [
  ...slds.configs['flat/recommended']
];

// Or configure manually for more control
export default [
  {
    files: ["**/*.html", "**/*.cmp"],
    plugins: {
      "@salesforce-ux/slds": slds,
    },
    rules: {
      "@salesforce-ux/slds/enforce-bem-usage": "error",
      "@salesforce-ux/slds/no-deprecated-classes-slds2": "error",
      "@salesforce-ux/slds/modal-close-button-issue": "error"
    }
  },
  {
    files: ["**/*.css", "**/*.scss"],
    plugins: {
      "@salesforce-ux/slds": slds,
    },
    rules: {
      "@salesforce-ux/slds/no-important-tag": "error",
      "@salesforce-ux/slds/no-slds-class-overrides": "warning"
    }
  }
];
```

### ESLint v8 Legacy Config

```json
{
  "extends": ["plugin:@salesforce-ux/slds/recommended"]
}
```

## File Support

- **CSS/SCSS files**: `*.css`, `*.scss` - Linted with CSS rules
- **HTML/Component files**: `*.html`, `*.cmp` - Linted with HTML/Component rules

## ESLint v9 CSS Integration

This plugin integrates with `@eslint/css` to provide native CSS parsing and linting capabilities in ESLint v9. The CSS rules use the official CSS language support for accurate parsing and error reporting.
