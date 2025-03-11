# SLDS Linter

## Overview

SLDS Linter provides custom linting rules built for Salesforce Lightning Design System 2 (SLDS 2 beta). Lint your components against SLDS 2 best practices to ensure they adhere to the latest styling standards. 

SLDS Linter checks your Aura and Lightning web components’ CSS and markup files to identify styling issues that you can fix for SLDS 2 compatibility. SLDS Linter helps you maintain consistent styling and identify common issues with custom Lightning components.

## Features

SLDS Linter is a custom-built linting solution based on open source [Stylelint](https://stylelint.io/) and [ESLint](https://eslint.org/) projects. It supports linting for both types of Lightning components. 

SLDS Linter runs on these types of files.

- Lightning web component *.html markup and Cascading Style Sheet (CSS) files
- Aura component *.cmp markup and CSS files

You can run SLDS Linter in a terminal window or in Visual Studio (VS) Code. We recommend running in VS Code.

Follow these instructions to integrate SLDS Linter into your project.

---

## Prerequisites

Install these items if they aren't installed already.

- [VS Code](https://code.visualstudio.com/)
- [SARIF Viewer](https://marketplace.visualstudio.com/items?itemName=MS-SarifVSCode.sarif-viewer) VS Code extension. This extension enables you to view SLDS Linter violation reports.
- [Node.js](https://nodejs.org/)
  - The minimum supported version is **v18.4.0**
  - We recommend using the latest [Active LTS](https://nodejs.org/en/about/previous-releases) version of Node.js.  

## Install SLDS Linter

1. Open your project in VS Code.
2. In a VS Code terminal, enter `npx @salesforce-ux/slds-linter@latest lint` to run the installer.
3. To install the SLDS Linter package, type `y` .

The SLDS Linter package installs in a temporary location on your system.

For more information about `slds-linter` commands, run `npx @salesforce-ux/slds-linter@latest --help`.


```
Usage: npx @salesforce-ux/slds-linter@latest [options] [command]

SLDS Linter CLI tool for linting styles and components

Options:
  -V, --version              output the version number
  -h, --help                 display help for command

Commands:
  lint:styles [options]      Run stylelint on all style files
  lint:components [options]  Run eslint on all markup files
  lint [options]             Run both style and component linting
  report [options]           Generate SARIF report from linting results
  emit [options]             Emits the configuration files used by slds-linter cli
  help [command]             display help for command
```

## Run SLDS Linter

Run SLDS Linter against your project in the VS Code terminal to check for any violations and generate a SARIF report. This report helps you identify the components you need to update.

In your project root directory, follow these steps.

1. In your project in VS Code, open Terminal.
2. Run `npx @salesforce-ux/slds-linter lint`. 
    The linting output displayed in the console includes the row and column numbers on the left. Navigate to specific lines in your source code by clicking on the displayed numbers (Command + Click on Mac).

3. (Optional) To see lint errors only on CSS files, run `npx @salesforce-ux/slds-linter lint:styles` .
4. (Optional) To see lint errors only on component markup files (componentName.html or componentName.cmp files), run `npx @salesforce-ux/slds-linter lint:components` . 
5. (Optional) To run SLDS Linter on a specific folder, add the `-d` option to specify the directory to be linted: `npx @salesforce-ux/slds-linter -d [directory name]` .
6. To produce a SARIF report in your project root directory and specify an output directory, run  `npx @salesforce-ux/slds-linter report -o [output directory]`. The output file is named as `slds-linter-report.sarif`.
7. Open the generated `.sarif` report file.
8. Make a note of how many components SLDS Linter has identified that you must update.
9. (Optional) To automatically fix validation errors in bulk, run the `lint` command with the `fix` option, `npx @salesforce-ux/slds-linter lint --fix`.
7. (Optional) To emit the configuration files used by `slds-linter`, run `npx @salesforce-ux/slds-linter emit` in your component source directory. Note that this command defaults to current working directory. These configuration files are discovered by your VS Code ESLint and Stylelint extensions to display squiggly lines in CSS and HTML files when opened in your code editor. 


### Troubleshoot SARIF Viewer Navigation

If the SARIF viewer doesn’t automatically go to the line of code when you click on an error or warning, follow these steps.

1. In the SARIF viewer pop-up window, click Locate.
2. In the file explorer or code editor, locate the file.
3. Click on the errors in the SARIF viewer, and it navigates directly to the relevant line of code.


### SLDS Linter Commands and Options

Use these commands to run SLDS Linter rules. Review the output violations and fix any issues to uplift your code to SLDS best practices.

- `npx @salesforce-ux/slds-linter lint`. Runs ESlint and Stylelint rules on HTML, CSS, and CMP files.
- `npx @salesforce-ux/slds-linter lint:styles`. Runs the Stylelint rules on your CSS files.
- `npx @salesforce-ux/slds-linter lint:components`. Runs the ESlint rules on your HTML/CMP files.
- `npx @salesforce-ux/slds-linter report`. Generates a SARIF report for static analysis.
- `npx @salesforce-ux/slds-linter emit`. Emits the configuration files used by `slds-linter`. Defaults to current directory. 

These options are available on SLDS Linter commands.

| **Option**              | **Description**                                                              | **Availability**                           |
| ------------------------ | ---------------------------------------------------------------------------- | ------------------------------------------ |
| `-d, --directory <path>` | Target directory to scan (defaults to current directory)                     | `lint`, `lint:styles`, `lint:components`, `report` |
| `-o, --output <path>`    | Output directory for reports (defaults to current directory)                 | `report`                                     |
| `--fix`                  | Automatically fix problems                                                   | `lint`, `lint:styles`, `lint:components`         |
| `--config <path>`        | Path to eslint/stylelint config file'         | `lint:styles`, `lint:components`               |
| `--config-style <path>`  | Path to stylelint config file'             | `lint`                                       |
| `--config-eslint <path>` | Path to eslint config file'                    | `lint`                                       |
| `--editor <editor>`      | Editor to open files with (e.g., vscode, atom, sublime). Defaults to vscode | `lint`, `lint:styles`, `lint:components`          |

To view help for these options, add `--help` to each command. For example, run `npx @salesforce-ux/slds-linter lint --help` to see which options you can use with `lint`.


## Extensions

To enhance your linting and error analysis experience, we recommend that you install these VS Code extensions. These extensions significantly improve your development workflow and make it easier to navigate and address linting issues.

- *[ESLint Extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)*:  Essential for JavaScript and TypeScript linting, it checks your code and flags any violations of the ESLint rules with squiggly lines to show you what to fix.
- *[Stylelint Extension](https://marketplace.visualstudio.com/items?itemName=stylelint.vscode-stylelint)*: When linting CSS, SCSS, or other stylesheets, this tool highlights errors with squiggly lines.

## Best Practices

- Run `npx @salesforce-ux/slds-linter lint` to see the lint output on Terminal. 
- To run SLDS Linter on a specific folder, add option `-d` For example, `npx @salesforce-ux/slds-linter lint -d`

For any questions or issues, open an issue in this repository.
