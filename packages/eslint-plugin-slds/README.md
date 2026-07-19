# @salesforce-ux/eslint-plugin-slds

ESLint plugin provides custom linting rules specifically built for Salesforce Lightning Design System 2 (SLDS 2 beta).

## Requirements

- **Node.js**: 18.18.0 or higher
- **ESLint**: 8.0.0 or 9.0.0+

## Install

```bash
npm install @salesforce-ux/eslint-plugin-slds --save-dev
```

## Configure

### ESLint v8 (Legacy Config)

```javascript
// .eslintrc.js
module.exports = {
  plugins: ['@salesforce-ux/slds'],
  extends: ['plugin:@salesforce-ux/slds/recommended']
};
```

### ESLint v9+ (Flat Config)

#### Basic Configuration

```javascript
// eslint.config.js
const { defineConfig } = require('eslint/config');
const sldsPlugin = require('@salesforce-ux/eslint-plugin-slds');

module.exports = defineConfig([
  {
    plugins: {
      '@salesforce-ux/slds': sldsPlugin
    },
    extends: ['@salesforce-ux/slds/recommended']
  }
]);
```

#### Using with Other Plugins

To use the ESLint plugin with other plugins, add the `sldsCssPlugin()` helper function to the `eslint.config.mjs` configuration file. The `sldsCssPlugin()` function returns an object that contains the configurations for the ESLint plugin. This makes it easy to combine the ESLint plugin with other plugins while maintaining all the required dependencies.

For example, to use the ESLint plugin with the CSS plugin, add the CSS plugin configuration to the object containing the ESLint plugin configuration.

```javascript
// eslint.config.mjs
import { defineConfig } from 'eslint/config';
import css from '@eslint/css';
import { sldsCssPlugin } from '@salesforce-ux/eslint-plugin-slds';

export default defineConfig([
  {
    files: ['**/*.css'],
    language: 'css/css',
    plugins: {
      css: css,
      ...sldsCssPlugin()
    },
    extends: ['@salesforce-ux/slds/recommended', 'css/recommended']
  }
]);
```

#### React (JSX/TSX) Configuration

The recommended flat config (`@salesforce-ux/slds/recommended`) already includes a JSX/TSX layer that lints `**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}` using `@typescript-eslint/parser`. It covers:

- `className` / `class` — string literals, template literals, and the `clsx`/`classnames`/`cx` helpers (string args and object keys).
- Inline `style={{ ... }}` objects — property keys (`--slds-`/`--lwc-` custom properties) and string values (hooks, `var()`, and hardcoded values). Numeric values (e.g. `padding: 16`) are intentionally **not** evaluated: a JS number literal cannot be safely rewritten into a `var()`/hook string, so they are skipped rather than reported. Wrap the value in a string (`padding: '16px'`) to have it checked.
- CSS-in-JS — `styled.*`, `styled(Component)`, `css`, `createGlobalStyle`, `keyframes`, and `injectGlobal` tagged templates. Class selectors and declarations inside the template are checked. To protect consumer source, a declaration value or selector whose span crosses a `${...}` interpolation is skipped entirely (neither reported nor auto-fixed), because the substituted placeholder length differs from the real expression and any derived edit could land on the wrong text.

> **Behavioral change:** as of this version, `@salesforce-ux/slds/recommended` lints your `.js`/`.jsx`/`.ts`/`.tsx` files in addition to CSS and markup. Rules only fire on `className`/`class`, `clsx`/`classnames`/`cx` calls, inline `style` objects, and `styled`/`css` tagged templates, so ordinary application logic is untouched — but you may see new findings in React code. To keep the previous CSS + markup-only behavior, compose the granular configs instead of `flat/recommended`:
>
> ```javascript
> // CSS + markup only (no React)
> export default defineConfig([
>   ...sldsPlugin.configs['flat/recommended-css'],
>   ...sldsPlugin.configs['flat/recommended-html'],
> ]);
> ```

To lint only React files, extend the standalone JSX config:

```javascript
// eslint.config.mjs
import { defineConfig } from 'eslint/config';
import sldsPlugin from '@salesforce-ux/eslint-plugin-slds';

export default defineConfig([
  ...sldsPlugin.configs['flat/recommended-jsx']
]);
```

Separate `flat/recommended-css`, `flat/recommended-html`, and `flat/recommended-jsx` configs are also exported for granular control.

> **Vue and Angular:** support is designed and specified with up-front tests, and is planned for a future release. Angular external `*.component.html`/`*.component.css` files already lint via the HTML and CSS rule paths.

## Migrate to the Latest Version

By default, the latest version of the plugin supports legacy and flat config systems.

## Supported Rules

### HTML/Component Rules

- `enforce-bem-usage`: Identifies instances that use the double-dash (--) syntax for block-element-modifier (BEM) in classes.
- `no-deprecated-classes-slds2`: Identifies classes that aren't available in SLDS 2.
- `modal-close-button-issue`: Identifies instances where the CSS classes or component attributes for the modal close button must be changed to follow the modal component blueprint.

