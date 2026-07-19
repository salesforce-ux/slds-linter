const { RuleTester } = require("eslint");
const rule = require("../../src/rules/v9/lwc-token-to-slds-hook").default;

const ruleTester = new RuleTester({
  languageOptions: {
    parser: require("@typescript-eslint/parser"),
    ecmaVersion: 2021,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run("lwc-token-to-slds-hook (react)", rule, {
  valid: [
    { code: `const s = { color: 'var(--custom-color)' };`, filename: "test.tsx" },
    { code: `const s = { color: 'var(--slds-g-color-palette-blue-10)' };`, filename: "test.tsx" },
    {
      code: "const S = styled.div`\n  color: var(--slds-g-color-palette-blue-10);\n`;",
      filename: "test.tsx",
    },
  ],
  invalid: [
    // Inline style object - value side var(--lwc-*)
    {
      code: `const A = () => <div style={{ color: 'var(--lwc-brandDark)' }} />;`,
      filename: "test.tsx",
      output: `const A = () => <div style={{ color: 'var(--slds-g-color-accent-dark-1, var(--lwc-brandDark))' }} />;`,
      errors: [{ messageId: "errorWithStyleHooks" }],
    },
    // Inline style object - property side --lwc-* key
    {
      code: `const A = () => <div style={{ '--lwc-brandDark': '#123456' }} />;`,
      filename: "test.tsx",
      output: `const A = () => <div style={{ '--slds-g-color-accent-dark-1': '#123456' }} />;`,
      errors: [{ messageId: "errorWithStyleHooks" }],
    },
    // CSS-in-JS declaration value side
    {
      code: "const S = styled.div`\n  color: var(--lwc-brandDark);\n`;",
      filename: "test.tsx",
      output: "const S = styled.div`\n  color: var(--slds-g-color-accent-dark-1, var(--lwc-brandDark));\n`;",
      errors: [{ messageId: "errorWithStyleHooks" }],
    },
  ],
});
