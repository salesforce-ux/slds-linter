# SLDS Linter

## Overview

SLDS Linter provides custom linting rules specifically built for Salesforce Lightning Design System 2 (SLDS 2 beta). SLDS Linter is designed to uplift your Cascading Style Sheet (CSS), Lightning Web Component (LWC), and Aura component files to SLDS 2 and to conform to SLDS best practices. SLDS Linter rules allow you to maintain consistent styling and identify common issues when working with Lightning components.

## Features

- Component Linting:
  The utility supports linting for two types of Salesforce Lightning components:

  - LWC and Aura components.
    LWC Components (.html): Linting is applied to Lightning Web Components.
  - Aura Components (.cmp): Linting is applied to Aura Components.

* Stylelint for CSS Files:
  Stylelint rules are applied to .css files associated with the components. This ensures consistent styling practices are followed throughout the project.

Follow the below instructions to integrate SLDS Linter into your project.

---

## Set Up SLDS Linter in Your Component Repository

### Pre-requisites

SLDS Linter CLI tool works best with the [Active LTS](https://nodejs.org/en/about/previous-releases) version of Node.js.  

#### **Minimum Required Node.js Version**  
- The minimum supported Node.js version is **v20.18.3**.  
- We recommend using the latest **Active LTS** release for the best performance and compatibility.  


### Command-Line Interface (CLI)

To see what all options does slds-linter provide please run `npx @salesforce-ux/slds-linter@latest --help` which gives the below output.
For the first time, it will ask to install the package. Please reply with `y` as yes to install the package.

```
Usage:  npx @salesforce-ux/slds-linter@latest [options] [command]

A CLI tool for linting styles and components

Options:
-V, --version              output the version number
-h, --help                 display help for command

Commands:
lint:styles [options]      Run stylelint on all style files
lint:components [options]  Run eslint on all markup files
lint [options]             Run both style and component linting
report [options]           Generate SARIF report from linting results
help [command]             display help for command
```

- `npx @salesforce-ux/slds-linter lint` - Runs the ESlint and Stylelint rules on your HTML/CSS/CMP files and outputs issues.
- `npx @salesforce-ux/slds-linter lint:styles` - Runs the Stylelint rules on your CSS files and outputs issues.
- `npx @salesforce-ux/slds-linter lint:components` - Runs the ESlint rules on your HTML/CMP files and outputs issues.
- `npx @salesforce-ux/slds-linter fix`: Attempts to automatically fix violations.
- `npx @salesforce-ux/slds-linter report`: Generates a SARIF report for static analysis.

#### Options available with each command

| **Options**              | **Description**                                                              | **Availability**                           |
| ------------------------ | ---------------------------------------------------------------------------- | ------------------------------------------ |
| `-d, --directory <path>` | Target directory to scan (defaults to current directory)                     | lint, lint:styles, lint:components, report |
| `-o, --output <path>`    | Output directory for reports (defaults to current directory)                 | report                                     |
| `--fix`                  | Automatically fix problems                                                   | lint, lint:styles, lint:components         |
| `--config <path>`        | Path to eslint/stylelint config file', DEFAULT_ESLINT_CONFIG_PATH            | lint:styles, lint:components               |
| `--config-style <path>`  | PPath to stylelint config file', DEFAULT_STYLELINT_CONFIG_PATH               | lint                                       |
| `--config-eslint <path>` | Path to eslint config file', DEFAULT_ESLINT_CONFIG_PATH                      | lint                                       |
| `--editor <editor>`      | Editor to open files with (e.g., vscode, atom, sublime). Defaults to vscode | lint,lint:styles, lint:components          |

These options can also be visualised by using `--help` with each command. For example: Running `slds-linter lint --help` will give the options which can be used along with `lint`.

#### Detailed Steps

1. Run `npx @salesforce-ux/slds-linter lint` to see the lint output on terminal. For specific files, you can go ahead with either `npx @salesforce-ux/slds-linter lint:styles` for lint errors within css files or `npx @salesforce-ux/slds-linter lint:components` for lint errors within html/cmp files. To run the linting only on a specific folder, use the option `-d` to specify the directory to be linted.
2. To run SLDS Linter, in Terminal, run `npx @salesforce-ux/slds-linter report` to generate a Sarif report in the project root directory. To run it on a different directory, use `-d` to run the report on that directory. For output, `-o` can be used to specify a different output folder for the genreated sarif. It will be named as `slds-linter-report.sarif`.
3. Open the generated Sarif file.
4. Make a note of how many components SLDS Linter has identified that you must update.
5. Run `npx @salesforce-ux/slds-linter fix` to automatically fix validation errors in bulk.

For any questions or issues, feel free to reach out to the maintainers or open an issue in the repository.
