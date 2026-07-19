const { RuleTester } = require("eslint");
const rule = require("../../src/rules/v9/no-sldshook-fallback-for-lwctoken").default;

const ruleTester = new RuleTester({
  languageOptions: {
    parser: require("@typescript-eslint/parser"),
    ecmaVersion: 2021,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run("no-sldshook-fallback-for-lwctoken (react)", rule, {
  valid: [
    { code: `const s = { color: 'var(--lwc-color-background-1, #333)' };`, filename: "test.tsx" },
    { code: `const s = { color: 'var(--lwc-color-background-1)' };`, filename: "test.tsx" },
  ],
  invalid: [
    {
      code: `const A = () => <div style={{ color: 'var(--lwc-color-background-1, var(--slds-g-color-border-1))' }} />;`,
      filename: "test.tsx",
      errors: [
        {
          messageId: "unsupportedFallback",
          data: { lwcToken: "--lwc-color-background-1", sldsToken: "--slds-g-color-border-1" },
        },
      ],
    },
    {
      code: "const S = styled.div`\n  color: var(--lwc-color-background-1, var(--slds-g-color-border-1));\n`;",
      filename: "test.tsx",
      errors: [{ messageId: "unsupportedFallback" }],
    },
  ],
});
