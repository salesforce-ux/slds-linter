# Custom configuration
To enable / disable rules used by SLDS Linter, you can make use of `emit` command and pass custom configuration to `lint` and `report` command

Follow the steps below to `setup` and `emit`.

### package.json update
Execute following command in terminal at root folder of your project to add `@salesforce-ux/slds-linter` entry to `package.json`

```bash
npm i @salesforce-ux/slds-linter@0.1.4-alpha.3 --save-dev
```

### Emit configuration
Use the `emit` command to export `eslint` and `stylelint` configurations used by `slds-linter` cli

```bash
npx @salesforce-ux/slds-linter@0.1.4-alpha.3 emit
```

This command will create / overwrite `.eslintrc.yml` and `.stylelintrc.yml` files at root of your project directory.


### Enable / Disable rule

To disable rule in `.eslintrc.yml` or `.stylelintrc.yml` file, you can simply comment rule entry by using `#`. 

```yml
    overrides:
       - "@html-eslint"
       - "@salesforce-ux/slds"
     rules:
-      "@salesforce-ux/slds/enforce-bem-usage": "error"
-      "@salesforce-ux/slds/no-deprecated-classes-slds2": "error"
+    #  "@salesforce-ux/slds/enforce-bem-usage": "error"
+    #  "@salesforce-ux/slds/no-deprecated-classes-slds2": "error"
       "@salesforce-ux/slds/modal-close-button-issue": "error"

```

### Lint html, cmp using custom config file

You can input custom configuration file to `lint` or `report` by using 
 - `--config-eslint` option to supply `.eslintrc.yml`
 - `--config-stylelint` option to supply `.stylelintrc.yml`

 ```bash
npx @salesforce-ux/slds-linter@0.1.4-alpha.3 lint "**/{aura,lwc}/**/*.{html,cmp}" --config-eslint .eslintrc.yml
```

### CSV Report using custom config file

You can use `report` command with `--format` option to generate csv report of all lint issue

```bash
npx @salesforce-ux/slds-linter@0.1.4-alpha.3 report "**/{aura,lwc}/**/*.{html,cmp}" --config-eslint .eslintrc.yml --format csv
```

### SARIF Report using custom config file


You can use `report` command with `--format` option to generate csv report of all lint issue

```bash
npx @salesforce-ux/slds-linter@0.1.4-alpha.3 report "**/{aura,lwc}/**/*.{html,cmp}" --config-eslint .eslintrc.yml --format sarif
```

### Fix all issues using custom config file

You can use `lint` command with `--fix` option to automatically fix all possible linter issues

```bash
npx @salesforce-ux/slds-linter@0.1.4-alpha.3 lint "**/{aura,lwc}/**/*.{html,cmp}" --config-eslint .eslintrc.yml --fix
```
