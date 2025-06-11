const plugin = {
    meta: {
        name: "@salesforce-ux/eslint-plugin-slds",
        version: "0.2.1"
    },
    rules: {
        "enforce-bem-usage": require('./rules/enforce-bem-usage'),
        "no-deprecated-classes-slds2": require('./rules/no-deprecated-classes-slds2'),
        "modal-close-button-issue": require('./rules/modal-close-button-issue')
    },
    configs: {},
};

// Assign configs after plugin definition to reference the plugin
Object.assign(plugin.configs, {
    recommended: {
        files: ["**/*.html", "**/*.cmp"],
        plugins: {
            "@salesforce-ux/slds": plugin
        },
        languageOptions: {
            parser: require("@html-eslint/parser"),
            ecmaVersion: 2021,
            sourceType: "module"
        },
        rules: {
            "@salesforce-ux/slds/enforce-bem-usage": "error",
            "@salesforce-ux/slds/no-deprecated-classes-slds2": "error",
            "@salesforce-ux/slds/modal-close-button-issue": "error"
        }
    }
});

export = plugin;