### CSS Rules

- `no-hardcoded-values-slds2`: Identifies static or hard-coded values that must be replaced with SLDS 2 styling hooks.
- `no-slds-class-overrides`: Identifies existing class names that must be replaced with new custom CSS classes, instead of overriding SLDS selectors.
- `no-slds-var-without-fallback`: Identifies SLDS styling hooks that are specified without fallback values and recommends suitable fallback values based on the SLDS metadata. The fallback values are used in Salesforce environments where styling hooks are unavailable.
- `no-slds-namespace-for-custom-hooks`: Identifies custom styling hooks that use the --slds or --sds namespaces, which are reserved for SLDS styling hooks. To differentiate custom styling hooks from SLDS styling hooks, create custom styling hooks in your namespace.
- `no-slds-private-var`: Identifies SLDS styling hooks that are reserved only for internal Salesforce use. Private SLDS styling hooks have prefixes --_slds- and --slds-s-.
- `no-unsupported-hooks-slds2`: Identifies styling hooks that aren't present in SLDS 2. They must be replaced with styling hooks that have a similar effect, or they must be removed.
- `no-sldshook-fallback-for-lwctoken`: Identifies instances where --slds styling hooks are provided as fallback values for --lwc tokens.
- `enforce-sds-to-slds-hooks`: Identifies Salesforce Design System (SDS) styling hooks that must be replaced with the suggested SLDS 2 styling hooks. For more information, see lightningdesignsystem.com.
- `enforce-component-hook-naming-convention`: Identifies --slds-c component-level styling hooks that use a deprecated naming convention.
- `no-deprecated-slds-classes`: Please replace the deprecated classes with a modern equivalent.
- `reduce-annotations`: Identifies annotations that must be removed from the code.
- `lwc-token-to-slds-hook`: Identifies the deprecated --lwc tokens that must be replaced with the latest --slds tokens. For more information, see lightningdesignsystem.com.

## Closest Color Suggestion Logic

This plugin suggests SLDS styling hooks that are perceptually closest to a given hardcoded color. The logic lives in `src/utils/color-lib-utils.ts` and is used by `no-hardcoded-values-slds2`.

- **API surface**
  - `findClosestColorHook(color, supportedColors, cssProperty): string[]`
    Returns up to 5 hook names, ordered by category priority and perceptual distance.
  - `isHardCodedColor(value): boolean`
    Detects if a string likely represents a hardcoded color (excludes CSS `var(...)`).

- **Perceptual metric**
  - Uses `chroma.deltaE` (CIEDE2000) to compare the input color against known SLDS color values.
  - A threshold (`DELTAE_THRESHOLD = 25`) controls how strict the matching is.
  - Exact hex matches short-circuit to distance `0` to avoid float rounding differences.

- **Category ordering**
  - Hooks are ranked by category, then by distance (ascending):
    1. Semantic hooks (e.g., surface, accent, error, success, etc.)
    2. System hooks
    3. Palette hooks
  - Only the top 5 suggestions are returned.

- **Property awareness**
  - Suggestions consider the CSS property from rule context.
  - Hooks declared for the same property (or `*`) are prioritized if within the distance threshold.

- **CSS variables**
  - Values using `var(...)` are not flagged as hardcoded colors and are excluded from matching.

- **Semantic hook ordering by CSS property**
  The sorter always applies the same category priority (semantic → system → palette). Within the semantic category, ordering is purely by perceptual distance for the current CSS property; there is no hardcoded sub-priority among semantic families (surface, accent, error, etc.). Property awareness comes from the metadata (`properties` on each hook).

  - `color`
    - Prefers semantic hooks that declare `properties: ['color']` (e.g., text/foreground-oriented tokens).
    - If multiple semantic hooks are eligible, they are ordered by Delta E (closest first).
    - If none are within threshold, the sorter may fall back to system, then palette.

  - `background-color`
    - Prefers semantic surface/role tokens that declare `['background-color']`.
    - Among eligible semantic hooks, order is by Delta E.

  - `border-color` (and `outline-color`)
    - Prefers semantic or system hooks that declare `['border-color']` (or `['outline-color']`).
    - If semantic hooks exist for borders, they are ranked before system; otherwise system hooks lead.
    - Order within the chosen category is by Delta E.

  - `box-shadow`
    - For color components inside shadows, prefers hooks declaring `['box-shadow']` or universal `['*']`.
    - Ordering within semantic remains by Delta E.

  - Other properties
    - If hook metadata specifies the current property, those hooks are preferred.
    - Hooks with `['*']` (universal) are considered next.
    - If still none within threshold, different-property hooks may be considered (still subject to category priority and Delta E).

- **Example**
  ```js
  // Given a hex color and a CSS property like 'color'
  const suggestions = findClosestColorHook('#ff0000', supportedColors, 'color');
  // => ['--slds-...semantic-...', '--slds-...system-...', ...]
  ```

## License

ISC