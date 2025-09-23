# SLDS Linter

## Overview

SLDS Linter is an installable npm package that analyzes your code against Salesforce Lightning Design System 2 (SLDS 2) rules and offers suggestions to better align your code with SLDS 2 guidelines. SLDS Linter can also apply the suggestions in bulk across your repository and automatically fix your code.

For detailed information about SLDS Linter, see the [SLDS Linter developer guide](https://developer.salesforce.com/docs/platform/slds-linter/overview).

## Features

SLDS Linter is a custom-built linting solution based on open-source [ESLint](https://eslint.org/) projects. It supports linting for both types of Lightning components. 

- Lightning web components: HTML and Cascading Style Sheet (CSS) files
- Aura components: Component (CMP) and CSS files

Run SLDS Linter in a terminal window or in Visual Studio (VS) Code. We recommend running in VS Code.

Follow these steps to integrate SLDS Linter into your project.

---

## Prerequisites

- Install [VS Code](https://code.visualstudio.com/)
- Install the [SARIF Viewer](https://marketplace.visualstudio.com/items?itemName=MS-SarifVSCode.sarif-viewer) VS Code extension. With this extension, you can view SLDS Linter violation reports.
- Install [Node.js](https://nodejs.org/)
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
  -V, --version                 output the version number
  -h, --help                    display help for command

Commands:
  lint [options] [directory]    Run both style and component linting
  report [options] [directory]  Generate SARIF report from linting results
  emit [options]                Emits the configuration files used by slds-linter cli
  help [command]                display help for command
```

## Run SLDS Linter

Run SLDS Linter against your project in the VS Code terminal to check for any violations and generate a SARIF report. This report helps you identify the components you need to update.

In your project root directory, follow these instructions.

1. In your project in VS Code, open Terminal.
2. Run `npx @salesforce-ux/slds-linter lint`. 
    The linting output displayed in the console includes the row and column numbers on the left. Navigate to specific lines in your source code by clicking on the displayed numbers (Command + Click on Mac).

3. (Optional) To run SLDS Linter on a specific folder, specify the directory to be linted: `npx @salesforce-ux/slds-linter [directory name]` . This option accepts directories or folders using [glob](https://github.com/sindresorhus/globby?tab=readme-ov-file#globbing-patterns) patterns, enabling flexible and efficient matching of multiple paths. For example, run `npx @salesforce-ux/slds-linter lint "com/CORE/**"` gives the lint output for all the files under `com/CORE`.
4. To produce a SARIF report in your project root directory and specify an output directory, run  `npx @salesforce-ux/slds-linter report -o [output directory]`. The output file is named as `slds-linter-report.sarif`.
5. Open the generated `.sarif` report file.
6. Make a note of how many components SLDS Linter has identified that you must update.
7. (Optional) To automatically fix validation errors in bulk, run the `lint` command with the `fix` option, `npx @salesforce-ux/slds-linter lint --fix`.
8. (Optional) To emit the configuration files used by `slds-linter`, run `npx @salesforce-ux/slds-linter emit` in your component source directory. Note that this command defaults to current working directory. These configuration files are discovered by your VS Code ESLint extension to display squiggly lines in HTML, CSS and CMP files when opened in your code editor.  


### Troubleshoot SARIF Viewer Navigation

If the SARIF viewer doesn’t automatically go to the line of code when you click on an error or warning, follow these steps.

1. In the SARIF viewer pop-up window, click Locate.
2. In the file explorer or code editor, locate the file.
3. Click on the errors in the SARIF viewer, and it navigates directly to the relevant line of code.


### SLDS Linter Commands and Options

Use these commands to run SLDS Linter rules. Review the output violations and fix any issues to uplift your code to SLDS best practices.

- `npx @salesforce-ux/slds-linter lint`. Runs ESLint rules on HTML, CSS, and CMP files.
- `npx @salesforce-ux/slds-linter report`. Generates a SARIF report for static analysis.
- `npx @salesforce-ux/slds-linter emit`. Emits the configuration files used by `slds-linter`. Defaults to current directory. 

These options are available on SLDS Linter commands.

| **Option**              | **Description**                                                              | **Availability**                           |
| ------------------------ | ---------------------------------------------------------------------------- | ------------------------------------------ |
| `-d, --directory <path>` | Target directory to scan (defaults to current directory). Supports glob patterns.                     | `lint`, `report` |
| `-o, --output <path>`    | Output directory for reports (defaults to current directory)                 | `report`                                     |
| `--fix`                  | Automatically fix problems                                                   | `lint`         |
| `--config-eslint <path>` | Path to eslint config file                    | `lint`, `report`|
| `--editor <editor>`      | Editor to open files with (e.g., vscode, atom, sublime). Defaults to vscode | `lint` |

To view help for these options, add `--help` to each command. For example, run `npx @salesforce-ux/slds-linter lint --help` to see which options you can use with `lint`.


## Extensions

To enhance your linting and error analysis experience, we recommend that you install these VS Code extensions. This extension significantly improves your development workflow and makes it easier to navigate and address linting issues.

- *[ESLint Extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)*:  Essential for JavaScript, TypeScript, HTML, CMP, and CSS linting. It checks your code and highlights any violations of the ESLint rules with squiggly lines.

## Best Practices

- Run `npx @salesforce-ux/slds-linter lint` to see the lint output on Terminal. 
- To run SLDS Linter on a specific folder, input as argument. For example, `npx @salesforce-ux/slds-linter lint <directory>`

### Example - single folder

Recursively linting all style and markup files in the `aura` directory:

```shell
npx @salesforce-ux/slds-linter lint aura
```

### Example - multiple folders

Recursively linting all style and markup files in the `aura` and `lwc` directory:

```shell
npx @salesforce-ux/slds-linter lint "**/{aura,lwc}/**"
```

### Example - lint style files

Recursively linting all `.css` files in the `aura` directory:

```shell
npx @salesforce-ux/slds-linter lint "aura/**/*.css"
```

### Example - multiple style file extensions

Linting all `.css`, `.scss`, and `.sass` files:

```shell
npx @salesforce-ux/slds-linter lint "**/*.{css,scss,sass}"
```

### Example - lint markeup files

Recursively linting all `.html` files in the `aura` directory:

```shell
npx @salesforce-ux/slds-linter lint "aura/**/*.html"
```

### Example - multiple markup file extensions

Linting all `.html` and `.cmp` files:

```shell
npx @salesforce-ux/slds-linter lint "**/*.{html,cmp}"
```


For any questions or issues, open an issue in this repository.
