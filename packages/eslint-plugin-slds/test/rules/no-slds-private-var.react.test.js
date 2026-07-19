const { RuleTester } = require("eslint");
const rule = require("../../src/rules/v9/no-slds-private-var").default;

const ruleTester = new RuleTester({
  languageOptions: {
    parser: require("@typescript-eslint/parser"),
    ecmaVersion: 2021,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run("no-slds-private-var (react)", rule, {
  valid: [
    { code: `const A = () => <div style={{ '--slds-valid-var': '#fff' }} />;`, filename: "test.tsx" },
    { code: `const A = () => <div style={{ '--my-custom-var': 'blue' }} />;`, filename: "test.tsx" },
  ],
  invalid: [
    {
      code: `const A = () => <div style={{ '--_slds-deprecated-var': '#fff' }} />;`,
      filename: "test.tsx",
      output: `const A = () => <div style={{ '--slds-deprecated-var': '#fff' }} />;`,
      errors: [{ messageId: "privateVar" }],
    },
    {
      code: "const S = styled.div`\n  --_slds-deprecated-var: #fff;\n`;",
      filename: "test.tsx",
      output: "const S = styled.div`\n  --slds-deprecated-var: #fff;\n`;",
      errors: [{ messageId: "privateVar" }],
    },
  ],
});
