# @salesforce-ux/eslint-plugin-react-slds

## Overview

 The `eslint-plugin-react-slds` plugin analyzes React applications against Salesforce Lightning Design System 2 (SLDS 2) rules and provides suggestions to better align your React code with SLDS 2 guidelines. It can also apply the suggestions in bulk across your repository and automatically fix your code.

The plugin checks static ``` class` `` and `` `className` `` values and inline style objects in JSX and TSX files, with partial support for CSS selectors and property declarations in styled-components.

## Prerequisites

* Install [Node.js](https://nodejs.org/) v22.0.0 or later.  
  We recommend using the latest [Active Long Term Support](https://nodejs.org/en/about/previous-releases) (LTS) version of Node.js.  
* Install [ESLint](https://eslint.org/) v10.0.0 or later.

## Install

The `eslint-plugin-react-slds` plugin is part of the SLDS Linter CLI package. Install SLDS Linter to install the `eslint-plugin-react-slds` plugin along with it. 

`npx @salesforce-ux/slds-linter lint`

To view the `.eslint.config.mjs` configuration file and disable specific rules in the file, emit the configuration file.

`npx @salesforce-ux/slds-linter  emit`

## Configure

When you configure ESLint without the SLDS Linter CLI, install the `eslint-plugin-react-slds` plugin directly and import it to your ESLint configuration file. 

`npm install --save-dev @salesforce-ux/eslint-plugin-react-slds`

## Supported Rules

For detailed information about the rules, see [SLDS Linter Rules](https://developer.salesforce.com/docs/platform/slds-linter/guide/reference-rules.html).

| Rule | Description | Severity Level | Autofix | Supported File Types |
| :---- | :---- | :---- | :---- | :---- |
| enforce-bem-usage | Identifies instances that use the double-dash (`--`) syntax for block-element-modifier (BEM) in classes. | Error | Yes | JSX, TSX, CSS |
| no-deprecated-classes-slds2 | Identifies classes that aren't available in SLDS 2. | Error in JSX and TSX files, Warning in CSS files | - | JSX, TSX, CSS |
| enforce-component-hook-naming-convention | Identifies `--slds-c` component-level styling hooks that use a deprecated naming convention. | Error | Yes | JSX, TSX, CSS |
| lwc-token-to-slds-hook | Identifies deprecated `--lwc` tokens in your code and recommends suitable `--slds` styling hooks. For more information, see [lightningdesignsystem.com](http://lightningdesignsystem.com). | Error | Yes | JSX, TSX, CSS |
| enforce-sds-to-slds-hooks | Identifies Salesforce Design System (SDS) styling hooks that must be replaced with the suggested SLDS 2 styling hooks. | Warning | Yes | JSX, TSX, CSS |
| no-hardcoded-values-slds2 | Identifies static or hard-coded values that must be replaced with SLDS 2 styling hooks. | Warning | Yes | JSX, TSX, CSS |
| no-slds-class-overrides | Identifies existing class names that must be replaced with new custom CSS classes, instead of overriding SLDS selectors. | Warning | - | JSX, TSX, CSS |
| no-slds-private-var | Identifies SLDS styling hooks that are reserved only for internal Salesforce use. | Warning | Yes | JSX, TSX, CSS |
| no-unsupported-hooks-slds2 | Identifies styling hooks that aren't present in SLDS 2.  | Warning | - | JSX, TSX, CSS |
| no-slds-var-without-fallback | Identifies SLDS styling hooks that are specified without fallback values and recommends suitable fallback values based on the SLDS metadata. The fallback values are used in Salesforce environments where styling hooks are unavailable. | Warning | Yes | JSX, TSX, CSS |
| no-slds-namespace-for-custom-hooks | Identifies custom styling hooks that use the `--slds` or `--sds` namespaces, which are reserved for SLDS styling hooks. | Warning | - | JSX, TSX, CSS |
| no-sldshook-fallback-for-lwctoken | Identifies instances where `--slds` styling hooks are provided as fallback values for `--lwc` tokens. | Warning | - | JSX, TSX, CSS |
