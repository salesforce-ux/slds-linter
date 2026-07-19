const { RuleTester } = require("eslint");
const rule = require("../../src/rules/v9/no-unsupported-hooks-slds2").default;

const ruleTester = new RuleTester({
  languageOptions: {
    parser: require("@typescript-eslint/parser"),
    ecmaVersion: 2021,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run("no-unsupported-hooks-slds2 (react)", rule, {
  valid: [
    { code: `const s = { color: 'var(--slds-c-button-color-background)' };`, filename: "test.tsx" },
    { code: `const s = { color: 'red' };`, filename: "test.tsx" },
  ],
  invalid: [
    // value side deprecated hook
    {
      code: `const A = () => <div style={{ borderColor: 'var(--slds-g-color-border-base-2)' }} />;`,
      filename: "test.tsx",
      errors: [{ messageId: "deprecated", data: { token: "--slds-g-color-border-base-2" } }],
    },
    // property side deprecated hook
    {
      code: `const A = () => <div style={{ '--slds-g-color-border-base-2': '#dddbda' }} />;`,
      filename: "test.tsx",
      errors: [{ messageId: "deprecated" }],
    },
    // CSS-in-JS
    {
      code: "const S = styled.div`\n  border: 1px solid var(--slds-g-color-border-base-2);\n`;",
      filename: "test.tsx",
      errors: [{ messageId: "deprecated" }],
    },
  ],
});
