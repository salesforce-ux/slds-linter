const { RuleTester } = require("eslint");
const rule = require("../../src/rules/v9/no-slds-namespace-for-custom-hooks").default;

const ruleTester = new RuleTester({
  languageOptions: {
    parser: require("@typescript-eslint/parser"),
    ecmaVersion: 2021,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run("no-slds-namespace-for-custom-hooks (react)", rule, {
  valid: [
    { code: `const s = { color: 'var(--myapp-valid-token)' };`, filename: "test.tsx" },
    { code: `const A = () => <div style={{ '--myapp-valid-token': '#fff' }} />;`, filename: "test.tsx" },
  ],
  invalid: [
    // property side custom hook using slds namespace
    {
      code: `const A = () => <div style={{ '--slds-my-own-token': '#fff' }} />;`,
      filename: "test.tsx",
      errors: [
        {
          messageId: "customHookNamespace",
          data: { token: "--slds-my-own-token", tokenWithoutNamespace: "my-own-token" },
        },
      ],
    },
    // value side
    {
      code: `const A = () => <div style={{ color: 'var(--slds-custom-color)' }} />;`,
      filename: "test.tsx",
      errors: [{ messageId: "customHookNamespace" }],
    },
    // CSS-in-JS
    {
      code: "const S = styled.div`\n  --slds-my-own-token: #fff;\n`;",
      filename: "test.tsx",
      errors: [{ messageId: "customHookNamespace" }],
    },
  ],
});
