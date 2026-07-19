const { RuleTester } = require("eslint");
const rule = require("../../src/rules/v9/no-hardcoded-values/no-hardcoded-values-slds2").default;

const ruleTester = new RuleTester({
  languageOptions: {
    parser: require("@typescript-eslint/parser"),
    ecmaVersion: 2021,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run("no-hardcoded-values-slds2 (react)", rule, {
  valid: [
    { code: `const s = { color: 'var(--slds-g-color-palette-neutral-100, #fff)' };`, filename: "test.tsx" },
    { code: `const s = { color: 'transparent' };`, filename: "test.tsx" },
    // number literal values are not fixed and only the string surface is covered
    { code: `const A = () => <div style={{ width: 0 }} />;`, filename: "test.tsx" },
  ],
  invalid: [
    // hardcoded color in inline style object (multiple suggestions => no fix)
    {
      code: `const A = () => <div style={{ color: '#ff0000' }} />;`,
      filename: "test.tsx",
      errors: [{ messageId: "hardcodedValue" }],
    },
    // font-size single suggestion (auto-fixable) in inline style object
    {
      code: `const A = () => <div style={{ fontSize: '0.875rem' }} />;`,
      filename: "test.tsx",
      output: `const A = () => <div style={{ fontSize: 'var(--slds-g-font-scale-1, 0.875rem)' }} />;`,
      errors: [{ messageId: "hardcodedValue" }],
    },
    // CSS-in-JS declaration
    {
      code: "const S = styled.div`\n  font-size: 0.875rem;\n`;",
      filename: "test.tsx",
      output: "const S = styled.div`\n  font-size: var(--slds-g-font-scale-1, 0.875rem);\n`;",
      errors: [{ messageId: "hardcodedValue" }],
    },
  ],
});
