# `@salesforce-ux/eslint-plugin-react-slds`

Alpha ESLint plugin for applying SLDS rules to React applications.

The `@salesforce-ux/slds-linter` CLI bundles this plugin and automatically scans
JSX and TSX files. Install this package directly only when configuring ESLint
without the CLI.

The plugin checks static `class` and `className` values and inline style objects in
JSX and TSX, with partial styled-components support for selectors and declarations.
Its optional `recommended-css` configuration imports the standalone CSS and SCSS
rules from `@salesforce-ux/eslint-plugin-slds`.

## Requirements

- Node.js 22 or newer
- ESLint 10

## Usage

```js
import reactSldsPlugin from '@salesforce-ux/eslint-plugin-react-slds';

export default [
  ...reactSldsPlugin.configs.recommended,
  ...reactSldsPlugin.configs['recommended-css'],
];
```

The `recommended` configuration targets only `**/*.{jsx,tsx}`. The external
build enables `enforce-bem-usage`, `no-deprecated-classes-slds2`,
`no-slds-class-overrides`, `lwc-token-to-slds-hook`,
`enforce-sds-to-slds-hooks`, `no-sldshook-fallback-for-lwctoken`,
`no-slds-var-without-fallback`, `no-unsupported-hooks-slds2`,
`no-slds-namespace-for-custom-hooks`, `enforce-component-hook-naming-convention`,
`no-slds-private-var`, and `no-hardcoded-values-slds2`.

The optional `recommended-css` configuration targets `**/*.{css,scss}` and
reuses the CSS configuration from `@salesforce-ux/eslint-plugin-slds`. Both
configurations are file-scoped, so they can share the `@salesforce-ux/slds`
namespace without replacing each other's rules.

The plugin uses the existing `@salesforce-ux/slds/*` rule IDs so diagnostics
remain consistent across SLDS linting packages.

The default build uses the external rule set in `eslint.rules.json`. Internal
builds set `TARGET_PERSONA=internal` to use `eslint.rules.internal.json`, which
adds internal-only rules and options to the same `recommended` configuration.
