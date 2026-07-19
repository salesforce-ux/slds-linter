const { RuleTester } = require("eslint");
const rule = require("../../src/rules/v9/no-slds-var-without-fallback").default;

const ruleTester = new RuleTester({
  languageOptions: {
    parser: require("@typescript-eslint/parser"),
    ecmaVersion: 2021,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run("no-slds-var-without-fallback (react)", rule, {
  valid: [
    { code: `const s = { color: 'var(--slds-g-color-border-base-1, #333)' };`, filename: "test.tsx" },
    { code: `const s = { color: 'var(--custom-color)' };`, filename: "test.tsx" },
  ],
  invalid: [
    // inline style object
    {
      code: `const A = () => <div style={{ color: 'var(--slds-g-color-border-base-1)' }} />;`,
      filename: "test.tsx",
      output: `const A = () => <div style={{ color: 'var(--slds-g-color-border-base-1, #c9c9c9)' }} />;`,
      errors: [{ messageId: "varWithoutFallback" }],
    },
    // CSS-in-JS
    {
      code: "const S = styled.div`\n  color: var(--slds-g-color-border-base-1);\n`;",
      filename: "test.tsx",
      output: "const S = styled.div`\n  color: var(--slds-g-color-border-base-1, #c9c9c9);\n`;",
      errors: [{ messageId: "varWithoutFallback" }],
    },
  ],
});
