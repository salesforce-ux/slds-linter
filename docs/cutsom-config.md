# Custom configuration
To enable / disable rules used by SLDS Linter, you can make use of `emit` command and pass custom configuration to `lint` and `report` command

Follow the steps below to setup and `emit`.

### package.json update
Execute following command in terminal at root folder of your project to add `@salesforce-ux/slds-linter` entry to `package.json`

```bash
npm i @salesforce-ux/slds-linter@0.1.4-alpha.1 --save-dev
```

### Emit configuration
Use the `emit` command to export `eslint` and `stylelint` configurations used by `slds-linter` cli

```bash
npx @salesforce-ux/slds-linter@0.1.4-alpha.1 emit
```

This command will create / overwrite `.eslintrc.yml` and `.stylelintrc.yml` files at root of your project directory.


### Enable / Disable rule

To disable rule in `.eslintrc.yml` or `.stylelintrc.yml` file, you can simply comment rule entry by using `#`. 

```yml
    overrides:
       - "@html-eslint"
       - "@salesforce-ux/slds"
     rules:
-      "@salesforce-ux/slds/enforce-bem-class": "error"
-      "@salesforce-ux/slds/no-deprecated-classes-slds2": "error"
+    #  "@salesforce-ux/slds/enforce-bem-class": "error"
+    #  "@salesforce-ux/slds/no-deprecated-classes-slds2": "error"
       "@salesforce-ux/slds/modal-close-button-issue": "error"

```

### using custom config file

You can input custom configuration file to `lint` or `report` as below

```bash
npx @salesforce-ux/slds-linter@0.1.4-alpha.1 lint --config-eslint .estlintrc.yml

npx @salesforce-ux/slds-linter@0.1.4-alpha.1 report --config-eslint .estlintrc.yml
```

### Examples
To run SLDS Linter on a specific folder, input as argument. For example, `npx @salesforce-ux/slds-linter lint <directory>`

### Example - single folder

Recursively linting all style and markup files in the `aura` directory:

```shell
npx @salesforce-ux/slds-linter@0.1.4-alpha.1 lint aura
```

### Example - multiple folders

Recursively linting all style and markup files in the `aura` and `lwc` directory:

```shell
npx @salesforce-ux/slds-linter@0.1.4-alpha.1 lint "**/{aura,lwc}/**"
```

### Example - lint style files

Recursively linting all `.css` files in the `aura` directory:

```shell
npx @salesforce-ux/slds-linter@0.1.4-alpha.1 lint "aura/**/*.css"
```

### Example - multiple style file extensions

Linting all `.css`, `.scss`, and `.sass` files:

```shell
npx @salesforce-ux/slds-linter@0.1.4-alpha.1 lint "**/*.{css,scss,sass}"
```

### Example - lint markeup files

Recursively linting all `.html` files in the `aura` directory:

```shell
npx @salesforce-ux/slds-linter@0.1.4-alpha.1 lint "aura/**/*.html"
```

### Example - multiple markup file extensions

Linting all `.html` and `.cmp` files:

```shell
npx @salesforce-ux/slds-linter@0.1.4-alpha.1lint "**/*.{html,cmp}"
```