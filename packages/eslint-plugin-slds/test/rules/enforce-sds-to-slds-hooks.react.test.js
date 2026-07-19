const { RuleTester } = require("eslint");
const rule = require("../../src/rules/v9/enforce-sds-to-slds-hooks").default;

const ruleTester = new RuleTester({
  languageOptions: {
    parser: require("@typescript-eslint/parser"),
    ecmaVersion: 2021,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run("enforce-sds-to-slds-hooks (react)", rule, {
  valid: [
    { code: `const s = { color: 'var(--custom-color)' };`, filename: "test.tsx" },
    { code: `const s = { color: 'var(--slds-g-color-palette-blue-10)' };`, filename: "test.tsx" },
  ],
  invalid: [
    // value side var(--sds-*)
    {
      code: `const A = () => <div style={{ backgroundColor: 'var(--sds-g-color-palette-blue-10)' }} />;`,
      filename: "test.tsx",
      output: `const A = () => <div style={{ backgroundColor: 'var(--slds-g-color-palette-blue-10)' }} />;`,
      errors: [{ messageId: "replaceSdsWithSlds" }],
    },
    // property side --sds-* key
    {
      code: `const A = () => <div style={{ '--sds-g-spacing-1': '4px' }} />;`,
      filename: "test.tsx",
      output: `const A = () => <div style={{ '--slds-g-spacing-1': '4px' }} />;`,
      errors: [{ messageId: "replaceSdsWithSlds" }],
    },
    // CSS-in-JS
    {
      code: "const S = styled.div`\n  background-color: var(--sds-g-color-palette-blue-10);\n`;",
      filename: "test.tsx",
      output: "const S = styled.div`\n  background-color: var(--slds-g-color-palette-blue-10);\n`;",
      errors: [{ messageId: "replaceSdsWithSlds" }],
    },
  ],
});
